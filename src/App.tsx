import React, { useState, useEffect } from 'react';
import { Camera, Alert, AuditLog, PersonRecord, VehicleRecord, CommunityPartner } from './types';
import { 
  INITIAL_CAMERAS, 
  INITIAL_ALERTS, 
  INITIAL_AUDIT_LOGS, 
  MOCK_PERSONS, 
  MOCK_VEHICLES 
} from './mockData';

// Component imports
import CCTVGrid from './components/CCTVGrid';
import AlertsManager from './components/AlertsManager';
import AIChatbot from './components/AIChatbot';
import PersonFinder from './components/PersonFinder';
import VehicleTracker from './components/VehicleTracker';
import AuditLogs from './components/AuditLogs';
import SettingsPanel from './components/SettingsPanel';
import FootageArchive from './components/FootageArchive';
import UploadFootage from './components/UploadFootage';

// Icons
import { 
  LayoutDashboard, 
  Video, 
  Bell, 
  Cpu, 
  Scan, 
  Compass, 
  ShieldCheck, 
  Settings, 
  ShieldAlert, 
  LogOut, 
  Clock, 
  Eye, 
  AlertTriangle, 
  Users, 
  Layers, 
  Car,
  Activity,
  UserCheck,
  Network,
  Bot,
  Radio
} from 'lucide-react';

export default function App() {
  // Session Access state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emailInput, setEmailInput] = useState('javeed123@gmail.com');
  const [passwordInput, setPasswordInput] = useState('password123');
  const [forgotPasswordView, setForgotPasswordView] = useState(false);

  // Active platform Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'monitoring' | 'alerts' | 'chatbot' | 'person-finder' | 'vehicle-tracking' | 'audit-logs' | 'settings' | 'archive' | 'upload-footage'>('home');

  // Master Data States
  const [cameras, setCameras] = useState<Camera[]>(INITIAL_CAMERAS);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>(MOCK_VEHICLES);
  const [persons, setPersons] = useState<PersonRecord[]>(MOCK_PERSONS);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  
  // Gemini API Key State
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');

  // Live timer state
  const [currentTime, setCurrentTime] = useState(new Date());

  const handleSaveApiKey = (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    setGeminiApiKey(key);
    addAuditLog(key ? 'Gemini API Key updated' : 'Gemini API Key cleared', 'System Settings', 'API Configuration');
  };

  const handleUpdateCameraCounts = (cameraId: string, peopleCount: number, vehicleCount: number) => {
    setCameras(prev => prev.map(c => c.id === cameraId ? { ...c, peopleCount, vehicleCount } : c));
  };

  const handleAddAlert = (alert: Alert) => {
    setAlerts(prev => [alert, ...prev]);
    addAuditLog(`Threat detected by AI: ${alert.title}`, alert.cameraName, 'Threat Detected');
  };

  const handleAddPerson = (person: PersonRecord) => {
    setPersons(prev => {
      const exists = prev.some(p => p.id === person.id);
      if (exists) return prev.map(p => p.id === person.id ? person : p);
      return [person, ...prev];
    });
  };

  const handleAddVehicle = (vehicle: VehicleRecord) => {
    setVehicles(prev => {
      const exists = prev.some(v => v.plateNumber === vehicle.plateNumber);
      if (exists) return prev.map(v => v.plateNumber === vehicle.plateNumber ? vehicle : v);
      return [vehicle, ...prev];
    });
  };

  const handleAddDetectedVehicles = (detectedVehicles: any[]) => {
    detectedVehicles.forEach((vehicle) => {
      const rawPlate = vehicle.details?.licensePlate?.trim();
      const normalizedPlate = rawPlate || `UPLOAD-${(vehicle.label || 'Vehicle').replace(/\s+/g, '')}-${(vehicle.details?.color || 'Unknown').replace(/\s+/g, '')}`;
      const plateNumber = normalizedPlate.toUpperCase();
      const vehicleType = vehicle.details?.type || 'Car';
      const makeModel = vehicle.details?.makeModel || vehicle.label || 'Detected Vehicle';
      const color = vehicle.details?.color || 'Unknown';

      handleAddVehicle({
        plateNumber,
        owner: 'Undetermined / Uploaded Footage',
        vehicleType,
        makeModel,
        color,
        status: 'Monitored',
        reportedReason: 'Detected from uploaded surveillance video analysis',
        sequence: [
          {
            camera: 'Uploaded Footage',
            timestamp: new Date().toISOString(),
            speed: 0,
            snapshotType: 'Front'
          }
        ]
      });
    });
  };

  const [stats, setStats] = useState({
    totalRecordings: 0,
    totalPeopleDetected: 3842,
    totalVehiclesDetected: 1419,
    totalPlatesDetected: 0,
    totalFaceMatches: 0,
    totalThreatAlerts: 1
  });

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/analytics');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Error fetching analytics stats:", e);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    fetchStats();
    const statsTimer = setInterval(fetchStats, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(statsTimer);
    };
  }, []);

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim() !== 'javeed123@gmail.com' || passwordInput !== 'password123') {
      alert("Access Denied: Invalid Operator email key or authentication password.");
      return;
    }
    setIsAuthenticated(true);
    // Log auth event
    const newLog: AuditLog = {
      id: `log-auth-${Date.now()}`,
      officerName: 'Sgt. Marcus Vance',
      rank: 'Chief SOC Supervisor',
      reason: 'Authorized security operator session initiated',
      cameraAccessed: 'All Channels Enrolled',
      timestamp: new Date().toISOString(),
      actionType: 'Session Login Approved',
      ipAddress: '10.240.41.98'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Add system-logged actions programmatically from other widgets
  const addAuditLog = (reason: string, camera: string, actionType: string = 'Access Triggered') => {
    const newLog: AuditLog = {
      id: `log-gen-${Date.now()}`,
      officerName: 'Sgt. Marcus Vance',
      rank: 'Chief SOC Supervisor',
      reason,
      cameraAccessed: camera,
      timestamp: new Date().toISOString(),
      actionType,
      ipAddress: '10.240.41.98'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Altering alert statuses
  const handleAlertStatusUpdate = async (alertId: string, status: any) => {
    try {
      const res = await fetch(`http://localhost:5000/api/alerts/${alertId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setAlerts(prev => prev.map(al => {
          if (al.id === alertId) {
            addAuditLog(`Threat manual status shift to [${status.toUpperCase()}] for event: ${al.title}`, al.cameraName, 'Status Shift');
            return { ...al, status };
          }
          return al;
        }));
      }
    } catch (e) {
      console.error("Error updating alert status:", e);
    }
  };

  // Adjust camera state (Online/Offline/Warning)
  const handleCameraStatusChange = (camId: string, status: 'online' | 'offline' | 'warning') => {
    setCameras(prev => prev.map(c => {
      if (c.id === camId) {
        addAuditLog(`Node stream validation state updated to: [${status.toUpperCase()}]`, c.name, 'Node Telemetry Adjusted');
        return { ...c, status };
      }
      return c;
    }));
  };

  // Community safety enrollment handler
  const handleAddCommunityPartner = (partner: CommunityPartner) => {
    addAuditLog(`Registered regional community safety society: [${partner.name}]`, 'Community Channels Hub', 'Community Safety Registered');
  };

  // Counts
  const totalCameras = cameras.length;
  const activeCameras = cameras.filter(c => c.status === 'online' || c.status === 'warning').length;
  const activeAlertsCount = alerts.filter(a => a.status !== 'resolved').length;
  const peopleDetectedTodayVal = 3842;
  const vehiclesDetectedTodayVal = 1419;

  // Render Login Layout
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#060814] flex items-center justify-center p-4 relative overflow-hidden font-mono text-slate-300 scanline-container">
        {/* Cinematic Grid HUD lines */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-black pointer-events-none z-10 opacity-70" />
        <div className="absolute top-10 left-10 p-4 border-l border-cyan-500/30 flex items-center gap-2.5 z-20">
          <Network className="w-6 h-6 text-cyan-400 animate-pulse" />
          <div>
            <h1 className="text-white font-display text-sm font-semibold tracking-wider uppercase">CCTV Safety Net</h1>
            <span className="text-[10px] text-cyan-500 font-bold">GRID LINK: ACTIVE</span>
          </div>
        </div>

        {/* Login Card wrapper */}
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-20 backdrop-blur-md">
          {/* Scanline indicator */}
          <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/80 shadow-[0_0_8px_#22d3ee]" />

          {forgotPasswordView ? (
            <div className="space-y-5 text-left">
              <div className="text-center">
                <ShieldAlert className="w-12 h-12 text-cyan-400 mx-auto animate-pulse mb-3" />
                <h2 className="text-white text-lg font-display font-bold uppercase tracking-wide">SOC Password Recovery</h2>
                <p className="text-xs text-slate-500 mt-1">Surveillance operators must request credentials recovery directly from the network administrator desk.</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 text-xs leading-relaxed space-y-2 text-slate-400">
                <p>⚠️ <strong>OPERATIONAL RECOVERY MANUAL:</strong></p>
                <p>For urgent secure pass reset or hardware YubiKey verification overrides, ring up standard supervisor helpline or dispatch command center immediately.</p>
              </div>

              <button 
                onClick={() => setForgotPasswordView(false)}
                className="w-full bg-slate-950 border border-slate-800 text-xs py-2 rounded-lg transition text-slate-300 font-semibold"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6 text-left">
              <div className="text-center">
                <Bot className="w-12 h-12 text-cyan-400 mx-auto animate-pulse-cyan mb-2" />
                <h2 className="text-white text-xl font-display font-black tracking-wide uppercase">Operator Sign-In</h2>
                <p className="text-xs text-slate-500 mt-1 truncate">Smart CCTV & Safety Control Console</p>
                <p className="text-[9px] text-cyan-500/80 font-mono mt-0.5">Demo Key: javeed123@gmail.com / password123</p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Surveillance Email Key</label>
                <input 
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="javeed123@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs p-3 rounded-lg focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Pass */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Authentication Password</label>
                  <button 
                    type="button"
                    onClick={() => setForgotPasswordView(true)}
                    className="text-[10px] text-slate-500 hover:text-cyan-400 transition"
                  >
                    Forgot Password Code?
                  </button>
                </div>
                <input 
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Password register code..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs p-3 rounded-lg focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Terms Checkbox */}
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-850 flex items-start gap-2.5">
                <input 
                  type="checkbox" 
                  defaultChecked 
                  required 
                  className="mt-0.5 accent-cyan-500" 
                  id="log-compliance-chk"
                />
                <label htmlFor="log-compliance-chk" className="text-[10px] text-slate-500 leading-normal select-none">
                  By clicking sign-in, I agree my screen session actions are logged synchronously on the regulatory audit ledger.
                </label>
              </div>

              {/* Submit button */}
              <button 
                type="submit"
                className="w-full bg-cyan-950 hover:bg-cyan-900 border border-cyan-500 text-cyan-400 font-bold text-xs py-3 rounded-lg transition tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                INITIALIZE OPERATOR CONTROL GRID
              </button>
            </form>
          )}

          {/* User/Email display box metadata */}
          <div className="mt-6 pt-5 border-t border-slate-850 flex justify-between items-center text-[10px] text-slate-600">
            <span>SOC OVERRIDE: VERIFIED</span>
            <span>DATE: {currentTime.toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060814] flex flex-col font-mono text-slate-300">
      
      {/* 1. Tactical Command Header Banner */}
      <header className="bg-slate-950 border-b border-slate-900 p-4 shrink-0 flex flex-wrap justify-between items-center gap-4 z-30 font-mono">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-950/40 border border-cyan-500/30 p-2 rounded-lg shrink-0">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-white font-display text-sm sm:text-base font-bold tracking-wider uppercase flex items-center gap-2">
              SURVEILLANCE OPERATIONS CONTROL (SOC)
              <span className="text-[10px] bg-red-950 border border-red-500 text-red-400 font-mono px-2 py-0.2 rounded-full font-sans uppercase tracking-wide">
                AI GRID FEED-LINK
              </span>
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5">Community Safety Network Integration Node • Unit 18</p>
          </div>
        </div>

        {/* Dynamic Timer clock HUD */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end gap-0.5">
            <div className="text-xs text-slate-500 uppercase tracking-widest leading-none">Security Server Date</div>
            <span className="text-xs font-semibold text-white mt-1 uppercase flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {currentTime.toUTCString().replace('GMT', 'UTC')}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-lg flex items-center gap-2">
            <div className="p-1 bg-cyan-950 border border-cyan-500/30 text-cyan-400 text-[10px] rounded block truncate max-w-[130px] font-bold">
              👤 Vance (Supervisor)
            </div>
            <button 
              onClick={() => setIsAuthenticated(false)}
              className="text-slate-500 hover:text-red-400 transition"
              title="Logout session link"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Sidebar Navigation & Contents Layout Block */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Sidebar link navigation list */}
        <nav className="w-full md:w-64 bg-slate-950 border-r border-slate-900 py-4 px-3 flex flex-row md:flex-col justify-between overflow-x-auto md:overflow-x-visible md:overflow-y-auto shrink-0 gap-2 md:gap-1 scrollbar-hide z-20">
          
          <div className="flex flex-row md:flex-col gap-1.5 md:w-full">
            <div className="text-[9px] text-slate-600 font-bold uppercase tracking-wider px-3 mb-2 hidden md:block">
              SURVEILLANCE WORKFLOWS
            </div>

            {/* Dashboard Home tab */}
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition select-none ${activeTab === 'home' ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Safety Dashboard</span>
            </button>

            {/* Live Camera Grid tab */}
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition select-none ${activeTab === 'monitoring' ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <Video className="w-4 h-4 shrink-0" />
              <span>Surveillance Grid</span>
            </button>

            {/* Footage Archive tab */}
            <button
              onClick={() => setActiveTab('archive')}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition select-none ${activeTab === 'archive' ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>Footage Archive</span>
            </button>

            {/* Upload Video tab */}
            <button
              onClick={() => setActiveTab('upload-footage')}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition select-none ${activeTab === 'upload-footage' ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <Cpu className="w-4 h-4 shrink-0" />
              <span>Upload Video Analysis</span>
            </button>

            {/* Threat Alerts Manager tab */}
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition select-none relative ${activeTab === 'alerts' ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              <span>Threat Alerts ({activeAlertsCount})</span>
              {activeAlertsCount > 0 && (
                <span className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>

            {/* AI Companion Chat tab */}
            <button
              onClick={() => setActiveTab('chatbot')}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition select-none relative ${activeTab === 'chatbot' ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <Cpu className="w-4 h-4 shrink-0" />
              <span>Surveillance A.I. Copilot</span>
            </button>

            {/* Biometric Person Finder tab */}
            <button
              onClick={() => setActiveTab('person-finder')}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition select-none relative ${activeTab === 'person-finder' ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <Scan className="w-4 h-4 shrink-0" />
              <span>Biometric Finder</span>
            </button>

            {/* Plates sequence tracking tab */}
            <button
              onClick={() => setActiveTab('vehicle-tracking')}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition select-none relative ${activeTab === 'vehicle-tracking' ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <Car className="w-4 h-4 shrink-0" />
              <span>Plates Tracker</span>
            </button>

            <div className="h-[1px] bg-slate-900 my-2 hidden md:block" />

            <div className="text-[9px] text-slate-600 font-bold uppercase tracking-wider px-3 mb-2 hidden md:block">
              REGULATORY & ADMIN
            </div>

            {/* Audit Logs tab */}
            <button
              onClick={() => setActiveTab('audit-logs')}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition select-none relative ${activeTab === 'audit-logs' ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Officers Audit Logs</span>
            </button>

            {/* Systems Settings tab */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg transition select-none relative ${activeTab === 'settings' ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Console Settings</span>
            </button>
          </div>

          <div className="md:block hidden p-3 bg-slate-900/40 border border-slate-900 rounded-xl m-1.5 space-y-2">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest block font-bold leading-none">Security Radar Spectrum</span>
            {/* Ambient cyber-radar scope simulation to maximize design craft */}
            <div className="aspect-square relative rounded-full border border-cyan-500/20 bg-slate-950 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 border border-cyan-500/5 rounded-full scale-75" />
              <div className="absolute inset-0 border border-cyan-500/5 rounded-full scale-50" />
              {/* Radar beam */}
              <div className="absolute top-1/2 left-1/2 w-full h-[1px] bg-cyan-500/60 origin-left animate-radar" style={{ transformOrigin: '0% 50%' }} />
              <span className="text-[9px] font-bold text-center text-cyan-400/80 animate-pulse z-10 font-mono">SCANNING GRID...</span>
            </div>
          </div>
        </nav>

        {/* 3. Primary contents area (Scrollable) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-transparent space-y-6">
          
          {/* A. ROUTE: DASHBOARD HOME VIEW */}
          {activeTab === 'home' && (
            <div className="space-y-6 animate-fade-in" id="dashboard-home-wrapper">
                    {/* Tactical Overview Counters Section */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                
                {/* Total Recordings */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Total Recordings</span>
                    <strong className="text-lg sm:text-xl font-display font-black text-white">{stats.totalRecordings}</strong>
                  </div>
                  <div className="p-2 bg-slate-950 border border-slate-800 text-cyan-400 rounded-lg hidden sm:block">
                    <Video className="w-4.5 h-4.5" />
                  </div>
                </div>

                {/* Total People Detected */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">People Detected</span>
                    <strong className="text-lg sm:text-xl font-display font-black text-cyan-400">{stats.totalPeopleDetected}</strong>
                  </div>
                  <div className="p-2 bg-slate-950 border border-slate-800 text-slate-400 rounded-lg hidden sm:block">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                </div>

                {/* Total Vehicles Detected */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Vehicles Catalogued</span>
                    <strong className="text-lg sm:text-xl font-display font-black text-emerald-400">{stats.totalVehiclesDetected}</strong>
                  </div>
                  <div className="p-2 bg-slate-950 border border-slate-800 text-emerald-400 rounded-lg hidden sm:block">
                    <Car className="w-4.5 h-4.5" />
                  </div>
                </div>

                {/* Total Plates Detected */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Plates Tracked</span>
                    <strong className="text-lg sm:text-xl font-display font-black text-amber-500">{stats.totalPlatesDetected}</strong>
                  </div>
                  <div className="p-2 bg-slate-950 border border-slate-800 text-amber-400 rounded-lg hidden sm:block">
                    <Car className="w-4.5 h-4.5" />
                  </div>
                </div>

                {/* Total Face Matches */}
                <div className="bg-slate-950/80 border border-cyan-500/20 p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Face Matches</span>
                    <strong className="text-lg sm:text-xl font-display font-black text-indigo-400">{stats.totalFaceMatches}</strong>
                  </div>
                  <div className="p-2 bg-slate-950 border border-slate-800 text-indigo-400 rounded-lg hidden sm:block">
                    <Cpu className="w-4.5 h-4.5" />
                  </div>
                </div>

                {/* Total Threat Alerts */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Threat Alerts</span>
                    <strong className="text-lg sm:text-xl font-display font-black text-red-400">{stats.totalThreatAlerts}</strong>
                  </div>
                  <div className="p-2 bg-slate-950 border border-slate-800 text-red-400 rounded-lg hidden sm:block">
                    <Bell className="w-4.5 h-4.5" />
                  </div>
                </div>
              </div>

              {/* Grid content mapping CCTV stream overview states and active event logs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Cameras Fast Preview Node Matrix (Col 1 & 2) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                        <h3 className="text-white font-display font-bold text-xs uppercase tracking-wider"> Surrounding Surveillance Matrix</h3>
                      </div>
                      <button 
                        onClick={() => setActiveTab('monitoring')}
                        className="text-[10px] text-cyan-400 hover:underline hover:text-cyan-300 font-semibold"
                      >
                        Launch Screen multiplex grid ➔
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {cameras.slice(0, 4).map((cam) => {
                        let filterOverlay = 'bg-slate-950';
                        if (cam.status === 'online' && cam.streamType === 'night-vision') filterOverlay = 'bg-emerald-950/50';
                        if (cam.status === 'online' && cam.streamType === 'thermal') filterOverlay = 'bg-blue-950/40';

                        return (
                          <div 
                            key={cam.id}
                            onClick={() => {
                              setSelectedCamera(cam);
                              setActiveTab('monitoring');
                            }}
                            className="bg-slate-950 border border-slate-850 hover:border-cyan-500 rounded-lg overflow-hidden transition cursor-pointer select-none text-left p-2.5 relative"
                          >
                            <span className="bg-slate-900/90 text-cyan-400 text-[8px] px-1 py-0.2 rounded font-mono block absolute top-1.5 left-1.5 z-10 border border-slate-800">
                              {cam.code}
                            </span>
                            <div className={`aspect-video rounded relative overflow-hidden ${filterOverlay} flex items-center justify-center border border-slate-900`}>
                              <div className="cctv-scanline" style={{ background: 'rgba(34, 211, 238, 0.1)' }} />
                              <span className="text-[10px] text-slate-500 font-mono mt-1">STREAM●</span>
                            </div>
                            <span className="text-white text-[10px] font-semibold truncate block mt-2">{cam.name}</span>
                            <span className="text-[9px] text-slate-500 font-mono block truncate">{cam.location}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI Quick helper FAQs block */}
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap sm:flex-nowrap justify-between gap-4 items-center">
                    <div className="space-y-1 text-left">
                      <span className="text-cyan-400 font-black text-xs block font-display tracking-widest uppercase flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
                        Need automated safety help?
                      </span>
                      <p className="text-slate-400 text-xs">Query the system copilot directly and get fast, structured security reports.</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('chatbot')}
                      className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-500 text-cyan-400 text-xs font-bold px-3 py-1.5 rounded-lg transition shrink-0"
                    >
                      Connect Copilot
                    </button>
                  </div>
                </div>

                {/* Recent platform activities timeline diary (Col 3) */}
                <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
                  <div className="border-b border-slate-800 pb-2.5 flex justify-between items-center">
                    <h3 className="text-white font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse-cyan" />
                      Recent Grid Activities List
                    </h3>
                    <button 
                      onClick={() => setActiveTab('audit-logs')}
                      className="text-[9px] text-slate-500 hover:text-slate-300"
                    >
                      Audit panel
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {alerts.map((al) => (
                      <div key={al.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 hover:border-slate-800 transition text-left flex gap-2.5">
                        <AlertTriangle className={`w-4.5 h-4.5 shrink-0 mt-0.5 ${al.severity === 'critical' ? 'text-red-500 animate-pulse' : 'text-amber-500'}`} />
                        <div>
                          <strong className="text-white text-[11px] block">{al.title}</strong>
                          <span className="text-slate-400 text-[10px] block leading-snug mt-0.5 truncate max-w-[190px]">{al.description}</span>
                          <span className="text-[9px] text-slate-500 font-mono block mt-1">{new Date(al.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {al.cameraName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* B. ROUTE: survelleince grid */}
          {activeTab === 'monitoring' && (
            <CCTVGrid
              cameras={cameras}
              selectedCamera={selectedCamera}
              onSelectCamera={(cam) => setSelectedCamera(cam)}
              onCameraStatusChange={handleCameraStatusChange}
              geminiApiKey={geminiApiKey}
              onUpdateCameraCounts={handleUpdateCameraCounts}
              onAddAlert={handleAddAlert}
            />
          )}

          {/* C. ROUTE: threat alerts */}
          {activeTab === 'alerts' && (
            <AlertsManager
              alerts={alerts}
              onUpdateStatus={handleAlertStatusUpdate}
              onSelectCameraByCode={(code) => {
                const target = cameras.find(c => c.code === code);
                if (target) {
                  setSelectedCamera(target);
                  setActiveTab('monitoring');
                }
              }}
            />
          )}

          {/* D. ROUTE: AI chatbot */}
          {activeTab === 'chatbot' && (
            <AIChatbot
              cameras={cameras}
              alerts={alerts}
              vehicles={vehicles}
              persons={persons}
              geminiApiKey={geminiApiKey}
            />
          )}

          {/* E. ROUTE: Find suspect */}
          {activeTab === 'person-finder' && (
            <PersonFinder
              persons={persons}
              onAddPerson={handleAddPerson}
              geminiApiKey={geminiApiKey}
              onSearchLogged={(reason, cam) => {
                addAuditLog(reason, cam, 'Biometric Search Inquiry');
              }}
            />
          )}

          {/* F. ROUTE: Vehicle sequence tracking */}
          {activeTab === 'vehicle-tracking' && (
            <VehicleTracker 
              vehicles={vehicles}
              onAddVehicle={handleAddVehicle}
              geminiApiKey={geminiApiKey}
              onVehicleSearchLogged={(reason, cam) => {
                addAuditLog(reason, cam, 'License Plate Inquiry');
              }}
            />
          )}

          {/* G. ROUTE: Audit ledger table */}
          {activeTab === 'audit-logs' && (
            <AuditLogs 
              logs={auditLogs}
            />
          )}

          {/* H. ROUTE: configuration panel */}
          {activeTab === 'settings' && (
            <SettingsPanel 
              geminiApiKey={geminiApiKey}
              onSaveApiKey={handleSaveApiKey}
              onAddCommunityPartner={handleAddCommunityPartner}
            />
          )}

          {/* I. ROUTE: Footage Archive */}
          {activeTab === 'archive' && (
            <FootageArchive />
          )}

          {/* J. ROUTE: Upload Video Analysis */}
          {activeTab === 'upload-footage' && (
            <UploadFootage onDetectedVehicles={handleAddDetectedVehicles} />
          )}

        </main>
      </div>

      {/* 3. Footer Operations HUD Status Lines */}
      <footer className="bg-slate-950 border-t border-slate-900 px-4 py-2 shrink-0 flex flex-wrap justify-between items-center text-[10px] text-slate-500 font-mono z-25">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse-cyan" />
            SYS_OPERATIONAL: 100.0% COGNITIVE COMPLIANCE
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline">DATABASE POOL: CLOUD_SECURE_REPLICA [READY]</span>
        </div>
        <div>
          <span>SECURE OPERATOR DESK SESSION KEY: d0981e49-b12e-4e93-9559-56c07c9c0b39</span>
        </div>
      </footer>
    </div>
  );
}
