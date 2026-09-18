import React, { useState } from 'react';
import { ShieldCheck, Brain, Terminal } from 'lucide-react';
import { PcaTraceDashboard } from './PcaTraceDashboard';
import { auth } from '../lib/firebase';

interface TestResult {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'pass' | 'fail' | 'error';
  message?: string;
  category: 'auth' | 'isolation' | 'encryption' | 'governance';
}

export const GovernanceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audit' | 'trace'>('audit');
  const user = auth.currentUser;
  const [tests] = useState<TestResult[]>([
    { id: 't1', name: 'Identity derivation', description: 'Backend must derive identity from authenticated session only', status: 'pending', category: 'auth' },
    { id: 't2', name: 'Cross-user storage isolation', description: 'User A cannot access User B data via client storage', status: 'pending', category: 'isolation' },
    { id: 't3', name: 'API Ownership verification', description: 'Backend enforces strict ownership on /api/conversations/:id', status: 'pending', category: 'isolation' },
  ]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditLog, setAuditLog] = useState<string[]>([]);

  return (
    <div className="p-6 bg-neutral-950 min-h-screen text-neutral-200">
      <div className="flex gap-6 mb-8 border-b border-neutral-800 pb-2">
        <button 
          onClick={() => setActiveTab('audit')}
          className={`pb-2 px-2 text-sm font-bold transition-colors ${activeTab === 'audit' ? 'text-white border-b-2 border-amber-500' : 'text-neutral-500 hover:text-neutral-300'}`}
        >
          Security Audit
        </button>
        <button 
          onClick={() => setActiveTab('trace')}
          className={`pb-2 px-2 text-sm font-bold transition-colors ${activeTab === 'trace' ? 'text-white border-b-2 border-amber-500' : 'text-neutral-500 hover:text-neutral-300'}`}
        >
          PCA Reasoning Trace
        </button>
      </div>

      {activeTab === 'audit' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Minimalized Audit Grid with Neutral Colors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tests.map(test => (
                    <div key={test.id} className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
                        <h4 className="text-sm font-bold text-neutral-100">{test.name}</h4>
                        <p className="text-xs text-neutral-400">{test.description}</p>
                    </div>
                ))}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
             <h3 className="text-sm font-bold text-neutral-100 mb-4 flex items-center gap-2"><Terminal className="w-4 h-4"/> Audit Console</h3>
             <div className="text-xs text-neutral-500 font-mono">Console logs...</div>
          </div>
        </div>
      ) : (
        <PcaTraceDashboard />
      )}
    </div>
  );
};
