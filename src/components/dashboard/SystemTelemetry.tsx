import { useState, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sliders, 
  Cpu, 
  Database, 
  AlertTriangle, 
  Check, 
  RotateCcw, 
  Terminal, 
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card } from '../ui/Card';
import { MetricsChart } from './MetricsChart';
import { StatusDot } from '../ui/StatusDot';

export function SystemTelemetry() {
  const [cpuThrottled, setCpuThrottled] = useState(false);
  const [cpuLimit, setCpuLimit] = useState(45); // percentage (45% = 1800m cores)
  const [ramLimited, setRamLimited] = useState(false);
  const [ramLimit, setRamLimit] = useState(60); // percentage (60% = 4.8GiB)
  const [isTuneOpen, setIsTuneOpen] = useState(false);
  const [lastPatched, setLastPatched] = useState<string | null>(null);

  const cpuInputId = useId();
  const ramInputId = useId();

  // Dynamic calculated current metrics based on applied cgroup limits
  const baseCpu = 65;
  const baseMem = 70;
  const effectiveCpu = cpuThrottled && baseCpu > cpuLimit ? cpuLimit : baseCpu;
  const isCpuCapped = cpuThrottled && baseCpu > cpuLimit;
  const effectiveMem = ramLimited && baseMem > ramLimit ? ramLimit : baseMem;
  const isMemCapped = ramLimited && baseMem > ramLimit;

  const triggerK8sPatch = (msg: string) => {
    setLastPatched(msg);
  };

  const handleCpuToggle = (enabled: boolean) => {
    setCpuThrottled(enabled);
    triggerK8sPatch(
      enabled 
        ? `kubectl patch deploy -p '{"limits":{"cpu":"${(cpuLimit * 40).toFixed(0)}m"}}'` 
        : `kubectl patch deploy --rm-limit=cpu`
    );
  };

  const handleRamToggle = (enabled: boolean) => {
    setRamLimited(enabled);
    triggerK8sPatch(
      enabled 
        ? `kubectl patch deploy -p '{"limits":{"memory":"${(ramLimit * 80).toFixed(0)}Mi"}}'` 
        : `kubectl patch deploy --rm-limit=memory`
    );
  };

  const applyPreset = (preset: 'default' | 'eco' | 'stress' | 'prod') => {
    if (preset === 'default') {
      setCpuThrottled(false);
      setRamLimited(false);
      triggerK8sPatch(`cgroup limits removed: full node burst capacity`);
    } else if (preset === 'eco') {
      setCpuThrottled(true);
      setCpuLimit(40);
      setRamLimited(true);
      setRamLimit(55);
      triggerK8sPatch(`preset applied: Eco Throttling (40% CPU / 55% RAM)`);
    } else if (preset === 'stress') {
      setCpuThrottled(true);
      setCpuLimit(25);
      setRamLimited(true);
      setRamLimit(45);
      triggerK8sPatch(`preset applied: Stress Concurrency (25% CPU / 45% RAM)`);
    } else if (preset === 'prod') {
      setCpuThrottled(true);
      setCpuLimit(80);
      setRamLimited(true);
      setRamLimit(85);
      triggerK8sPatch(`preset applied: Production Bounds (80% CPU / 85% RAM)`);
    }
  };

  const isAnyLimitActive = cpuThrottled || ramLimited;

  return (
    <Card
      title="System Telemetry"
      className="min-h-[340px] flex flex-col transition-all"
      delay={0.3}
      action={
        <div className="flex items-center gap-2">
          {isAnyLimitActive && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <StatusDot status="warning" pulse />
              K8s Cgroups Active
            </span>
          )}
          <button
            onClick={() => setIsTuneOpen(!isTuneOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
              isTuneOpen || isAnyLimitActive
                ? 'bg-neutral-800 text-blue-400 border-blue-500/30 shadow-sm'
                : 'bg-neutral-900/80 text-neutral-400 hover:text-neutral-200 border-neutral-800 hover:bg-neutral-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>K8s Limits</span>
            {isTuneOpen ? (
              <ChevronUp className="w-3 h-3 ml-0.5 opacity-70" />
            ) : (
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
            )}
          </button>
        </div>
      }
    >
      <div className="p-4 md:p-5 h-full flex flex-col justify-between">
        {/* Metric stats row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex gap-6 md:gap-8">
            {/* CPU Metric */}
            <div>
              <div className="flex items-center gap-1.5 text-neutral-400 text-xs mb-1 font-medium">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>CPU Load</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-semibold tracking-tight transition-colors ${
                  isCpuCapped ? 'text-amber-400' : 'text-neutral-100'
                }`}>
                  {effectiveCpu}
                  <span className="text-sm text-neutral-500 font-normal">%</span>
                </span>
                {isCpuCapped && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                    <span>CAPPED</span>
                  </span>
                )}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                {cpuThrottled ? `Quota: ${(cpuLimit * 40).toFixed(0)}m / 4000m` : 'Unbounded (4 Cores)'}
              </div>
            </div>

            {/* RAM Metric */}
            <div>
              <div className="flex items-center gap-1.5 text-neutral-400 text-xs mb-1 font-medium">
                <Database className="w-3.5 h-3.5 text-purple-400" />
                <span>Memory (RAM)</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-semibold tracking-tight transition-colors ${
                  isMemCapped ? 'text-purple-400' : 'text-neutral-100'
                }`}>
                  {effectiveMem}
                  <span className="text-sm text-neutral-500 font-normal">%</span>
                </span>
                {isMemCapped && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                    <span>LIMIT</span>
                  </span>
                )}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                {ramLimited ? `Cgroup: ${(ramLimit * 0.08).toFixed(1)}GiB / 8.0GiB` : '8.0 GiB Allocated'}
              </div>
            </div>
          </div>

          {/* Quick inline switches if drawer is closed */}
          {!isTuneOpen && (
            <div className="flex flex-col gap-1.5 items-end">
              <button
                onClick={() => handleCpuToggle(!cpuThrottled)}
                className={`text-[11px] px-2 py-0.5 rounded flex items-center gap-1.5 transition-all border ${
                  cpuThrottled 
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                    : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border-neutral-800'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${cpuThrottled ? 'bg-amber-400 glow-yellow' : 'bg-neutral-600'}`} />
                <span>Throttle CPU {cpuThrottled ? `(${cpuLimit}%)` : 'Off'}</span>
              </button>
              <button
                onClick={() => handleRamToggle(!ramLimited)}
                className={`text-[11px] px-2 py-0.5 rounded flex items-center gap-1.5 transition-all border ${
                  ramLimited 
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' 
                    : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border-neutral-800'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${ramLimited ? 'bg-purple-400 glow-blue' : 'bg-neutral-600'}`} />
                <span>Limit RAM {ramLimited ? `(${ramLimit}%)` : 'Off'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Expandable Interactive K8s Tuning Drawer */}
        <AnimatePresence>
          {isTuneOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden mb-4 border border-neutral-800 bg-neutral-950/80 rounded-lg p-3.5 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-neutral-800/60">
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
                    K8s Cgroup Resource Requests & Limits
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => applyPreset('default')}
                    className="text-[10px] text-neutral-400 hover:text-neutral-200 px-2 py-0.5 rounded hover:bg-neutral-900 transition-colors flex items-center gap-1"
                    title="Reset to default unconstrained limits"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Reset
                  </button>
                </div>
              </div>

              {/* Slider 1: Throttle CPU */}
              <div className="mb-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <label 
                      htmlFor={cpuInputId}
                      className="relative inline-flex items-center cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        id={cpuInputId}
                        checked={cpuThrottled}
                        onChange={(e) => handleCpuToggle(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-7 h-4 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                    <span className={`font-medium ${cpuThrottled ? 'text-amber-400' : 'text-neutral-300'}`}>
                      Throttle CPU (CFS Quota)
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-neutral-400">
                    <span className="text-neutral-200 font-semibold">{cpuLimit}%</span> ({ (cpuLimit * 40).toFixed(0) }m / 4000m)
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="15"
                    max="95"
                    step="5"
                    value={cpuLimit}
                    disabled={!cpuThrottled}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCpuLimit(val);
                      triggerK8sPatch(`resources.limits.cpu set to ${(val * 40).toFixed(0)}m`);
                    }}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer transition-opacity ${
                      cpuThrottled 
                        ? 'bg-neutral-700 accent-amber-500' 
                        : 'bg-neutral-800 accent-neutral-600 opacity-40 cursor-not-allowed'
                    }`}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-neutral-500 font-mono mt-1">
                  <span>600m (Strict)</span>
                  <span>2000m (Balanced)</span>
                  <span>3800m (Max)</span>
                </div>
              </div>

              {/* Slider 2: Limit RAM */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <label 
                      htmlFor={ramInputId}
                      className="relative inline-flex items-center cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        id={ramInputId}
                        checked={ramLimited}
                        onChange={(e) => handleRamToggle(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-7 h-4 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                    <span className={`font-medium ${ramLimited ? 'text-purple-400' : 'text-neutral-300'}`}>
                      Limit RAM (cgroup v2)
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-neutral-400">
                    <span className="text-neutral-200 font-semibold">{ramLimit}%</span> ({ (ramLimit * 0.08).toFixed(1) } GiB / 8.0 GiB)
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="25"
                    max="95"
                    step="5"
                    value={ramLimit}
                    disabled={!ramLimited}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setRamLimit(val);
                      triggerK8sPatch(`resources.limits.memory set to ${(val * 80).toFixed(0)}Mi`);
                    }}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer transition-opacity ${
                      ramLimited 
                        ? 'bg-neutral-700 accent-purple-500' 
                        : 'bg-neutral-800 accent-neutral-600 opacity-40 cursor-not-allowed'
                    }`}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-neutral-500 font-mono mt-1">
                  <span>2.0 GiB</span>
                  <span>4.8 GiB (Nominal)</span>
                  <span>7.6 GiB (Burstable)</span>
                </div>
              </div>

              {/* Quick Presets Bar */}
              <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between">
                <span className="text-[10px] text-neutral-500 font-mono">Simulation Presets:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => applyPreset('eco')}
                    className="text-[10px] px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 transition-colors"
                  >
                    Eco (40%)
                  </button>
                  <button
                    onClick={() => applyPreset('stress')}
                    className="text-[10px] px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-amber-300 rounded border border-neutral-800 transition-colors"
                  >
                    Stress (25%)
                  </button>
                  <button
                    onClick={() => applyPreset('prod')}
                    className="text-[10px] px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-blue-300 rounded border border-neutral-800 transition-colors"
                  >
                    Prod (80%)
                  </button>
                </div>
              </div>

              {/* Real-time K8s patch indicator */}
              {lastPatched && (
                <div className="mt-2.5 px-2 py-1 bg-black/60 rounded border border-neutral-800/80 flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
                  <Terminal className="w-3 h-3 text-blue-400 shrink-0" />
                  <span className="text-blue-300 font-medium shrink-0">k8s-agent:</span>
                  <span className="truncate">{lastPatched}</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Recharts area */}
        <div className="flex-1 -mx-4 -mb-4 md:-mx-5 md:-mb-5 min-h-[175px]">
          <MetricsChart 
            cpuThrottled={cpuThrottled} 
            cpuLimit={cpuLimit}
            ramLimited={ramLimited}
            ramLimit={ramLimit}
          />
        </div>
      </div>
    </Card>
  );
}
