import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  Database,
  Wifi,
  Clock,
  Radio,
  Server,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { StatusDot } from '../ui/StatusDot';

// Initial Memory Dataset (simulating 10 intervals)
const initialMemoryData = [
  { time: '14:20:00', allocated: 58.4, cache: 24.1, swap: 4.2 },
  { time: '14:20:15', allocated: 61.2, cache: 24.8, swap: 4.2 },
  { time: '14:20:30', allocated: 59.8, cache: 25.0, swap: 4.1 },
  { time: '14:20:45', allocated: 67.5, cache: 26.2, swap: 4.4 },
  { time: '14:21:00', allocated: 72.1, cache: 27.5, swap: 4.8 },
  { time: '14:21:15', allocated: 69.4, cache: 26.8, swap: 4.6 },
  { time: '14:21:30', allocated: 74.8, cache: 28.1, swap: 5.0 },
  { time: '14:21:45', allocated: 71.0, cache: 27.2, swap: 4.7 },
  { time: '14:22:00', allocated: 76.5, cache: 29.0, swap: 5.2 },
  { time: '14:22:15', allocated: 73.2, cache: 28.4, swap: 4.9 },
];

// Initial Latency Dataset (simulating P50, P95, P99 in ms)
const initialLatencyData = [
  { time: '14:20:00', p50: 12.4, p95: 22.1, p99: 34.5 },
  { time: '14:20:15', p50: 14.1, p95: 24.8, p99: 38.2 },
  { time: '14:20:30', p50: 13.0, p95: 23.2, p99: 36.0 },
  { time: '14:20:45', p50: 18.5, p95: 31.0, p99: 47.8 },
  { time: '14:21:00', p50: 22.4, p95: 38.6, p99: 56.2 },
  { time: '14:21:15', p50: 16.8, p95: 29.4, p99: 43.1 },
  { time: '14:21:30', p50: 15.2, p95: 27.0, p99: 40.5 },
  { time: '14:21:45', p50: 14.6, p95: 25.8, p99: 39.0 },
  { time: '14:22:00', p50: 17.3, p95: 30.2, p99: 44.8 },
  { time: '14:22:15', p50: 15.8, p95: 28.1, p99: 41.6 },
];

const nodesStatus = [
  { name: 'worker-gpu-node-01', type: 'NVIDIA A100 (80GB)', memPct: 78, latency: '12.4ms', status: 'success' },
  { name: 'worker-gpu-node-02', type: 'NVIDIA A100 (80GB)', memPct: 82, latency: '14.8ms', status: 'success' },
  { name: 'ingress-envoy-east', type: 'c6i.2xlarge (8 vCPU)', memPct: 34, latency: '3.8ms', status: 'success' },
  { name: 'redis-cache-cluster', type: 'r6i.xlarge (32GB)', memPct: 61, latency: '1.9ms', status: 'success' },
  { name: 'inference-serving-us', type: 'g5.2xlarge (24GB)', memPct: 69, latency: '18.2ms', status: 'info', pulse: true },
];

export function MonitoringView() {
  const [memoryData, setMemoryData] = useState(initialMemoryData);
  const [latencyData, setLatencyData] = useState(initialLatencyData);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [timeWindow, setTimeWindow] = useState('15m');

  // Real-time ticking simulation to append smooth live metrics
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];

      // Simulated micro fluctuations
      setMemoryData((prev) => {
        const last = prev[prev.length - 1];
        const newAllocated = Math.max(50, Math.min(88, Number((last.allocated + (Math.random() * 6 - 3)).toFixed(1))));
        const newCache = Math.max(20, Math.min(35, Number((last.cache + (Math.random() * 2 - 1)).toFixed(1))));
        const newSwap = Math.max(3, Math.min(8, Number((last.swap + (Math.random() * 0.4 - 0.2)).toFixed(1))));

        const next = [...prev.slice(1), { time: timeStr, allocated: newAllocated, cache: newCache, swap: newSwap }];
        return next;
      });

      setLatencyData((prev) => {
        const last = prev[prev.length - 1];
        const newP50 = Math.max(9, Math.min(26, Number((last.p50 + (Math.random() * 4 - 2)).toFixed(1))));
        const newP95 = Number((newP50 * 1.7 + Math.random() * 3).toFixed(1));
        const newP99 = Number((newP95 * 1.45 + Math.random() * 4).toFixed(1));

        const next = [...prev.slice(1), { time: timeStr, p50: newP50, p95: newP95, p99: newP99 }];
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  const latestMem = memoryData[memoryData.length - 1];
  const latestLatency = latencyData[latencyData.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
              Cluster Telemetry & Monitoring
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
              K8s v1.31
            </span>
          </div>
          <p className="text-sm text-neutral-500">
            Real-time memory bandwidth allocation and ingress network latency streams.
          </p>
        </div>

        {/* Live streaming switch and time range selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            {(['5m', '15m', '1h', '24h'] as const).map((window) => (
              <button
                key={window}
                onClick={() => setTimeWindow(window)}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  timeWindow === window
                    ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {window}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isLiveStreaming
                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
          >
            <StatusDot status={isLiveStreaming ? 'success' : 'inactive'} pulse={isLiveStreaming} />
            <span>{isLiveStreaming ? 'Streaming' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-purple-400" />
              Allocated RSS
            </span>
            <span className="text-[10px] font-mono text-neutral-500">Node Total</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-semibold text-neutral-100 tracking-tight font-mono">
              {latestMem.allocated} <span className="text-sm font-normal text-neutral-500">GB</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Cache: {latestMem.cache} GB · Swap: {latestMem.swap} GB
            </div>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(latestMem.allocated / 100) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              P50 / P95 Latency
            </span>
            <span className="text-[10px] font-mono text-green-400 bg-green-500/10 px-1 rounded">
              SLA Met
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-semibold text-neutral-100 tracking-tight font-mono">
              {latestLatency.p50} <span className="text-sm font-normal text-neutral-500">ms</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              P95: {latestLatency.p95} ms · Peak P99: {latestLatency.p99} ms
            </div>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (latestLatency.p50 / 40) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              Active Pod Mesh
            </span>
            <span className="text-[10px] font-mono text-neutral-500">us-east-1</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-semibold text-neutral-100 tracking-tight font-mono">
              48 / 48
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              100% Ready (0 restarting)
            </div>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full w-full" />
          </div>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Network Egress
            </span>
            <span className="text-[10px] font-mono text-neutral-500">gRPC v2</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-semibold text-neutral-100 tracking-tight font-mono">
              1.84 <span className="text-sm font-normal text-neutral-500">Gbps</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Packet Loss: 0.001% · TCP retrans: 0
            </div>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full w-[42%]" />
          </div>
        </div>
      </div>

      {/* Primary Recharts Area Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Real-time Memory Usage Trend */}
        <Card
          title="Real-Time Memory Usage Trend (GB)"
          className="h-[360px]"
          delay={0.1}
          action={
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-neutral-400">Allocated</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="text-neutral-400">Page Cache</span>
              </div>
            </div>
          }
        >
          <div className="p-4 h-full flex flex-col">
            <div className="flex-1 -mx-3 -mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={memoryData}
                  margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorAllocated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCache" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="#525252"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={5}
                  />
                  <YAxis
                    stroke="#525252"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    dx={-6}
                    tickFormatter={(v) => `${v}GB`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-neutral-900/95 border border-neutral-800 rounded-lg p-3 shadow-xl backdrop-blur-md">
                            <p className="text-neutral-400 text-xs font-mono mb-2">{label}</p>
                            {payload.map((entry: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-4 text-xs font-mono mb-1 last:mb-0"
                              >
                                <span className="text-neutral-300 capitalize">{entry.name}:</span>
                                <span className="font-semibold text-neutral-100">
                                  {entry.value} GB
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Warning line at 85 GB threshold */}
                  <ReferenceLine
                    y={85}
                    stroke="#ef4444"
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                    label={{
                      value: 'Node Limit: 85GB',
                      fill: '#f87171',
                      fontSize: 9,
                      position: 'insideTopRight',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="allocated"
                    name="Allocated RSS"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAllocated)"
                    animationDuration={600}
                  />
                  <Area
                    type="monotone"
                    dataKey="cache"
                    name="Cache / Buffers"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCache)"
                    animationDuration={600}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Chart 2: Real-time Network Latency Trends */}
        <Card
          title="Network Latency Trends (ms)"
          className="h-[360px]"
          delay={0.2}
          action={
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-neutral-400">P50</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-neutral-400">P95</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-neutral-400">P99</span>
              </div>
            </div>
          }
        >
          <div className="p-4 h-full flex flex-col">
            <div className="flex-1 -mx-3 -mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={latencyData}
                  margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorP50" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorP95" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorP99" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="#525252"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={5}
                  />
                  <YAxis
                    stroke="#525252"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 70]}
                    dx={-6}
                    tickFormatter={(v) => `${v}ms`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-neutral-900/95 border border-neutral-800 rounded-lg p-3 shadow-xl backdrop-blur-md">
                            <p className="text-neutral-400 text-xs font-mono mb-2">{label}</p>
                            {payload.map((entry: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-4 text-xs font-mono mb-1 last:mb-0"
                              >
                                <span className="text-neutral-300 uppercase">{entry.name}:</span>
                                <span className="font-semibold text-neutral-100">
                                  {entry.value} ms
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* SLA reference line at 50ms */}
                  <ReferenceLine
                    y={50}
                    stroke="#f59e0b"
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                    label={{
                      value: 'Target SLA: 50ms',
                      fill: '#fbbf24',
                      fontSize: 9,
                      position: 'insideTopRight',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="p99"
                    name="P99 Peak"
                    stroke="#f43f5e"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#colorP99)"
                    animationDuration={600}
                  />
                  <Area
                    type="monotone"
                    dataKey="p95"
                    name="P95 Latency"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorP95)"
                    animationDuration={600}
                  />
                  <Area
                    type="monotone"
                    dataKey="p50"
                    name="P50 Median"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorP50)"
                    animationDuration={600}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* Cluster Node Status & Latency Breakdown Table */}
      <Card title="Compute Nodes & Mesh Latency Map" delay={0.3}>
        <div className="divide-y divide-neutral-800/60 overflow-x-auto">
          {nodesStatus.map((node, i) => (
            <div
              key={i}
              className="p-4 hover:bg-neutral-900/40 transition-colors flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3 min-w-[200px]">
                <StatusDot status={node.status as any} pulse={node.pulse} />
                <div>
                  <div className="text-sm font-medium text-neutral-200 group-hover:text-blue-400 transition-colors">
                    {node.name}
                  </div>
                  <div className="text-xs text-neutral-500 font-mono mt-0.5">{node.type}</div>
                </div>
              </div>

              <div className="flex-1 max-w-xs hidden sm:block">
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-neutral-400">RAM Pressure</span>
                  <span className="text-neutral-200 font-medium">{node.memPct}%</span>
                </div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      node.memPct > 80 ? 'bg-amber-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${node.memPct}%` }}
                  />
                </div>
              </div>

              <div className="text-right min-w-[100px]">
                <div className="text-xs font-mono font-medium text-cyan-400">{node.latency}</div>
                <div className="text-[10px] text-neutral-500 mt-0.5">Roundtrip</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
