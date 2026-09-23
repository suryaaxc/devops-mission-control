import { useState } from 'react';
import { Reorder } from 'motion/react';
import { GripVertical, Clock, Cpu, Network, User, Download, Check, FileSpreadsheet } from 'lucide-react';
import { StatusDot } from '../ui/StatusDot';
import { Drawer } from '../ui/Drawer';
import { Card } from '../ui/Card';

export type Job = {
  id: string;
  status: 'success' | 'error' | 'warning' | 'info' | 'inactive';
  pulse?: boolean;
  name: string;
  time: string;
  duration: string;
  node: string;
  triggeredBy: string;
  logs: string[];
};

const initialJobs: Job[] = [
  { 
    id: 'JOB-9821', status: 'success', name: 'Data Prep (S3 -> PVC)', time: '2m ago', duration: '45s',
    node: 'worker-node-01', triggeredBy: 'Cron Schedule',
    logs: ['[INFO] Connecting to S3...', '[INFO] Downloading dataset-v2.tar.gz', '[SUCCESS] Extracted 4.2GB to /pvc/data']
  },
  { 
    id: 'JOB-9822', status: 'info', pulse: true, name: 'Train ResNet50 (GPU)', time: 'Running', duration: '12m 30s',
    node: 'gpu-cluster-a', triggeredBy: 'Jane Doe',
    logs: ['[INFO] Initializing PyTorch distributed...', '[INFO] Epoch 1/50 - Loss: 2.451', '[INFO] Epoch 2/50 - Loss: 1.982', '[INFO] Epoch 3/50 - Loss: 1.634 (eta: 38m)']
  },
  { 
    id: 'JOB-9823', status: 'inactive', name: 'Eval & Checkpoint', time: 'Pending', duration: '-',
    node: 'worker-node-02', triggeredBy: 'Auto-trigger (JOB-9822)',
    logs: ['Waiting for dependency JOB-9822 to complete...']
  },
  { 
    id: 'JOB-9824', status: 'error', name: 'Model Serving Test', time: '1h ago', duration: '5s',
    node: 'k8s-prod-us', triggeredBy: 'CI/CD Pipeline',
    logs: ['[INFO] Deploying to staging...', '[ERROR] Readiness probe failed: connection refused on port 8080.', '[ERROR] Container exited with status 1']
  },
  { 
    id: 'JOB-9825', status: 'success', name: 'Docker Image Build', time: '2h ago', duration: '1m 20s',
    node: 'build-server-xyz', triggeredBy: 'Jane Doe',
    logs: ['[INFO] Pulling base image ubuntu:22.04...', '[INFO] RUN pip install -r requirements.txt', '[SUCCESS] Successfully built image gcr.io/proj/model:v1']
  },
];

interface ActiveJobsListProps {
  hideCard?: boolean;
}

export function ActiveJobsList({ hideCard = false }: ActiveJobsListProps) {
  const [jobs, setJobs] = useState(initialJobs);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isExported, setIsExported] = useState(false);

  // Generate and download CSV with proper RFC 4180 escaping
  const exportToCSV = (jobsList: Job[] = jobs, filenamePrefix: string = 'k8s-active-jobs') => {
    const headers = [
      'Job ID',
      'Job Name',
      'Status',
      'Execution State',
      'Duration',
      'Started Time',
      'Compute Node',
      'Triggered By',
      'Log Entries Count',
      'Latest Log Entry',
      'Full Execution Logs'
    ];

    const escapeCSV = (val: string | number | undefined | null) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = jobsList.map((job) => [
      escapeCSV(job.id),
      escapeCSV(job.name),
      escapeCSV(job.status === 'info' ? 'Running' : job.status.toUpperCase()),
      escapeCSV(job.pulse ? 'ACTIVE_PROCESSING' : 'COMPLETED_OR_WAITING'),
      escapeCSV(job.duration),
      escapeCSV(job.time),
      escapeCSV(job.node),
      escapeCSV(job.triggeredBy),
      job.logs.length,
      escapeCSV(job.logs[job.logs.length - 1] || ''),
      escapeCSV(job.logs.join(' \n '))
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filenamePrefix}-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExported(true);
    setTimeout(() => setIsExported(false), 2400);
  };

  const exportButton = (
    <button
      onClick={() => exportToCSV(jobs)}
      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-all shadow-sm ${
        isExported
          ? 'bg-green-500/10 text-green-400 border-green-500/30'
          : 'bg-neutral-800 hover:bg-neutral-700/80 text-neutral-300 hover:text-white border-neutral-700/80'
      }`}
      title="Export active jobs metadata and execution logs as CSV report"
    >
      {isExported ? (
        <>
          <Check className="w-3.5 h-3.5 text-green-400" />
          <span>Exported!</span>
        </>
      ) : (
        <>
          <Download className="w-3.5 h-3.5 text-blue-400" />
          <span>Export CSV</span>
        </>
      )}
    </button>
  );

  const content = (
    <div className="flex flex-col h-full">
      <Reorder.Group axis="y" values={jobs} onReorder={setJobs} className="divide-y divide-neutral-800/50 overflow-y-auto flex-1">
        {jobs.map((job) => (
          <Reorder.Item 
            key={job.id} 
            value={job}
            onClick={() => setSelectedJob(job)}
            className="p-4 hover:bg-neutral-900/40 transition-colors flex items-center justify-between group cursor-pointer bg-transparent relative"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-neutral-700 hover:text-neutral-500 transition-colors" onPointerDown={(e) => e.stopPropagation()}>
                <GripVertical className="w-4 h-4 shrink-0" />
              </div>
              <StatusDot status={job.status as any} pulse={job.pulse} />
              <div className="ml-1 min-w-0">
                <div className="text-sm font-medium text-neutral-200 group-hover:text-blue-400 transition-colors truncate">{job.name}</div>
                <div className="text-xs text-neutral-500 font-mono mt-0.5">{job.id}</div>
              </div>
            </div>
            <div className="text-right shrink-0 ml-4">
              <div className="text-xs text-neutral-400">{job.time}</div>
              <div className="text-[10px] text-neutral-600 mt-1">{job.duration}</div>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <Drawer 
        isOpen={!!selectedJob} 
        onClose={() => setSelectedJob(null)} 
        title={selectedJob ? selectedJob.name : 'Job Details'}
      >
        {selectedJob && (
          <div className="flex flex-col gap-6">
            {/* Status Indicator */}
            <div className="flex items-center justify-between p-4 bg-neutral-900/30 border border-neutral-800 rounded-lg">
              <div className="flex items-center gap-3">
                <StatusDot status={selectedJob.status} pulse={selectedJob.pulse} />
                <span className="text-sm font-medium text-neutral-200 capitalize">
                  {selectedJob.status === 'info' ? 'Running' : selectedJob.status}
                </span>
              </div>
              <span className="text-xs font-mono text-neutral-500 px-2 py-1 bg-neutral-950 rounded border border-neutral-800">
                {selectedJob.id}
              </span>
            </div>

            {/* Meta Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-lg p-3">
                <div className="flex items-center gap-2 text-neutral-400 mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs">Duration</span>
                </div>
                <div className="text-sm font-medium text-neutral-200">{selectedJob.duration}</div>
              </div>
              <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-lg p-3">
                <div className="flex items-center gap-2 text-neutral-400 mb-2">
                  <User className="w-3.5 h-3.5" />
                  <span className="text-xs">Triggered By</span>
                </div>
                <div className="text-sm font-medium text-neutral-200">{selectedJob.triggeredBy}</div>
              </div>
              <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-lg p-3 col-span-2">
                <div className="flex items-center gap-2 text-neutral-400 mb-2">
                  <Cpu className="w-3.5 h-3.5" />
                  <span className="text-xs">Compute Node</span>
                </div>
                <div className="text-sm font-mono text-neutral-300">{selectedJob.node}</div>
              </div>
            </div>

            {/* Logs Terminal */}
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center justify-between text-neutral-400 px-1 mt-2">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4" />
                  <span className="text-sm font-medium">Execution Logs</span>
                </div>
                <button
                  onClick={() => exportToCSV([selectedJob], `job-${selectedJob.id}`)}
                  className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 px-2 py-0.5 rounded hover:bg-neutral-900 transition-colors"
                  title="Export this job's logs to CSV"
                >
                  <Download className="w-3 h-3" />
                  <span>Export Job CSV</span>
                </button>
              </div>
              <div className="bg-black border border-neutral-800 rounded-lg p-4 min-h-[250px] overflow-y-auto font-mono text-xs shadow-inner flex flex-col gap-1.5">
                {selectedJob.logs.map((log, i) => (
                  <div key={i} className={`tracking-wide ${log.includes('[ERROR]') ? 'text-red-400' : log.includes('[SUCCESS]') ? 'text-green-400' : log.includes('[INFO]') ? 'text-blue-400' : 'text-neutral-400'}`}>
                    {log}
                  </div>
                ))}
                {selectedJob.pulse && (
                  <div className="flex gap-1.5 mt-2 ml-1">
                    <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-neutral-800/50 flex gap-3">
              <button 
                onClick={() => exportToCSV([selectedJob], `job-${selectedJob.id}`)}
                className="flex-1 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Export CSV</span>
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                View Full Logs
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );

  if (hideCard) {
    return content;
  }

  return (
    <Card 
      title="Active Jobs" 
      className="h-[400px] flex flex-col" 
      delay={0.4}
      action={exportButton}
    >
      {content}
    </Card>
  );
}
