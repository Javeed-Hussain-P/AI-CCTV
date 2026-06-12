import { useState } from 'react';
import { Alert, AlertSeverity, AlertCategory, AlertStatus } from '../types';
import { 
  ShieldAlert, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Send, 
  Eye, 
  SlidersHorizontal, 
  BellRing,
  AlertTriangle,
  Flame,
  Info
} from 'lucide-react';

interface AlertsManagerProps {
  alerts: Alert[];
  onUpdateStatus: (alertId: string, status: AlertStatus) => void;
  onSelectCameraByCode: (cameraCode: string) => void;
}

export default function AlertsManager({ alerts, onUpdateStatus, onSelectCameraByCode }: AlertsManagerProps) {
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<AlertCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AlertStatus | 'all'>('all');

  const filteredAlerts = alerts.filter(alert => {
    const sevMatch = filterSeverity === 'all' || alert.severity === filterSeverity;
    const catMatch = filterCategory === 'all' || alert.category === filterCategory;
    const statMatch = filterStatus === 'all' || alert.status === filterStatus;
    return sevMatch && catMatch && statMatch;
  });

  // Calculate status statistics
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;
  const activeCount = alerts.filter(a => a.status === 'active').length;
  const dispatchedCount = alerts.filter(a => a.status === 'dispatched').length;

  // Custom styling for severity tags
  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="bg-red-950/80 border border-red-500 text-red-400 text-[10px] font-bold font-mono px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
            <Flame className="w-3 text-red-500" />
            CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className="bg-orange-950/80 border border-orange-500 text-orange-400 text-[10px] font-bold font-mono px-2 py-0.5 rounded flex items-center gap-1">
            <AlertTriangle className="w-3 text-orange-400" />
            HIGH
          </span>
        );
      case 'medium':
        return (
          <span className="bg-amber-950/85 border border-amber-500 text-amber-400 text-[10px] font-medium font-mono px-2 py-0.5 rounded flex items-center gap-1">
            <AlertTriangle className="w-3 text-amber-500" />
            MEDIUM
          </span>
        );
      case 'low':
        return (
          <span className="bg-slate-800/80 border border-slate-700 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1">
            <Info className="w-3 text-slate-400" />
            LOW
          </span>
        );
    }
  };

  // Custom styling for status badges
  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="text-red-400 font-semibold text-xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Unattended
          </span>
        );
      case 'acknowledged':
        return (
          <span className="text-amber-400 font-semibold text-xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Acknowledged
          </span>
        );
      case 'dispatched':
        return (
          <span className="text-cyan-400 font-semibold text-xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Units Dispatched
          </span>
        );
      case 'resolved':
        return (
          <span className="text-green-400 font-semibold text-xs flex items-center gap-1">
            <span className="w-2- h-2 rounded-full bg-green-500" />
            Resolved
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="alerts-operations-panel">
      {/* 1. Tactical Stat Metrics Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-mono uppercase">Critical Threat Breaches</span>
            <p className="text-2xl font-display font-bold text-red-500">{criticalCount}</p>
          </div>
          <div className="bg-red-950 p-2.5 rounded-lg border border-red-500/20">
            <Flame className="w-5 h-5 text-red-400 animate-pulse" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-mono uppercase">Active Unresolved Incidents</span>
            <p className="text-2xl font-display font-bold text-amber-500">{activeCount}</p>
          </div>
          <div className="bg-amber-950 p-2.5 rounded-lg border border-amber-500/20">
            <BellRing className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-mono uppercase">First Responders Active</span>
            <p className="text-2xl font-display font-bold text-cyan-400">{dispatchedCount}</p>
          </div>
          <div className="bg-cyan-950 p-2.5 rounded-lg border border-cyan-500/20">
            <Send className="w-5 h-5 text-cyan-400 animate-bounce" />
          </div>
        </div>
      </div>

      {/* 2. Advanced Multi-Filter controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-500" />
            <h4 className="text-white text-xs font-mono uppercase tracking-widest font-semibold">Incident Feeds Filters Dashboard</h4>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            {/* Severity Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Severity</span>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-md focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="all">All Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Threat Class</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-md focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="all">All Classes</option>
                <option value="Weapon">Weapons Detector</option>
                <option value="Intrusion">Intrusion Fence</option>
                <option value="Crowd">Crowd Congestion</option>
                <option value="Loitering">Loitering Safety</option>
                <option value="Safety">Safety Incidents</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Operations Status</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-md focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="all">All Statuses</option>
                <option value="active">Unattended</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="dispatched">Dispatched</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Alerts Timeline Card Stack */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <div 
            key={alert.id}
            className={`border rounded-xl overflow-hidden transition bg-slate-900 border-slate-850 p-4 sm:p-5 flex flex-col md:flex-row justify-between gap-5 shadow-md`}
          >
            {/* Primary content area */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {getSeverityBadge(alert.severity)}
                <span className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-wide">
                  {alert.category}
                </span>
                <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="text-xs text-orange-400 font-mono">
                  Confidence: {alert.confidence}%
                </span>
              </div>

              <div>
                <h4 className="text-white font-display font-bold text-sm sm:text-base">{alert.title}</h4>
                <p className="text-slate-400 text-sm mt-1 leading-relaxed">{alert.description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 p-2 bg-slate-950 rounded-lg">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Surveillance Focus: <strong className="text-slate-300 font-mono text-[11px]">{alert.cameraName}</strong> ({alert.location})</span>
                </div>
                {alert.licensePlate && (
                  <div className="bg-slate-900 border border-slate-800 text-amber-400 text-xs font-mono px-2 py-0.5 rounded">
                    Plate: Ka-01-AB-1234 Match
                  </div>
                )}
              </div>
            </div>

            {/* Status Indicator & Response Action Console */}
            <div className="w-full md:w-56 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-3 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-5">
              <div className="space-y-1 text-right md:w-full">
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Operations Center Status</span>
                <div className="mt-0.5 flex md:justify-end">{getStatusBadge(alert.status)}</div>
              </div>

              <div className="flex flex-wrap gap-1.5 justify-end w-full max-w-[280px] md:max-w-none">
                {alert.status === 'active' && (
                  <button
                    onClick={() => onUpdateStatus(alert.id, 'acknowledged')}
                    className="bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono px-3 py-1.5 rounded transition"
                  >
                    Acknowledge
                  </button>
                )}
                
                {(alert.status === 'active' || alert.status === 'acknowledged') && (
                  <button
                    onClick={() => {
                      onUpdateStatus(alert.id, 'dispatched');
                      window.alert(`First Responder Units DISPATCHED for tactical incident: ${alert.title}. Incident location: ${alert.location}`);
                    }}
                    className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-500 text-cyan-400 text-xs font-mono px-3 py-1.5 rounded transition flex items-center gap-1.5"
                  >
                    <Send className="w-3 h-3 text-cyan-400" />
                    Dispatch SOC Units
                  </button>
                )}

                {alert.status !== 'resolved' && (
                  <button
                    onClick={() => onUpdateStatus(alert.id, 'resolved')}
                    className="bg-green-950 hover:bg-green-900 border border-green-500 text-green-400 text-xs font-mono px-3 py-1.5 rounded transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    Resolve Threat
                  </button>
                )}

                {alert.status === 'resolved' && (
                  <div className="text-slate-500 font-mono text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Operational Safety RESTORED
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="text-center font-mono text-slate-600 bg-slate-900 border border-slate-800 p-12 rounded-xl text-sm">
            All hazard thresholds clear. No matching events triggers found.
          </div>
        )}
      </div>
    </div>
  );
}
