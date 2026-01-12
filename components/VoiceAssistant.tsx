
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from '@google/genai';
import { Room, RoomStatus, Staff } from '../types';
import { STAFF, STAFF_COLORS } from '../constants';

interface VoiceAssistantProps {
  rooms: Room[];
  onBook: (data: { roomIds: string[], guestName: string, startDate: string, endDate: string, staffId: string, notes: string }) => void;
  onUpdateStatus: (roomId: string, status: RoomStatus) => void;
  activeStaffId: string;
}

// Audio Utils as per instructions
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ rooms, onBook, onUpdateStatus, activeStaffId }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextInRef.current) audioContextInRef.current.close();
    if (audioContextOutRef.current) audioContextOutRef.current.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setIsActive(false);
    setIsConnecting(false);
  };

  const startSession = async () => {
    setIsConnecting(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

    audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const outputNode = audioContextOutRef.current.createGain();
    outputNode.connect(audioContextOutRef.current.destination);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const config = {
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
        },
        systemInstruction: `You are the Dhangethi Atoll Voice Assistant. Help staff manage rooms.
        Available Rooms: ${rooms.map(r => r.name).join(', ')}.
        Current Staff: ${STAFF.find(s => s.id === activeStaffId)?.name}.
        You can:
        1. Book one or multiple rooms. Ask for guest name, room numbers, start date, and number of nights if not provided. Note: Verification via 4-digit manual PIN is still required after tool use.
        2. Change room status (Ready, Occupied, Cleaning, Out of Order).
        3. Give hotel status summaries.
        Be professional, brief, and confirm actions before and after execution.`,
        tools: [{
          functionDeclarations: [
            {
              name: 'book_rooms',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  guestName: { type: Type.STRING },
                  roomNames: { type: Type.ARRAY, items: { type: Type.STRING } },
                  startDate: { type: Type.STRING, description: 'ISO date YYYY-MM-DD' },
                  nights: { type: Type.NUMBER }
                },
                required: ['guestName', 'roomNames', 'startDate', 'nights']
              }
            },
            {
              name: 'set_room_status',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  roomName: { type: Type.STRING },
                  status: { type: Type.STRING, enum: Object.values(RoomStatus) }
                },
                required: ['roomName', 'status']
              }
            }
          ]
        }],
        outputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => {
          setIsConnecting(false);
          setIsActive(true);
          const source = audioContextInRef.current!.createMediaStreamSource(stream);
          const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const l = inputData.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
            const pcmBlob = {
              data: encode(new Uint8Array(int16.buffer)),
              mimeType: 'audio/pcm;rate=16000',
            };
            sessionRef.current?.sendRealtimeInput({ media: pcmBlob });
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(audioContextInRef.current!.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          // Handle Audio
          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio && audioContextOutRef.current) {
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextOutRef.current.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextOutRef.current, 24000, 1);
            const source = audioContextOutRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextOutRef.current.destination);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sourcesRef.current.add(source);
            source.onended = () => sourcesRef.current.delete(source);
          }

          if (message.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => s.stop());
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }

          // Handle Function Calls
          if (message.toolCall) {
            for (const fc of message.toolCall.functionCalls) {
              let result = "failed";
              if (fc.name === 'book_rooms') {
                const args = fc.args as any;
                const roomIds = rooms.filter(r => args.roomNames.includes(r.name)).map(r => r.id);
                if (roomIds.length > 0) {
                  const end = new Date(args.startDate);
                  end.setDate(end.getDate() + (args.nights || 1));
                  onBook({
                    roomIds,
                    guestName: args.guestName,
                    startDate: args.startDate,
                    endDate: end.toISOString().split('T')[0],
                    staffId: activeStaffId,
                    notes: 'Booked via AI Voice'
                  });
                  result = "ok";
                }
              } else if (fc.name === 'set_room_status') {
                const args = fc.args as any;
                const room = rooms.find(r => r.name === args.roomName);
                if (room) {
                  onUpdateStatus(room.id, args.status as RoomStatus);
                  result = "ok";
                }
              }
              sessionRef.current?.sendToolResponse({
                functionResponses: { id: fc.id, name: fc.name, response: { result } }
              });
            }
          }

          // Handle Transcription
          if (message.serverContent?.outputTranscription) {
            setTranscript(prev => (prev + ' ' + message.serverContent?.outputTranscription?.text).slice(-100));
          }
        },
        onerror: (e: any) => {
          console.error("AI Error:", e);
          stopSession();
        },
        onclose: () => stopSession()
      }
    };

    sessionRef.current = await ai.live.connect(config);
  };

  return (
    <div className="fixed bottom-20 right-8 z-50 flex flex-col items-end gap-4">
      {isActive && (
        <div className="bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-2xl shadow-2xl text-xs animate-in slide-in-from-bottom-4 border border-white/10 max-w-[200px]">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
            <span className="font-bold uppercase tracking-widest opacity-60 text-[9px]">Dhangethi AI</span>
          </div>
          <p className="italic opacity-80 truncate">"{transcript || 'Listening...'}"</p>
        </div>
      )}

      <button
        onClick={isActive ? stopSession : startSession}
        disabled={isConnecting}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 relative group ${
          isActive 
            ? 'bg-rose-500 text-white animate-pulse' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {isConnecting ? (
          <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ) : isActive ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
        
        {!isActive && !isConnecting && (
          <span className="absolute right-full mr-4 bg-white text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-slate-100">
            Dhangethi Voice Assistant
          </span>
        )}
      </button>
    </div>
  );
};

export default VoiceAssistant;
