import { useState } from 'react';
import { AuditLog } from '../types';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  Filter, 
  Clock, 
  User, 
  Terminal,
  Printer,
  History
} from 'lucide-react';

interface AuditLogsProps {
  logs: AuditLog[];
}

export default function AuditLogs({ logs }: AuditLogsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const textMatch = 
      log.officerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.cameraAccessed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.rank.toLowerCase().includes(searchTerm.toLowerCase());
    
    const actionMatch = actionFilter === 'all' || log.actionType.toLowerCase() === actionFilter.toLowerCase();
    
    return textMatch && actionMatch;
  });

  const triggerMockLogsExport = () => {
    alert("SYSTEM SECURE EXPORT: Generating high-security PGP encrypted surveillance audit log CSV. Saved to workspace memory.");
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6 shadow-sm" id="audit-logs-workspace">
      
      {/* Header operations bar */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-950 border border-cyan-500/30 text-cyan-400 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-white font-display font-semibold text-sm uppercase">Officer Surveillance Audit Trail</h4>
            <p className="text-xs text-slate-500">Regulatory ledger logging all camera lookups, biometric searches, and controls.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={triggerMockLogsExport}
            className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono px-3 py-1.5 rounded transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Audit LEDGER
          </button>
          
          <button 
            onClick={() => window.print()}
            className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 p-1.5 rounded transition"
            title="Print view"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Advanced search controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Keywords */}
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Officer, access reason, camera designations..."
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Action Type */}
        <div className="relative w-full sm:w-52">
          <Filter className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="all">All Access Types</option>
            <option value="Live Feed Access">Live Feed Access</option>
            <option value="PTZ Zoom Triggered">PTZ Zoom</option>
            <option value="Police Dispatch Notification">Dispatch Notification</option>
            <option value="Footage Export Authorized">Footage Export</option>
            <option value="Biometric Search Inquiry">Biometric Query</option>
            <option value="License Plate Inquiry">Plate Scan</option>
          </select>
        </div>
      </div>

      {/* Elegant Audit Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-lg">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
              <th className="p-3 text-left">TIMESTAMP</th>
              <th className="p-3 text-left">SOC OPERATOR & RANK</th>
              <th className="p-3 text-left">SURVEILLANCE NODE</th>
              <th className="p-3 text-left">ACTION ACTIONED</th>
              <th className="p-3 text-left">REGULATORY JUSTIFICATION</th>
              <th className="p-3 text-left">IP SOURCE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 bg-slate-950/20 text-slate-300">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-850/50 transition">
                <td className="p-3 text-slate-400 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </td>
                <td className="p-3">
                  <div>
                    <span className="text-white font-bold block">{log.officerName}</span>
                    <span className="text-[10px] text-slate-500 font-medium block">{log.rank}</span>
                  </div>
                </td>
                <td className="p-3">
                  <span className="text-cyan-400 font-semibold">{log.cameraAccessed}</span>
                </td>
                <td className="p-3">
                  <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300 font-bold whitespace-nowrap">
                    {log.actionType}
                  </span>
                </td>
                <td className="p-3 max-w-[280px]">
                  <p className="text-slate-400 leading-normal truncate hover:white-space-normal" title={log.reason}>{log.reason}</p>
                </td>
                <td className="p-3 text-slate-500 whitespace-nowrap">{log.ipAddress}</td>
              </tr>
            ))}

            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-slate-600 py-10 font-mono">
                  No matching audit history logs found under active selection filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Ledger compliance notice */}
      <div className="bg-slate-950/40 p-3.5 border border-slate-800 rounded-lg flex gap-3 text-slate-400 text-xs font-mono">
        <Terminal className="w-5 h-5 text-cyan-500" />
        <p className="leading-relaxed">
          <strong>SECURITY PROTOCOL COMPLIANCE NOTICE:</strong> This journal operates on WORM (Write Once Read Many) technology. Regulatory officers and system administrators are prohibited from destroying or truncating these safety logs under federal surveillance disclosure laws.
        </p>
      </div>
    </div>
  );
}
