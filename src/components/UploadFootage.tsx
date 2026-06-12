import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Cpu, 
  Play, 
  Clock, 
  AlertTriangle, 
  Car, 
  Users, 
  Sparkles,
  FileText,
  Activity,
  CheckCircle2,
  FileJson
} from 'lucide-react';

interface TimelineItem {
  time: string;
  peopleCount: number;
  vehicleCount: number;
}

interface DetectionsLog {
  peopleCount: number;
  totalVehicles: number;
  cars: number;
  bikes: number;
  buses: number;
  trucks: number;
  plates: Array<{ plate: string; timestamp: string }>;
  weapons: Array<{ type: string; timestamp: string }>;
}

interface UploadFootageProps {
  onDetectedVehicles: (vehicles: any[]) => void;
}

export default function UploadFootage({ onDetectedVehicles }: UploadFootageProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [aiStatus, setAIStatus] = useState<'idle' | 'analyzing' | 'complete'>('idle');

  // Live Counts
  const [currentDetections, setCurrentDetections] = useState<DetectionsLog>({
    peopleCount: 0,
    totalVehicles: 0,
    cars: 0,
    bikes: 0,
    buses: 0,
    trucks: 0,
    plates: [],
    weapons: []
  });

  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [detectionHistory, setDetectionHistory] = useState<any[]>([]);

  // Bounding Boxes from active frame
  const [frameDetections, setFrameDetections] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setAIStatus('idle');
      setProgress(0);
      setTimeline([]);
      setFrameDetections(null);
      setDetectionHistory([]);
      setCurrentDetections({
        peopleCount: 0,
        cars: 0,
        bikes: 0,
        buses: 0,
        trucks: 0,
        plates: [],
        weapons: []
      });
    }
  };

  // Extract and analyze current frame
  const analyzeCurrentFrame = async () => {
    const video = videoRef.current;
    if (!video || video.paused || video.ended) return;

    // Capture frame on offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob and upload
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
      
      const formData = new FormData();
      formData.append('frame', file);

      try {
        const res = await fetch('http://localhost:5000/api/analyze-frame', {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          setFrameDetections(data);

          // Update timeline counts
          const minutes = Math.floor(video.currentTime / 60).toString().padStart(2, '0');
          const seconds = Math.floor(video.currentTime % 60).toString().padStart(2, '0');
          const timestampStr = `${minutes}:${seconds}`;

          const detectedVehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
          const summaryVehicleCount = data.summary?.vehicleCount ?? detectedVehicles.length;

          setTimeline(prev => {
            // Avoid duplicate timestamps
            if (prev.some(t => t.time === timestampStr)) return prev;
            return [...prev, {
              time: timestampStr,
              peopleCount: data.summary.peopleCount || 0,
              vehicleCount: summaryVehicleCount
            }].sort((a, b) => a.time.localeCompare(b.time));
          });

          // Aggregate Detections
          setCurrentDetections(prev => {
            const nextPlates = [...prev.plates];
            const nextWeapons = [...prev.weapons];
            let cars = prev.cars;
            let bikes = prev.bikes;
            let buses = prev.buses;
            let trucks = prev.trucks;

            detectedVehicles.forEach((v: any) => {
              if (v.details.type === 'Car') cars++;
              if (v.details.type === 'Bike') bikes++;
              if (v.details.type === 'Bus') buses++;
              if (v.details.type === 'Truck') trucks++;

              if (v.details.licensePlate && !nextPlates.some(p => p.plate === v.details.licensePlate)) {
                nextPlates.push({ plate: v.details.licensePlate, timestamp: timestampStr });
              }
            });

            if (detectedVehicles.length === 0 && summaryVehicleCount > 0) {
              // Use the summary count as a fallback if no vehicle type breakdown was provided.
              cars = Math.max(cars, summaryVehicleCount);
            }

            data.weapons?.forEach((w: any) => {
              if (!nextWeapons.some(wp => wp.type === w.details.type && wp.timestamp === timestampStr)) {
                nextWeapons.push({ type: w.details.type, timestamp: timestampStr });
              }
            });

            return {
              peopleCount: Math.max(prev.peopleCount, data.summary.peopleCount || 0),
              totalVehicles: Math.max(prev.totalVehicles, summaryVehicleCount),
              cars,
              bikes,
              buses,
              trucks,
              plates: nextPlates,
              weapons: nextWeapons
            };
          });

          // Add to log list
          setDetectionHistory(prev => [
            {
              time: timestampStr,
              summary: `${data.summary.peopleCount} People, ${data.summary.vehicleCount} Vehicles detected.`,
              weapons: data.summary.weaponCount
            },
            ...prev
          ]);

          if (detectedVehicles.length > 0) {
            onDetectedVehicles(detectedVehicles);
          }

          // Play alert audio warning if weapons found
          if (data.summary.weaponCount > 0) {
            triggerAudioAlert();
          }
        }
      } catch (err) {
        console.error("Frame analysis upload failed:", err);
      }
    }, 'image/jpeg');
  };

  const triggerAudioAlert = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High siren tone
      oscillator.frequency.linearRampToValueAtTime(440, audioCtx.currentTime + 0.4);
      
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.error(e);
    }
  };

  const startAnalysis = () => {
    const video = videoRef.current;
    if (!video) return;

    setAnalyzing(true);
    setAIStatus('analyzing');
    video.play();

    // Trigger analysis every 2 seconds
    analysisIntervalRef.current = setInterval(() => {
      analyzeCurrentFrame();
      
      // Update progress bar based on video playback
      if (video.duration) {
        const currentProgress = (video.currentTime / video.duration) * 100;
        setProgress(Math.min(currentProgress, 100));
      }
    }, 2000);
  };

  const stopAnalysis = () => {
    setAnalyzing(false);
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }
    const video = videoRef.current;
    if (video) video.pause();
  };

  useEffect(() => {
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, []);

  // Sync canvas size to video size and draw bounding boxes
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !frameDetections) return;

    const resizeAndDraw = () => {
      canvas.width = video.clientWidth;
      canvas.height = video.clientHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const scaleX = canvas.width / 1000;
      const scaleY = canvas.height / 1000;

      // Draw Persons
      frameDetections.persons?.forEach((p: any) => {
        const [ymin, xmin, ymax, xmax] = p.box_2d;
        const x = xmin * scaleX;
        const y = ymin * scaleY;
        const w = (xmax - xmin) * scaleX;
        const h = (ymax - ymin) * scaleY;

        ctx.strokeStyle = '#06b6d4'; // Cyan
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = 'rgba(6, 182, 212, 0.85)';
        ctx.font = '9px monospace';
        const label = `${p.label} (${p.details?.gender || 'N/A'}, ${p.details?.approximateAge || 'N/A'})`;
        ctx.fillText(label, x, y > 12 ? y - 4 : y + 10);
      });

      // Draw Vehicles
      frameDetections.vehicles?.forEach((v: any) => {
        const [ymin, xmin, ymax, xmax] = v.box_2d;
        const x = xmin * scaleX;
        const y = ymin * scaleY;
        const w = (xmax - xmin) * scaleX;
        const h = (ymax - ymin) * scaleY;

        ctx.strokeStyle = '#10b981'; // Emerald
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = 'rgba(16, 185, 129, 0.85)';
        ctx.font = '9px monospace';
        const label = `${v.label} ${v.details?.licensePlate ? `[${v.details.licensePlate}]` : ''}`;
        ctx.fillText(label, x, y > 12 ? y - 4 : y + 10);
      });

      // Draw Weapons
      frameDetections.weapons?.forEach((weapon: any) => {
        const [ymin, xmin, ymax, xmax] = weapon.box_2d;
        const x = xmin * scaleX;
        const y = ymin * scaleY;
        const width = (xmax - xmin) * scaleX;
        const height = (ymax - ymin) * scaleY;

        ctx.strokeStyle = '#ef4444'; // Red
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.font = '9px monospace font-bold';
        ctx.fillText(`⚠️ WEAPON: ${weapon.details?.type || 'Knife'}`, x, y > 12 ? y - 4 : y + 10);
      });
    };

    // Trigger drawing
    resizeAndDraw();
    
    // Wire listeners
    window.addEventListener('resize', resizeAndDraw);
    video.addEventListener('timeupdate', resizeAndDraw);

    return () => {
      window.removeEventListener('resize', resizeAndDraw);
      video.removeEventListener('timeupdate', resizeAndDraw);
    };
  }, [frameDetections]);

  // When video ends
  const handleVideoEnded = () => {
    stopAnalysis();
    setProgress(100);
    setAIStatus('complete');
  };

  return (
    <div className="space-y-6" id="upload-surveillance-footage-workspace">
      {/* 1. File Upload Selector Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h4 className="text-white font-display font-semibold text-sm uppercase tracking-wide flex items-center gap-2 mb-3">
          <Upload className="w-4.5 h-4.5 text-cyan-400" />
          Ingest Pre-Recorded Surveillance Footage
        </h4>
        <p className="text-xs text-slate-500 mb-4 font-mono">Upload surveillance video files to process them frame-by-frame through the local YOLOv8 & DeepFace AI pipeline.</p>

        <div className="flex flex-wrap items-center gap-4">
          <label className="bg-slate-950 border border-slate-800 hover:border-cyan-500 text-slate-300 font-mono text-xs font-semibold px-4 py-3 rounded-lg cursor-pointer transition flex items-center gap-2">
            <Upload className="w-4 h-4 text-cyan-400" />
            SELECT SURVEILLANCE VIDEO (MP4, MOV, AVI)
            <input 
              type="file" 
              className="hidden" 
              accept="video/mp4,video/quicktime,video/x-msvideo"
              onChange={handleFileChange}
            />
          </label>

          {videoFile && (
            <div className="text-xs font-mono text-slate-400">
              Selected: <strong className="text-emerald-400">{videoFile.name}</strong> ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
            </div>
          )}
        </div>
      </div>

      {videoUrl && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
          {/* CCTV Feed Monitor (Left / 2 Columns) */}
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
              {/* CCTV Header */}
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                <div className="flex items-center gap-2">
                  <Activity className="w-4.5 h-4.5 text-cyan-400 animate-pulse" />
                  <span className="text-white font-mono text-xs uppercase tracking-wider">CCTV REPLAY: {videoFile?.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="bg-slate-900 px-2 py-0.5 rounded text-cyan-400 border border-slate-850">
                    STATUS: {aiStatus.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Feed Display Container */}
              <div className="aspect-video relative bg-black max-h-[500px]">
                <div className="cctv-scanline" style={{ background: 'rgba(34, 211, 238, 0.15)' }} />
                <video
                  ref={videoRef}
                  src={videoUrl}
                  onEnded={handleVideoEnded}
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {/* Overlay canvas for drawing YOLO bounding boxes */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 pointer-events-none z-20"
                />
              </div>

              {/* Control Console */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-2">
                    {analyzing ? (
                      <button
                        onClick={stopAnalysis}
                        className="bg-amber-950 border border-amber-500 text-amber-400 px-4 py-2 text-xs font-mono font-bold rounded-lg transition"
                      >
                        PAUSE AI PIPELINE
                      </button>
                    ) : (
                      <button
                        onClick={startAnalysis}
                        className="bg-cyan-950 border border-cyan-500 text-cyan-400 px-4 py-2 text-xs font-mono font-bold rounded-lg transition flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        RUN AI ANALYTICS
                      </button>
                    )}
                  </div>

                  <div className="text-xs font-mono text-slate-500">
                    Time: {videoRef.current ? Math.floor(videoRef.current.currentTime) : 0}s / {videoRef.current ? Math.floor(videoRef.current.duration || 0) : 0}s
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>PROCESSING STREAM PROGRESS</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                    <div 
                      className="h-full bg-cyan-500 transition-all duration-300 shadow-[0_0_8px_#22d3ee]" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Event Timeline (Horizontal list or chart style) */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-white font-mono text-xs uppercase tracking-wider mb-3 block">Surveillance Timeline Event Matrix</span>
              {timeline.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-600 font-mono border border-dashed border-slate-800 rounded-lg">
                  No timeline telemetry recorded. Launch the AI pipeline above...
                </div>
              ) : (
                <div className="flex overflow-x-auto gap-4 py-2 scrollbar-hide">
                  {timeline.map((item, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-850 p-3 rounded-lg text-left font-mono shrink-0 w-28">
                      <span className="text-cyan-400 text-[10px] block font-bold">{item.time}</span>
                      <div className="text-[10px] text-slate-400 space-y-0.5 mt-1.5">
                        <div>PEOPLE: <strong className="text-white">{item.peopleCount}</strong></div>
                        <div>VEHICLES: <strong className="text-white">{item.vehicleCount}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Metrics Log Sidebar (Right / 1 Column) */}
          <div className="xl:col-span-1 space-y-4">
            {/* Live Counts Panel */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <h4 className="text-white font-display font-semibold text-xs uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
                Live AI Pipeline Analysis
              </h4>

              {/* Warning popups when weapons are found */}
              {currentDetections.weapons.length > 0 && (
                <div className="bg-red-950/70 border border-red-500 p-3.5 rounded-lg flex gap-3 text-left font-mono animate-pulse shadow-md shadow-red-950/20">
                  <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5 animate-bounce" />
                  <div>
                    <strong className="text-white text-xs block uppercase">CRITICAL THREAT THRESHOLD</strong>
                    <span className="text-red-400 text-[10px] block leading-snug mt-1">
                      Knife/Weapon classification match recorded in footage stream! Security siren broadcasted.
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-left font-mono text-xs">
                <div className="bg-slate-950 p-3 border border-slate-850 rounded-lg">
                  <span className="text-slate-500 block">PEOPLE DETECTED:</span>
                  <strong className="text-white text-lg mt-1 block">{currentDetections.peopleCount}</strong>
                </div>
                <div className="bg-slate-950 p-3 border border-slate-850 rounded-lg">
                  <span className="text-slate-500 block">VEHICLES DETECTED:</span>
                  <strong className="text-white text-lg mt-1 block">{currentDetections.totalVehicles}</strong>
                </div>
                <div className="bg-slate-950 p-3 border border-slate-850 rounded-lg">
                  <span className="text-slate-500 block">CARS DETECTED:</span>
                  <strong className="text-white text-lg mt-1 block">{currentDetections.cars}</strong>
                </div>
                <div className="bg-slate-950 p-3 border border-slate-850 rounded-lg">
                  <span className="text-slate-500 block">BIKES DETECTED:</span>
                  <strong className="text-white text-lg mt-1 block">{currentDetections.bikes}</strong>
                </div>
                <div className="bg-slate-950 p-3 border border-slate-850 rounded-lg">
                  <span className="text-slate-500 block">BUSES DETECTED:</span>
                  <strong className="text-white text-lg mt-1 block">{currentDetections.buses}</strong>
                </div>
                <div className="bg-slate-950 p-3 border border-slate-850 rounded-lg">
                  <span className="text-slate-500 block">TRUCKS DETECTED:</span>
                  <strong className="text-white text-lg mt-1 block">{currentDetections.trucks}</strong>
                </div>
              </div>

              {/* Plate tracker list */}
              <div className="pt-2">
                <span className="text-slate-500 font-mono text-[10px] uppercase block mb-2 font-bold">OCR Number Plates Tracked ({currentDetections.plates.length})</span>
                <div className="bg-slate-950 border border-slate-850 rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-1.5">
                  {currentDetections.plates.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] font-mono py-1 border-b border-slate-900/60 last:border-0">
                      <span className="bg-emerald-950 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.2 rounded font-bold">{p.plate}</span>
                      <span className="text-slate-500">{p.timestamp}</span>
                    </div>
                  ))}
                  {currentDetections.plates.length === 0 && (
                    <span className="text-slate-600 font-mono text-[10px] text-center block py-4">No plates detected.</span>
                  )}
                </div>
              </div>

              {/* Report generation buttons */}
              {aiStatus === 'complete' && (
                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <a
                    href="http://localhost:5000/api/reports?format=pdf"
                    download="Surveillance-AI-Report.pdf"
                    className="w-full bg-cyan-950 border border-cyan-500 hover:bg-cyan-900 text-cyan-400 text-xs font-mono font-bold py-2 rounded-lg transition flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    DOWNLOAD AUDIT REPORT (PDF)
                  </a>
                  <a
                    href="http://localhost:5000/api/reports?format=json"
                    download="Surveillance-AI-Report.json"
                    className="w-full bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 text-xs font-mono font-bold py-2 rounded-lg transition flex items-center justify-center gap-1.5"
                  >
                    <FileJson className="w-4 h-4" />
                    EXPORT DETECTION JOURNAL (JSON)
                  </a>
                </div>
              )}
            </div>

            {/* History Logs */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex-1 flex flex-col">
              <span className="text-white font-mono text-xs uppercase tracking-wider mb-2 pb-2 border-b border-slate-800 block">AI Ingestion Journal Logs</span>
              <div className="flex-1 overflow-y-auto space-y-2 max-h-48 pr-1">
                {detectionHistory.map((log, idx) => (
                  <div key={idx} className="p-2 bg-slate-950 border border-slate-850 rounded text-left font-mono text-[10px] flex justify-between items-start gap-2">
                    <div>
                      <strong className="text-cyan-400">{log.time}</strong>
                      <p className="text-slate-400 mt-0.5">{log.summary}</p>
                    </div>
                    {log.weapons > 0 && (
                      <span className="bg-red-950 border border-red-500 text-red-400 px-1 py-0.2 rounded font-bold animate-pulse">WEAPON</span>
                    )}
                  </div>
                ))}
                {detectionHistory.length === 0 && (
                  <span className="text-slate-600 font-mono text-[10px] text-center block py-10">Waiting for AI frame sequence ingestion...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
