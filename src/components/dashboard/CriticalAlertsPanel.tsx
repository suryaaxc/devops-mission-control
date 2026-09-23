import { useState, useEffect, useRef, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Check,
  Eye,
  ShieldAlert,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Terminal,
  Server,
  Layers,
  Flame,
  CheckCheck
} from 'lucide-react';
import { StatusDot } from '../ui/StatusDot';

export interface AlertItem {
  id: string;
  code: string;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium';
  component: string;
  node: string;
  timestamp: string;
  status: 'unacknowledged' | 'acknowledged' | 'resolved';
  logSnippet?: string;
  remediation?: string;
}

const initialAlerts: AlertItem[] = [
  {
    id: 'alt-1',
    code: 'ERR-CUDA-OOM',
    title: 'CUDA Memory Exhaustion on GPU Worker',
    message: 'torch.cuda.OutOfMemoryError: Tried to allocate 2.40 GiB on GPU 0 (78.8GB allocated of 80GB capacity). Container entered CrashLoopBackOff.',
    severity: 'critical',
    component: 'worker-gpu-node-02',
    node: 'k8s-pod/inference-worker-7b9c4',
    timestamp: '2m ago',
    status: 'unacknowledged',
    logSnippet: `[FATAL 14:28:11] torch.cuda.OutOfMemoryError: CUDA out of memory.
  Total capacity: 79.15 GiB
  Already allocated: 76.82 GiB
  Tried to allocate: 2.40 GiB
  Process terminated with exit code 137 (SIGKILL by cgroup oom-killer)`,
    remediation: 'kubectl patch deployment inference-worker -p \'{"spec":{"template":{"spec":{"containers":[{"name":"worker","resources":{"limits":{"nvidia.com/gpu":"2"}}}]}}}}\'',
  },
  {
    id: 'alt-2',
    code: 'ERR-NET-P99',
    title: 'Ingress Envoy Mesh P99 Latency Breach',
    message: 'Ingress gateway P99 packet latency rose to 142ms, breaching the 50ms service level agreement (SLA) under current gRPC payload.',
    severity: 'high',
    component: 'ingress-envoy-east',
    node: 'envoy-gateway-mesh',
    timestamp: '7m ago',
    status: 'unacknowledged',
    logSnippet: `[WARN 14:23:44] envoy upstream: connection pool queue saturation detected.
  Upstream cluster: vision-transformer-serving
  P50: 16.2ms | P95: 42.1ms | P99: 142.8ms (Target: < 50ms)
  Active HTTP/2 streams: 1,840 / 2,000`,
    remediation: 'Trigger horizontal pod autoscaler (HPA) scale-out on Envoy cluster or switch upstream to us-east-backup.',
  },
  {
    id: 'alt-3',
    code: 'WARN-CFS-THROTTLE',
    title: 'CFS Bandwidth Quota Drop Detected',
    message: 'Linux CFS scheduler reports 38% periods throttled on worker-cpu-01 due to aggressive cpu.cfs_quota_us ceiling.',
    severity: 'medium',
    component: 'kernel-cgroup-v2',
    node: 'worker-cpu-node-01',
    timestamp: '16m ago',
    status: 'acknowledged',
    logSnippet: `[INFO 14:14:02] cgroup.cpu.stat: nr_periods=1000 nr_throttled=380 throttled_time=14820932ns
  CPU quota capped at 1200m / 4000m. Node throughput degraded by 18%.`,
    remediation: 'Relax CPU limit slider in System Telemetry or increase deployment spec cpu limit to 2500m.',
  },
  {
    id: 'alt-4',
    code: 'WARN-REDIS-SYNC',
    title: 'Redis Replica Replication Lag > 500ms',
    message: 'Replication offset sync lag between master and redis-cache-replica-2 reached 620ms during model checkpoint sync.',
    severity: 'medium',
    component: 'redis-cache-cluster',
    node: 'redis-statefulset-02',
    timestamp: '32m ago',
    status: 'resolved',
    logSnippet: `[INFO 13:58:10] * Replication sync completed. Offset backlog caught up in 4.2s. All read replicas synchronized.`,
    remediation: 'Replication synchronized successfully. No action required.',
  },
];

interface CriticalAlertsPanelProps {
  onAlertStatusChange?: (unacknowledgedCount: number, criticalCount: number) => void;
}

export function CriticalAlertsPanel({ onAlertStatusChange }: CriticalAlertsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>('alt-1');
  const panelRef = useRef<HTMLDivElement>(null);

  // Unacknowledged & active counts
  const unacknowledgedCount = alerts.filter((a) => a.status === 'unacknowledged').length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && a.status !== 'resolved').length;
  const activeCount = alerts.filter((a) => a.status !== 'resolved').length;

  useEffect(() => {
    onAlertStatusChange?.(unacknowledgedCount, criticalCount);
  }, [alerts, unacknowledgedCount, criticalCount, onAlertStatusChange]);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAcknowledge = (id: string, e?: MouseEvent) => {
    e?.stopPropagation();
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, status: 'acknowledged' } : alert
      )
    );
  };

  const handleResolve = (id: string, e?: MouseEvent) => {
    e?.stopPropagation();
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, status: 'resolved' } : alert
      )
    );
  };

  const handleAcknowledgeAll = () => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.status === 'unacknowledged' ? { ...alert, status: 'acknowledged' } : alert
      )
    );
  };

  const handleResolveAll = () => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.status !== 'resolved' ? { ...alert, status: 'resolved' } : alert
      )
    );
  };

  const handleSimulateNewAlert = () => {
    const timestamp = 'Just now';
    const randomId = `alt-${Date.now()}`;
    const newAlert: AlertItem = {
      id: randomId,
      code: 'ERR-POD-EVICTION',
      title: 'Ephemeral Storage Pressure on Worker Node',
      message: 'Node worker-gpu-node-01 reached 92% disk usage (/var/lib/docker/overlay2). Kubelet triggered pod eviction.',
      severity: 'critical',
      component: 'kubelet-eviction',
      node: 'worker-gpu-node-01',
      timestamp,
      status: 'unacknowledged',
      logSnippet: `[CRITICAL ${new Date().toLocaleTimeString()}] DiskPressure condition true on node worker-gpu-node-01. Evicting lowest-priority pods.`,
      remediation: 'Run docker system prune -af or clean /tmp checkpoint caches.',
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setExpandedAlertId(randomId);
    setFilter('active');
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'active' && alert.status === 'resolved') return false;
    if (filter === 'resolved' && alert.status !== 'resolved') return false;
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Critical Alerts Panel"
        className={`relative p-2 rounded-lg border transition-all flex items-center justify-center ${
          isOpen
            ? 'bg-neutral-800 text-neutral-100 border-neutral-700 shadow-inner'
            : unacknowledgedCount > 0
            ? 'bg-neutral-900/90 text-neutral-200 border-red-500/30 hover:border-red-500/50 hover:bg-neutral-900'
            : 'bg-neutral-900/60 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:bg-neutral-900'
        }`}
      >
        <Bell className="w-4 h-4" />

        {/* Counter Badge */}
        {unacknowledgedCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg animate-pulse border-2 border-[#050505]">
            {unacknowledgedCount}
          </span>
        )}
      </button>

      {/* Floating Popover Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-[92vw] sm:w-[460px] md:w-[500px] max-h-[82vh] bg-neutral-950/95 border border-neutral-800 rounded-xl shadow-2xl backdrop-blur-xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-neutral-800/80 bg-neutral-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-neutral-100 tracking-tight">
                      Critical Alerts & Incidents
                    </h2>
                    {criticalCount > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                        {criticalCount} Critical
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Real-time K8s pod, GPU, and service mesh triage
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleSimulateNewAlert}
                  title="Simulate incoming incident"
                  className="px-2 py-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors flex items-center gap-1 border border-blue-500/20"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Test Alert</span>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs & Bulk Actions */}
            <div className="px-4 py-2.5 bg-neutral-900/30 border-b border-neutral-800/60 flex items-center justify-between gap-2 flex-wrap">
              {/* Status Tabs */}
              <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800/80 rounded-lg p-0.5">
                <button
                  onClick={() => setFilter('active')}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    filter === 'active'
                      ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  onClick={() => setFilter('all')}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  All ({alerts.length})
                </button>
                <button
                  onClick={() => setFilter('resolved')}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    filter === 'resolved'
                      ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Resolved ({alerts.filter((a) => a.status === 'resolved').length})
                </button>
              </div>

              {/* Bulk actions */}
              <div className="flex items-center gap-1.5">
                {unacknowledgedCount > 0 && (
                  <button
                    onClick={handleAcknowledgeAll}
                    className="text-[11px] text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 px-2 py-1 rounded transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Ack All</span>
                  </button>
                )}
                {activeCount > 0 && (
                  <button
                    onClick={handleResolveAll}
                    className="text-[11px] text-green-400 hover:text-green-300 hover:bg-green-500/10 px-2 py-1 rounded transition-colors flex items-center gap-1 border border-green-500/20"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Resolve All</span>
                  </button>
                )}
              </div>
            </div>

            {/* Severity Chip Bar */}
            <div className="px-4 py-2 border-b border-neutral-800/40 flex items-center gap-2 overflow-x-auto text-[11px]">
              <span className="text-neutral-500 text-[10px] uppercase font-mono tracking-wider">Severity:</span>
              {(['all', 'critical', 'high', 'medium'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2 py-0.5 rounded capitalize font-medium transition-colors ${
                    severityFilter === sev
                      ? 'bg-neutral-800 text-neutral-100 border border-neutral-700'
                      : 'text-neutral-400 hover:text-neutral-300'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            {/* Alerts List */}
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60 max-h-[460px]">
              {filteredAlerts.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="text-sm font-medium text-neutral-200">No Incidents in View</div>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                    All error alerts have been acknowledged or resolved. Compute nodes are reporting green.
                  </p>
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  const isExpanded = expandedAlertId === alert.id;
                  const isCritical = alert.severity === 'critical';
                  const isHigh = alert.severity === 'high';
                  const isResolved = alert.status === 'resolved';
                  const isAck = alert.status === 'acknowledged';

                  return (
                    <div
                      key={alert.id}
                      className={`p-3.5 transition-colors ${
                        isResolved
                          ? 'bg-neutral-950/40 opacity-70'
                          : isCritical && !isAck
                          ? 'bg-red-500/5 hover:bg-red-500/10'
                          : 'hover:bg-neutral-900/40'
                      }`}
                    >
                      {/* Top line: severity badge, code, timestamp, expand button */}
                      <div
                        className="flex items-start justify-between gap-3 cursor-pointer select-none"
                        onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Severity Icon */}
                          <div className="mt-0.5 shrink-0">
                            {isResolved ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : isCritical ? (
                              <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                            ) : isHigh ? (
                              <AlertCircle className="w-4 h-4 text-amber-500" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-blue-400" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded font-semibold ${
                                  isResolved
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                    : isCritical
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : isHigh
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }`}
                              >
                                {alert.severity}
                              </span>
                              <span className="text-xs font-mono text-neutral-400">{alert.code}</span>
                              <span className="text-[10px] text-neutral-500">{alert.timestamp}</span>

                              {isAck && !isResolved && (
                                <span className="text-[10px] font-mono px-1 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                                  Acked
                                </span>
                              )}
                              {isResolved && (
                                <span className="text-[10px] font-mono px-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                                  Resolved
                                </span>
                              )}
                            </div>

                            <h3 className={`text-xs font-semibold mt-1 transition-colors ${
                              isResolved ? 'text-neutral-400 line-through' : 'text-neutral-200'
                            }`}>
                              {alert.title}
                            </h3>
                          </div>
                        </div>

                        <div className="shrink-0 text-neutral-500 hover:text-neutral-300 p-1">
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      {/* Summary Message */}
                      <p className="text-xs text-neutral-400 mt-1.5 pl-6 leading-relaxed">
                        {alert.message}
                      </p>

                      {/* Component info */}
                      <div className="flex items-center gap-3 text-[10px] text-neutral-500 font-mono mt-2 pl-6">
                        <span className="flex items-center gap-1">
                          <Server className="w-3 h-3 text-neutral-600" />
                          {alert.component}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-neutral-600" />
                          {alert.node}
                        </span>
                      </div>

                      {/* Expanded diagnostic drawer */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-3 pl-6 overflow-hidden"
                          >
                            {alert.logSnippet && (
                              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-[10px] font-mono text-neutral-300 overflow-x-auto my-2">
                                <div className="text-[9px] text-neutral-500 mb-1 flex items-center gap-1">
                                  <Terminal className="w-3 h-3 text-neutral-400" />
                                  <span>Cluster Diagnostic Log:</span>
                                </div>
                                <pre className="whitespace-pre-wrap leading-tight text-neutral-300">
                                  {alert.logSnippet}
                                </pre>
                              </div>
                            )}

                            {alert.remediation && (
                              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-2.5 text-[11px] text-neutral-300 my-2">
                                <span className="text-blue-400 font-medium block mb-1">Recommended Remediation:</span>
                                <code className="font-mono text-[10px] text-neutral-400 block bg-neutral-950/80 p-1.5 rounded border border-neutral-800 break-all">
                                  {alert.remediation}
                                </code>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Action buttons (Acknowledge & Resolve) */}
                      {!isResolved && (
                        <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-neutral-800/40">
                          {alert.status === 'unacknowledged' && (
                            <button
                              onClick={(e) => handleAcknowledge(alert.id, e)}
                              className="px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded-md border border-neutral-700 transition-colors flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5 text-neutral-400" />
                              <span>Acknowledge</span>
                            </button>
                          )}

                          <button
                            onClick={(e) => handleResolve(alert.id, e)}
                            className="px-2.5 py-1 text-xs font-medium text-green-300 hover:text-green-200 bg-green-500/10 hover:bg-green-500/20 rounded-md border border-green-500/30 transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Resolve</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-neutral-900/60 border-t border-neutral-800 text-[11px] text-neutral-500 flex items-center justify-between font-mono">
              <span>Incident Bus: live telemetry</span>
              <span className="flex items-center gap-1.5">
                <StatusDot status={criticalCount > 0 ? 'error' : 'success'} pulse={criticalCount > 0} />
                {criticalCount > 0 ? `${criticalCount} active blocker` : 'All systems nominal'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
