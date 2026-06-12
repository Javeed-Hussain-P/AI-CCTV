import React, { useState } from 'react';
import { CommunityPartner } from '../types';
import { MOCK_COMMUNITY_PARTNERS } from '../mockData';
import { 
  ShieldAlert, 
  Settings, 
  Users, 
  Video, 
  EyeOff, 
  Rss, 
  Check, 
  Sliders,
  User,
  MapPin,
  Lock
} from 'lucide-react';

interface SettingsPanelProps {
  geminiApiKey: string;
  onSaveApiKey: (key: string) => void;
  onAddCommunityPartner: (partner: CommunityPartner) => void;
}

export default function SettingsPanel({ geminiApiKey, onSaveApiKey, onAddCommunityPartner }: SettingsPanelProps) {
  const [keyInput, setKeyInput] = useState(geminiApiKey);
  const [partners, setPartners] = useState<CommunityPartner[]>(MOCK_COMMUNITY_PARTNERS);
  const [officerName, setOfficerName] = useState('Sgt. Marcus Vance');
  const [officerRank, setOfficerRank] = useState('Chief SOC Supervisor');
  const [resolutionThreshold, setResolutionThreshold] = useState('1080p');
  const [alertsThreshold, setAlertsThreshold] = useState(85); // 85% confidence
  const [enrollmentEnacted, setEnrollmentEnacted] = useState(true);

  // Community Safety Enrollment state helper
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerType, setNewPartnerType] = useState<'Residential' | 'Commercial' | 'Retail' | 'Public Space'>('Residential');
  const [newPartnerContact, setNewPartnerContact] = useState('');
  const [newPartnerCameras, setNewPartnerCameras] = useState(5);

  const toggleFeedActive = (partnerId: string) => {
    setPartners(prev => prev.map(p => {
      if (p.id === partnerId) {
        return { ...p, activeFeed: !p.activeFeed };
      }
      return p;
    }));
  };

  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName || !newPartnerContact) {
      alert("Please key in community partner and coordinator names.");
      return;
    }

    const created: CommunityPartner = {
      id: `partner-${Date.now()}`,
      name: newPartnerName,
      type: newPartnerType,
      camerasCount: newPartnerCameras,
      enrolledSince: new Date().toISOString().split('T')[0],
      contactPerson: newPartnerContact,
      activeFeed: true
    };

    onAddCommunityPartner(created);
    setPartners(prev => [...prev, created]);

    // reset fields
    setNewPartnerName('');
    setNewPartnerContact('');
    alert(`ENROLLMENT SUCCESSFUL: ${newPartnerName} registered with total of ${newPartnerCameras} cameras on Safety Network.`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="settings-platform-console">
      {/* 1. Left Layout Pane: Profile & Core Metrics Configs (Col 1) */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Gemini Security Key Configuration */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <h4 className="text-white font-display font-semibold text-sm uppercase tracking-wide flex items-center gap-1.5">
            <Lock className="text-cyan-400 w-4 h-4" />
            Gemini AI Integration Key
          </h4>
          <div className="space-y-3 font-mono text-xs text-left">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">Gemini API Key</span>
              <input 
                type="password" 
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-850 p-2 text-white rounded focus:outline-none focus:border-cyan-500 text-xs font-mono"
              />
            </div>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => {
                  onSaveApiKey(keyInput);
                  alert('Gemini API Key successfully updated.');
                }}
                className="flex-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500 text-cyan-400 font-bold text-[10px] py-2 rounded transition"
              >
                Save API Key
              </button>
              <button 
                type="button"
                onClick={() => {
                  setKeyInput('');
                  onSaveApiKey('');
                  alert('Gemini API Key cleared.');
                }}
                className="bg-slate-950 border border-slate-850 text-slate-400 hover:text-white text-[10px] px-3 py-2 rounded transition"
              >
                Clear
              </button>
            </div>
            <div className="flex justify-between items-center bg-slate-950/80 p-2 rounded border border-slate-800 text-[10px] mt-2">
              <span className="text-slate-500">Status:</span>
              <span className={geminiApiKey ? "text-cyan-400 font-bold" : "text-amber-500 font-bold"}>
                {geminiApiKey ? "ACTIVE (REAL AI)" : "DEMO MODE (MOCK AI)"}
              </span>
            </div>
            <p className="text-[9px] text-slate-500 leading-normal">
              An API key is required to perform actual visual object detection on webcam feeds and custom uploads. Get one from Google AI Studio.
            </p>
          </div>
        </div>

        {/* Officer Profile settings */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <h4 className="text-white font-display font-semibold text-sm uppercase tracking-wide flex items-center gap-1.5">
            <User className="text-cyan-400 w-4 h-4" />
            Duty Officer Profile
          </h4>
          
          <div className="space-y-3 font-mono text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">Officer Designee Name</span>
              <input 
                type="text" 
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 p-2 text-white rounded focus:outline-none focus:border-cyan-500 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase">Active Administrative Rank</span>
              <input 
                type="text" 
                value={officerRank}
                onChange={(e) => setOfficerRank(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 p-2 text-white rounded focus:outline-none focus:border-cyan-500 text-xs font-mono"
              />
            </div>
            <div className="flex justify-between items-center bg-slate-950/80 p-2 rounded border border-slate-800 text-[10px] text-slate-400 mt-2">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-green-500" />
                <span>Security Clearance: Level 5 SuperUser</span>
              </div>
              <span className="text-green-400">VERIFIED</span>
            </div>
          </div>
        </div>

        {/* AI threshold limits and standard resolution presets */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <h4 className="text-white font-display font-semibold text-sm uppercase tracking-wide flex items-center gap-1.5">
            <Sliders className="text-cyan-400 w-4 h-4" />
            Surveillance AI Rules Presets
          </h4>

          <div className="space-y-4 font-mono text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">MIN MATCHING THRESHOLD:</span>
                <span className="text-cyan-400 font-bold">{alertsThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="98"
                value={alertsThreshold}
                onChange={(e) => setAlertsThreshold(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <span className="text-[9px] text-slate-500 leading-normal block">
                Higher settings filter out false alarms but may overlook brief visual face matches.
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 uppercase text-[10px] block">Surveillance Resolution Pref</span>
              <select
                value={resolutionThreshold}
                onChange={(e) => setResolutionThreshold(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 p-2 text-white rounded focus:outline-none focus:border-cyan-500"
              >
                <option value="4k">4K Dynamic UHD (Maximum load)</option>
                <option value="1080p">1080p Full High Definition</option>
                <option value="720p">720p Bandwidth Saving</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle and Right Layout Pane: Community Safety Network Management (Col 2 & 3) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-5">
          {/* Header */}
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center flex-wrap gap-2">
            <div className="space-y-0.5">
              <h4 className="text-white font-display font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400 animate-pulse" />
                Community Safety Network enrollment (CSN)
              </h4>
              <p className="text-slate-500 text-xs font-mono">Connecting local societies and public systems under a single protective firewall grid.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs font-mono">Sharing Active</span>
              <button
                onClick={() => setEnrollmentEnacted(!enrollmentEnacted)}
                className={`w-10 h-5.5 rounded-full p-0.5 transition duration-300 focus:outline-none ${enrollmentEnacted ? 'bg-cyan-500' : 'bg-slate-800'}`}
              >
                <div className={`bg-neutral-900 w-4.5 h-4.5 rounded-full shadow-md transform transition duration-300 ${enrollmentEnacted ? 'translate-x-4.5 bg-neutral-950' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Active Partners List Grid */}
          <div className="space-y-3">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Active Community Partner Registries</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {partners.map((p) => (
                <div key={p.id} className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl flex justify-between items-center gap-3">
                  <div className="space-y-1 text-left">
                    <span className="text-white text-xs font-bold block truncate max-w-[170px]">{p.name}</span>
                    <div className="text-[10px] text-slate-400 space-y-0.5">
                      <div>Class: <strong className="text-slate-300">{p.type}</strong></div>
                      <div>Feeds: <strong className="text-cyan-400">{p.camerasCount} Lens Nodes</strong></div>
                      <div>Contact: <strong className="text-slate-300 font-sans">{p.contactPerson}</strong></div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${p.activeFeed && enrollmentEnacted ? 'bg-indigo-950 border border-indigo-500 text-indigo-400' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>
                      {p.activeFeed && enrollmentEnacted ? 'FEED ONLINE' : 'FEED SILENCED'}
                    </span>
                    <button
                      onClick={() => toggleFeedActive(p.id)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded transition ${p.activeFeed ? 'bg-red-950 border border-red-500/30 text-red-400' : 'bg-slate-900 border border-slate-800 text-slate-300'}`}
                    >
                      {p.activeFeed ? 'Silence Feed' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enroll New Partner Form */}
          <form onSubmit={handleCreatePartner} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3.5">
            <span className="text-[10px] text-slate-500 font-mono uppercase block border-b border-slate-850 pb-1">Register New Community Safety Partner</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Partner Name */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] text-slate-400 uppercase font-mono">Society / Area Name</label>
                <input 
                  type="text"
                  value={newPartnerName}
                  onChange={(e) => setNewPartnerName(e.target.value)}
                  placeholder="e.g. Greenwood Enclave"
                  className="w-full bg-slate-900 border border-slate-800 p-2 text-white text-xs rounded focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              {/* Coordinator */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] text-slate-400 uppercase font-mono">Primary Coordinator</label>
                <input 
                  type="text"
                  value={newPartnerContact}
                  onChange={(e) => setNewPartnerContact(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-900 border border-slate-800 p-2 text-white text-xs rounded focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              {/* Partner Type */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] text-slate-400 uppercase font-mono">Classification</label>
                <select
                  value={newPartnerType}
                  onChange={(e) => setNewPartnerType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 p-2 text-slate-300 text-xs rounded focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="Residential">Residential Block</option>
                  <option value="Commercial">Commercial Tower</option>
                  <option value="Retail">Retail Market</option>
                  <option value="Public Space">Public Transit</option>
                </select>
              </div>

              {/* Cameras Number */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] text-slate-400 uppercase font-mono">Cameras Shared</label>
                <input 
                  type="number"
                  min="1"
                  max="25"
                  value={newPartnerCameras}
                  onChange={(e) => setNewPartnerCameras(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 p-2 text-white text-xs rounded focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="bg-cyan-950 border border-cyan-500/50 hover:bg-cyan-900 text-cyan-400 font-mono text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                Enroll Partner into safety Grid
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
