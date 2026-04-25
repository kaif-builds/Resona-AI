import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import {
  ArrowRight, Mic2, Globe, Cpu, Trash2, Play, Pause, Square,
  Download, LoaderCircle, Github, Linkedin, Mail, ChevronDown,
  Activity
} from 'lucide-react';
import { uploadVoiceSample, synthesizeSpeech as synthesizeSpeechApi, deleteProfile } from './resonaApi.js';
import { storage, db } from './firebase';
import { ref as storageRef, uploadBytes } from 'firebase/storage';
import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';


interface ProfileListItem {
  id: string;
  name?: string;
  createdAt?: string | number | Date | null;
}


const DEFAULT_VOICES = [
  { id: 'alex',   label: 'Alex',   file: '/default_voices/alex.mp3' },
  { id: 'zara',   label: 'Zara',   file: '/default_voices/zara.mp3' },
  { id: 'marcus', label: 'Marcus', file: '/default_voices/marcus.mp3' },
  { id: 'emma',   label: 'Emma',   file: '/default_voices/emma.mp3' },
];

const DEVELOPERS = [
  {
    name: "Alkaif Gajdhar",
    github: "https://github.com/kaif-builds",
    linkedin: "https://www.linkedin.com/in/alkaif-gajdhar-b6033328b",
    email: "alkaifgajdhar@gmail.com"
  },
  {
    name: "Akshat Jain",
    github: "https://github.com/akshatjain",
    linkedin: "https://linkedin.com/in/akshatjain",
    email: "akshat@resona.ai"
  }
];

const LANG_OPTIONS = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'ru', name: 'Russian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'cs', name: 'Czech' },
  { code: 'ar', name: 'Arabic' },
  { code: 'zh-cn', name: 'Chinese (Simplified)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'ko', name: 'Korean' },
  { code: 'hi', name: 'Hindi' }
];


function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function formatMonthYear(v: unknown) {
  const d = v instanceof Date ? v : typeof v === 'number' || typeof v === 'string' ? new Date(v as any) : null;
  return d && !isNaN(d.getTime()) ? d.toLocaleString(undefined, { month: 'short', year: 'numeric' }) : '—';
}

function downloadAudio(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}


const NoiseBg = () => (
  <svg className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
    <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
    <rect width="100%" height="100%" filter="url(#noise)" opacity="1"/>
  </svg>
);


const DotGrid = () => (
  <div
    className="fixed inset-0 z-0 pointer-events-none"
    style={{
      backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
      backgroundSize: '20px 20px'
    }}
  />
);


function WaveformViz({ active }: { active: boolean }) {
  const bars = Array.from({ length: 32 }, (_, i) => i);
  return (
    <div className="flex items-center gap-[3px] h-10">
      {bars.map(i => (
        <motion.div
          key={i}
          className="w-[2px] rounded-full"
          style={{ backgroundColor: active ? '#FF6A00' : 'rgba(255,255,255,0.15)' }}
          animate={active ? {
            height: [8, Math.random() * 32 + 6, 8],
            opacity: [0.6, 1, 0.6]
          } : { height: 3 }}
          transition={active ? {
            duration: 0.4 + Math.random() * 0.4,
            repeat: Infinity,
            delay: i * 0.03,
            ease: 'easeInOut'
          } : { duration: 0.3 }}
        />
      ))}
    </div>
  );
}


function CursorGlow() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  useEffect(() => {
    const fn = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', fn);
    return () => window.removeEventListener('mousemove', fn);
  }, []);
  return (
    <div
      className="fixed pointer-events-none z-[1] transition-transform duration-300"
      style={{
        left: pos.x - 250, top: pos.y - 250,
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(255,106,0,0.06) 0%, transparent 70%)',
        borderRadius: '50%'
      }}
    />
  );
}


function FrequencyWaves() {
  const bars = Array.from({ length: 60 });
  
  return (
    <div 
      className="absolute inset-0 flex items-center justify-center gap-[4px] sm:gap-[6px] md:gap-[8px] opacity-[0.15] pointer-events-none"
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
      }}
    >
      {bars.map((_, i) => {
        const distance = Math.abs(i - 30) / 30;
        const envelope = 1 - Math.pow(distance, 1.5);
        
        const minH = 5 * envelope + 2;
        const maxH = 60 * envelope + 10;
        
        return (
          <motion.div
            key={i}
            className="w-[2px] sm:w-[3px] bg-gradient-to-t from-[#FF6A00] to-[#FF8C42] rounded-full"
            initial={{ height: `${minH}%`, opacity: 0 }}
            animate={{ 
              height: [
                `${minH}%`, 
                `${Math.random() * (maxH - minH) + minH}%`, 
                `${minH}%`
              ],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 2.5 + 2.0,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 3
            }}
          />
        );
      })}
    </div>
  );
}

function HeroBlob() {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          rotate: [0, 8, -5, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full opacity-30"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,106,0,0.25) 0%, rgba(200,74,0,0.1) 40%, transparent 70%)',
          filter: 'blur(80px)'
        }}
      />
    </div>
  );
}


function Logo({ size = 32 }: { size?: number }) {
  return (
    <div 
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size, borderRadius: size * 0.25, background: '#111113', border: '1px solid #2A2A2E' }}
    >
      <div className="flex items-center justify-center gap-[2px] h-[40%]">
        {[ '60%', '100%', '40%', '80%' ].map((h, i) => (
          <div 
            key={i}
            className="w-[2px] rounded-full bg-[#FF6A00]"
            style={{ height: h }}
          />
        ))}
      </div>
    </div>
  );
}


function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#0B0B0D] text-white overflow-hidden flex flex-col">
      <NoiseBg />
      <DotGrid />
      <CursorGlow />

      {/* Ambient top glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] z-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(255,106,0,0.07) 0%, transparent 70%)' }}
      />

      
      <nav className="relative z-10 flex justify-between items-center px-8 md:px-16 py-8">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3"
        >
          <Logo size={36} />
          <span className="text-sm tracking-[0.3em] uppercase text-[#A1A1AA] font-bold ml-1">Resona AI</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-8"
        >
          {/* Top right header elements removed */}
        </motion.div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 md:px-16 pb-16 pt-8 text-center">

        <HeroBlob />
        <FrequencyWaves />

        {/* Main heading */}
        <div className="overflow-hidden mb-2 pb-4 relative z-10 mt-8">
          <motion.h1
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(52px,9vw,130px)] font-extrabold leading-[0.88] tracking-[-0.03em] text-white"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Clone your
          </motion.h1>
        </div>
        <div className="overflow-hidden mb-12 relative z-10">
          <motion.h1
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(52px,9vw,130px)] font-extrabold leading-[0.88] tracking-[-0.03em]"
            style={{
              fontFamily: "'Outfit', sans-serif",
              background: 'linear-gradient(135deg, #FF6A00, #FF8C42, #C84A00)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            voice in seconds
          </motion.h1>
        </div>

        {/* Sub + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65 }}
          className="flex flex-col items-center gap-8 relative z-10"
        >
          <p className="text-sm md:text-base text-[#A1A1AA] max-w-lg leading-relaxed font-light text-center">
            Clone your voice with cutting-edge AI that preserves identity, emotion, and clarity.
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={onEnter}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              className="group relative flex items-center gap-4 cursor-pointer"
            >
              <div
                className="px-8 py-4 rounded-full font-bold text-sm tracking-wide flex items-center gap-3 transition-all duration-500"
                style={{
                  background: hovered
                    ? 'linear-gradient(135deg, #FF8C42, #FF6A00)'
                    : '#FFFFFF',
                  color: hovered ? '#FFFFFF' : '#000000',
                  boxShadow: hovered
                    ? '0 0 60px rgba(255,106,0,0.4), 0 0 120px rgba(255,106,0,0.15)'
                    : '0 0 30px rgba(255,255,255,0.1)',
                }}
              >
                Begin Cloning
                <ArrowRight size={16} className={`transition-transform duration-300 ${hovered ? 'translate-x-1' : ''}`} />
              </div>
            </button>
          </div>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="flex flex-wrap justify-center gap-3 mt-20 relative z-10"
        >
          {['Neural Voice Cloning', 'Real-time Synthesis', '17 Languages', 'Studio Quality'].map((tag, i) => (
            <div
              key={i}
              className="px-5 py-2.5 rounded-full text-[10px] tracking-[0.3em] uppercase text-[#A1A1AA]/60 transition-all duration-300 hover:border-[#FF6A00]/30 hover:text-[#FF8C42]"
              style={{ border: '1px solid #2A2A2E' }}
            >
              {tag}
            </div>
          ))}
        </motion.div>
      </main>

      {/* Bottom strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        className="relative z-10 px-8 md:px-16 py-6 flex justify-between items-center"
        style={{ borderTop: '1px solid #2A2A2E' }}
      >
        <div className="flex gap-8">
          {DEVELOPERS.map((d, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#A1A1AA]/80 font-medium">{d.name}</span>
              <div className="flex gap-2 text-[#A1A1AA]/60">
                <a href={d.github} target="_blank" rel="noopener noreferrer" className="hover:text-[#FF6A00] transition-colors"><Github size={12}/></a>
                <a href={d.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-[#FF6A00] transition-colors"><Linkedin size={12}/></a>
                <a href={`mailto:${d.email}`} className="hover:text-[#FF6A00] transition-colors"><Mail size={12}/></a>
              </div>
            </div>
          ))}
        </div>
        <span className="text-[10px] tracking-[0.3em] uppercase text-[#A1A1AA]/20 hidden md:block">© 2026 Resona AI</span>
      </motion.div>
    </div>
  );
}


function WorkspacePage({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<'clone' | 'tts'>('clone');
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('en');
  const [ttsSpeaker, setTtsSpeaker] = useState('alex');
  const [cachedProfiles, setCachedProfiles] = useState<Record<string, string>>({});
  const [uploadingVoiceId, setUploadingVoiceId] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sampleUrl, setSampleUrl] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimeRef = useRef(0);

  useEffect(() => {
    return () => {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
    };
  }, [mode]);

  const togglePreview = (id: string, file: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePreview === id) {
      if (audioPreviewRef.current) audioPreviewRef.current.pause();
      setActivePreview(null);
    } else {
      if (audioPreviewRef.current) audioPreviewRef.current.pause();
      audioPreviewRef.current = new Audio(file);
      audioPreviewRef.current.play().catch(console.error);
      audioPreviewRef.current.onended = () => setActivePreview(null);
      setActivePreview(id);
    }
  };

  const getAudioDuration = async (file: File | Blob) => {
    const url = URL.createObjectURL(file);
    try {
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.src = url;
      return await new Promise<number>((res) => {
        audio.onloadedmetadata = () => res(isFinite(audio.duration) ? audio.duration : 0);
        audio.onerror = () => res(0);
      });
    } finally { URL.revokeObjectURL(url); }
  };

  const persistToFirebase = async (pId: string, file: File, duration: number) => {
    const tRef = storageRef(storage, `voices/${pId}/sample.wav`);
    await uploadBytes(tRef, file, { contentType: file.type || 'audio/wav' });
    await setDoc(doc(db, 'profiles', pId), { profileId: pId, createdAt: serverTimestamp(), duration });
  };

  const createProfile = async (file: File, duration: number) => {
    const res = await uploadVoiceSample(file, `My Voice ${Date.now()}`);
    const pId = res?.profile_id ?? res?.profileId ?? res?.id ?? null;
    if (!pId) throw new Error('No profileId returned.');
    setProfileId(pId);
    try { await persistToFirebase(pId, file, duration); } catch (e) { console.warn('Firebase skip:', e); }
    return pId;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg', 'audio/mp4'];
      let mimeType = '';
      for (const mt of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mt)) { mimeType = mt; break; }
      }
      const mrOptions: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const mr = new MediaRecorder(stream, mrOptions);
      const actualMime = mr.mimeType || mimeType || 'audio/webm';

      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: actualMime });
        const blobUrl = URL.createObjectURL(blob);
        setSampleUrl(blobUrl);
        setAudioName('Recorded Sample');
        stream.getTracks().forEach(t => t.stop());

        let ext = '.webm';
        if (actualMime.includes('ogg')) ext = '.ogg';
        else if (actualMime.includes('mp4')) ext = '.m4a';
        else if (actualMime.includes('wav')) ext = '.wav';

        const file = new File([blob], `sample-${Date.now()}${ext}`, { type: actualMime });

        let duration = recordingTimeRef.current;
        try {
          const blobDuration = await getAudioDuration(blob);
          if (blobDuration > 0) duration = blobDuration;
        } catch { /* use timer fallback */ }

        createProfile(file, duration).catch(err => {
          console.error('Profile creation failed:', err);
          alert(`Voice profile creation failed: ${err.message || 'Unknown error'}. Please try again.`);
        });
      };

      mr.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      setSampleUrl(null); setAudioName(null); setProfileId(null); setAudioUrl(null);
      timerRef.current = setInterval(() => {
        setRecordingTime(p => {
          const next = p + 1;
          recordingTimeRef.current = next;
          return next;
        });
      }, 1000);
    } catch { alert("Microphone access required."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) { alert("Please upload a valid audio file."); return; }
    setSampleUrl(URL.createObjectURL(file));
    setAudioName(file.name);
    setIsRecording(false); setProfileId(null); setAudioUrl(null);
    if (timerRef.current) clearInterval(timerRef.current);
    getAudioDuration(file).then(d => createProfile(file, d)).catch(console.error);
  };

  const maxWords = 500;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const isOver = wordCount > maxWords;
  const canGen = mode === 'tts' 
    ? (!!text.trim() && !isOver && !isLoading) 
    : (!!profileId && !!text.trim() && !isOver && !isLoading);

  const handleGenerate = async () => {
    if (!canGen) return;
    setError(null); setIsLoading(true);
    setAudioUrl(null);
    try {
      let res;
      if (mode === 'clone') {
        if (!profileId) throw new Error("Please capture or upload a voice first.");
        res = await synthesizeSpeechApi({ text, profile_id: profileId, language });
      } else {
        let currentProfileId = cachedProfiles[ttsSpeaker];
        if (!currentProfileId) {
          setUploadingVoiceId(ttsSpeaker);
          try {
            const selectedVoice = DEFAULT_VOICES.find(v => v.id === ttsSpeaker);
            if (!selectedVoice) throw new Error("Invalid voice selected.");
            const fetchRes = await fetch(selectedVoice.file);
            if (!fetchRes.ok) throw new Error("Failed to load standard voice sample.");
            const blob = await fetchRes.blob();
            const file = new File([blob], `${selectedVoice.id}.mp3`, { type: 'audio/mpeg' });
            
            const uploadRes = await uploadVoiceSample(file, selectedVoice.label);
            currentProfileId = uploadRes?.profile_id ?? uploadRes?.profileId ?? uploadRes?.id;
            if (!currentProfileId) throw new Error("Failed to initialize voice profile for the selected speaker.");
            
            setCachedProfiles(prev => ({ ...prev, [ttsSpeaker]: currentProfileId! }));
          } finally {
            setUploadingVoiceId(null);
          }
        }
        res = await synthesizeSpeechApi({ text, profile_id: currentProfileId, language });
      }
      
      let url: string | null = null;
      if (res instanceof Blob) url = URL.createObjectURL(res);
      else if (typeof res === 'string') url = res;
      else if (res?.audio_url) url = res.audio_url;
      else if (res?.audio_base64) url = `data:audio/wav;base64,${res.audio_base64}`;
      else throw new Error('No audio returned.');
      setAudioUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Synthesis failed. For TTS, please ensure backend supports without custom profile.');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="relative min-h-screen bg-[#0B0B0D] text-white overflow-x-hidden">
      <NoiseBg />
      <DotGrid />
      <CursorGlow />

      
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] z-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(255,106,0,0.06) 0%, transparent 70%)' }}
      />

      
      <nav className="relative z-10 flex items-center justify-between px-8 md:px-16 py-8" style={{ borderBottom: '1px solid #2A2A2E' }}>
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={onBack}>
          <Logo size={32} />
          <span className="text-[11px] tracking-[0.45em] uppercase text-[#A1A1AA]/80 font-bold ml-1">Resona AI</span>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-8 md:px-16 py-16 space-y-12">

        
        <div className="flex justify-center mb-4 relative z-10">
          <div className="p-1 rounded-full bg-[#111113] border border-[#2A2A2E] flex items-center shadow-lg">
            <button
              onClick={() => setMode('clone')}
              className={`px-8 py-3 rounded-full text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 ${mode === 'clone' ? 'bg-[#2A2A2E] text-white shadow-sm' : 'text-[#A1A1AA]/50 hover:text-white'}`}
            >
              Voice Clone
            </button>
            <button
              onClick={() => setMode('tts')}
              className={`px-8 py-3 rounded-full text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 ${mode === 'tts' ? 'bg-[#2A2A2E] text-white shadow-sm' : 'text-[#A1A1AA]/50 hover:text-white'}`}
            >
              Text To Speech
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10 w-full">
          
          <div className="rounded-2xl p-8 flex flex-col min-h-[400px]" style={{ background: '#111113', border: '1px solid #2A2A2E' }}>
            <div className="flex items-center gap-3 mb-6">
              <Mic2 size={16} className="text-[#FF6A00]" />
              <h2 className="text-sm font-semibold tracking-wide">Text to speak</h2>
            </div>
            
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Please enter text to speak..."
              className="w-full flex-1 bg-transparent text-white placeholder-[#A1A1AA]/30 text-sm leading-relaxed resize-none focus:outline-none"
            />
            
            <div className="flex justify-between items-center mt-6 pt-6" style={{ borderTop: '1px solid #2A2A2E' }}>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#A1A1AA]/50 flex items-center gap-2">
                <Activity size={12} /> Please input text
              </span>
              <span className={`text-[10px] tracking-[0.2em] uppercase ${isOver ? 'text-red-400' : 'text-[#A1A1AA]/40'}`}>
                {wordCount} / {maxWords}
              </span>
            </div>
          </div>

          
          <div className="space-y-8">
            {mode === 'clone' ? (
              <div className="space-y-8">
                
                <div className="rounded-2xl p-8" style={{ background: '#111113', border: '1px solid #2A2A2E' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <Globe size={16} className="text-[#FF6A00]" />
                    <h2 className="text-sm font-semibold tracking-wide">Choose audio</h2>
                  </div>

                  <div 
                    className="relative rounded-2xl p-6 space-y-6 transition-all duration-500 overflow-hidden"
                    style={{
                      background: isRecording ? 'rgba(255,106,0,0.04)' : 'rgba(255,255,255,0.02)',
                      border: isRecording ? '1px solid rgba(255,106,0,0.4)' : '1px solid #2A2A2E',
                    }}
                  >
                    {isRecording && (
                      <div className="absolute inset-0 rounded-2xl animate-pulse pointer-events-none"
                        style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255,106,0,0.08) 0%, transparent 70%)' }}
                      />
                    )}

                    <div className="relative z-10">
                      <h3 className="text-[11px] font-semibold tracking-wide uppercase text-[#A1A1AA]/80 mb-2">
                        {isRecording ? 'Capturing...' : audioName || 'Select an audio file'}
                      </h3>
                      <p className="text-[#A1A1AA]/50 text-xs leading-relaxed max-w-[250px]">
                        {isRecording
                          ? 'Speak naturally. Vary your pitch and pace for best results.'
                          : sampleUrl
                          ? 'Sample captured. Ready for processing.'
                          : 'Supported formats: MP3, WAV, M4A. Duration 10-60S.'}
                      </p>
                    </div>

                    {isRecording && (
                      <div className="space-y-3 relative z-10">
                        <div className="text-3xl font-mono tracking-widest text-[#FF6A00]">{formatTime(recordingTime)}</div>
                        <WaveformViz active={true} />
                      </div>
                    )}

                    {sampleUrl && !isRecording && (
                      <div className="space-y-3 relative z-10">
                        <WaveformViz active={false} />
                        <audio src={sampleUrl} controls className="w-full h-8 opacity-50" />
                        <button
                          onClick={() => { setSampleUrl(null); setAudioName(null); setProfileId(null); setAudioUrl(null); }}
                          className="flex flex-row items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-[#A1A1AA]/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={10} /> Delete
                        </button>
                      </div>
                    )}

                    <div className="relative z-10 flex flex-wrap gap-4">
                      {!isRecording && !sampleUrl && (
                        <>
                          <GhostButton onClick={startRecording} icon={<Play size={11} fill="currentColor"/>} label="Record" />
                          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" className="hidden" />
                          <GhostButton onClick={() => fileInputRef.current?.click()} icon={<Download size={11}/>} label="Upload" />
                        </>
                      )}
                      {isRecording && (
                        <PrimaryButton onClick={stopRecording} icon={<Square size={11} fill="currentColor"/>} label="Stop" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-8 space-y-8" style={{ background: '#111113', border: '1px solid #2A2A2E' }}>
                <div className="space-y-3">
                  <label className="text-[10px] tracking-[0.3em] uppercase text-[#A1A1AA]/50 font-semibold block">Language</label>
                  <div className="relative">
                    <select
                      value={language}
                      onChange={e => setLanguage(e.target.value)}
                      className="w-full appearance-none bg-[rgba(255,255,255,0.02)] text-white text-sm p-4 rounded-xl border border-[#2A2A2E] focus:outline-none focus:border-[#FF6A00]/40 transition-colors cursor-pointer"
                    >
                      {LANG_OPTIONS.map(l => <option key={l.code} value={l.code} className="bg-[#0B0B0D]">{l.name}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA]/50 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] tracking-[0.3em] uppercase text-[#A1A1AA]/50 font-semibold block">Speaker</label>
                  <div className="grid grid-cols-2 gap-4">
                    {DEFAULT_VOICES.map(v => {
                      const isSelected = ttsSpeaker === v.id;
                      const isPlaying = activePreview === v.id;
                      const isUploading = uploadingVoiceId === v.id;
                      
                      return (
                        <div
                          key={v.id}
                          onClick={() => setTtsSpeaker(v.id)}
                          className={`relative flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                            isSelected
                              ? 'bg-[rgba(255,106,0,0.05)] border-[#FF6A00] shadow-[0_0_15px_rgba(255,106,0,0.2)]'
                              : 'bg-[rgba(255,255,255,0.02)] border-[#2A2A2E] hover:border-[#A1A1AA]/40'
                          }`}
                        >
                          <span className="text-sm font-medium">{v.label}</span>
                          <div className="flex items-center">
                            {isUploading ? (
                              <LoaderCircle size={14} className="animate-spin text-[#FF6A00]" />
                            ) : (
                              <button
                                onClick={(e) => togglePreview(v.id, v.file, e)}
                                className={`p-2 rounded-full transition-colors ${
                                  isPlaying ? 'bg-[#FF6A00] text-white hover:bg-[#C84A00]' : 'bg-[#2A2A2E] text-[#A1A1AA] hover:text-white'
                                }`}
                              >
                                {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            
            <div className="rounded-2xl p-8" style={{ background: '#111113', border: '1px solid #2A2A2E' }}>
              <div className="space-y-4">
                {mode === 'clone' && !profileId && (
                  <p className="text-[10px] tracking-[0.25em] uppercase text-[#A1A1AA]/30 text-center mb-4">Select or create a voice profile</p>
                )}
                <motion.button
                  whileHover={canGen ? { scale: 1.01 } : {}}
                  whileTap={canGen ? { scale: 0.98 } : {}}
                  disabled={!canGen}
                  onClick={handleGenerate}
                  className="w-full flex items-center justify-center gap-3 px-8 py-5 text-[11px] uppercase tracking-[0.45em] font-bold rounded-xl transition-all"
                  style={{
                    background: canGen ? 'linear-gradient(135deg, #FF6A00, #C84A00)' : 'rgba(255,255,255,0.05)',
                    color: canGen ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
                    cursor: canGen ? 'pointer' : 'not-allowed',
                    boxShadow: canGen ? '0 0 50px rgba(255,106,0,0.25), 0 0 100px rgba(255,106,0,0.08)' : 'none',
                  }}
                >
                  <Cpu size={14} strokeWidth={2} />
                  Generate
                </motion.button>

                <AnimatePresence>
                  {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-3 text-[10px] tracking-[0.35em] uppercase text-[#FF6A00] pt-4">
                      <LoaderCircle size={13} className="animate-spin" /> Synthesising...
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <div className="bg-red-500/8 border border-red-400/20 rounded-xl p-4 text-red-300 text-[10px] tracking-[0.25em] uppercase text-center mt-4">{error}</div>
                )}

                {audioUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-5 space-y-4 mt-6"
                    style={{ background: 'rgba(255,106,0,0.03)', border: '1px solid rgba(255,106,0,0.15)' }}
                  >
                    <div className="text-[10px] tracking-[0.4em] uppercase text-[#FF6A00]/80 font-semibold flex justify-between items-center">
                      Output Ready
                      <button
                        onClick={() => downloadAudio(audioUrl, 'resona-output.wav')}
                        className="text-[#A1A1AA]/80 hover:text-white transition-colors"
                      >
                        <Download size={14}/>
                      </button>
                    </div>
                    <audio controls src={audioUrl} className="w-full h-8 opacity-60" />
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      
      <footer className="relative z-10 mt-8 px-8 md:px-16 py-8 flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderTop: '1px solid #2A2A2E' }}>
        <div className="flex flex-wrap gap-8">
          {DEVELOPERS.map((d, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#A1A1AA]/80 font-medium">{d.name}</span>
              <div className="flex gap-2 text-[#A1A1AA]/60">
                <a href={d.github} target="_blank" rel="noopener noreferrer" className="hover:text-[#FF6A00] transition-colors"><Github size={12}/></a>
                <a href={d.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-[#FF6A00] transition-colors"><Linkedin size={12}/></a>
                <a href={`mailto:${d.email}`} className="hover:text-[#FF6A00] transition-colors"><Mail size={12}/></a>
              </div>
            </div>
          ))}
        </div>
        <span className="text-[10px] tracking-[0.3em] uppercase text-[#A1A1AA]/20">© 2026 Resona AI</span>
      </footer>
    </div>
  );
}


function PrimaryButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full py-4 text-white text-[10px] uppercase tracking-[0.45em] font-bold flex items-center justify-center gap-3 rounded-full transition-all cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, #FF6A00, #C84A00)',
        boxShadow: '0 0 50px rgba(255,106,0,0.3), 0 0 100px rgba(255,106,0,0.1)',
      }}
    >
      {icon}{label}
    </motion.button>
  );
}

function GhostButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full py-4 bg-transparent text-[#A1A1AA]/60 hover:text-white text-[10px] uppercase tracking-[0.45em] font-medium flex items-center justify-center gap-3 rounded-full transition-all cursor-pointer"
      style={{
        border: '1px solid #2A2A2E',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,106,0,0.3)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(255,106,0,0.08)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#2A2A2E';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {icon}{label}
    </motion.button>
  );
}


export default function App() {
  const [page, setPage] = useState<'home' | 'workspace'>('home');

  return (
    <AnimatePresence mode="wait">
      {page === 'home' ? (
        <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
          <LandingPage onEnter={() => setPage('workspace')} />
        </motion.div>
      ) : (
        <motion.div key="workspace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
          <WorkspacePage onBack={() => setPage('home')} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}