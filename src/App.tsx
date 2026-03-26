/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { Search, ArrowRight, Menu, X, Globe, Layers, Cpu, Users, Gamepad2, Mic2, Activity, Github, Twitter, Linkedin, Mail, Play, Square, Trash2, CheckCircle2, Music } from 'lucide-react';

// --- Types ---

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
}

const PROJECTS: Project[] = [
  {
    id: '1',
    title: 'AI Voice Cloner',
    description: 'Transform your voice into a high-fidelity digital asset. Authentic and personal.',
    category: 'AI Platform',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1920'
  },
  {
    id: '2',
    title: 'Voice Tuning Engine',
    description: 'Advanced frequency modulation for real-time vocal adjustment and emotional tone mapping.',
    category: 'Audio Engineering',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=1920'
  }
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

// --- Components ---

export default function App() {
  const [activeProject, setActiveProject] = useState(PROJECTS[0]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState<{ id: number, x: number, y: number, icon: string }[]>([]);
  const trailIdRef = useRef(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [view, setView] = useState<'home' | 'cloning'>('home');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mouse tracking for 3D tilt
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const parallaxX = useTransform(mouseXSpring, [-0.5, 0.5], [20, -20]);
  const parallaxY = useTransform(mouseYSpring, [-0.5, 0.5], [20, -20]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const xPct = (e.clientX / innerWidth) - 0.5;
      const yPct = (e.clientY / innerHeight) - 0.5;
      x.set(xPct);
      y.set(yPct);
      setMousePos({ x: e.clientX, y: e.clientY });

      // Add trail element
      const icons = ['♪', '♫', '♬', '♩'];
      const newNote = {
        id: trailIdRef.current++,
        x: e.clientX + 10,
        y: e.clientY + 10,
        icon: icons[Math.floor(Math.random() * icons.length)]
      };
      setTrail(prev => [...prev.slice(-15), newNote]);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [x, y]);

  return (
    <>
      {/* Music Trail */}
      <AnimatePresence>
        {trail.map((note) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0.8, scale: 0.5, x: note.x, y: note.y }}
            animate={{ opacity: 0, scale: 1.5, y: note.y - 50, x: note.x + (Math.random() * 40 - 20) }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="fixed pointer-events-none z-[99] text-emerald-500/40 font-serif text-xl"
          >
            {note.icon}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Custom Musical Cursor */}
      <motion.div 
        className="fixed pointer-events-none z-[100] text-emerald-400 mix-blend-screen hidden md:block"
        animate={{ x: mousePos.x + 10, y: mousePos.y + 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 250, mass: 0.5 }}
      >
        <Music size={24} strokeWidth={2.5} />
      </motion.div>

      {view === 'cloning' ? (
        <VoiceCloningPage onBack={() => setView('home')} />
      ) : (
        <div className="relative min-h-screen flex flex-col justify-between px-0 pt-4 pb-0 overflow-x-hidden">
          <div className="px-6 md:px-16">
            <div className="cinematic-bg" />
            <div className="grain-overlay" />
            
            {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8 z-40">
        <div className="flex justify-between items-center w-full md:w-auto gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg md:text-xl font-medium tracking-[0.4em] uppercase"
          >
            Resona AI
          </motion.div>
          
          <button 
            className="md:hidden p-2 text-white/60"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        <div className="hidden md:flex items-center gap-12">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/60 hover:text-white"
          >
            <Menu size={20} />
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="md:hidden flex flex-col gap-4 w-full items-center overflow-hidden pt-4 pb-8 border-b border-white/5"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full text-center py-2 text-white/40 text-[10px] uppercase tracking-[0.3em]"
              >
                Menu Content Coming Soon
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center z-10 pt-8 md:pt-4 pb-12">
        {/* Project Card - Expanded */}
        <div className="w-full max-w-6xl md:perspective-[2000px]">
          <motion.div
            style={{ rotateX: window.innerWidth > 768 ? rotateX : 0, rotateY: window.innerWidth > 768 ? rotateY : 0 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
            className="glass-panel relative aspect-[4/5] md:aspect-[16/9] w-full overflow-hidden group md:cursor-none"
          >
            {/* Project Image with parallax effect */}
            <motion.img 
              src={activeProject.image}
              alt={activeProject.title}
              initial={isMobile ? { filter: 'grayscale(100%) contrast(125%)', opacity: 0.6 } : false}
              animate={isMobile ? { filter: 'grayscale(0%) contrast(100%)', opacity: 1 } : {}}
              transition={{ duration: 5, delay: 1, ease: [0.22, 1, 0.36, 1] }}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${!isMobile ? 'opacity-60 grayscale contrast-125 group-hover:grayscale-0 group-hover:contrast-100' : ''}`}
              style={{
                x: window.innerWidth > 768 ? parallaxX : 0,
                y: window.innerWidth > 768 ? parallaxY : 0,
                scale: 1.1
              }}
            />

            {/* Content Overlay */}
            <div className="absolute inset-0 p-6 md:p-16 flex flex-col justify-end bg-gradient-to-t from-[#08090a]/90 via-[#08090a]/40 to-transparent">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={activeProject.id}
                transition={{ delay: 0.5, duration: 1 }}
                className="space-y-4 md:space-y-6"
              >
                <div className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-emerald-500/80 font-medium">
                  {activeProject.category}
                </div>
                <h2 className="text-4xl md:text-8xl font-light tracking-tight leading-[0.9]">
                  {activeProject.title}
                </h2>
                <p className="text-xs md:text-lg text-white/60 max-w-2xl leading-relaxed font-light">
                  {activeProject.description}
                </p>
                <div className="pt-4 flex items-center gap-6">
                  {activeProject.id === '1' && (
                    <motion.button 
                      whileHover={{ scale: 1.02, backgroundColor: '#34d399' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setView('cloning')}
                      className="w-full md:w-auto px-10 py-5 bg-emerald-500 text-black text-[11px] font-mono font-bold uppercase tracking-[0.4em] transition-all flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.2)] hover:shadow-[0_0_60px_rgba(16,185,129,0.4)]"
                    >
                      Start Cloning
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Physical Depth Accents */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10" />
            <div className="absolute top-0 left-0 w-[1px] h-full bg-white/10" />
          </motion.div>
        </div>
      </main>
      </div>

      {/* Footer */}
      <footer className="mt-24 p-8 md:p-16 bg-white/[0.03] backdrop-blur-xl border-t border-white/10 z-40 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <div className="text-2xl font-bold tracking-[0.4em] uppercase text-white">
                Resona AI
              </div>
              <p className="text-sm text-white/60 max-w-sm leading-relaxed font-bold">
                The next generation of vocal synthesis. We transform human voice into a digital asset, 
                enabling seamless frequency tuning and authentic cloning for the modern creator.
              </p>
              <div className="flex gap-6 pt-4">
                <FooterSocialIcon icon={<Twitter size={20} />} />
                <FooterSocialIcon icon={<Github size={20} />} />
                <FooterSocialIcon icon={<Linkedin size={20} />} />
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[11px] uppercase tracking-[0.3em] text-emerald-500 font-bold">Technology</h4>
              <ul className="space-y-4 text-xs tracking-[0.2em] text-white/50 font-bold">
                <li className="hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                  <Mic2 size={14} strokeWidth={2.5} /> Voice Cloning
                </li>
                <li className="hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                  <Activity size={14} strokeWidth={2.5} /> Frequency Tuning
                </li>
                <li className="hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                  <Cpu size={14} strokeWidth={2.5} /> Neural Synthesis
                </li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-[11px] uppercase tracking-[0.3em] text-emerald-500 font-bold">Contact</h4>
              <ul className="space-y-4 text-xs tracking-[0.2em] text-white/50 font-bold">
                <li className="hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                  <Mail size={14} strokeWidth={2.5} /> alkaifgajdhar@gmail.com
                </li>
                <li className="hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                  <Mail size={14} strokeWidth={2.5} /> dummy@resona.ai
                </li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-[11px] uppercase tracking-[0.3em] text-emerald-500 font-bold">Developers</h4>
              <div className="space-y-8">
                {DEVELOPERS.map((dev, index) => (
                  <div key={index} className="space-y-3">
                    <div className="text-[10px] text-white font-bold tracking-widest uppercase">{dev.name}</div>
                    <div className="flex gap-4 text-white/40">
                      <a href={dev.github} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                        <Github size={16} />
                      </a>
                      <a href={dev.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                        <Linkedin size={16} />
                      </a>
                      <a href={`mailto:${dev.email}`} className="hover:text-emerald-400 transition-colors">
                        <Mail size={16} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-12 border-t border-white/10">
            <div className="flex gap-12 text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">
              <div>© 2026 Resona AI</div>
              <div className="hover:text-white transition-colors cursor-pointer">Privacy Policy</div>
              <div className="hover:text-white transition-colors cursor-pointer">Terms of Service</div>
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold">
              Designed for the future of sound
            </div>
          </div>
        </div>
      </footer>

      {/* Ambient Particles (Simple Canvas) */}
      <ParticleBackground />
    </div>
  )}
</>
);
}

// --- Sub-components ---

function VoiceCloningPage({ onBack }: { onBack: () => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioName('Recorded Sample');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setAudioUrl(null);
      setAudioName(null);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required for recording.");
    }
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
    if (file) {
      if (file.type.startsWith('audio/')) {
        const url = URL.createObjectURL(file);
        setAudioUrl(url);
        setAudioName(file.name);
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        alert("Please upload a valid audio file.");
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#08090a] text-white p-6 md:p-16 flex flex-col relative overflow-hidden">
      <div className="cinematic-bg opacity-30" />
      <div className="grain-overlay" />
      
      <header className="flex justify-between items-center mb-12 md:mb-16 z-10">
        <motion.button 
          whileHover={{ x: -5, color: '#fff' }}
          onClick={onBack} 
          className="text-white/40 transition-all flex items-center gap-3 text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-bold group"
        >
          <ArrowRight className="rotate-180 transition-transform" size={12} /> Back
        </motion.button>
        <div className="text-lg md:text-xl font-medium tracking-[0.4em] uppercase">Resona AI</div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full space-y-12 md:space-y-16 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 md:space-y-6"
        >
          <div className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-emerald-500 font-bold">Workspace / Voice Synthesis</div>
          <h1 className="text-4xl md:text-8xl font-light tracking-tighter leading-none">Voice Cloning</h1>
          <p className="text-white/40 text-sm md:text-lg font-light max-w-2xl leading-relaxed">
            Synthesize your unique vocal signature into a high-fidelity digital asset.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`glass-panel p-6 md:p-10 space-y-6 md:space-y-8 border transition-all group relative overflow-hidden ${isRecording ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/5 hover:border-emerald-500/30'}`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Mic2 size={60} className="md:w-[80px] md:h-[80px]" />
            </div>
            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border transition-all ${isRecording ? 'bg-emerald-500 text-black border-emerald-500 animate-pulse' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
              <Mic2 size={20} className="md:w-[24px] md:h-[24px]" />
            </div>
            
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-xl md:text-2xl font-light tracking-tight">
                {isRecording ? 'Recording...' : audioName ? audioName : 'Record Sample'}
              </h3>
              <p className="text-white/40 text-xs md:text-sm leading-relaxed font-light">
                {isRecording 
                  ? 'Capturing your vocal signature. Speak naturally for best results.' 
                  : audioUrl 
                    ? 'Your voice sample is ready for processing. You can preview it below.'
                    : 'Record a 30-second script to capture your unique vocal characteristics, emotional range, and cadence.'}
              </p>
            </div>

            {isRecording && (
              <div className="flex items-center gap-4 py-4">
                <div className="text-3xl font-mono tracking-widest text-emerald-500">
                  {formatTime(recordingTime)}
                </div>
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-emerald-500"
                    animate={{ width: ['0%', '100%'] }}
                    transition={{ duration: 30, ease: 'linear' }}
                  />
                </div>
              </div>
            )}

            {audioUrl && !isRecording && (
              <div className="space-y-4 py-4">
                <audio src={audioUrl} controls className="w-full h-10 filter invert opacity-60" />
                <div className="flex gap-4">
                  <motion.button 
                    whileHover={{ x: 5, color: '#f87171' }}
                    onClick={() => {
                      setAudioUrl(null);
                      setAudioName(null);
                    }}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-white/40 transition-colors"
                  >
                    <Trash2 size={12} /> Delete Sample
                  </motion.button>
                </div>
              </div>
            )}

            {!isRecording && !audioUrl && (
              <motion.button 
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.98 }}
                onClick={startRecording}
                className="w-full py-5 bg-white/5 text-[10px] uppercase tracking-[0.4em] font-bold transition-all border border-white/10 hover:border-white/20 flex items-center justify-center gap-3"
              >
                <Play size={12} fill="currentColor" />
                Start Recording
              </motion.button>
            )}

            {isRecording && (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={stopRecording}
                className="w-full py-5 bg-emerald-500 text-black text-[10px] uppercase tracking-[0.4em] font-bold transition-all border border-emerald-500 hover:bg-emerald-400 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
              >
                <Square size={12} fill="currentColor" /> Stop Recording
              </motion.button>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel p-6 md:p-10 space-y-6 md:space-y-8 border border-white/5 hover:border-emerald-500/30 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Globe size={60} className="md:w-[80px] md:h-[80px]" />
            </div>
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
              <Globe size={20} className="md:w-[24px] md:h-[24px]" />
            </div>
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-xl md:text-2xl font-light tracking-tight">Upload Audio</h3>
              <p className="text-white/40 text-xs md:text-sm leading-relaxed font-light">
                Already have a high-quality recording? Upload your .wav or .mp3 files directly to our engine.
              </p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*"
              className="hidden"
            />
            <motion.button 
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-5 bg-white/5 text-[10px] uppercase tracking-[0.4em] font-bold transition-all border border-white/10 hover:border-white/20 flex items-center justify-center gap-3"
            >
              <Globe size={12} />
              Choose Files
            </motion.button>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pt-12 md:pt-16 border-t border-white/5"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8 w-full md:w-auto">
              <div className="space-y-2 w-full sm:w-auto">
                <div className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold">Status</div>
                <div className="text-xs md:text-sm font-medium flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${audioUrl ? 'bg-emerald-500' : 'bg-white/20'} ${isRecording ? 'animate-pulse' : ''}`} /> 
                  <span className="tracking-widest uppercase text-[10px] md:text-[11px]">
                    {isRecording ? 'Recording in progress' : audioUrl ? 'Ready for synthesis' : 'Awaiting voice sample'}
                  </span>
                </div>
              </div>
              <div className="h-8 md:h-12 w-[1px] bg-white/5 hidden sm:block" />
              <div className="space-y-2 w-full sm:w-auto">
                <div className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold">Engine</div>
                <div className="text-xs md:text-sm font-medium tracking-widest uppercase text-[10px] md:text-[11px]">Resona v2.4 Pro</div>
              </div>
            </div>
            <motion.button 
              whileHover={audioUrl && !isRecording ? { scale: 1.02, backgroundColor: '#34d399' } : {}}
              whileTap={audioUrl && !isRecording ? { scale: 0.98 } : {}}
              disabled={!audioUrl || isRecording}
              className={`w-full md:w-auto px-12 py-5 text-black text-[11px] uppercase tracking-[0.4em] font-bold transition-all flex items-center justify-center gap-4 ${audioUrl && !isRecording ? 'bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.2)] hover:shadow-[0_0_60px_rgba(16,185,129,0.4)]' : 'bg-white/10 text-white/20 cursor-not-allowed'}`}
            >
              <Cpu size={16} strokeWidth={2.5} />
              {audioUrl ? 'Generate Clone' : 'Awaiting Sample'}
            </motion.button>
          </div>
        </motion.div>
      </main>

      <footer className="mt-24 py-12 border-t border-white/5 z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] uppercase tracking-[0.4em] text-white/20 font-bold">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">
            <div>© 2026 Resona AI</div>
            <div className="flex gap-8">
              {DEVELOPERS.map((dev, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <span className="text-white/40">{dev.name}</span>
                  <div className="flex gap-3">
                    <a href={dev.github} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                      <Github size={12} />
                    </a>
                    <a href={dev.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                      <Linkedin size={12} />
                    </a>
                    <a href={`mailto:${dev.email}`} className="hover:text-emerald-400 transition-colors">
                      <Mail size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-8">
            <span className="hover:text-white/40 cursor-pointer transition-colors">Security</span>
            <span className="hover:text-white/40 cursor-pointer transition-colors">Privacy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ label, active = false }: { label: string, active?: boolean }) {
  return (
    <div className={`text-xs uppercase tracking-[0.3em] cursor-pointer transition-all duration-500 py-3 md:py-0 ${active ? 'text-white' : 'text-white/30 hover:text-white/60'}`}>
      {label}
    </div>
  );
}

function FooterSocialIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <motion.div 
      whileHover={{ y: -5, color: '#10b981' }}
      className="text-white/20 cursor-pointer transition-colors p-2 -m-2"
    >
      {icon}
    </motion.div>
  );
}

function SideNavLink({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <motion.div 
      whileHover={{ x: 10 }}
      className="nav-link"
    >
      <span className="text-emerald-500/40">{icon}</span>
      {label}
    </motion.div>
  );
}

function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: { x: number, y: number, size: number, speedX: number, speedY: number, opacity: number }[] = [];
    const particleCount = 50;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5,
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 0.5) * 0.2,
          opacity: Math.random() * 0.5
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167, 243, 208, ${p.opacity})`;
        ctx.fill();
      });
      requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    createParticles();
    animate();

    return () => window.removeEventListener('resize', resize);
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 pointer-events-none opacity-40" />;
}
