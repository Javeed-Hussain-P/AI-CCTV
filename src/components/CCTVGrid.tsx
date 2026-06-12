import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { Camera } from '../types';
import { 
  Camera as CameraIcon, 
  Settings, 
  Maximize2, 
  ShieldAlert, 
  Cpu, 
  Eye, 
  Thermometer, 
  Moon, 
  Radio, 
  Activity, 
  Sparkles,
  Search,
  Bell
} from 'lucide-react';

interface CCTVGridProps {
  cameras: Camera[];
  onSelectCamera: (camera: Camera) => void;
  selectedCamera: Camera | null;
  onCameraStatusChange: (id: string, status: 'online' | 'offline' | 'warning') => void;
  geminiApiKey: string;
  onUpdateCameraCounts: (id: string, people: number, vehicles: number) => void;
  onAddAlert: (alert: any) => void;
}

// Lifecycle managed video component to bind/unbind the live MediaStream safely.
const CameraVideo = forwardRef<HTMLVideoElement, { stream: MediaStream; className?: string }>(
  ({ stream, className }, ref) => {
    useEffect(() => {
      const video = (ref as React.RefObject<HTMLVideoElement | null>)?.current;
      if (video) {
        video.srcObject = stream;
        video.play().catch(err => console.error("Error playing video:", err));
      }
      return () => {
        if (video) {
          video.srcObject = null;
        }
      };
    }, [stream, ref]);

    return (
      <video
        ref={ref}
        muted
        playsInline
        autoPlay
        className={className}
        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
      />
    );
  }
);
CameraVideo.displayName = 'CameraVideo';

export default function CCTVGrid({ 
  cameras, 
  onSelectCamera, 
  selectedCamera, 
  onCameraStatusChange,
  geminiApiKey,
  onUpdateCameraCounts,
  onAddAlert
}: CCTVGridProps) {
  const [streamFilter, setStreamFilter] = useState<'standard' | 'night-vision' | 'thermal'>('standard');
  const [overlayFilter, setOverlayFilter] = useState<'ai-detection' | 'heatmap' | 'none'>('ai-detection');
  const [searchTerm, setSearchTerm] = useState('');
  const [ptzMoving, setPtzMoving] = useState<string | null>(null);

  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [webcamLinkedCamId, setWebcamLinkedCamId] = useState<string | null>(null);
  const activeVideoRef = useRef<HTMLVideoElement>(null);

  // Real AI Detections State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [realDetections, setRealDetections] = useState<{
    summary: { peopleCount: number; vehicleCount: number; weaponCount: number };
    persons: Array<{ box_2d: number[]; label: string; details: any }>;
    vehicles: Array<{ box_2d: number[]; label: string; details: any }>;
    weapons: Array<{ box_2d: number[]; label: string; details: any }>;
  } | null>(null);

  // Filtered list
  const filteredCameras = cameras.filter(cam => 
    cam.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    cam.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cam.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Active camera or first camera can serve as selected if none is chosen
  const activeCamera = selectedCamera || filteredCameras[0] || null;

  // Reset detections when selected camera changes
  useEffect(() => {
    setRealDetections(null);
    setUploadedPreview(null);
  }, [selectedCamera]);

  // Clean up track streams when component unmounts
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [webcamStream]);

  const startWebcam = async (camId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setWebcamStream(stream);
      setWebcamLinkedCamId(camId);
      // Bring offline camera back online if it was offline
      const cam = cameras.find(c => c.id === camId);
      if (cam && cam.status === 'offline') {
        onCameraStatusChange(camId, 'online');
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert("Could not access laptop webcam. Please check camera permissions in your browser settings.");
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    setWebcamLinkedCamId(null);
    setRealDetections(null);
    setUploadedPreview(null);
  };

  const analyzeImage = async (base64Data: string) => {
    if (!geminiApiKey) {
      alert("Please configure a Gemini API key in the Console Settings tab to enable real AI analysis.");
      return;
    }
    setIsAnalyzing(true);
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
                  text: `Analyze this security camera stream snapshot. Detect all persons, vehicles, and weapons.
For each detected object, find its bounding box as [ymin, xmin, ymax, xmax] normalized to 0-1000 (where [0,0,1000,1000] is the full image).
If any weapon is brandished (firearm, knife, etc.), label it carefully and set weaponCount accordingly.
Extract vehicle color, make/model type, and exact license plate text if visible.
Provide output in JSON format matching the schema.`
                },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data
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
                summary: {
                  type: 'OBJECT',
                  properties: {
                    peopleCount: { type: 'INTEGER' },
                    vehicleCount: { type: 'INTEGER' },
                    weaponCount: { type: 'INTEGER' }
                  },
                  required: ['peopleCount', 'vehicleCount', 'weaponCount']
                },
                persons: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      box_2d: {
                        type: 'ARRAY',
                        items: { type: 'INTEGER' }
                      },
                      label: { type: 'STRING' },
                      details: {
                        type: 'OBJECT',
                        properties: {
                          gender: { type: 'STRING' },
                          clothing: { type: 'STRING' },
                          approximateAge: { type: 'STRING' },
                          activity: { type: 'STRING' }
                        },
                        required: ['gender', 'clothing', 'activity']
                      }
                    },
                    required: ['box_2d', 'label', 'details']
                  }
                },
                vehicles: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      box_2d: {
                        type: 'ARRAY',
                        items: { type: 'INTEGER' }
                      },
                      label: { type: 'STRING' },
                      details: {
                        type: 'OBJECT',
                        properties: {
                          color: { type: 'STRING' },
                          makeModel: { type: 'STRING' },
                          type: { type: 'STRING' },
                          licensePlate: { type: 'STRING' }
                        },
                        required: ['color', 'makeModel', 'type']
                      }
                    },
                    required: ['box_2d', 'label', 'details']
                  }
                },
                weapons: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      box_2d: {
                        type: 'ARRAY',
                        items: { type: 'INTEGER' }
                      },
                      label: { type: 'STRING' },
                      details: {
                        type: 'OBJECT',
                        properties: {
                          type: { type: 'STRING' },
                          description: { type: 'STRING' }
                        },
                        required: ['type', 'description']
                      }
                    },
                    required: ['box_2d', 'label', 'details']
                  }
                }
              },
              required: ['summary', 'persons', 'vehicles', 'weapons']
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
      setRealDetections(data);

      if (activeCamera) {
        onUpdateCameraCounts(activeCamera.id, data.summary.peopleCount, data.summary.vehicleCount);
        
        if (data.summary.weaponCount > 0) {
          data.weapons.forEach((w: any, idx: number) => {
            onAddAlert({
              id: `alert-ai-weapon-${Date.now()}-${idx}`,
              category: 'Weapon',
              title: `AI Brandished Weapon Detected: ${w.details.type}`,
              description: `AI camera analyzer detected a ${w.details.description} at ${activeCamera.name}.`,
              location: activeCamera.location,
              cameraName: activeCamera.name,
              timestamp: new Date().toISOString(),
              severity: 'critical',
              status: 'active',
              confidence: 98.0
            });
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(`AI Analysis Failed: ${err.message || err}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTriggerAnalysis = () => {
    if (uploadedPreview) {
      const base64 = uploadedPreview.split(',')[1];
      analyzeImage(base64);
      return;
    }

    const video = activeVideoRef.current;
    if (!video) {
      alert("No active video feed found to capture.");
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
        analyzeImage(base64);
      }
    } catch (err) {
      console.error("Frame capture failed:", err);
      alert("Could not capture frame from webcam video stream.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setUploadedPreview(reader.result);
          setRealDetections(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };



  // Simulate a moving PTZ action
  const triggerPTZ = (direction: string) => {
    if (!activeCamera) return;
    setPtzMoving(direction);
    setTimeout(() => {
      setPtzMoving(null);
    }, 1000);
  };

  const renderRealBoundingBoxes = () => {
    if (!realDetections) return null;
    return (
      <div className="absolute inset-0 pointer-events-none z-20">
        {realDetections.persons?.map((p: any, idx: number) => {
          const [ymin, xmin, ymax, xmax] = p.box_2d || [0, 0, 0, 0];
          return (
            <div
              key={`p-${idx}`}
              className="absolute border-2 border-cyan-500 font-mono"
              style={{
                top: `${ymin / 10}%`,
                left: `${xmin / 10}%`,
                width: `${(xmax - xmin) / 10}%`,
                height: `${(ymax - ymin) / 10}%`,
              }}
            >
              <span className="absolute -top-5 left-0 bg-cyan-950/90 border border-cyan-500 text-cyan-400 text-[8px] px-1 py-0.2 rounded font-semibold whitespace-nowrap">
                {p.label} ({p.details?.gender || 'N/A'}, {p.details?.approximateAge || 'N/A'})
              </span>
            </div>
          );
        })}
        {realDetections.vehicles?.map((v: any, idx: number) => {
          const [ymin, xmin, ymax, xmax] = v.box_2d || [0, 0, 0, 0];
          return (
            <div
              key={`v-${idx}`}
              className="absolute border-2 border-emerald-500 font-mono"
              style={{
                top: `${ymin / 10}%`,
                left: `${xmin / 10}%`,
                width: `${(xmax - xmin) / 10}%`,
                height: `${(ymax - ymin) / 10}%`,
              }}
            >
              <span className="absolute -top-5 left-0 bg-emerald-950/90 border border-emerald-500 text-emerald-400 text-[8px] px-1 py-0.2 rounded font-semibold whitespace-nowrap">
                {v.label} {v.details?.licensePlate ? `[Plate: ${v.details.licensePlate}]` : ''}
              </span>
            </div>
          );
        })}
        {realDetections.weapons?.map((w: any, idx: number) => {
          const [ymin, xmin, ymax, xmax] = w.box_2d || [0, 0, 0, 0];
          return (
            <div
              key={`w-${idx}`}
              className="absolute border-2 border-red-500 font-mono animate-pulse"
              style={{
                top: `${ymin / 10}%`,
                left: `${xmin / 10}%`,
                width: `${(xmax - xmin) / 10}%`,
                height: `${(ymax - ymin) / 10}%`,
              }}
            >
              <span className="absolute -top-5 left-0 bg-red-950/90 border border-red-500 text-red-400 text-[8px] px-1 py-0.2 rounded font-bold whitespace-nowrap">
                ⚠️ WEAPON: {w.details?.type || 'Detected'}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Mock camera stream content with dynamic canvas or interactive vector
  const renderMockStream = (cam: Camera, isDetailView: boolean = false) => {
    if (cam.status === 'offline') {
      return (
        <div className="relative w-full h-full bg-slate-950 flex flex-col items-center justify-center border border-dashed border-red-500/30 font-mono">
          <div className="absolute top-3 left-3 bg-red-950/80 border border-red-500 text-red-400 text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
            <Radio className="w-3 text-red-500 animate-pulse" />
            No Signal
          </div>
          <ShieldAlert className="w-12 h-12 text-red-500/40 mb-2 animate-bounce" />
          <span className="text-red-400 text-xs font-bold tracking-wider uppercase">CONNECTION LOST</span>
          <span className="text-slate-500 text-[10px] mt-1">{cam.ipAddress}</span>
        </div>
      );
    }

    // Determine color schemes based on active view stream type
    const activeStreamType = isDetailView ? streamFilter : cam.streamType;
    const activeOverlay = isDetailView ? overlayFilter : cam.overlay;

    let streamBg = 'bg-slate-900';
    let filterClass = '';
    let scanlineColor = 'rgba(34, 211, 238, 0.25)';

    if (activeStreamType === 'night-vision') {
      streamBg = 'bg-emerald-950';
      filterClass = 'brightness-110 contrast-125 saturate-50 hue-rotate-60';
      scanlineColor = 'rgba(16, 185, 129, 0.35)';
    } else if (activeStreamType === 'thermal') {
      streamBg = 'bg-blue-950';
      filterClass = 'contrast-150 saturate-200 hue-rotate-180 invert';
      scanlineColor = 'rgba(239, 68, 68, 0.25)';
    }

    if (uploadedPreview && isDetailView) {
      return (
        <div className="relative w-full h-full bg-slate-900 overflow-hidden select-none">
          <div className="cctv-scanline" style={{ background: scanlineColor }} />
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-black pointer-events-none z-10 opacity-60" />
          <img src={uploadedPreview} className={`w-full h-full object-cover ${filterClass}`} />
          <div className="absolute inset-0 flex flex-col justify-between p-3 z-10">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-0.5">
                <span className="bg-slate-950/80 border border-slate-800 text-cyan-400 font-mono text-[9px] sm:text-xs px-1.5 py-0.5 rounded flex items-center gap-1 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                  {cam.code} (SNAPSHOT UPLOAD)
                </span>
                <span className="text-neutral-400 text-[9px] font-mono select-none">{cam.ipAddress}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="bg-slate-950/80 border border-slate-800 text-slate-300 font-mono text-[9px] sm:text-xs px-1.5 py-0.5 rounded">
                  ANALYZER: INGESTED
                </span>
                <span className="text-[9px] tracking-wider text-purple-400 font-mono select-none">SNAP ● ANALYZING</span>
              </div>
            </div>
            {activeOverlay === 'ai-detection' && (
              realDetections ? renderRealBoundingBoxes() : (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                  <div className="absolute top-[30%] left-[25%] w-[45%] h-[45%] border-2 border-purple-500 animate-pulse">
                    <span className="absolute -top-5 left-0 bg-purple-950/80 border border-purple-500 text-purple-400 text-[8px] font-mono px-1 py-0.2 rounded font-semibold whitespace-nowrap">
                      [WAITING FOR AI ANALYSIS TRIGGER]
                    </span>
                  </div>
                </div>
              )
            )}
            {activeOverlay === 'heatmap' && (
              <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-purple-500/35 to-transparent flex items-center justify-center">
                <div className="w-24 h-24 bg-purple-600/30 rounded-full filter blur-xl animate-pulse" />
              </div>
            )}
            <div className="flex justify-between items-end">
              <span className="text-slate-400 text-[8px] sm:text-[10px] font-mono select-none truncate max-w-[65%]">
                {cam.location} (IMAGE SOURCE)
              </span>
              <div className="text-slate-400 text-[8px] sm:text-[10px] font-mono select-none">
                {cam.coordinates}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (webcamStream && webcamLinkedCamId === cam.id) {
      return (
        <div className={`relative w-full h-full bg-slate-900 overflow-hidden select-none`}>
          {/* Scanlines layer */}
          <div className="cctv-scanline" style={{ background: scanlineColor }} />
          
          {/* Vignette & Static effect */}
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-black pointer-events-none z-10 opacity-60" />

          {/* Webcam video component */}
          <CameraVideo ref={activeVideoRef} stream={webcamStream} className={filterClass} />

          {/* HUD Overlay */}
          <div className="absolute inset-0 flex flex-col justify-between p-3 z-10">
            {/* Header Bar */}
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-0.5">
                <span className="bg-slate-950/80 border border-slate-800 text-cyan-400 font-mono text-[9px] sm:text-xs px-1.5 py-0.5 rounded flex items-center gap-1 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {cam.code} (WEBCAM)
                </span>
                <span className="text-neutral-400 text-[9px] font-mono select-none hidden sm:inline">{cam.ipAddress}</span>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                <span className="bg-slate-950/80 border border-slate-800 text-slate-300 font-mono text-[9px] sm:text-xs px-1.5 py-0.5 rounded">
                  FPS: {cam.fps}
                </span>
                <span className="text-[9px] tracking-wider text-cyan-400/80 font-mono select-none hidden sm:inline">REC ● LIVE</span>
              </div>
            </div>

            {/* AI Bounding Boxes */}
            {activeOverlay === 'ai-detection' && (
              realDetections ? renderRealBoundingBoxes() : (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                  <div className="absolute top-[30%] left-[25%] w-[45%] h-[45%] border-2 border-cyan-500 animate-pulse-cyan">
                    <span className="absolute -top-5 left-0 bg-cyan-950/80 border border-cyan-500 text-cyan-400 text-[8px] font-mono px-1 py-0.2 rounded font-semibold whitespace-nowrap">
                      [PERSON: Laptop Operator]
                    </span>
                    <span className="absolute -bottom-4 right-0 text-[8px] font-mono text-cyan-400/80">User Stream</span>
                  </div>
                </div>
              )
            )}

            {activeOverlay === 'heatmap' && (
              <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-amber-500/30 via-red-500/20 to-transparent flex items-center justify-center">
                <div className="w-24 h-24 bg-red-600/30 rounded-full filter blur-xl animate-pulse" />
                <span className="absolute bottom-16 right-16 bg-red-950/85 border border-red-500 text-red-400 text-[9px] px-1.5 py-0.5 uppercase tracking-wide font-mono rounded">
                  OPERATOR PRESENT
                </span>
              </div>
            )}

            {/* Footer Coordinates & HUD */}
            <div className="flex justify-between items-end">
              <span className="text-slate-400 text-[8px] sm:text-[10px] font-mono select-none truncate max-w-[65%]">
                {cam.location} (LAPTOP SOURCE)
              </span>
              <div className="text-slate-400 text-[8px] sm:text-[10px] font-mono select-none">
                {cam.coordinates}
              </div>
            </div>
          </div>

          {/* PTZ Adjustment HUD overlay (when moving) */}
          {ptzMoving && isDetailView && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center font-mono z-20">
              <div className="border border-cyan-500 bg-slate-900/90 text-cyan-400 text-xs px-4 py-2 rounded-md shadow-lg flex items-center gap-2">
                <Activity className="w-4 h-4 animate-spin" />
                PAN-TILT-ZOOM ENGAGED: {ptzMoving.toUpperCase()}...
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={`relative w-full h-full ${streamBg} overflow-hidden group select-none`}>
        {/* Scanlines layer */}
        <div className="cctv-scanline" style={{ background: scanlineColor }} />
        
        {/* Vignette & Static effect */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-black pointer-events-none z-10 opacity-60" />

        {/* Live Camera Feed Vector Graphics (gives that high fidelity real CCTV feel) */}
        <div className={`absolute inset-0 flex flex-col justify-between p-3 z-10 ${filterClass}`}>
          {/* Header Bar */}
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-0.5">
              <span className="bg-slate-950/80 border border-slate-800 text-cyan-400 font-mono text-[9px] sm:text-xs px-1.5 py-0.5 rounded flex items-center gap-1 select-none">
                <span className={`w-1.5 h-1.5 rounded-full ${cam.status === 'warning' ? 'bg-amber-500 animate-pulse' : 'bg-green-500 animate-pulse'}`} />
                {cam.code}
              </span>
              <span className="text-neutral-400 text-[9px] font-mono select-none hidden sm:inline">{cam.ipAddress}</span>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <span className="bg-slate-950/80 border border-slate-800 text-slate-300 font-mono text-[9px] sm:text-xs px-1.5 py-0.5 rounded">
                FPS: {cam.fps}
              </span>
              <span className="text-[9px] tracking-wider text-cyan-400/80 font-mono select-none hidden sm:inline">REC ● LIVE</span>
            </div>
          </div>

          {/* AI Bounding Boxes (highly cinematic for "AI-powered" theme) */}
          {activeOverlay === 'ai-detection' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
              {/* Bounding box 1 */}
              <div className="absolute top-[20%] left-[15%] w-[18%] h-[40%] border-2 border-cyan-500 animate-pulse-cyan">
                <span className="absolute -top-5 left-0 bg-cyan-950/80 border border-cyan-500 text-cyan-400 text-[8px] font-mono px-1 py-0.2 rounded font-semibold whitespace-nowrap">
                  [PERSON: Wanted 96%]
                </span>
                <span className="absolute -bottom-4 right-0 text-[8px] font-mono text-cyan-400/80">Tracker 092</span>
              </div>

              {/* Bounding box 2 */}
              <div className="absolute top-[40%] right-[20%] w-[25%] h-[35%] border-2 border-emerald-500">
                <span className="absolute -top-5 left-0 bg-emerald-950/80 border border-emerald-500 text-emerald-400 text-[8px] font-mono px-1 py-0.2 rounded font-semibold whitespace-nowrap m-0.5">
                  [VEHICLE: Clean 91%]
                </span>
                <span className="absolute -bottom-4 left-0 text-[8px] font-mono text-emerald-400/80">Plate Ka-12</span>
              </div>

              {/* Grid matrix indicators */}
              <div className="absolute inset-12 border border-slate-500/10 grid grid-cols-4 grid-rows-4 pointer-events-none">
                <div className="border-[0.5px] border-slate-500/5"></div>
                <div className="border-[0.5px] border-slate-500/5"></div>
                <div className="border-[0.5px] border-slate-500/5"></div>
                <div className="border-[0.5px] border-slate-500/5"></div>
              </div>
            </div>
          )}

          {activeOverlay === 'heatmap' && (
            <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-amber-500/30 via-red-500/20 to-transparent flex items-center justify-center">
              <div className="w-24 h-24 bg-red-600/30 rounded-full filter blur-xl animate-pulse" />
              <div className="w-16 h-16 bg-yellow-500/30 rounded-full filter blur-md ml-12 mt-8 animate-pulse" />
              <span className="absolute bottom-16 right-16 bg-red-950/85 border border-red-500 text-red-400 text-[9px] px-1.5 py-0.5 uppercase tracking-wide font-mono rounded">
                DENSITY CONGESTION WARNING
              </span>
            </div>
          )}

          {/* Footer Coordinates & HUD */}
          <div className="flex justify-between items-end">
            <span className="text-slate-400 text-[8px] sm:text-[10px] font-mono select-none truncate max-w-[65%]">
              {cam.location}
            </span>
            <div className="text-slate-400 text-[8px] sm:text-[10px] font-mono select-none">
              {cam.coordinates}
            </div>
          </div>
        </div>

        {/* PTZ Adjustment HUD overlay (when moving) */}
        {ptzMoving && isDetailView && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center font-mono z-20">
            <div className="border border-cyan-500 bg-slate-900/90 text-cyan-400 text-xs px-4 py-2 rounded-md shadow-lg flex items-center gap-2">
              <Activity className="w-4 h-4 animate-spin" />
              PAN-TILT-ZOOM ENGAGED: {ptzMoving.toUpperCase()}...
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6" id="cctv-monitoring-wrapper">
      {/* 1. Primary Focus Camera Stream (Left / Take 3 Columns on desktop for cinematic monitor) */}
      <div className="xl:col-span-3 flex flex-col gap-4">
        {activeCamera ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
            {/* Expanded Screen Title Header */}
            <div className="p-4 border-b border-slate-800 flex flex-wrap justify-between items-center gap-3 bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-950 border border-cyan-500/50 p-2 rounded-lg">
                  <CameraIcon className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-display font-semibold text-white flex items-center gap-2">
                    {activeCamera.name}
                    {activeCamera.communityEnrolled && (
                      <span className="bg-indigo-950 border border-indigo-500 text-indigo-400 text-[10px] px-1.5 py-0.2 rounded-full font-sans">
                        Community Safety Network
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">{activeCamera.location}</p>
                </div>
              </div>

              {/* Video control switches */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-lg">
                <button
                  onClick={() => setStreamFilter('standard')}
                  className={`px-2 py-1 text-xs font-mono rounded flex items-center gap-1 transition ${streamFilter === 'standard' ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-300'}`}
                  title="Optical Feed"
                >
                  <Eye className="w-3.5 h-3.5" />
                  OPT
                </button>
                <button
                  onClick={() => setStreamFilter('night-vision')}
                  className={`px-2 py-1 text-xs font-mono rounded flex items-center gap-1 transition ${streamFilter === 'night-vision' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-300'}`}
                  title="Night Vision Infrared"
                >
                  <Moon className="w-3.5 h-3.5" />
                  IR
                </button>
                <button
                  onClick={() => setStreamFilter('thermal')}
                  className={`px-2 py-1 text-xs font-mono rounded flex items-center gap-1 transition ${streamFilter === 'thermal' ? 'bg-red-950 text-red-400 border border-red-500/30' : 'text-slate-400 hover:text-slate-300'}`}
                  title="Thermal FLIR Scope"
                >
                  <Thermometer className="w-3.5 h-3.5" />
                  FLIR
                </button>
              </div>

              {/* AI overlays toggle */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
                <button
                  onClick={() => setOverlayFilter('ai-detection')}
                  className={`px-2 py-1 text-xs font-mono rounded flex items-center gap-1 transition ${overlayFilter === 'ai-detection' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'}`}
                >
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  AI Tracking
                </button>
                <button
                  onClick={() => setOverlayFilter('heatmap')}
                  className={`px-2 py-1 text-xs font-mono rounded flex items-center gap-1 transition ${overlayFilter === 'heatmap' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'}`}
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Heatmap
                </button>
                <button
                  onClick={() => setOverlayFilter('none')}
                  className={`px-2 py-1 text-xs font-mono rounded transition ${overlayFilter === 'none' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'}`}
                >
                  Raw CSS
                </button>
              </div>
            </div>

            {/* Simulated Live Display Frame */}
            <div className="aspect-video relative bg-black select-none max-h-[500px]">
              {renderMockStream(activeCamera, true)}
            </div>

            {/* Tactical PTZ D-pad Control Panel */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <span className="text-slate-500 text-xs font-mono uppercase block mb-1">Telemetry Diagnostics</span>
                <div className="text-slate-300 text-xs font-mono flex flex-col gap-1">
                  {realDetections ? (
                    <>
                      <span className="text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                        AI Vision Ingestion:
                      </span>
                      <span>PEOPLE COUNT: <strong className="text-white">{realDetections.summary.peopleCount}</strong></span>
                      <span>VEHICLE COUNT: <strong className="text-white">{realDetections.summary.vehicleCount}</strong></span>
                      {realDetections.summary.weaponCount > 0 ? (
                        <span className="text-red-400 font-bold animate-pulse">WEAPONS: {realDetections.summary.weaponCount} DETECTED</span>
                      ) : (
                        <span className="text-green-400 font-bold">WEAPONS CHECK: CLEAR</span>
                      )}
                    </>
                  ) : (
                    <>
                      <span>RESOLUTION: <strong className="text-white">{activeCamera.resolution}</strong></span>
                      <span>IP CHOP: <strong className="text-white">{activeCamera.ipAddress}</strong></span>
                    </>
                  )}
                </div>
              </div>

              {/* PTZ Console */}
              {activeCamera.status !== 'offline' ? (
                <div className="flex flex-col items-center gap-1 justify-center py-1">
                  <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-1">PTZ PT9G Console</span>
                  <div className="grid grid-cols-3 gap-2 w-28">
                    <div />
                    <button 
                      onClick={() => triggerPTZ('tilt up')}
                      className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 active:scale-95 py-0.5 rounded flex items-center justify-center font-mono text-[10px]"
                    >
                      ▲
                    </button>
                    <div />
                    <button 
                      onClick={() => triggerPTZ('pan left')}
                      className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 active:scale-95 py-0.5 rounded flex items-center justify-center font-mono text-[10px]"
                    >
                      ◀
                    </button>
                    <div className="bg-slate-950 rounded flex items-center justify-center text-[8px] font-mono text-cyan-400">
                      PTZ
                    </div>
                    <button 
                      onClick={() => triggerPTZ('pan right')}
                      className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 active:scale-95 py-0.5 rounded flex items-center justify-center font-mono text-[10px]"
                    >
                      ▶
                    </button>
                    <div />
                    <button 
                      onClick={() => triggerPTZ('tilt down')}
                      className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 active:scale-95 py-0.5 rounded flex items-center justify-center font-mono text-[10px]"
                    >
                      ▼
                    </button>
                    <div />
                  </div>
                </div>
              ) : (
                <div className="text-center text-xs text-red-500/60 font-mono">Console offline. Remote control link lost.</div>
              )}

              {/* Operational Action Buttons */}
              <div className="flex flex-col gap-2">
                <span className="text-slate-500 text-xs font-mono uppercase text-right md:block hidden">Platform Dispatch</span>
                <div className="flex flex-wrap justify-end gap-2">
                  {/* Real AI Buttons */}
                  {geminiApiKey ? (
                    <>
                      {(webcamLinkedCamId === activeCamera.id || uploadedPreview) && (
                        <button
                          onClick={handleTriggerAnalysis}
                          disabled={isAnalyzing}
                          className="bg-purple-950 border border-purple-500 text-purple-300 hover:bg-purple-900/60 px-3 py-1.5 text-xs font-mono rounded font-semibold transition flex items-center gap-1 disabled:opacity-50"
                        >
                          <Cpu className="w-3.5 h-3.5 animate-pulse" />
                          {isAnalyzing ? "AI Analyzing..." : "Analyze Feed Frame"}
                        </button>
                      )}
                      <input 
                        type="file"
                        id="cctv-file-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                      <button
                        onClick={() => document.getElementById('cctv-file-upload')?.click()}
                        className="bg-cyan-950 border border-cyan-500 text-cyan-400 hover:bg-cyan-900/60 px-3 py-1.5 text-xs font-mono rounded font-semibold transition"
                      >
                        Upload Snapshot File
                      </button>
                      {(realDetections || uploadedPreview) && (
                        <button
                          onClick={() => {
                            setRealDetections(null);
                            setUploadedPreview(null);
                          }}
                          className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white px-3 py-1.5 text-xs font-mono rounded font-semibold transition"
                        >
                          Reset Feed
                        </button>
                      )}
                    </>
                  ) : null}

                  {webcamLinkedCamId === activeCamera.id ? (
                    <button 
                      onClick={stopWebcam}
                      className="bg-amber-950 border border-amber-500 text-amber-400 hover:bg-amber-900/60 px-3 py-1.5 text-xs font-mono rounded font-semibold transition"
                    >
                      Disconnect Webcam
                    </button>
                  ) : (
                    <button 
                      onClick={() => startWebcam(activeCamera.id)}
                      className="bg-cyan-950 border border-cyan-500 text-cyan-400 hover:bg-cyan-900/60 px-3 py-1.5 text-xs font-mono rounded font-semibold transition"
                    >
                      Link Laptop Webcam
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      const nextStatus = activeCamera.status === 'offline' ? 'online' : 'offline';
                      if (nextStatus === 'offline' && webcamLinkedCamId === activeCamera.id) {
                        stopWebcam();
                      }
                      onCameraStatusChange(activeCamera.id, nextStatus);
                    }}
                    className={`px-3 py-1.5 text-xs font-mono rounded font-semibold transition ${activeCamera.status === 'offline' ? 'bg-emerald-950 border border-emerald-500 text-emerald-400' : 'bg-red-950 border border-red-500 text-red-400 hover:bg-red-900/60'}`}
                  >
                    {activeCamera.status === 'offline' ? 'Reconnect Signal' : 'Decommission/Offline'}
                  </button>
                  <button 
                    onClick={() => alert(`Broadcasting system pre-recorded audio Warning to speaker node connected to IP: ${activeCamera.ipAddress}`)}
                    className="bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 px-3 py-1.5 text-xs font-mono rounded"
                  >
                    IP Audio Broadcast
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500">
            Select a surveillance node from the directory list...
          </div>
        )}
      </div>

      {/* 2. Side camera directory list (Right / 1 Column) */}
      <div className="xl:col-span-1 flex flex-col gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col flex-1 shadow-md max-h-[640px]">
          {/* Header search bar */}
          <div className="border-b border-slate-800 pb-3 mb-3">
            <h4 className="text-white font-display font-semibold mb-2 text-sm uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse-cyan" />
              Camera Directory ({filteredCameras.length})
            </h4>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search code or location..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Scrolling directory elements */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredCameras.map((cam) => {
              const isActive = activeCamera?.id === cam.id;
              
              let statusBorder = 'border-slate-800';
              let statusText = 'text-green-400 bg-green-500/10';
              if (cam.status === 'offline') {
                statusText = 'text-red-400 bg-red-500/10';
                statusBorder = 'border-red-950/40';
              } else if (cam.status === 'warning') {
                statusText = 'text-amber-400 bg-amber-500/10';
                statusBorder = 'border-amber-950/40';
              }

              return (
                <div
                  key={cam.id}
                  onClick={() => onSelectCamera(cam)}
                  className={`p-2.5 rounded-lg border transition cursor-pointer select-none text-left ${isActive ? 'bg-cyan-950/50 border-cyan-500/80 shadow-md shadow-cyan-950/30' : 'bg-slate-950 hover:bg-slate-900/60 ' + statusBorder}`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-slate-100 text-xs font-mono font-medium truncate max-w-[140px] block">
                      {cam.name}
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${statusText}`}>
                      {cam.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2.5">
                    <span className="text-[10px] text-slate-500 font-mono">{cam.code}</span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        P:{cam.peopleCount}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        V:{cam.vehicleCount}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredCameras.length === 0 && (
              <div className="text-center font-mono text-slate-600 text-xs py-10">
                No surveillance node found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
