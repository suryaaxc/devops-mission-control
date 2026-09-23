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
import { motion } from 'motion/react';

const baseData = [
  { time: '00:00', cpu: 20, memory: 40 },
  { time: '04:00', cpu: 25, memory: 45 },
  { time: '08:00', cpu: 45, memory: 60 },
  { time: '12:00', cpu: 85, memory: 80 },
  { time: '16:00', cpu: 65, memory: 70 },
  { time: '20:00', cpu: 35, memory: 55 },
  { time: '24:00', cpu: 30, memory: 50 },
];

interface MetricsChartProps {
  cpuThrottled?: boolean;
  cpuLimit?: number;
  ramLimited?: boolean;
  ramLimit?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-neutral-900/95 border border-neutral-800 rounded-lg p-3 shadow-xl backdrop-blur-md">
        <p className="text-neutral-400 text-xs mb-2 font-mono">{label} UTC</p>
        {payload.map((entry: any, index: number) => {
          const isCpu = entry.dataKey === 'cpu';
          const isMemory = entry.dataKey === 'memory';
          const throttled = entry.payload?.[isCpu ? 'cpuThrottled' : 'memThrottled'];
          return (
            <div key={index} className="flex items-center justify-between gap-3 mb-1 last:mb-0">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-neutral-300 text-xs font-medium">
                  {entry.name.toUpperCase()}:
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-50 text-xs font-mono font-medium">{entry.value}%</span>
                {throttled && (
                  <span className="text-[9px] px-1 py-0.2 bg-red-500/20 text-red-400 border border-red-500/30 rounded font-mono">
                    THROTTLED
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export function MetricsChart({
  cpuThrottled = false,
  cpuLimit = 50,
  ramLimited = false,
  ramLimit = 65,
}: MetricsChartProps) {
  // Transform base data with simulated K8s cgroup limits
  const chartData = baseData.map((d) => {
    const rawCpu = d.cpu;
    const rawMem = d.memory;
    const cpu = cpuThrottled && rawCpu > cpuLimit ? cpuLimit : rawCpu;
    const memory = ramLimited && rawMem > ramLimit ? ramLimit : rawMem;

    return {
      time: d.time,
      cpu,
      memory,
      rawCpu,
      rawMem,
      cpuThrottled: cpuThrottled && rawCpu > cpuLimit,
      memThrottled: ramLimited && rawMem > ramLimit,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full h-full min-h-[190px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 12,
            right: 8,
            left: -20,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={cpuThrottled ? "#ef4444" : "#3b82f6"} stopOpacity={0.35} />
              <stop offset="95%" stopColor={cpuThrottled ? "#ef4444" : "#3b82f6"} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={ramLimited ? "#a855f7" : "#8b5cf6"} stopOpacity={0.35} />
              <stop offset="95%" stopColor={ramLimited ? "#a855f7" : "#8b5cf6"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
          <XAxis
            dataKey="time"
            stroke="#525252"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            dy={8}
          />
          <YAxis
            stroke="#525252"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            dx={-10}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#404040', strokeWidth: 1, strokeDasharray: '4 4' }} />

          {/* Reference Lines for K8s Resource Limits */}
          {cpuThrottled && (
            <ReferenceLine
              y={cpuLimit}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `CPU Limit: ${cpuLimit}%`,
                fill: '#f87171',
                fontSize: 9,
                position: 'insideTopRight',
              }}
            />
          )}

          {ramLimited && (
            <ReferenceLine
              y={ramLimit}
              stroke="#a855f7"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `RAM Limit: ${ramLimit}%`,
                fill: '#c084fc',
                fontSize: 9,
                position: 'insideBottomRight',
              }}
            />
          )}

          <Area
            type="monotone"
            dataKey="memory"
            stroke={ramLimited ? "#a855f7" : "#8b5cf6"}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorMemory)"
            animationDuration={800}
          />
          <Area
            type="monotone"
            dataKey="cpu"
            stroke={cpuThrottled ? "#ef4444" : "#3b82f6"}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCpu)"
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
