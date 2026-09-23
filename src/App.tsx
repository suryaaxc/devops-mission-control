/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Terminal, LayoutDashboard, Settings, Activity, GitBranch, Search, Hexagon } from 'lucide-react';
import { Card } from './components/ui/Card';
import { StatusDot } from './components/ui/StatusDot';
import { PipelineGraph } from './components/dashboard/PipelineGraph';
import { TerminalLogs } from './components/dashboard/Terminal';
import { SystemTelemetry } from './components/dashboard/SystemTelemetry';
import { ActiveJobsList } from './components/dashboard/ActiveJobs';
import { PipelinesView, SettingsView } from './components/dashboard/Views';
import { MonitoringView } from './components/dashboard/MonitoringView';
import { CriticalAlertsPanel } from './components/dashboard/CriticalAlertsPanel';
import { motion } from 'motion/react';
import { useState } from 'react';

function Sidebar({ activeView, setActiveView }: { activeView: string, setActiveView: (v: string) => void }) {
  const navItems = [
    { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Overview' },
    { icon: <GitBranch className="w-4 h-4" />, label: 'Pipelines' },
    { icon: <Terminal className="w-4 h-4" />, label: 'Deployments' },
    { icon: <Activity className="w-4 h-4" />, label: 'Monitoring' },
    { icon: <Settings className="w-4 h-4" />, label: 'Settings' },
  ];

  return (
    <div className="w-64 border-r border-neutral-800 bg-[#050505] flex flex-col h-screen shrink-0 hidden md:flex z-20 relative">
      <div className="h-14 border-b border-neutral-800 flex items-center px-6 gap-3 shrink-0">
        <div className="relative">
          <Hexagon className="w-6 h-6 text-neutral-100 fill-neutral-900" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full glow-blue" />
          </div>
        </div>
        <span className="font-semibold text-neutral-100 tracking-tight">Nexys<span className="text-neutral-500">ML</span></span>
      </div>
      
      <div className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item, i) => (
          <button
            key={i}
            onClick={() => setActiveView(item.label)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
              item.label === activeView
                ? 'bg-neutral-900 text-neutral-100 border border-neutral-800/50 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-neutral-800 shrink-0">
        <div className="flex items-center gap-3 bg-neutral-900/50 p-3 rounded-lg border border-neutral-800/80 cursor-pointer hover:border-neutral-700 hover:bg-neutral-900 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-[0_0_10px_rgba(37,99,235,0.3)] shrink-0">
            JD
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-neutral-200 truncate">Jane Doe</span>
            <span className="text-[10px] text-neutral-500 truncate">jane@nexys.ml</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header() {
  const [criticalCount, setCriticalCount] = useState(1);
  const [unackCount, setUnackCount] = useState(2);

  return (
    <header className="h-14 border-b border-neutral-800 bg-[#050505]/90 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-neutral-400 hidden sm:flex">
          <span>Project:</span>
          <span className="text-neutral-200 font-medium px-2.5 py-1 bg-neutral-900 rounded-md border border-neutral-800 shadow-inner">Vision-Transformer-v2</span>
        </div>
        <div className="h-4 w-px bg-neutral-800 hidden sm:block" />
        <div className="flex items-center gap-2">
          <StatusDot 
            status={criticalCount > 0 ? "error" : unackCount > 0 ? "warning" : "success"} 
            pulse={criticalCount > 0} 
          />
          <span className="text-xs text-neutral-400 font-medium">
            {criticalCount > 0 
              ? `${criticalCount} Critical Incident${criticalCount > 1 ? 's' : ''}` 
              : unackCount > 0 
              ? `${unackCount} Alerts Pending` 
              : "Cluster Healthy"}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search resources..."
            className="bg-neutral-900 border border-neutral-800 text-neutral-200 text-sm rounded-md pl-9 pr-4 py-1.5 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 w-64 transition-all shadow-inner"
          />
        </div>
        
        {/* Critical Alerts notification panel in top-right */}
        <CriticalAlertsPanel 
          onAlertStatusChange={(unack, crit) => {
            setUnackCount(unack);
            setCriticalCount(crit);
          }} 
        />
      </div>
    </header>
  );
}

function OverviewDashboard() {
  return (
    <div className="max-w-7xl mx-auto w-full">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">Mission Control</h1>
          <p className="text-sm text-neutral-500 mt-1">Real-time telemetry and orchestration.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-md text-sm font-medium transition-colors shadow-sm">
            View Docs
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            Deploy Pipeline
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-12 gap-6 pb-8">
        {/* Left Column */}
        <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
          {/* Top Row: Pipeline DAG */}
          <Card title="Orchestration DAG" className="h-[300px]" delay={0.1}>
            <PipelineGraph />
          </Card>
          
          {/* Bottom Row: Terminal */}
          <Card 
            title="Container Build Logs" 
            className="h-[400px]"
            action={<StatusDot status="info" pulse />}
            delay={0.2}
          >
            <TerminalLogs />
          </Card>
        </div>

        {/* Right Column */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
          {/* System Metrics with K8s Resource Control & Throttling */}
          <SystemTelemetry />

          {/* Active Jobs with Export CSV action */}
          <ActiveJobsList />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState('Overview');

  return (
    <div className="flex h-screen bg-[#050505] text-neutral-50 overflow-hidden font-sans antialiased selection:bg-blue-500/30">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
          {activeView === 'Overview' && <OverviewDashboard />}
          {activeView === 'Pipelines' && <PipelinesView />}
          {activeView === 'Monitoring' && <MonitoringView />}
          {activeView === 'Settings' && <SettingsView />}
          {activeView === 'Deployments' && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full text-neutral-500 mt-20">
              <div className="w-16 h-16 mb-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-lg">
                <Activity className="w-8 h-8 text-neutral-600" />
              </div>
              <h3 className="text-lg font-medium text-neutral-300">Under Construction</h3>
              <p className="text-sm mt-2 text-neutral-500 max-w-sm text-center">
                The {activeView} module is currently being connected to the Kubernetes cluster. Check back soon.
              </p>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
