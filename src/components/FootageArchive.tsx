import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Trash2, 
  Download, 
  Play, 
  Search, 
  Calendar, 
  Camera as CameraIcon, 
  Clock,
  Database,
  Eye,
  Activity
} from 'lucide-react';

interface Recording {
  id: string;
  cameraName: string;
  timestamp: string;
  duration: string;
  videoUrl: string;
}

export default function FootageArchive() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Recording | null>(null);
  
  // Filter states
  const [searchCamera, setSearchCamera] = useState('');
  const [searchDate, setSearchDate] = useState('');

  // Fetch recordings from server
  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/recordings');
      if (res.ok) {
        const data = await res.json();
        setRecordings(data);
      }
    } catch (e) {
      console.error("Error fetching recordings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this footage segment from the SOC archives?")) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/recordings/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setRecordings(prev => prev.filter(r => r.id !== id));
        if (selectedVideo?.id === id) {
          setSelectedVideo(null);
        }
        alert("Footage record purged successfully.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete recording.");
    }
  };

  const getFullVideoUrl = (url: string) => {
    if (url.startsWith('/uploads')) {
      return `http://localhost:5000${url}`;
    }
    return url;
  };

  // Filtered recordings list
  const filteredRecordings = recordings.filter(rec => {
    const matchesCamera = rec.cameraName.toLowerCase().includes(searchCamera.toLowerCase());
    
    let matchesDate = true;
    if (searchDate) {
      const recDate = new Date(rec.timestamp).toISOString().split('T')[0];
      matchesDate = recDate === searchDate;
    }

    return matchesCamera && matchesDate;
  });

  return (
    <div className="space-y-6" id="soc-footage-archive">
      {/* 1. Archive Search Filter Console */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h4 className="text-white font-display font-semibold text-sm uppercase tracking-wide flex items-center gap-2 mb-4">
          <Database className="w-4.5 h-4.5 text-cyan-400" />
          SOC Footage Archival Database
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Camera filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-mono uppercase block">Filter by Camera Node</label>
            <div className="relative">
              <CameraIcon className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
              <input
                type="text"
                value={searchCamera}
                onChange={(e) => setSearchCamera(e.target.value)}
                placeholder="e.g. Laptop Webcam..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs pl-8 pr-3 py-2.5 rounded-lg focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Date filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-mono uppercase block">Filter by Calendar Date</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs pl-8 pr-3 py-2.2 rounded-lg focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Refresh/Reset button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchCamera('');
                setSearchDate('');
                fetchRecordings();
              }}
              className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 text-xs py-2.5 rounded-lg font-mono transition"
            >
              Reset Search Filter
            </button>
          </div>
        </div>
      </div>

      {/* 2. Primary Media Player & Clips Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clips Grid (Left/Take 2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col min-h-[400px]">
            <div className="border-b border-slate-800 pb-2.5 mb-4 flex justify-between items-center">
              <span className="text-white font-mono text-xs uppercase tracking-wider block">Archived Footage Segments ({filteredRecordings.length})</span>
              <span className="text-[9px] text-slate-500 font-mono">Secure Cloud Storage Enrolled</span>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center font-mono py-20">
                <Activity className="w-8 h-8 text-cyan-400 animate-pulse mb-2" />
                <span className="text-cyan-500 text-xs">Accessing Storage Repositories...</span>
              </div>
            ) : filteredRecordings.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center font-mono py-20 text-slate-500">
                <Video className="w-12 h-12 text-slate-800 mb-2" />
                <span className="text-xs">No recorded video segments found.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredRecordings.map((rec) => {
                  const isPlaying = selectedVideo?.id === rec.id;
                  return (
                    <div
                      key={rec.id}
                      onClick={() => setSelectedVideo(rec)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer select-none text-left flex flex-col justify-between gap-3 ${isPlaying ? 'bg-cyan-950/40 border-cyan-500' : 'bg-slate-950 border-slate-850 hover:bg-slate-900/60'}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <strong className="text-white text-xs font-mono font-bold block">{rec.cameraName}</strong>
                          <span className="text-[10px] text-slate-500 font-mono mt-1 block flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {new Date(rec.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <span className="bg-slate-900 border border-slate-800 text-cyan-400 text-[9px] px-2 py-0.5 rounded font-mono font-semibold">
                          {rec.duration}
                        </span>
                      </div>

                      {/* Card Bottom Actions */}
                      <div className="flex justify-between items-center pt-2.5 border-t border-slate-900/60">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Review Stream</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={getFullVideoUrl(rec.videoUrl)}
                            download={`Surveillance-${rec.id}.webm`}
                            onClick={(e) => e.stopPropagation()}
                            title="Download video"
                            className="p-1.5 bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-400 hover:text-cyan-400 rounded transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={(e) => handleDelete(rec.id, e)}
                            title="Purge clip"
                            className="p-1.5 bg-slate-900 border border-slate-800 hover:border-red-500 text-slate-400 hover:text-red-400 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Video Player Display (Right/1 Column) */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-full min-h-[400px] justify-between shadow-2xl overflow-hidden relative">
            {selectedVideo ? (
              <div className="flex-1 flex flex-col gap-4 font-mono text-left">
                <div className="border-b border-slate-800 pb-2.5">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Active Review Feed</span>
                  <h4 className="text-white text-xs font-bold font-mono truncate mt-1">{selectedVideo.cameraName}</h4>
                  <span className="text-[9px] text-slate-400 block mt-0.5">{new Date(selectedVideo.timestamp).toLocaleString()}</span>
                </div>

                {/* Main video tag */}
                <div className="aspect-video relative rounded-lg overflow-hidden bg-black border border-slate-950 flex items-center justify-center">
                  <div className="cctv-scanline" style={{ background: 'rgba(34, 211, 238, 0.15)' }} />
                  <video
                    key={selectedVideo.id}
                    src={getFullVideoUrl(selectedVideo.videoUrl)}
                    controls
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Metadata details */}
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2 text-xs text-slate-400 leading-relaxed">
                  <div>STREAM ID: <strong className="text-slate-200">{selectedVideo.id}</strong></div>
                  <div>RECORDING TIME: <strong className="text-slate-200">{selectedVideo.duration}</strong></div>
                  <div>REPOS ARCHIVE: <strong className="text-emerald-400">ENROLLED & ACTIVE</strong></div>
                </div>

                <div className="flex justify-end gap-2 mt-auto">
                  <a
                    href={getFullVideoUrl(selectedVideo.videoUrl)}
                    download={`Surveillance-${selectedVideo.id}.webm`}
                    className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-500 text-cyan-400 px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download File
                  </a>
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="bg-slate-950 hover:bg-slate-905 border border-slate-850 text-slate-400 px-3 py-1.5 text-xs font-bold rounded-lg transition"
                  >
                    Close Player
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center font-mono py-20 text-slate-600">
                <Play className="w-12 h-12 text-slate-800 mb-3 animate-pulse" />
                <span className="text-xs max-w-xs block leading-relaxed">Select a footage segment from the archive list to load it into the active console player.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
