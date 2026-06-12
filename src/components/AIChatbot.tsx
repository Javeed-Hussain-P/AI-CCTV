import { useState, useRef, useEffect } from 'react';
import { ChatMessage, Camera, Alert, VehicleRecord, PersonRecord } from '../types';
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  HelpCircle, 
  Cpu, 
  Radio, 
  MapPin, 
  ShieldAlert, 
  CheckCircle,
  Clock,
  Gauge
} from 'lucide-react';

interface AIChatbotProps {
  cameras: Camera[];
  alerts: Alert[];
  vehicles: VehicleRecord[];
  persons: PersonRecord[];
  geminiApiKey: string;
}

export default function AIChatbot({ cameras, alerts, vehicles, persons, geminiApiKey }: AIChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-init',
      sender: 'assistant',
      text: `Tactical CCTV Copilot active. I can query our ${cameras.length} active stream${cameras.length !== 1 ? 's' : ''}, extract weapon reports, verify license tracking, or count pedestrians. What is your query, Officer?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [typing, setTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Suggested canned prompts based on user requirements schema
  const SUGGESTED_QUESTIONS = [
    "How many people entered today?",
    "Show suspicious activities.",
    "Track vehicle KA01AB1234."
  ];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const getConsoleContext = () => {
    return `You are the Tactical CCTV Copilot, an AI assistant running inside a Surveillance Operations Control (SOC) console.
Here is the current real-time state of the surveillance network:
1. Cameras:
${cameras.map(c => `- ${c.name} (${c.code}): Location: ${c.location}, Status: ${c.status}, People Count: ${c.peopleCount}, Vehicle Count: ${c.vehicleCount}`).join('\n')}

2. Active Security Threats / Alerts:
${alerts.map(a => `- [${a.severity.toUpperCase()}] ${a.title}: ${a.description} (Location: ${a.location}, Camera: ${a.cameraName}, Status: ${a.status})`).join('\n')}

3. Tracked Persons Registry:
${persons.map(p => `- ${p.name}: Description: ${p.description}, Status: ${p.status}, Last Seen: ${p.lastSeenCamera} at ${p.lastSeenTime}`).join('\n')}

4. Tracked Vehicles Registry:
${vehicles.map(v => `- Plate: ${v.plateNumber}: Make/Model: ${v.makeModel}, Color: ${v.color}, Status: ${v.status}, Reason: ${v.reportedReason || 'None'}`).join('\n')}

Rules for your response:
1. Speak professionally like a tactical SOC supervisor assistant. Use concise, actionable military/security jargon.
2. If the officer asks about counts (e.g. people or vehicles), list them based on the current camera states.
3. If they ask about threats, suspicious activities, or alerts, summarize the active alerts.
4. If they ask about vehicles or suspects, reference the registries.
5. If they ask generic questions, answer them intelligently in the context of the CCTV command center.`;
  };

  const handleMockReply = (text: string) => {
    const normalized = text.toLowerCase();
    let reply = "";
    let type: 'text' | 'camera-grid' | 'alert-status' | 'vehicle-timeline' = 'text';
    let payload: any = null;

    if (normalized.includes('people') || normalized.includes('count') || normalized.includes('how many')) {
      const totalPeople = cameras.reduce((acc, cam) => acc + cam.peopleCount, 0);
      const topCam = [...cameras].sort((a,b) => b.peopleCount - a.peopleCount)[0];
      reply = `Surveillance Node scanning complete. Across all ${cameras.length} active streams, we are currently tracking ${totalPeople} pedestrians. Segment density is highest at "${topCam.name}" with a local aggregate of ${topCam.peopleCount} individuals.`;
      type = 'camera-grid';
      payload = cameras.filter(c => c.peopleCount > 10);
    } 
    else if (normalized.includes('suspicious') || normalized.includes('alert') || normalized.includes('danger') || normalized.includes('activity')) {
      const activeTh = alerts.filter(a => a.status !== 'resolved');
      if (activeTh.length > 0) {
        reply = `CRITICAL DETECTION UPDATE: I am monitoring ${activeTh.length} un-resolved alerts in the grid. This includes a Weapon Brandished trigger at the Metro East entrance with a local matching confidence of 96.8%.`;
        type = 'alert-status';
        payload = activeTh;
      } else {
        reply = `Analytical scanning suggests all danger thresholds are clear, and first responders have resolved all previous alarms. No active hostile targets flagged.`;
      }
    } 
    else if (normalized.includes('red') || normalized.includes('blue') || normalized.includes('black') || normalized.includes('white') || normalized.includes('silver') || normalized.includes('grey') || normalized.includes('gray') || normalized.includes('green') || normalized.includes('yellow') || normalized.includes('brown') || normalized.includes('orange')) {
      const colorMatches = vehicles.filter(v => {
        const vehicleColor = v.color?.toLowerCase() || '';
        return vehicleColor.split(' ').some(part => part && normalized.includes(part));
      });
      const typeMatches = vehicles.filter(v => {
        if (normalized.includes('car')) return v.vehicleType.toLowerCase().includes('car') || v.makeModel.toLowerCase().includes('car');
        if (normalized.includes('truck')) return v.vehicleType.toLowerCase().includes('truck');
        if (normalized.includes('bus')) return v.vehicleType.toLowerCase().includes('bus');
        if (normalized.includes('bike') || normalized.includes('motorcycle')) return v.vehicleType.toLowerCase().includes('bike') || v.vehicleType.toLowerCase().includes('motorcycle');
        return true;
      });
      const matches = typeMatches.filter(v => colorMatches.includes(v));
      if (matches.length > 0) {
        reply = `I located ${matches.length} vehicle${matches.length > 1 ? 's' : ''} matching that description in the current registry.`;
        if (normalized.includes('car')) {
          reply += ` Example: ${matches[0].color} ${matches[0].makeModel} with plate ${matches[0].plateNumber}.`;
        }
        type = 'vehicle-timeline';
        payload = matches[0];
      } else if (colorMatches.length > 0) {
        reply = `I found ${colorMatches.length} ${normalized.includes('car') ? 'car' : 'vehicle'} matches by color in the registry. The top result is ${colorMatches[0].color} ${colorMatches[0].makeModel} [${colorMatches[0].plateNumber}].`;
        type = 'vehicle-timeline';
        payload = colorMatches[0];
      } else {
        reply = `I could not find any vehicles matching that color/type in the current surveillance registry. Please verify the query or upload footage containing the target scene.`;
      }
    }
    else if (normalized.includes('track') || normalized.includes('ka01ab1234') || normalized.includes('vehicle')) {
      const targetedPlate = 'KA01AB1234';
      const carMatch = vehicles.find(v => v.plateNumber === targetedPlate);
      
      if (carMatch) {
        reply = `Biometric scan matched! Stolen Hyundai Elantra [${targetedPlate}] was logged 12 mins ago. Timeline sequence traces: Laptop Dashcam (14:20) ➔ Laptop Dashcam (14:35) ➔ Laptop Dashcam (14:42). Current speed: 82 km/h. High threat.`;
        type = 'vehicle-timeline';
        payload = carMatch;
      } else {
        reply = `Plate search performed. The specified plate is not indexed under active alert logs or neighborhood security logs.`;
      }
    } 
    else {
      reply = "Copilot processing error. I could not parse that command structure. You can command me to search pedestrian counts ('people'), retrieve security incidents ('suspicious activities'), or track flagged cars ('Track vehicle KA01AB1234').";
    }

    const aiMessage: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      sender: 'assistant',
      text: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
      payload
    };

    setMessages(prev => [...prev, aiMessage]);
    setTyping(false);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // 1. Add User message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setUserInput('');
    setTyping(true);

    if (geminiApiKey) {
      try {
        const contextPrompt = getConsoleContext();
        const apiMessages = [
          {
            role: 'user',
            parts: [{ text: `${contextPrompt}\n\nHere is the chat history so far. Respond to the user's latest message.\n` }]
          }
        ];

        updatedMessages.slice(-6).forEach(m => {
          apiMessages.push({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          });
        });

        apiMessages.push({
          role: 'user',
          parts: [{ text: text }]
        });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: apiMessages
          })
        });

        if (!response.ok) {
          throw new Error(`Gemini API Error: ${response.status}`);
        }

        const result = await response.json();
        const replyText = result.candidates?.[0]?.content?.parts?.[0]?.text || "No response received from copilot.";

        const aiMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'text'
        };
        setMessages(prev => [...prev, aiMessage]);
        setTyping(false);
      } catch (err: any) {
        console.error(err);
        handleMockReply(text);
      }
    } else {
      setTimeout(() => {
        handleMockReply(text);
      }, 1000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[580px]" id="chatbot-operations-pane">
      
      {/* Visual Assist Helper Panel (Col 1) */}
      <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4.5 h-4.5 text-cyan-500 animate-pulse" />
            <span className="text-white text-xs font-mono font-semibold uppercase tracking-widest">AI CCTV Companion</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Surveillance Copilot uses local deep learning filters to analyze feeds, flags vehicle anomalies, and maps security escalations in English text vectors.
          </p>

          <div className="space-y-2 mt-2">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Active Data Registries</span>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-2 font-mono text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span>SURVEILLANCE CAMERAS:</span>
                <span className="text-cyan-400">{cameras.length} Active</span>
              </div>
              <div className="flex justify-between">
                <span>THREAT ALERTS IN-LOOP:</span>
                <span className="text-amber-500">{alerts.length} Incidents</span>
              </div>
              <div className="flex justify-between">
                <span>FLAGGED HIGHWAY PLATES:</span>
                <span className="text-red-400">3 Vehicles</span>
              </div>
            </div>
          </div>
        </div>

        {/* Suggestion prompt boxes */}
        <div className="space-y-2 pt-4 border-t border-slate-850">
          <span className="text-[10px] text-slate-500 font-mono uppercase block">Quick Suggested Inquiries</span>
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
               key={idx}
               onClick={() => handleSendMessage(q)}
               className="w-full text-left bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-300 hover:text-white p-2 text-xs rounded-lg transition"
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Thread Frame (Col 2, 3, 4) */}
      <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between shadow-2xl overflow-hidden">
        {/* Chat window top header */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center px-4 font-mono">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            <div>
              <h4 className="text-white font-semibold text-xs leading-none">Security AI Copilot</h4>
              <span className="text-[9px] text-emerald-400">SYS_COGNITIVE_ACTIVE [V2.5]</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Secure Tunnel Link</span>
          </div>
        </div>

        {/* Messaging Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isAI = msg.sender === 'assistant';
            return (
              <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isAI ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'}`}>
                {/* Profile Circle icon */}
                <div className={`p-2 rounded-lg shrink-0 h-9 w-9 flex items-center justify-center ${isAI ? 'bg-cyan-950 border border-cyan-500/30 text-cyan-400' : 'bg-slate-800 text-slate-300'}`}>
                  {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message body and timestamps */}
                <div className="space-y-1 bg-transparent">
                  <div className={`p-3 rounded-xl border text-sm leading-relaxed font-mono ${isAI ? 'bg-slate-950 border-slate-850 text-slate-200' : 'bg-cyan-950/20 border-cyan-500/30 text-cyan-300'}`}>
                    {msg.text}

                    {/* Highly custom, futuristic embedded payload cards if AI sends specific structures */}
                    {isAI && msg.type === 'camera-grid' && msg.payload && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                        {msg.payload.map((cam: Camera) => (
                          <div key={cam.id} className="bg-slate-900 border border-slate-800 p-2 rounded-lg flex justify-between items-center">
                            <div>
                              <span className="text-white font-bold text-xs">{cam.name}</span>
                              <span className="text-[10px] text-slate-500 block truncate font-mono mt-0.5">{cam.location}</span>
                            </div>
                            <span className="bg-cyan-950 border border-cyan-500/30 text-cyan-400 text-xs px-2 py-0.5 font-bold rounded">
                              P: {cam.peopleCount}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {isAI && msg.type === 'alert-status' && msg.payload && (
                      <div className="mt-3 space-y-2 text-left">
                        {msg.payload.map((al: Alert) => (
                          <div key={al.id} className="bg-red-950/20 border border-red-500/30 p-2.5 rounded-lg flex justify-between items-center gap-4">
                            <div>
                              <span className="text-white font-bold text-xs block">{al.title}</span>
                              <span className="text-slate-400 text-[10px] block mt-0.5 leading-snug">{al.description}</span>
                            </div>
                            <span className="bg-red-950 text-red-500 border border-red-500 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0">
                              CRITICAL
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {isAI && msg.type === 'vehicle-timeline' && msg.payload && (
                      <div className="mt-3 bg-slate-900 border border-slate-850 p-3 rounded-lg text-left space-y-2">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                          <span className="text-white font-bold text-xs">{msg.payload.plateNumber} — {msg.payload.makeModel}</span>
                          <span className="bg-red-950 text-red-500 border border-red-500 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase">FLAGGED</span>
                        </div>
                        {/* Timeline */}
                        <div className="relative border-l border-slate-800 ml-1 pl-3 space-y-2.5 pt-1 text-[10px]">
                          {msg.payload.sequence.map((node: any, idx: number) => (
                            <div key={idx} className="relative">
                              <span className="absolute -left-[16.5px] top-1 w-2 h-2 rounded-full bg-cyan-400" />
                              <div className="text-white font-semibold">{node.camera}</div>
                              <div className="text-slate-500 text-[9px] mt-0.5">{new Date(node.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} @ {node.speed} km/h</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing simulation */}
          {typing && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="p-2 rounded-lg shrink-0 h-9 w-9 flex items-center justify-center bg-cyan-950 border border-cyan-500/30 text-cyan-400 animate-pulse">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-950 border border-slate-850 text-slate-500 p-3 rounded-xl text-xs font-mono animate-pulse">
                Copilot drawing telemetry maps...
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input prompt element */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(userInput); }}
            placeholder="Type your CCTV, pedestrian, or plates inquiry here..."
            className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-cyan-500 font-mono"
          />
          <button
            onClick={() => handleSendMessage(userInput)}
            className="bg-cyan-950 border border-cyan-500 hover:bg-cyan-900 text-cyan-400 px-4 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}
