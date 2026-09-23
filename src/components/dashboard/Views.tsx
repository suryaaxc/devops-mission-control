import { Card } from '../ui/Card';
import { Play } from 'lucide-react';
import { motion } from 'motion/react';

export function PipelinesView() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6 max-w-7xl mx-auto w-full"
    >
      <div className="mb-2">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-100">Pipeline Configurations</h2>
        <p className="text-sm text-neutral-500 mt-1">Manage and orchestrate automated workflows.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[
          { name: 'Nightly Training', freq: 'Every 24h', models: 'ResNet50, YOLOv8' },
          { name: 'Data Ingestion Sync', freq: 'Every 1h', models: 'Postgres -> S3' },
          { name: 'Model Eval & Test', freq: 'On PR Merge', models: 'All Staging Models' },
        ].map((pipe, i) => (
          <Card key={i} title={pipe.name} className="h-48 group hover:border-neutral-700 transition-colors">
            <div className="p-5 flex flex-col h-full justify-between">
              <div>
                <p className="text-sm text-neutral-400 font-medium">Trigger: {pipe.freq}</p>
                <p className="text-xs text-neutral-500 mt-2 font-mono bg-neutral-900/50 p-2 rounded-md border border-neutral-800/50">{pipe.models}</p>
              </div>
              <div className="flex items-center gap-3">
                 <button className="flex items-center justify-center gap-2 px-3 py-1.5 w-full bg-blue-600/10 text-blue-400 border border-blue-900/30 rounded-md text-sm font-medium hover:bg-blue-600/20 transition-colors">
                    <Play className="w-3.5 h-3.5 fill-current" /> Run Now
                 </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

export function SettingsView() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6 max-w-3xl mx-auto w-full"
    >
      <div className="mb-2">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-100">Project Settings</h2>
        <p className="text-sm text-neutral-500 mt-1">Configure your environment, compute, and billing.</p>
      </div>
      
      <Card title="General" className="overflow-visible">
        <div className="p-6 flex flex-col gap-8">
          <div>
            <label className="text-sm font-medium text-neutral-300 block mb-2">Project Name</label>
            <input 
              type="text" 
              defaultValue="Vision-Transformer-v2" 
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-sm rounded-md px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner" 
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-neutral-900/30 rounded-lg border border-neutral-800/50">
            <div>
              <h4 className="text-sm font-medium text-neutral-200">Auto-Scaling Compute</h4>
              <p className="text-xs text-neutral-500 mt-1">Automatically provision GPU nodes based on pipeline queue depth.</p>
            </div>
            <div className="w-11 h-6 bg-blue-600 rounded-full relative cursor-pointer shadow-inner">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </div>
        </div>
      </Card>

      <Card title="Danger Zone" className="border-red-900/30 bg-red-950/5">
        <div className="p-6">
          <p className="text-sm text-neutral-400 mb-4">Permanently delete this project and all associated pipelines, models, and artifacts. This action cannot be undone.</p>
          <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-900/30 rounded-md text-sm font-medium transition-colors">
            Delete Project
          </button>
        </div>
      </Card>
    </motion.div>
  );
}
