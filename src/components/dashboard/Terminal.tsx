import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

// Safely patch FitAddon.prototype to prevent reading 'dimensions' when terminal is not yet rendered or disposed
if (typeof FitAddon !== 'undefined' && FitAddon.prototype) {
  const originalPropose = FitAddon.prototype.proposeDimensions;
  if (!(FitAddon.prototype as any).__dimensionsGuarded) {
    (FitAddon.prototype as any).__dimensionsGuarded = true;
    FitAddon.prototype.proposeDimensions = function () {
      try {
        const terminal = (this as any)._terminal;
        if (!terminal || !terminal.element || !terminal.element.parentElement) {
          return undefined;
        }
        const core = terminal._core;
        if (!core || !core._renderService) {
          return undefined;
        }
        if (typeof core._renderService.hasRenderer === 'function' && !core._renderService.hasRenderer()) {
          return undefined;
        }
        return originalPropose.call(this);
      } catch {
        return undefined;
      }
    };
  }
}

const logs = [
  '[INFO] Initializing build process...',
  '[INFO] Pulling base image ubuntu:22.04...',
  '[SUCCESS] Base image pulled.',
  '[INFO] Executing RUN apt-get update && apt-get install -y python3-pip',
  'Get:1 http://security.ubuntu.com/ubuntu jammy-security InRelease [110 kB]',
  'Get:2 http://archive.ubuntu.com/ubuntu jammy InRelease [270 kB]',
  'Fetched 380 kB in 1s (430 kB/s)',
  '[INFO] Reading package lists... Done',
  '[INFO] Installing dependencies from requirements.txt...',
  'Collecting torch==2.1.0',
  '  Downloading torch-2.1.0-cp310-cp310-manylinux1_x86_64.whl (670.2 MB)',
  '[WARNING] High memory usage detected during pip install.',
  '[SUCCESS] Dependencies installed successfully.',
  '[INFO] Compiling CUDA extensions...',
  '[INFO] nvcc warning : The "compute_35", "compute_37", "compute_50", "sm_35", "sm_37" and "sm_50" architectures are deprecated',
  '[SUCCESS] Build completed in 45.2s.',
  '[INFO] Pushing image to registry: gcr.io/project/ml-model:v1.0.4',
  'The push refers to repository [gcr.io/project/ml-model]',
  'd4bce7fd68df: Preparing',
  'd4bce7fd68df: Pushed',
  '[SUCCESS] Image pushed successfully.',
  '[INFO] Triggering K8s deployment update...',
  '[INFO] Waiting for rollout to finish: 0 of 3 updated replicas are available...',
  '[INFO] Waiting for rollout to finish: 1 of 3 updated replicas are available...',
  '[INFO] Waiting for rollout to finish: 2 of 3 updated replicas are available...',
  '[SUCCESS] Deployment rollout complete.',
];

export function TerminalLogs() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const term = useRef<XTerm | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    let isMounted = true;
    let timeoutId: any = null;
    let interval: any = null;

    try {
      const terminal = new XTerm({
        theme: {
          background: '#0a0a0a',
          foreground: '#a3a3a3',
          cursor: '#3b82f6',
          cursorAccent: '#0a0a0a',
          selectionBackground: '#262626',
          black: '#000000',
          red: '#ef4444',
          green: '#22c55e',
          yellow: '#eab308',
          blue: '#3b82f6',
          magenta: '#d946ef',
          cyan: '#06b6d4',
          white: '#ffffff',
        },
        fontFamily: '"Geist Mono", "JetBrains Mono", "Fira Code", monospace',
        fontSize: 12,
        lineHeight: 1.5,
        cursorBlink: true,
        disableStdin: true,
      });

      term.current = terminal;
      const fit = new FitAddon();
      fitAddon.current = fit;

      terminal.loadAddon(fit);
      terminal.open(terminalRef.current);

      // Guard RenderService.prototype.dimensions to never throw if renderer is uninitialized/disposed
      const core = (terminal as any)._core;
      if (core && core._renderService) {
        const proto = Object.getPrototypeOf(core._renderService);
        if (proto && !(proto as any).__dimensionsGuarded) {
          (proto as any).__dimensionsGuarded = true;
          const origDescriptor = Object.getOwnPropertyDescriptor(proto, 'dimensions');
          const fallbackDimensions = {
            css: {
              canvas: { width: 0, height: 0 },
              cell: { width: 0, height: 0 },
            },
            device: {
              canvas: { width: 0, height: 0 },
              cell: { width: 0, height: 0 },
              char: { width: 0, height: 0, left: 0, top: 0 },
            },
          };

          Object.defineProperty(proto, 'dimensions', {
            configurable: true,
            enumerable: true,
            get() {
              try {
                if (this._renderer && this._renderer.value && this._renderer.value.dimensions) {
                  return this._renderer.value.dimensions;
                }
                if (origDescriptor && typeof origDescriptor.get === 'function') {
                  const val = origDescriptor.get.call(this);
                  if (val) return val;
                }
              } catch {
                // fall through to fallback
              }
              return fallbackDimensions;
            },
          });
        }
      }

      const safeFit = () => {
        if (!isMounted || !terminalRef.current || !term.current) return;
        try {
          const el = terminalRef.current;
          if (!document.body.contains(el) || el.clientWidth <= 0 || el.clientHeight <= 0) {
            return;
          }
          const tCore = (term.current as any)?._core;
          if (tCore?._renderService && typeof tCore._renderService.hasRenderer === 'function') {
            if (!tCore._renderService.hasRenderer()) return;
          }
          fitAddon.current?.fit();
        } catch {
          // Guard against any race condition
        }
      };

      // Delay to ensure DOM geometry is established before initial fit
      timeoutId = setTimeout(() => {
        safeFit();
      }, 150);

      let lineIndex = 0;
      interval = setInterval(() => {
        if (!isMounted || !term.current) return;
        try {
          if (lineIndex < logs.length) {
            let line = logs[lineIndex];
            if (line.includes('[SUCCESS]')) {
              line = `\x1b[32m${line}\x1b[0m`;
            } else if (line.includes('[WARNING]')) {
              line = `\x1b[33m${line}\x1b[0m`;
            } else if (line.includes('[INFO]')) {
              line = `\x1b[34m${line}\x1b[0m`;
            }
            term.current?.writeln(line);
            lineIndex++;
          } else {
            clearInterval(interval);
            term.current?.writeln('\r\n\x1b[32m[SYSTEM]\x1b[0m Pipeline execution finished. Ready.');
          }
        } catch {
          // ignore
        }
      }, 500);

      const handleResize = () => {
        safeFit();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        isMounted = false;
        if (timeoutId) clearTimeout(timeoutId);
        if (interval) clearInterval(interval);
        window.removeEventListener('resize', handleResize);

        try {
          term.current?.dispose();
        } catch {
          // ignore error on dispose
        }
        term.current = null;
        fitAddon.current = null;

        if (terminalRef.current) {
          terminalRef.current.innerHTML = '';
        }
      };
    } catch (err) {
      console.warn('Terminal initialization error:', err);
    }
  }, []);

  return <div ref={terminalRef} className="w-full h-full bg-[#0a0a0a] overflow-hidden" />;
}
