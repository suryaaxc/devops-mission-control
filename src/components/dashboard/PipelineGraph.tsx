import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { StatusDot } from '../ui/StatusDot';
import { Database, Cpu, Rocket } from 'lucide-react';

const CustomNode = ({ data }: NodeProps) => {
  return (
    <div className="px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-lg shadow-xl min-w-[150px] flex items-center justify-between gap-3 group hover:border-neutral-700 transition-colors">
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-neutral-700 !border-neutral-950" />
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-md ${data.color}`}>
          {data.icon}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-neutral-200">{data.label}</span>
          <span className="text-[10px] text-neutral-500 font-mono mt-0.5">{data.sublabel}</span>
        </div>
      </div>
      <StatusDot status={data.status as any} pulse={data.status === 'success' || data.status === 'info'} />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-neutral-700 !border-neutral-950" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const initialNodes = [
  {
    id: '1',
    type: 'custom',
    position: { x: 50, y: 100 },
    data: {
      label: 'Data Ingestion',
      sublabel: 'postgres-db-1',
      icon: <Database className="w-4 h-4 text-blue-400" />,
      color: 'bg-blue-500/10',
      status: 'success',
    },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 300, y: 100 },
    data: {
      label: 'Model Training',
      sublabel: 'gpu-cluster-a',
      icon: <Cpu className="w-4 h-4 text-purple-400" />,
      color: 'bg-purple-500/10',
      status: 'info',
    },
  },
  {
    id: '3',
    type: 'custom',
    position: { x: 550, y: 100 },
    data: {
      label: 'Deployment',
      sublabel: 'k8s-prod-us',
      icon: <Rocket className="w-4 h-4 text-green-400" />,
      color: 'bg-green-500/10',
      status: 'inactive',
    },
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2, opacity: 0.8 } },
  { id: 'e2-3', source: '2', target: '3', animated: false, style: { stroke: '#525252', strokeWidth: 1.5 } },
];

export function PipelineGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  return (
    <div className="w-full h-full bg-neutral-950/50 rounded-lg overflow-hidden border border-neutral-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="dark"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#262626" gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}
