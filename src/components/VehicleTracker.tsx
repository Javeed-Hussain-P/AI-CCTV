import React, { useState, useRef, useEffect } from 'react';
import { VehicleRecord } from '../types';
import { 
  Car, 
  Search, 
  MapPin, 
  Clock, 
  Gauge, 
  AlertTriangle, 
  Compass, 
  History, 
  ShieldCheck, 
  CheckCircle,
  HelpCircle,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

interface VehicleTrackerProps {
  vehicles: VehicleRecord[];
  onAddVehicle: (vehicle: VehicleRecord) => void;
  geminiApiKey: string;
  onVehicleSearchLogged: (reason: string, camera: string) => void;
}

export default function VehicleTracker({ vehicles, onAddVehicle, geminiApiKey, onVehicleSearchLogged }: VehicleTrackerProps) {
  const [dbPlates, setDbPlates] = useState<any[]>([]);

  const fetchDbPlates = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/plates');
      if (res.ok) {
        const data = await res.json();
        setDbPlates(data);
      }
    } catch (e) {
      console.error("Error fetching plates database:", e);
    }
  };

  useEffect(() => {
    fetchDbPlates();
    const interval = setInterval(fetchDbPlates, 5000);
    return () => clearInterval(interval);
  }, []);

  const [plateQuery, setPlateQuery] = useState('');
  const [activeRecord, setActiveRecord] = useState<VehicleRecord | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchReason, setSearchReason] = useState('Automated stolen vehicle license scan matching');
  
  const [customFile, setCustomFile] = useState<string | null>(null);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCustomFile(file.name);
      
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setUploadedBase64(reader.result.split(',')[1]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const executeVehicleLookup = (plate: string) => {
    if (!plate.trim()) {
      alert('Please key in a license plate register inquiry.');
      return;
    }
    setIsSearching(true);
    
    // Log search event to auditable register
    onVehicleSearchLogged(`License Plate Query: [${plate.toUpperCase()}] - ${searchReason}`, 'Automatic Plates Scan Service');

    setTimeout(() => {
      const match = vehicles.find(
        (v) => v.plateNumber.toLowerCase() === plate.trim().toLowerCase()
      );
      setActiveRecord(match || null);
      setIsSearching(false);
    }, 1000);
  };

  const executeVehicleUploadLookup = async () => {
    if (!uploadedBase64 || !geminiApiKey) {
      alert("Please upload a vehicle image and configure a Gemini API key.");
      return;
    }
    setIsSearching(true);
    onVehicleSearchLogged(`License Plate Visual Analysis: [${customFile}] - ${searchReason}`, 'Automatic Plate Ingestion Service');

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Analyze this vehicle image. Extract the following details:
1. License Plate Text (if visible, format cleanly without spaces like 'KA01AB1234'. If not visible at all, generate a likely realistic plate text based on country cues or leave empty).
2. Make and Model (e.g. 'Toyota Camry', 'Mahindra XUV700').
3. Body Color (e.g. 'Midnight Blue', 'Metallic Silver').
4. Vehicle Type (e.g. 'SUV', 'Sedan', 'Motorbike').
5. Owner Name (generate a typical owner name if not visible).
6. Security status (one of: 'Flagged', 'Monitored', 'Clear').
Provide output in JSON format matching the schema.`
                },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: uploadedBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                plateNumber: { type: 'STRING' },
                owner: { type: 'STRING' },
                makeModel: { type: 'STRING' },
                color: { type: 'STRING' },
                vehicleType: { type: 'STRING' },
                status: { type: 'STRING', description: "Must be one of: 'Flagged', 'Monitored', 'Clear'" },
                reportedReason: { type: 'STRING' }
              },
              required: ['plateNumber', 'owner', 'makeModel', 'color', 'vehicleType', 'status']
            }
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
      }

      const result = await response.json();
      const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) throw new Error("Empty response from Gemini Vision engine.");

      const data = JSON.parse(textResponse);
      const newVehicle: VehicleRecord = {
        plateNumber: data.plateNumber || `UNKNOWN-${Math.floor(Math.random() * 10000)}`,
        owner: data.owner || 'Unknown',
        makeModel: data.makeModel || 'Unknown',
        color: data.color || 'Unknown',
        vehicleType: data.vehicleType || 'Sedan',
        status: data.status || 'Clear',
        reportedReason: data.reportedReason || '',
        sequence: [
          { camera: 'Laptop Dashcam', timestamp: new Date().toISOString(), speed: 55, snapshotType: 'Front' }
        ]
      };

      onAddVehicle(newVehicle);
      setActiveRecord(newVehicle);
      setPlateQuery(newVehicle.plateNumber);
    } catch (err: any) {
      console.error(err);
      alert(`Vehicle AI Ingestion Failed: ${err.message || err}`);
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusBadge = (status: 'Flagged' | 'Monitored' | 'Clear') => {
    switch (status) {
      case 'Flagged':
        return (
          <span className="bg-red-950/80 border border-red-500 text-red-400 text-xs font-bold font-mono px-3 py-0.5 rounded flex items-center gap-1.5 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            FLAGGED STOLEN / WANTED
          </span>
        );
      case 'Monitored':
        return (
          <span className="bg-amber-950/80 border border-amber-500 text-amber-400 text-xs font-medium font-mono px-3 py-0.5 rounded flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            MONITORED COMMUNITY RESIDENT
          </span>
        );
      case 'Clear':
        return (
          <span className="bg-green-950/85 border border-green-500 text-green-400 text-xs font-semibold font-mono px-3 py-0.5 rounded flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
            CLEARED PERMITS MATCH
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="vehicle-operations-tracker">
      {/* Search Bar Input Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h4 className="text-white font-display font-semibold text-sm uppercase tracking-wide flex items-center gap-2 mb-3">
          <Car className="w-4.5 h-4.5 text-cyan-400" />
          Neural License Plate Tracking Desk
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Uploader section */}
          <div className="space-y-1.5 col-span-1">
            <label className="text-[10px] text-slate-500 font-mono uppercase">Vehicle Snapshot Uploader</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500 bg-slate-950 p-2.5 rounded-lg text-center transition cursor-pointer select-none relative overflow-hidden"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                className="hidden" 
                accept="image/*"
              />
              {customFile ? (
                <div className="font-mono text-[10px] flex items-center justify-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-emerald-400 truncate max-w-[130px] font-semibold">{customFile}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Upload Vehicle Snapshot</span>
                </div>
              )}
            </div>
          </div>

          {/* PLATE query input */}
          <div className="space-y-1.5 col-span-1">
            <label className="text-[10px] text-slate-500 font-mono uppercase">Standard License Plate Register</label>
            <div className="relative">
              <input
                type="text"
                value={plateQuery}
                onChange={(e) => setPlateQuery(e.target.value.toUpperCase())}
                placeholder="e.g. KA01AB1234..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs pl-3 pr-16 py-2.5 rounded-lg focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                type="button"
                onClick={() => executeVehicleLookup(plateQuery)}
                className="absolute right-1.5 top-1.5 bg-cyan-950 border border-cyan-500/50 hover:bg-cyan-900 text-cyan-400 text-[10px] uppercase font-mono font-bold px-2.5 py-1 rounded transition"
              >
                Scan
              </button>
            </div>
          </div>

          {/* Officer lookup reason */}
          <div className="space-y-1.5 col-span-1">
            <label className="text-[10px] text-slate-500 font-mono uppercase">Inquiry Justification</label>
            <input
              type="text"
              value={searchReason}
              onChange={(e) => setSearchReason(e.target.value)}
              placeholder="Reason for vehicle query access..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Actions/Suggestions button */}
          <div className="space-y-1.5 col-span-1">
            {uploadedBase64 && geminiApiKey ? (
              <button
                type="button"
                onClick={executeVehicleUploadLookup}
                className="w-full bg-purple-950 hover:bg-purple-900 border border-purple-500 text-purple-300 font-mono py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-md shadow-purple-950/20"
              >
                AI Analyze Snapshot
              </button>
            ) : (
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Active Grid Plates Queries</span>
                <div className="flex flex-wrap gap-1.5">
                  {vehicles.map((v) => (
                    <button
                      type="button"
                      key={v.plateNumber}
                      onClick={() => {
                        setPlateQuery(v.plateNumber);
                        executeVehicleLookup(v.plateNumber);
                      }}
                      className="bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-300 text-[9px] font-mono px-1.5 py-0.5 rounded transition"
                    >
                      {v.plateNumber} {v.status === 'Flagged' ? '⚠️' : '✓'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lookup Loading Display */}
      {isSearching && (
        <div className="bg-slate-900 border border-slate-800 p-12 rounded-xl text-center font-mono">
          <Compass className="w-12 h-12 text-cyan-400 mx-auto animate-spin mb-3" />
          <p className="text-cyan-400 text-xs font-semibold tracking-wider">RETRIEVING DISPATCH CODES & HIGHWAY CAMERA HISTOGRAMS...</p>
        </div>
      )}

      {/* Results Workspace */}
      {!isSearching && activeRecord && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Right/Left: Vehicle Profile Data details (Col 1) */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Registered Vehicle Profile</span>
              <h3 className="text-white text-lg font-bold font-mono tracking-wide mt-1">{activeRecord.plateNumber}</h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">OWNER IDENTIFIER:</span>
                <span className="text-white font-medium">{activeRecord.owner}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MAKE / MODEL:</span>
                <span className="text-white font-medium">{activeRecord.makeModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">VEHICLE COLOR:</span>
                <span className="text-white font-medium">{activeRecord.color}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">VEHICLE CLASS:</span>
                <span className="text-white font-medium">{activeRecord.vehicleType}</span>
              </div>
            </div>

            {/* Legal Status alert boxes */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex justify-start">{getStatusBadge(activeRecord.status)}</div>
              {activeRecord.reportedReason && (
                <p className="text-red-400 bg-red-950/20 border border-red-500/20 text-[11px] p-2.5 rounded-lg mt-3 leading-relaxed font-mono">
                  {activeRecord.reportedReason}
                </p>
              )}
            </div>
          </div>

          {/* Route Sequence & Timestamps Timeline (Col 2 & 3) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-5">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <h4 className="text-white font-display font-semibold text-sm uppercase">CCTV Sequence Traversal map</h4>
              </div>
              <span className="text-slate-500 font-mono text-[10px] uppercase">Sorted Newest First</span>
            </div>

            {/* Camera sequence display (Animated Arrow list style) */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col sm:flex-row justify-around items-center gap-4 text-center">
              {activeRecord.sequence.map((node, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded block">
                      Camera Step {activeRecord.sequence.length - index}
                    </span>
                    <span className="text-cyan-400 font-bold text-xs font-mono">{node.camera}</span>
                  </div>
                  {index < activeRecord.sequence.length - 1 && (
                    <span className="text-slate-500 text-lg font-bold sm:rotate-0 rotate-90">➔</span>
                  )}
                </div>
              ))}
            </div>

            {/* Structured chronos list detailing speeds and timestamps */}
            <div className="space-y-3">
              {activeRecord.sequence.map((node, index) => (
                <div 
                  key={index} 
                  className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-wrap justify-between items-center gap-4 hover:border-slate-800 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 border border-slate-800 text-cyan-400 rounded-lg">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-white font-mono font-bold text-xs">{node.camera}</h5>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(node.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Velocity gauge */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-mono block uppercase">Radar Velocity</span>
                      <strong className={`font-mono text-xs ${node.speed > 80 ? 'text-red-400' : 'text-slate-300'}`}>
                        {node.speed} KM/H
                      </strong>
                    </div>
                    <div className={`p-2 rounded-full ${node.speed > 80 ? 'bg-red-950 border border-red-500/20 text-red-400' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}>
                      <Gauge className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Plates camera snap */}
                  <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-center font-mono">
                    <span className="text-[9px] text-slate-500 block uppercase">{node.snapshotType} Lens View</span>
                    <span className="text-emerald-400 text-xs font-bold font-mono">{activeRecord.plateNumber}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No query found message state */}
      {!isSearching && !activeRecord && plateQuery && (
        <div className="bg-slate-900 border border-slate-850 p-12 rounded-xl text-center font-mono text-slate-600 text-sm">
          No registry logs found matching: <span className="text-red-400">[{plateQuery}]</span> on active network streams.
        </div>
      )}
      {/* 4. Active Plates Log Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 shadow-md text-left mt-6">
        <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
          <h4 className="text-white font-display font-semibold text-sm uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Neural Plates Tracker Ledger ({dbPlates.length})
          </h4>
          <span className="text-[10px] text-slate-500 font-mono uppercase">Scanned Nodes Ledger</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono text-slate-300">
            <thead>
              <tr className="border-b border-slate-850 text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                <th className="py-3 px-4">Plate Number</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Vehicle Class</th>
                <th className="py-3 px-4">Feed Screenshot</th>
              </tr>
            </thead>
            <tbody>
              {dbPlates.map((log) => (
                <tr key={log.id} className="border-b border-slate-900 hover:bg-slate-950/40 transition">
                  <td className="py-3 px-4">
                    <span className="bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded text-xs">
                      {log.plate}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-slate-200">
                    {log.vehicleType || 'Car'}
                  </td>
                  <td className="py-2 px-4">
                    {log.screenshot ? (
                      <div className="w-14 aspect-video rounded overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                        <img 
                          src={log.screenshot.startsWith('/uploads') ? `http://localhost:5000${log.screenshot}` : log.screenshot} 
                          alt="LPR crop" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-slate-600 text-[10px] uppercase">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
              {dbPlates.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-600">
                    No license plates scanned in active registry records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
