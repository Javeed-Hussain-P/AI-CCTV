import React, { useState, useRef } from 'react';
import { PersonRecord } from '../types';
import { MOCK_PERSONS } from '../mockData';
import { 
  Scan, 
  Upload, 
  Search, 
  Eye, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Cpu, 
  ShieldCheck, 
  UserPlus, 
  Activity,
  Image as ImageIcon
} from 'lucide-react';

interface PersonFinderProps {
  persons: PersonRecord[];
  onAddPerson: (person: PersonRecord) => void;
  geminiApiKey: string;
  onSearchLogged: (reason: string, camera: string) => void;
}

export default function PersonFinder({ persons, onAddPerson, geminiApiKey, onSearchLogged }: PersonFinderProps) {
  const [selectedSuspect, setSelectedSuspect] = useState<PersonRecord | null>(null);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'scanning' | 'results'>('idle');
  const [customFile, setCustomFile] = useState<string | null>(null);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [searchReason, setSearchReason] = useState('Suspected unauthorized entry - standard verification scan');
  const [matchingConfidence, setMatchingConfidence] = useState(94.7);
  const [scanSpeedMs, setScanSpeedMs] = useState(1500);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Triggering local photo selection trigger
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

      // Select first mock person as standard placeholder fallback
      setSelectedSuspect(persons[0] || null);
    }
  };

  const handleSelectPreRegister = (person: PersonRecord) => {
    setSelectedSuspect(person);
    setCustomFile(null);
    setUploadedBase64(null);
    setMatchingConfidence(person.confidence);
  };

  const executeBiometricSearch = async () => {
    if (!selectedSuspect && !customFile) {
      alert('Please upload a visual file or select a designated suspect profile.');
      return;
    }
    setSearchStatus('scanning');
    
    // Log audit query access
    onSearchLogged(searchReason, selectedSuspect?.lastSeenCamera || 'All Platform Nodes');

    if (customFile) {
      try {
        const fileInput = fileInputRef.current;
        if (!fileInput || !fileInput.files || !fileInput.files[0]) {
          alert('Please select a visual file to scan.');
          setSearchStatus('idle');
          return;
        }

        const formData = new FormData();
        formData.append('face', fileInput.files[0]);

        const response = await fetch('http://localhost:5000/api/search-face', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Server returned code ${response.status}`);
        }

        const data = await response.json();
        
        if (data.matchFound) {
          const newPerson: PersonRecord = {
            id: `sub-ai-${Date.now()}`,
            name: data.name || `Subject AI-${Math.floor(Math.random() * 1000)}`,
            description: `Wanted target matching visual query. Dom Gender: ${data.details?.gender || 'Unknown'}. Dom Age: ${data.details?.age || 'Unknown'}. Tracked on active network stream segment.`,
            confidence: data.confidence || 95.0,
            lastSeenCamera: data.cameraName || 'Laptop Webcam',
            lastSeenTime: data.timestamp || new Date().toISOString(),
            status: 'Wanted',
            trackHistory: [
              { camera: data.cameraName || 'Laptop Webcam', timestamp: data.timestamp || new Date().toISOString(), confidence: data.confidence || 95.0 }
            ]
          };

          onAddPerson(newPerson);
          setSelectedSuspect(newPerson);
          setMatchingConfidence(newPerson.confidence);
          setSearchStatus('results');
        } else {
          alert("No matching records found in recorded surveillance files.");
          setSearchStatus('idle');
        }
      } catch (err: any) {
        console.error(err);
        alert(`Facial Search Failed: ${err.message || err}`);
        setSearchStatus('idle');
      }
    } else {
      setTimeout(() => {
        setSearchStatus('results');
      }, scanSpeedMs);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="person-finder-workspace">
      {/* 1. Left Config / File Selector Column */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-sm">
          <h4 className="text-white font-display font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
            <Scan className="w-4.5 h-4.5 text-cyan-400" />
            Biometric Signature Input
          </h4>

          {/* Upload Widget */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-cyan-500 hover:bg-slate-950/40 p-6 rounded-lg text-center transition cursor-pointer select-none relative overflow-hidden"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
              className="hidden" 
              accept="image/*"
            />
            {customFile ? (
              <div className="space-y-1 font-mono text-xs">
                <ImageIcon className="w-8 h-8 text-cyan-400 mx-auto mb-1 animate-pulse" />
                <span className="text-emerald-400 block break-all font-semibold">{customFile}</span>
                <span className="text-slate-500 text-[10px]">Ready for neural comparison</span>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="w-8 h-8 text-slate-500 mx-auto mb-1" />
                <span className="text-slate-300 text-xs font-semibold block">Upload Suspect Photo</span>
                <span className="text-[10px] text-slate-500">Supports JPG, PNG with clear facial profile</span>
              </div>
            )}
          </div>

          {/* Officer Query Reason */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-mono uppercase">Officer Access Justification</label>
            <input 
              type="text" 
              value={searchReason}
              onChange={(e) => setSearchReason(e.target.value)}
              placeholder="e.g. Amber alert response, warrant check..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Wanted Database Quick Select */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Active Wanted / Missing Targets</span>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {persons.map((p) => {
                const isSelected = selectedSuspect?.id === p.id && !customFile;
                return (
                  <div 
                    key={p.id}
                    onClick={() => handleSelectPreRegister(p)}
                    className={`p-2 rounded-lg border transition cursor-pointer select-none text-left flex justify-between items-center ${isSelected ? 'bg-cyan-950/40 border-cyan-500' : 'bg-slate-950 border-slate-850 hover:bg-slate-900/60'}`}
                  >
                    <div>
                      <span className="text-white text-xs font-bold font-mono">{p.name}</span>
                      <p className="text-[10px] text-slate-400 truncate max-w-[170px] mt-0.5">{p.description}</p>
                    </div>
                    <span className={`text-[9px] font-semibold px-2 py-0.2 rounded font-mono ${p.status === 'Wanted' ? 'bg-red-950 border border-red-500/55 text-red-400' : p.status === 'Missing' ? 'bg-indigo-950 border border-indigo-500/55 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                      {p.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            onClick={executeBiometricSearch}
            className="w-full bg-cyan-950 hover:bg-cyan-900 border border-cyan-500 text-cyan-400 font-mono py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/20"
          >
            <Search className="w-3.5 h-3.5" />
            Launch AI Facial Search
          </button>
        </div>
      </div>

      {/* 2. Middle and Right Scanning Screen / Matches Result Display */}
      <div className="lg:col-span-2">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-full min-h-[460px] justify-between shadow-2xl overflow-hidden relative">
          
          {searchStatus === 'idle' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 font-mono">
              <Scan className="w-16 h-16 text-slate-700 mb-3 animate-pulse" />
              <p className="text-slate-400 text-sm font-semibold">Surveillance Node Facial Comparison Module</p>
              <p className="text-slate-500 text-xs mt-1 max-w-sm">Ready to ingest facial images or pre-registered security matches for cross-referencing on 8 active high-definition CCTV streams.</p>
            </div>
          )}

          {searchStatus === 'scanning' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 relative font-mono">
              {/* Sci fi Scanning Indicator overlay */}
              <div className="absolute top-1/4 h-0.5 w-64 bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-pulse z-10" />
              <Cpu className="w-16 h-16 text-cyan-500 mb-4 animate-spin" />
              <p className="text-cyan-400 text-sm font-bold tracking-widest uppercase">CONVNEURAL AI FACIAL EXTRACTION ACTIVE</p>
              <div className="text-slate-400 text-[10px] space-y-1.5 mt-4 max-w-md text-left bg-slate-950 p-4 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>Segmenting Facial Landmarks (68-point spatial mesh)... <span className="text-green-500">COMPLETE</span></span>
                </div>
                <div>Mapping Distance Vectors to CCTV Histograms... <span className="text-green-500">PROCESSING</span></div>
                <div>Generating multi-camera correlation timestamps... <span className="text-yellow-500">BUFFERING</span></div>
              </div>
            </div>
          )}

          {searchStatus === 'results' && selectedSuspect && (
            <div className="flex-1 flex flex-col gap-5 text-left font-mono">
              {/* Match Header Overlay Banner */}
              <div className="bg-red-950/20 border border-red-500/30 p-4 rounded-xl flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-950 border border-red-500 font-sans rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-500 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-white text-base font-bold uppercase tracking-wider flex items-center gap-2">
                      POSITIVE MATCH DETECTED
                      <span className="text-red-400 text-xs font-semibold px-2 py-0.2 bg-red-950/80 border border-red-500 rounded">
                        Confidence: {matchingConfidence}%
                      </span>
                    </h4>
                    <p className="text-slate-400 text-xs">{selectedSuspect.name} — Status: {selectedSuspect.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1 rounded">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-slate-300 text-[10px]">TARGET ALIVE IN GRID</span>
                </div>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visual Description Panel */}
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
                  <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Subject Description</span>
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed">{selectedSuspect.description}</p>
                  <div className="text-[10px] space-y-1.5 text-slate-400 mt-2">
                    <div>LAST DETECTED NODAL POINT: <strong className="text-white">{selectedSuspect.lastSeenCamera}</strong></div>
                    <div>TIMESTAMP RECEIVED: <strong className="text-white">{new Date(selectedSuspect.lastSeenTime).toLocaleString()}</strong></div>
                  </div>
                </div>

                {/* Surveillance Sequence Logs */}
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
                  <div className="border-b border-slate-800 pb-2">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Tracking Node Sequences</span>
                  </div>
                  <div className="relative border-l border-slate-800 ml-1.5 pl-4 space-y-3">
                    {selectedSuspect.trackHistory.map((track, idx) => (
                      <div key={idx} className="relative">
                        {/* Dot */}
                        <div className={`absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full border-2 ${idx === 0 ? 'bg-red-500 border-red-500 animate-pulse' : 'bg-slate-500 border-slate-950'}`} />
                        <div>
                          <div className="text-white text-xs font-bold leading-tight">{track.camera}</div>
                          <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                            <span>Score: {track.confidence}%</span>
                            <span>{new Date(track.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action commands */}
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={() => alert(`Broadcasting visual match files of ${selectedSuspect.name} to all local dispatch devices.`)}
                  className="bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 text-xs font-mono px-3 py-1.5 rounded transition"
                >
                  Broadcast Suspect Profile
                </button>
                <button 
                  onClick={() => setSearchStatus('idle')}
                  className="bg-cyan-950 border border-cyan-500 hover:bg-cyan-900 text-cyan-400 text-xs font-mono px-3 py-1.5 rounded transition"
                >
                  Clear Results
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
