/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Component, type ErrorInfo, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Target, 
  Zap, 
  Brain, 
  ChevronRight, 
  CheckCircle2, 
  Trophy, 
  Flame, 
  Users, 
  ArrowRight,
  Sparkles,
  BarChart3,
  Clock,
  MessageSquare,
  RefreshCw,
  Biohazard as Virus,
  LogOut,
  AlertTriangle,
  ExternalLink,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Globe,
  Gamepad2,
  TrendingUp,
  School,
  Info,
  Calendar,
  Plus,
  Trash2,
  Edit3
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { generateLearningPath, adaptContent, generateSchedule, generateStudyNotes, type LearningProfile, type LearningPath, type LearningStep, type DailySchedule, type StudyNotes } from './services/gemini';
import { cn } from './lib/utils';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  handleFirestoreError, 
  OperationType,
  type User
} from './firebase';

// --- Types ---
type AppState = 'landing' | 'onboarding' | 'dashboard' | 'learning' | 'completed' | 'profile';

interface CompletedPathway {
  id: string;
  name: string;
  date: string;
  year: string;
  topics: string[];
  studentName?: string;
}

interface UserStats {
  xp: number;
  rank: number;
  streak: number;
  completedSteps: string[];
  mutations: string[];
  dailyQuests: { label: string; xp: number; done: boolean }[];
  completedPathways?: CompletedPathway[];
  schedule?: DailySchedule;
  activityLog?: { [date: string]: number };
  skills?: string[];
  externalCourses?: { name: string; issuer: string; date: string }[];
}

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error) errorMessage = parsed.error;
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center p-8 text-center">
          <div className="p-8 bg-white border-8 border-black shadow-[24px_24px_0px_0px_rgba(239,68,68,1)] max-w-2xl">
            <AlertTriangle size={80} className="text-red-500 mx-auto mb-6" />
            <h1 className="text-5xl font-black uppercase italic mb-4">Neural Breach Detected</h1>
            <p className="text-xl font-bold mb-8 opacity-60">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-12 py-5 bg-black text-white font-black uppercase italic hover:bg-orange-500 transition-all"
            >
              Re-Initialize System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Components ---

const Landing = ({ onStart, isLoggedIn }: { onStart: () => void, isLoggedIn: boolean }) => (
  <div className="bg-[#050505] text-white overflow-x-hidden">
    {/* Hero / Login Section */}
    <section className="min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden relative border-b-4 border-black">
      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-orange-500/20"
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              scale: Math.random() * 2 + 0.5,
              rotate: Math.random() * 360
            }}
            animate={{ 
              y: [null, "-20px", "20px", "0px"],
              rotate: [null, 10, -10, 0],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ 
              duration: 5 + Math.random() * 5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <Virus size={40 + Math.random() * 80} />
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 text-center max-w-4xl"
      >
        <div className="flex justify-center mb-12">
          <motion.div 
            animate={{ rotate: [12, -12, 12], scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="p-6 bg-orange-500 rounded-[2rem] shadow-[0_0_50px_rgba(249,115,22,0.4)]"
          >
            <Virus size={80} className="text-black" />
          </motion.div>
        </div>
        
        <h1 className="text-[10vw] md:text-[14rem] font-black tracking-tighter leading-[0.8] uppercase mb-6 select-none">
          <span className="block">Plague</span>
        </h1>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-16">
          <p className="text-xl md:text-3xl font-mono text-orange-500 uppercase tracking-[0.4em] font-bold">
            Knowledge that spreads.
          </p>
          <div className="h-px w-12 bg-white/20 hidden md:block" />
          <p className="text-white/40 font-mono text-sm uppercase tracking-widest">
            AI-Driven Neural Infection
          </p>
        </div>

      </motion.div>

      {/* Atmospheric Glows */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-orange-600 rounded-full blur-[180px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600 rounded-full blur-[180px]" />
      </div>

      <div className="absolute bottom-8 left-8 flex items-center gap-4 opacity-30 font-mono text-[10px] uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>System Online</span>
        </div>
        <span>v2.4.0-STABLE</span>
      </div>
    </section>

    {/* App Description Section */}
    <section className="py-24 px-6 md:px-12 bg-[#0A0A0A] border-b-4 border-black">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <span className="font-mono text-orange-500 uppercase tracking-widest font-bold">Infection Protocol Alpha</span>
            <h2 className="text-5xl md:text-7xl font-black uppercase italic leading-none">Welcome to Smart Learning AI</h2>
            <p className="text-xl md:text-2xl text-white/60 leading-relaxed">
              We've engineered a radical approach to education using advanced cognitive AI. 
              Our system analyzes your neural patterns to deliver <span className="text-white">personalized learning</span> that evolves with you.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 bg-white/5 border-l-4 border-orange-500">
                <h4 className="font-black uppercase italic mb-2">Adaptive Difficulty</h4>
                <p className="text-sm text-white/40 italic leading-tight">Content that scales in complexity based on your absorption rate.</p>
              </div>
              <div className="p-6 bg-white/5 border-l-4 border-orange-500">
                <h4 className="font-black uppercase italic mb-2">Student Growth</h4>
                <p className="text-sm text-white/40 italic leading-tight">Quantifiable metrics for rapid cognitive expansion.</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-orange-500/10 border-4 border-white/10 flex items-center justify-center p-12">
              <motion.div
                animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
                transition={{ duration: 6, repeat: Infinity }}
              >
                <Brain size={200} className="text-orange-500 opacity-50" />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* About the App Section */}
    <section id="about" className="py-24 px-6 md:px-12 bg-[#050505] border-b-4 border-black">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-6">
          <h2 className="text-5xl md:text-7xl font-black uppercase italic leading-none">The Neural Nexus</h2>
          <div className="w-24 h-2 bg-orange-500 mx-auto" />
        </div>
        <div className="space-y-8 text-center">
          <p className="text-2xl md:text-3xl font-medium text-white/80 leading-relaxed">
            Plague isn't just an app; it's a cognitive accelerator. Built for <span className="text-orange-500 italic">students and forward-thinking schools</span>, 
            it bridges the gap between passive consumption and active neural integration.
          </p>
          <p className="text-xl text-white/50 leading-relaxed italic">
            The key idea is simple: Humans learn best when the path is tailored to their unique cognitive architecture. 
            We use AI to map that path in real-time.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
          <div className="p-8 border-4 border-white/10 bg-white/5 space-y-4">
            <School className="text-orange-500" size={40} />
            <h3 className="text-2xl font-black uppercase italic">For Schools</h3>
            <p className="text-white/40 italic">Equip your institution with AI-driven analytics and personal paths for every single student.</p>
          </div>
          <div className="p-8 border-4 border-white/10 bg-white/5 space-y-4">
            <Users className="text-orange-500" size={40} />
            <h3 className="text-2xl font-black uppercase italic">For Students</h3>
            <p className="text-white/40 italic">Take control of your learning. Break through plateaus with custom-tuned challenges.</p>
          </div>
        </div>
      </div>
    </section>

    {/* Features Section */}
    <section className="py-24 px-6 md:px-12 bg-[#0A0A0A] border-b-4 border-black">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-5xl md:text-7xl font-black uppercase italic mb-16 text-center">Mutation Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { 
              title: "Personalized Paths", 
              desc: "Dynamic curriculum adjusted to your specific learning velocity.", 
              icon: RefreshCw, color: "text-blue-500" 
            },
            { 
              title: "Real-time Tracking", 
              desc: "Deep-dive analytics into your neural integration progress.", 
              icon: BarChart3, color: "text-green-500" 
            },
            { 
              title: "AI Recommendations", 
              desc: "Smart suggestions for your next cognitive leap based on data.", 
              icon: Sparkles, color: "text-orange-500" 
            },
            { 
              title: "Multi-Language", 
              desc: "Global knowledge access through universal neural translation.", 
              icon: Globe, color: "text-purple-500" 
            },
            { 
              title: "Gamified Learning", 
              desc: "Dopamine-fueled progression systems and mutation ranks.", 
              icon: Gamepad2, color: "text-yellow-500" 
            },
            { 
              title: "Neural Synergy", 
              desc: "Connect with other minds to accelerate collective learning.", 
              icon: Users, color: "text-red-500" 
            },
          ].map((feature, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="p-8 bg-[#050505] border-4 border-black shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] space-y-6 group"
            >
              <div className={cn("p-4 border-2 border-black inline-block bg-black group-hover:scale-110 transition-transform", feature.color)}>
                <feature.icon size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase italic">{feature.title}</h3>
              <p className="text-white/40 italic leading-snug">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Secondary Login CTA */}
    <section className="py-24 bg-orange-500 border-b-4 border-black">
      <div className="max-w-4xl mx-auto text-center space-y-12">
        <h2 className="text-5xl md:text-7xl font-black uppercase italic leading-none text-black animate-pulse">Ready to begin?</h2>
        <motion.button 
          onClick={onStart}
          whileHover={{ scale: 1.05, backgroundColor: "#000", color: "#FFF" }}
          whileTap={{ scale: 0.95 }}
          className="px-16 py-8 bg-black text-white font-black text-2xl uppercase tracking-[0.2em] italic border-4 border-black shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all duration-300"
        >
          {isLoggedIn ? "Infect your mind" : "Login to Infect"}
          <ArrowRight className="inline-block ml-4" size={32} />
        </motion.button>
      </div>
    </section>

    {/* Contact Section */}
    <section id="contact" className="py-24 px-6 md:px-12 bg-[#050505] border-b-4 border-black">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
        <div className="space-y-8">
          <h2 className="text-6xl font-black uppercase italic leading-tight">Transmit Your Query</h2>
          <p className="text-xl text-white/40 font-bold italic">Our neural support unit is standing by to assist with your integration.</p>
          
          <div className="space-y-6 pt-8">
            <div className="flex items-center gap-6 group">
              <div className="p-4 bg-orange-500 text-black border-2 border-black group-hover:rotate-12 transition-transform">
                <Mail size={24} />
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest opacity-30">Direct Terminal</span>
                <span className="text-xl font-black italic">support@smartlearn.ai</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6 group">
              <div className="p-4 bg-orange-500 text-black border-2 border-black group-hover:rotate-12 transition-transform">
                <Phone size={24} />
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest opacity-30">Voice Link</span>
                <span className="text-xl font-black italic">+91 XXXXX XXXXX</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6 group">
              <div className="p-4 bg-orange-500 text-black border-2 border-black group-hover:rotate-12 transition-transform">
                <MapPin size={24} />
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest opacity-30">Nexus Location</span>
                <span className="text-xl font-black italic">Coimbatore, India</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-10 border-4 border-black bg-[#0A0A0A] shadow-[16px_16px_0px_0px_rgba(249,115,22,1)]">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase italic text-orange-500">Mind Identification</label>
              <input type="text" placeholder="Your Name" className="w-full bg-black border-2 border-white/10 p-4 font-bold focus:border-orange-500 outline-none transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase italic text-orange-500">Transmission Frequency</label>
              <input type="email" placeholder="Your Email" className="w-full bg-black border-2 border-white/10 p-4 font-bold focus:border-orange-500 outline-none transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase italic text-orange-500">The Message</label>
              <textarea placeholder="Describe your query..." className="w-full h-32 bg-black border-2 border-white/10 p-4 font-bold focus:border-orange-500 outline-none transition-colors resize-none" />
            </div>
            <button className="w-full py-6 bg-white text-black font-black uppercase italic text-xl shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">Send Transmission</button>
          </form>
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer className="py-12 px-6 bg-black border-t-4 border-black">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-orange-500 border-2 border-black rotate-12">
            <Virus size={24} className="text-black" />
          </div>
          <span className="text-2xl font-black uppercase italic tracking-tighter">Plague AI</span>
        </div>
        
        <div className="flex gap-8 font-mono text-[10px] uppercase font-black tracking-widest">
          <a href="#about" className="hover:text-orange-500 transition-colors">About</a>
          <a href="#contact" className="hover:text-orange-500 transition-colors">Contact</a>
          <a href="#" className="hover:text-orange-500 transition-colors">Privacy Policy</a>
        </div>
        
        <div className="font-mono text-[10px] uppercase opacity-30 font-black tracking-widest text-center md:text-right">
          © 2026 Smart Learning AI. All rights reserved.<br/>
          Neural Architecture V2.4.0
        </div>
      </div>
    </footer>
  </div>
);

const Onboarding = ({ onComplete }: { onComplete: (profile: LearningProfile) => void }) => {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<LearningProfile>({
    name: '',
    learningStyle: 'visual',
    goals: '',
    level: 'beginner',
    subject: ''
  });

  const steps = [
    {
      title: "Identify Subject",
      field: "name",
      placeholder: "Enter your name...",
      type: "text",
      label: "Subject Name"
    },
    {
      title: "Target Domain",
      field: "subject",
      placeholder: "e.g., Quantum Physics, Python, History...",
      type: "text",
      label: "Knowledge Domain"
    },
    {
      title: "Neural Preference",
      field: "learningStyle",
      options: [
        { id: 'visual', label: 'Visual', desc: 'Neural mapping via imagery & spatial data', icon: <Sparkles /> },
        { id: 'auditory', label: 'Auditory', desc: 'Frequency-based learning & sonic patterns', icon: <MessageSquare /> },
        { id: 'reading', label: 'Reading', desc: 'Symbolic decoding & textual synthesis', icon: <BookOpen /> },
        { id: 'kinesthetic', label: 'Kinesthetic', desc: 'Tactile execution & physical feedback', icon: <Zap /> },
      ]
    },
    {
      title: "Infection Level",
      field: "level",
      options: [
        { id: 'beginner', label: 'Dormant', desc: 'Initial exposure, no prior data' },
        { id: 'intermediate', label: 'Active', desc: 'Significant neural integration' },
        { id: 'advanced', label: 'Critical', desc: 'High-level mastery & synthesis' },
      ]
    },
    {
      title: "Final Objective",
      field: "goals",
      placeholder: "What is the ultimate outcome of this infection?",
      type: "textarea",
      label: "Strategic Goal"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(profile);
    }
  };

  const current = steps[step];

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#0A0A0A] p-8 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Scan Line Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="scan-line" />
      </div>

      <div className="w-full max-w-3xl relative z-10">
        <div className="mb-16 flex justify-between items-end">
          <div className="font-mono text-[10px] uppercase font-black tracking-[0.2em] bg-black text-white px-2 py-1">
            Diagnostic Phase 0{step + 1}
          </div>
          <div className="flex-1 mx-8 h-1 bg-black/5 relative overflow-hidden">
            <motion.div 
              className="absolute inset-y-0 left-0 bg-orange-500" 
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
              transition={{ type: "spring", stiffness: 50 }}
            />
          </div>
          <div className="font-mono text-[10px] uppercase font-black opacity-30">
            {Math.round(((step + 1) / steps.length) * 100)}%
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-12"
          >
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase text-orange-500 font-bold tracking-widest">
                {current.label || "System Query"}
              </span>
              <h2 className="text-7xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.85] text-black">
                {current.title}
              </h2>
            </div>

            {current.type === 'text' && (
              <div className="relative">
                <input 
                  type="text"
                  value={(profile as any)[current.field]}
                  onChange={(e) => setProfile({ ...profile, [current.field]: e.target.value })}
                  placeholder={current.placeholder}
                  className="w-full bg-transparent border-b-8 border-black p-6 text-4xl md:text-6xl font-black uppercase italic focus:outline-none focus:border-orange-500 transition-colors placeholder:opacity-10"
                  autoFocus
                />
                <div className="absolute bottom-0 left-0 w-full h-2 bg-orange-500/20 -z-10" />
              </div>
            )}

            {current.type === 'textarea' && (
              <div className="relative">
                <textarea 
                  value={(profile as any)[current.field]}
                  onChange={(e) => setProfile({ ...profile, [current.field]: e.target.value })}
                  placeholder={current.placeholder}
                  className="w-full bg-white border-4 border-black p-8 text-2xl font-bold focus:outline-none focus:border-orange-500 transition-colors h-64 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
                  autoFocus
                />
              </div>
            )}

            {current.options && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {current.options.map((opt) => (
                  <motion.button
                    key={opt.id}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setProfile({ ...profile, [current.field]: opt.id });
                      setTimeout(handleNext, 400);
                    }}
                    className={cn(
                      "p-8 border-4 border-black text-left transition-all relative group overflow-hidden",
                      (profile as any)[current.field] === opt.id 
                        ? "bg-black text-white shadow-none translate-x-1 translate-y-1" 
                        : "bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                    )}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl font-black uppercase italic leading-none">{opt.label}</span>
                      <div className={cn(
                        "transition-transform group-hover:rotate-12",
                        (profile as any)[current.field] === opt.id ? "text-orange-500" : "text-black/20"
                      )}>
                        {(opt as any).icon || <ChevronRight />}
                      </div>
                    </div>
                    <p className="text-sm font-bold opacity-60 leading-tight">{opt.desc}</p>
                    
                    {/* Active Indicator */}
                    {(profile as any)[current.field] === opt.id && (
                      <motion.div 
                        layoutId="active-opt"
                        className="absolute top-0 right-0 w-12 h-12 bg-orange-500 flex items-center justify-center"
                      >
                        <CheckCircle2 size={24} className="text-black" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}

            {current.type && (
              <div className="flex justify-end">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  disabled={!(profile as any)[current.field]}
                  className="px-16 py-6 bg-black text-white font-black uppercase italic text-xl tracking-widest hover:bg-orange-500 transition-colors disabled:opacity-20 shadow-[8px_8px_0px_0px_rgba(249,115,22,1)]"
                >
                  Confirm Data
                </motion.button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const Dashboard = ({ 
  profile, 
  path, 
  stats,
  onStartLearning,
  onNewInfection,
  onGenerateSchedule,
  onViewArchived,
  onViewProfile,
  onLogout
}: { 
  profile: LearningProfile, 
  path: LearningPath | null, 
  stats: UserStats,
  onStartLearning: (stepIdx?: number) => void,
  onNewInfection: () => void,
  onGenerateSchedule: () => void,
  onViewArchived: (pathway: CompletedPathway) => void,
  onViewProfile: () => void,
  onLogout: () => void
}) => {
  const integrationProgress = path ? Math.round((stats.completedSteps.length / path.steps.length) * 100) : 0;
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#0A0A0A] selection:bg-orange-500 selection:text-white pb-24">
      {/* Header */}
      <header className="border-b-4 border-black p-6 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="p-2 bg-orange-500 border-2 border-black"
          >
            <Virus size={24} className="text-black" />
          </motion.div>
          <span className="text-3xl font-black uppercase tracking-tighter italic leading-none">Plague</span>
        </div>
        
        <div className="hidden md:flex items-center gap-12 font-mono text-[10px] uppercase font-black tracking-widest">
          <div className="flex flex-col items-end">
            <span className="opacity-30">Neural Sync</span>
            <span className="text-orange-500">Active</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="opacity-30">Infection Rate</span>
            <span>0.85/hr</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={onNewInfection}
            className="hidden md:flex items-center gap-3 px-6 py-3 bg-black text-white border-2 border-black font-black uppercase italic text-xs hover:bg-orange-500 hover:text-black transition-all"
          >
            <Sparkles size={16} /> New Infection
          </button>
          <div className="flex items-center gap-4 px-4 py-2 bg-black text-white border-2 border-black">
            <Flame size={18} className="text-orange-500" />
            <span className="font-black italic">{stats.streak} DAYS</span>
          </div>
          <button 
            onClick={onLogout}
            className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
          <button 
            onClick={onViewProfile}
            className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center text-2xl font-black italic hover:bg-orange-500 transition-colors cursor-pointer"
            title="Profile"
          >
            {profile.name[0]}
          </button>
        </div>
      </header>

      <main className="p-8 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Profile & Stats (4 cols) */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-4 space-y-8"
        >
          <motion.section 
            whileHover={{ y: -4 }}
            className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 -rotate-12 translate-x-8 -translate-y-8 group-hover:bg-orange-500/10 transition-colors" />
            
            <div className="flex items-center gap-6 mb-8 relative">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-24 h-24 bg-orange-500 border-4 border-black flex items-center justify-center text-6xl font-black italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                {profile.name[0]}
              </motion.div>
              <div>
                <h2 className="text-4xl font-black uppercase italic leading-none mb-2">{profile.name}</h2>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-black text-white text-[10px] font-black uppercase tracking-widest">{profile.level}</span>
                  <span className="text-xs font-bold opacity-40 italic">
                    {path ? `Infecting ${profile.subject}` : "Neural State: Dormant"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="opacity-40">Neural Integration</span>
                  <span className="text-orange-500">{integrationProgress}%</span>
                </div>
                <div className="h-6 border-4 border-black p-1 bg-white">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${integrationProgress}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className="h-full bg-orange-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-black text-white border-2 border-black">
                  <div className="text-[10px] uppercase opacity-40 mb-1">Total XP</div>
                  <motion.div 
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-black italic"
                  >
                    {stats.xp.toLocaleString()}
                  </motion.div>
                </div>
                <div className="p-4 bg-white border-2 border-black">
                  <div className="text-[10px] uppercase opacity-40 mb-1">Rank</div>
                  <div className="text-2xl font-black italic">#{stats.rank}</div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section 
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            className="bg-black text-white p-8 shadow-[12px_12px_0px_0px_rgba(249,115,22,1)]"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black uppercase italic text-orange-500">Daily Mutations</h3>
              <Zap size={20} className="text-orange-500 animate-pulse" />
            </div>
            <div className="space-y-6">
              {stats.dailyQuests.map((q, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-6 h-6 border-2 flex items-center justify-center transition-colors",
                      q.done ? "bg-orange-500 border-orange-500" : "border-white/20 group-hover:border-orange-500"
                    )}>
                      {q.done && <CheckCircle2 size={14} className="text-black" />}
                    </div>
                    <span className={cn("text-lg font-black uppercase italic transition-all", q.done ? "line-through opacity-30" : "group-hover:text-orange-500")}>
                      {q.label}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-orange-500 font-bold">+{q.xp}</span>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Neural Scheduler */}
          <motion.section 
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black uppercase italic">Neural Scheduler</h3>
              <Clock size={20} className="text-orange-500" />
            </div>
            
            {stats.schedule ? (
              <div className="space-y-4">
                <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-4">Optimized for {stats.schedule.day}</p>
                <div className="space-y-3">
                  {stats.schedule.items.map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -5 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-4 items-start border-l-2 border-black pl-4 py-1"
                    >
                      <span className="font-mono text-[10px] font-black w-16">{item.time}</span>
                      <div className="flex-1">
                        <p className="text-xs font-black uppercase italic leading-tight">{item.activity}</p>
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5",
                          item.type === 'learning' ? "bg-orange-500 text-black" : 
                          item.type === 'focus' ? "bg-black text-white" : "bg-gray-200 text-gray-600"
                        )}>
                          {item.type}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <button 
                  onClick={async () => {
                    setIsGeneratingSchedule(true);
                    await onGenerateSchedule();
                    setIsGeneratingSchedule(false);
                  }}
                  disabled={isGeneratingSchedule}
                  className="w-full mt-6 py-3 border-2 border-black font-black uppercase italic text-xs hover:bg-black hover:text-white transition-all disabled:opacity-20"
                >
                  {isGeneratingSchedule ? 'Optimizing...' : 'Re-Optimize Day'}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm font-bold opacity-40 mb-6 leading-tight italic">No optimized schedule detected. Let the AI agent structure your day for maximum neural integration.</p>
                <button 
                  onClick={async () => {
                    setIsGeneratingSchedule(true);
                    await onGenerateSchedule();
                    setIsGeneratingSchedule(false);
                  }}
                  disabled={isGeneratingSchedule}
                  className="w-full py-4 bg-black text-white font-black uppercase italic tracking-widest hover:bg-orange-500 hover:text-black transition-all disabled:opacity-20"
                >
                  {isGeneratingSchedule ? 'Optimizing...' : 'Generate Neural Schedule'}
                </button>
              </div>
            )}
          </motion.section>
        </motion.div>

        {/* Right Column: Learning Path & Bento (8 cols) */}
        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-8 space-y-8"
        >
          {path ? (
            <section className="bg-white border-4 border-black p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-orange-500" />
              
              <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                <div className="space-y-2">
                  <span className="font-mono text-xs uppercase text-orange-500 font-black tracking-widest">
                    Active Neural Pathway
                  </span>
                  <h2 className="text-7xl font-black uppercase italic tracking-tighter leading-none">
                    {profile.subject}
                  </h2>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05, x: 4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onStartLearning()}
                  className="px-12 py-6 bg-orange-500 text-black font-black uppercase italic text-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
                >
                  Resume Infection
                </motion.button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {path.steps.map((step, i) => {
                  const isCompleted = stats.completedSteps.includes(step.title);
                  return (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => onStartLearning(i)}
                      className={cn(
                        "group flex items-center gap-8 p-8 border-4 border-black transition-all cursor-pointer relative overflow-hidden",
                        isCompleted ? "bg-green-50 border-green-500" : (i === stats.completedSteps.length ? "bg-orange-50 border-orange-500" : "bg-white hover:bg-black hover:text-white")
                      )}
                    >
                      <div className="text-6xl font-black italic opacity-10 group-hover:opacity-100 transition-opacity">0{i + 1}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="text-2xl font-black uppercase italic leading-none">{step.title}</h4>
                          {isCompleted && <CheckCircle2 size={20} className="text-green-600" />}
                        </div>
                        <div className="flex flex-wrap gap-6 font-mono text-[10px] uppercase font-black tracking-widest opacity-40 group-hover:opacity-100">
                          <span className="flex items-center gap-2"><Clock size={12} /> {step.estimatedTime}</span>
                          <span className="flex items-center gap-2"><BarChart3 size={12} /> {step.difficulty}</span>
                          <span className="flex items-center gap-2"><Brain size={12} /> {step.method}</span>
                        </div>
                      </div>
                      <ChevronRight className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-2" size={32} />
                      
                      {i === stats.completedSteps.length && !isCompleted && (
                        <div className="absolute top-0 right-0 px-3 py-1 bg-orange-500 text-black text-[10px] font-black uppercase italic">
                          Next Up
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="bg-black text-white p-12 border-4 border-black shadow-[12px_12px_0px_0px_rgba(249,115,22,1)] flex flex-col items-center text-center space-y-8">
              <div className="w-24 h-24 bg-orange-500 border-4 border-black flex items-center justify-center text-black">
                <Sparkles size={48} />
              </div>
              <div className="space-y-4">
                <h2 className="text-6xl font-black uppercase italic tracking-tighter leading-none">Neural Evolution Stalled</h2>
                <p className="text-xl font-bold opacity-60 max-w-xl mx-auto italic">Previous infection successfully integrated. Your neural network is primed for the next mutation.</p>
              </div>
              <button 
                onClick={onNewInfection}
                className="px-16 py-8 bg-orange-500 text-black font-black uppercase italic text-3xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] hover:shadow-none transition-all"
              >
                Initialize New Infection
              </button>
            </section>
          )}

          {/* Completed Pathways */}
          {stats.completedPathways && stats.completedPathways.length > 0 && (
            <section className="bg-white border-4 border-black p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-4 mb-10">
                <CheckCircle2 size={40} className="text-green-500" />
                <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none">Neural Archive</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stats.completedPathways.map((cp, i) => (
                  <motion.div 
                    key={cp.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-6 border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{cp.date}, {cp.year}</span>
                        <Trophy size={16} className="text-orange-500" />
                      </div>
                      <h3 className="text-2xl font-black uppercase italic leading-none mb-4">{cp.name}</h3>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {cp.topics.slice(0, 3).map((t, j) => (
                          <span key={j} className="text-[8px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5">
                            {t}
                          </span>
                        ))}
                        {cp.topics.length > 3 && <span className="text-[8px] font-black uppercase tracking-widest opacity-40">+{cp.topics.length - 3} more</span>}
                      </div>
                    </div>
                    <button 
                      onClick={() => onViewArchived(cp)}
                      className="w-full py-3 border-2 border-black font-black uppercase italic text-xs hover:bg-black hover:text-white transition-all"
                    >
                      Review Data
                    </button>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Bento Grid Bottom */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 bg-blue-500 text-black p-8 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] group cursor-pointer">
              <div className="flex items-center justify-between mb-6">
                <Users size={48} className="group-hover:scale-110 transition-transform" />
                <span className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase italic">3 Active Peers</span>
              </div>
              <h3 className="text-4xl font-black uppercase italic leading-none mb-4">Peer Infection</h3>
              <p className="text-lg font-bold leading-tight mb-8 opacity-80">Sync your neural pathways with others studying {profile.subject} to accelerate integration.</p>
              <button className="w-full py-4 bg-black text-white font-black uppercase italic tracking-widest hover:bg-white hover:text-black transition-colors">Initialize Sync</button>
            </div>

            <div className="space-y-8">
              <div className="bg-white p-8 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-4 mb-6">
                  <Trophy size={32} className="text-yellow-500" />
                  <h3 className="text-2xl font-black uppercase italic">Rankings</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { name: 'Rahul S.', xp: '4,200', rank: 1 },
                    { name: 'Priya K.', xp: '3,850', rank: 2 },
                    { name: 'You', xp: stats.xp.toLocaleString(), rank: stats.rank },
                  ].map((r, i) => (
                    <div key={i} className={cn("flex items-center justify-between p-3 border-2", r.name === 'You' ? "border-orange-500 bg-orange-50" : "border-black")}>
                      <div className="flex items-center gap-3">
                        <span className="font-black italic">#{r.rank}</span>
                        <span className="text-sm font-bold uppercase">{r.name}</span>
                      </div>
                      <span className="font-mono text-xs font-black">{r.xp}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 border-4 border-black shadow-[12px_12px_0px_0px_rgba(168,85,247,1)]">
                <div className="flex items-center gap-4 mb-6">
                  <Sparkles size={32} className="text-purple-500" />
                  <h3 className="text-2xl font-black uppercase italic">Mutations</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stats.mutations.map((m, i) => (
                    <div key={i} className={cn("px-3 py-1 text-[8px] font-black uppercase italic border-2 border-black bg-orange-500")}>
                      {m}
                    </div>
                  ))}
                  <div className="px-3 py-1 text-[8px] font-black uppercase italic border-2 border-dashed border-black/20 opacity-30">
                    Locked
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

const StudyNotesView = ({ notes, onBack }: { notes: StudyNotes, onBack: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="fixed inset-0 bg-[#F5F5F0] z-[150] overflow-y-auto p-6 md:p-12"
  >
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <header className="flex justify-between items-center border-b-4 border-black pb-8">
        <div>
          <span className="font-mono text-xs uppercase text-orange-500 font-black tracking-widest">Neural Study Data</span>
          <h2 className="text-5xl md:text-7xl font-black uppercase italic leading-none">{notes.title}</h2>
        </div>
        <button 
          onClick={onBack}
          className="px-8 py-4 bg-black text-white font-black uppercase italic hover:bg-orange-500 hover:text-black transition-all border-4 border-black shadow-[8px_8px_0px_0px_rgba(249,115,22,1)]"
        >
          Close Notes
        </button>
      </header>

      <section className="space-y-6">
        <h3 className="text-3xl font-black uppercase italic border-l-8 border-orange-500 pl-4">Introduction</h3>
        <p className="text-xl font-medium leading-relaxed opacity-80">{notes.introduction}</p>
      </section>

      <section className="space-y-8">
        <h3 className="text-3xl font-black uppercase italic border-l-8 border-orange-500 pl-4">Key Concepts</h3>
        <div className="grid grid-cols-1 gap-6">
          {notes.keyConcepts.map((kc, i) => (
            <div key={i} className="p-8 bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <h4 className="text-2xl font-black uppercase italic text-orange-500">{kc.concept}</h4>
              <p className="text-lg font-bold opacity-70">{kc.explanation}</p>
              <div className="p-4 bg-orange-50 border-2 border-dashed border-orange-500">
                <span className="font-mono text-[10px] font-black uppercase text-orange-600 block mb-2">Practical Example</span>
                <p className="text-sm font-bold italic">{kc.example}</p>
              </div>
              {kc.exampleCode && (
                <div className="mt-4 p-4 bg-black text-white font-mono text-sm overflow-x-auto border-l-4 border-orange-500">
                  <span className="text-[10px] uppercase opacity-40 mb-2 block">Example Code</span>
                  <ReactMarkdown>{`\`\`\`\n${kc.exampleCode}\n\`\`\``}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-3xl font-black uppercase italic border-l-8 border-orange-500 pl-4">Detailed Breakdown</h3>
        <div className="prose prose-xl max-w-none font-medium leading-relaxed">
          <ReactMarkdown>{notes.detailedBreakdown}</ReactMarkdown>
        </div>
      </section>

      {notes.mainExampleCode && (
        <section className="space-y-6">
          <h3 className="text-3xl font-black uppercase italic border-l-8 border-orange-500 pl-4">Comprehensive Code Example</h3>
          <div className="p-6 bg-black text-white font-mono text-sm overflow-x-auto border-4 border-black shadow-[12px_12px_0px_0px_rgba(249,115,22,1)]">
            <ReactMarkdown>{`\`\`\`\n${notes.mainExampleCode}\n\`\`\``}</ReactMarkdown>
          </div>
        </section>
      )}

      <section className="p-8 bg-black text-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(249,115,22,1)]">
        <h3 className="text-3xl font-black uppercase italic text-orange-500 mb-4">Summary</h3>
        <p className="text-lg font-bold opacity-80">{notes.summary}</p>
      </section>

      <section className="space-y-6">
        <h3 className="text-3xl font-black uppercase italic border-l-8 border-orange-500 pl-4">Suggested Sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {notes.suggestedSources.map((source, i) => (
            <a 
              key={i}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 bg-white border-4 border-black hover:bg-orange-500 hover:text-black transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 group-hover:bg-white group-hover:text-black">{source.type}</span>
                <ExternalLink size={16} />
              </div>
              <h4 className="text-lg font-black uppercase italic leading-tight">{source.name}</h4>
            </a>
          ))}
        </div>
      </section>
    </div>
  </motion.div>
);

const LearningView = ({ 
  path, 
  stats,
  onBack,
  onCompleteStep,
  onFinish,
  initialStepIdx = 0
}: { 
  path: LearningPath, 
  stats: UserStats,
  onBack: () => void,
  onCompleteStep: (step: LearningStep) => void,
  onFinish: () => void,
  initialStepIdx?: number
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(initialStepIdx);
  const [isAdapting, setIsAdapting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showAdaptModal, setShowAdaptModal] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [studyNotesMap, setStudyNotesMap] = useState<Record<number, StudyNotes>>({});
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [showFullNotes, setShowFullNotes] = useState(false);

  const currentStep = path.steps[currentStepIdx];
  const currentNotes = studyNotesMap[currentStepIdx];
  const isCompleted = stats.completedSteps.includes(currentStep.title);

  useEffect(() => {
    if (!currentNotes && !isGeneratingNotes) {
      handleGenerateNotes();
    }
  }, [currentStepIdx]);

  const handleAdapt = async () => {
    setIsAdapting(true);
    try {
      const adapted = await adaptContent(currentStep, feedback);
      path.steps[currentStepIdx] = adapted;
      setShowAdaptModal(false);
      setFeedback('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdapting(false);
    }
  };

  const handleGenerateNotes = async () => {
    setIsGeneratingNotes(true);
    try {
      const notes = await generateStudyNotes(currentStep.title, stats.rank > 50 ? 'beginner' : 'advanced');
      setStudyNotesMap(prev => ({ ...prev, [currentStepIdx]: notes }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500 flex flex-col",
      focusMode ? "bg-black text-white/90" : "bg-white text-black"
    )}>
      <header className={cn(
        "border-b-4 border-black p-6 flex justify-between items-center sticky top-0 z-50 transition-colors",
        focusMode ? "bg-black border-white/10" : "bg-white"
      )}>
        <button 
          onClick={onBack} 
          className="flex items-center gap-3 font-black uppercase italic hover:text-orange-500 transition-colors group"
        >
          <ChevronRight className="rotate-180 group-hover:-translate-x-1 transition-transform" /> 
          <span className="hidden md:inline">Abort Session</span>
        </button>
        
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-4">
            <div className="font-mono text-[10px] uppercase font-black opacity-40">
              Neural Integration Progress
            </div>
            <div className="w-64 h-3 bg-black/5 border-2 border-black relative overflow-hidden">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-orange-500"
                initial={{ width: 0 }}
                animate={{ width: `${(stats.completedSteps.length / path.steps.length) * 100}%` }}
              />
            </div>
            <div className="font-mono text-[10px] uppercase font-black text-orange-500">
              {stats.completedSteps.length} / {path.steps.length}
            </div>
          </div>

          <button 
            onClick={() => setFocusMode(!focusMode)}
            className={cn(
              "px-4 py-2 border-2 border-black font-black uppercase italic text-[10px] tracking-widest transition-all",
              focusMode ? "bg-white text-black" : "bg-black text-white"
            )}
          >
            {focusMode ? 'Exit Focus' : 'Focus Mode'}
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 md:p-16 max-w-5xl mx-auto w-full relative">
        {/* Scan Line in Focus Mode */}
        {focusMode && (
          <div className="absolute inset-0 pointer-events-none opacity-5">
            <div className="scan-line" />
          </div>
        )}

        <motion.div
          key={currentStepIdx}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="space-y-12"
        >
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <span className="px-4 py-1 bg-orange-500 text-black font-black uppercase italic text-xs border-2 border-black">
                {currentStep.difficulty}
              </span>
              <span className={cn(
                "px-4 py-1 border-2 font-black uppercase italic text-xs",
                focusMode ? "border-white/20" : "border-black"
              )}>
                {currentStep.method}
              </span>
              <span className="font-mono text-[10px] uppercase opacity-40 font-black tracking-widest">
                Est. Time: {currentStep.estimatedTime}
              </span>
              {isCompleted && (
                <span className="px-4 py-1 bg-green-500 text-black font-black uppercase italic text-xs border-2 border-black">
                  Completed
                </span>
              )}
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.85]">
              {currentStep.title}
            </h1>
          </div>

          <div className={cn(
            "prose prose-2xl max-w-none font-medium leading-relaxed transition-colors",
            focusMode ? "prose-invert text-white/80" : "text-black/80"
          )}>
            <ReactMarkdown>{currentStep.content}</ReactMarkdown>
          </div>

          {isGeneratingNotes && !currentNotes && (
            <div className="py-12 flex flex-col items-center justify-center border-t-4 border-black/10">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-orange-500 mb-4"
              >
                <RefreshCw size={48} />
              </motion.div>
              <p className="font-mono text-xs uppercase font-black opacity-30 tracking-widest">Synthesizing Neural Study Data...</p>
            </div>
          )}

          {currentNotes && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12 pt-12 border-t-4 border-black/10"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black uppercase italic">Neural Study Notes</h2>
                <button 
                  onClick={() => setShowFullNotes(true)}
                  className="px-4 py-2 bg-black text-white text-[10px] font-black uppercase italic hover:bg-orange-500 transition-colors"
                >
                  Full Screen View
                </button>
              </div>

              <section className="space-y-6">
                <h3 className="text-2xl font-black uppercase italic text-orange-500">Introduction</h3>
                <p className="text-lg font-medium opacity-80">{currentNotes.introduction}</p>
              </section>

              <div className="grid grid-cols-1 gap-8">
                {currentNotes.keyConcepts.map((kc, i) => (
                  <div key={i} className="p-8 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
                    <h4 className="text-xl font-black uppercase italic text-orange-500">{kc.concept}</h4>
                    <p className="text-base font-bold opacity-70">{kc.explanation}</p>
                    {kc.exampleCode && (
                      <div className="mt-4 p-4 bg-black text-white font-mono text-xs overflow-x-auto border-l-4 border-orange-500">
                        <ReactMarkdown>{`\`\`\`\n${kc.exampleCode}\n\`\`\``}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {currentNotes.mainExampleCode && (
                <section className="space-y-6">
                  <h3 className="text-2xl font-black uppercase italic text-orange-500">Main Implementation</h3>
                  <div className="p-6 bg-black text-white font-mono text-xs overflow-x-auto border-4 border-black">
                    <ReactMarkdown>{`\`\`\`\n${currentNotes.mainExampleCode}\n\`\`\``}</ReactMarkdown>
                  </div>
                </section>
              )}
            </motion.div>
          )}

          {currentStep.resourceLink && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-6",
                focusMode ? "bg-white/5 border-white/20" : "bg-orange-50"
              )}
            >
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-16 h-16 flex items-center justify-center border-4 border-black",
                  currentStep.resourceType === 'youtube' ? "bg-red-500" : "bg-blue-500"
                )}>
                  {currentStep.resourceType === 'youtube' ? <Youtube className="text-white" size={32} /> : <ExternalLink className="text-white" size={32} />}
                </div>
                <div>
                  <h4 className="text-xl font-black uppercase italic leading-none mb-2">Deep Dive Resource</h4>
                  <p className="text-sm font-bold opacity-60">Complete this {currentStep.resourceType} module to master this phase.</p>
                </div>
              </div>
              <a 
                href={currentStep.resourceLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full md:w-auto px-8 py-4 bg-black text-white font-black uppercase italic text-sm tracking-widest hover:bg-orange-500 transition-colors flex items-center justify-center gap-3"
              >
                Access Resource <ExternalLink size={16} />
              </a>
            </motion.div>
          )}

          <div className={cn(
            "pt-16 border-t-4 flex flex-col md:flex-row justify-between items-center gap-8",
            focusMode ? "border-white/10" : "border-black"
          )}>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setShowAdaptModal(true)}
                className="flex items-center gap-3 text-sm font-black uppercase italic hover:text-orange-500 transition-colors group"
              >
                <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" /> 
                Reshape this content (AI Adaptation)
              </button>
            </div>
            
            <div className="flex gap-6 w-full md:w-auto">
              {currentStepIdx > 0 && (
                <button 
                  onClick={() => setCurrentStepIdx(currentStepIdx - 1)}
                  className={cn(
                    "flex-1 md:flex-none px-12 py-5 border-4 border-black font-black uppercase italic hover:bg-black hover:text-white transition-all",
                    focusMode && "border-white/20 hover:bg-white hover:text-black"
                  )}
                >
                  Back
                </button>
              )}
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!isCompleted) {
                    onCompleteStep(currentStep);
                  }
                  if (currentStepIdx < path.steps.length - 1) {
                    setCurrentStepIdx(currentStepIdx + 1);
                  } else {
                    confetti({
                      particleCount: 150,
                      spread: 70,
                      origin: { y: 0.6 },
                      colors: ['#F97316', '#000000', '#FFFFFF']
                    });
                    setTimeout(onFinish, 2000);
                  }
                }}
                className="flex-1 md:flex-none px-16 py-5 bg-orange-500 text-black font-black uppercase italic text-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
              >
                {currentStepIdx === path.steps.length - 1 ? 'Complete Pathway' : 'Next Phase'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Adaptation Modal */}
      <AnimatePresence>
        {showAdaptModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#F5F5F0] border-8 border-black p-12 max-w-2xl w-full shadow-[24px_24px_0px_0px_rgba(249,115,22,1)]"
            >
              <div className="flex items-center gap-4 mb-6">
                <RefreshCw size={40} className="text-orange-500" />
                <h2 className="text-5xl font-black uppercase italic leading-none">Reshape Neural Data</h2>
              </div>
              
              <p className="text-xl font-bold mb-8 leading-tight">Identify the friction point. Our AI will re-synthesize this phase to match your current neural capacity.</p>
              
              <textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g., 'Simplify the terminology', 'Provide a real-world analogy', 'I need a step-by-step breakdown'..."
                className="w-full h-48 p-6 border-4 border-black bg-white font-bold text-lg focus:outline-none focus:border-orange-500 mb-8 placeholder:opacity-20"
              />
              
              <div className="flex gap-6">
                <button 
                  onClick={() => setShowAdaptModal(false)}
                  className="flex-1 py-5 border-4 border-black font-black uppercase italic hover:bg-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAdapt}
                  disabled={isAdapting || !feedback}
                  className="flex-1 py-5 bg-black text-white font-black uppercase italic hover:bg-orange-500 hover:text-black transition-all disabled:opacity-20"
                >
                  {isAdapting ? 'Re-Synthesizing...' : 'Execute Adaptation'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Study Notes View */}
      <AnimatePresence>
        {showFullNotes && currentNotes && (
          <StudyNotesView notes={currentNotes} onBack={() => setShowFullNotes(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

const calculateStreak = (activityLog: { [date: string]: number } = {}) => {
  let streak = 0;
  const today = new Date();
  const checkDate = new Date(today);
  
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (activityLog[dateStr] && activityLog[dateStr] > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // If no activity today, check yesterday. If yesterday also has no activity, streak is broken.
      // Exception: If we just started checking and today has no activity, it doesn't break yet, check yesterday.
      if (dateStr === today.toISOString().split('T')[0]) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return streak;
};

// --- Streak Calendar ---
const StreakCalendar = ({ activityLog = {} }: { activityLog?: { [date: string]: number } }) => {
  const today = new Date();
  const months = [];
  
  // Generate last 12 months
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const daysInMonth = new Date(year, d.getMonth() + 1, 0).getDate();
    
    const monthDates = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, d.getMonth(), day);
      // Only include dates up to today for the current month
      if (dateObj > today) break;
      monthDates.push(dateObj.toISOString().split('T')[0]);
    }
    
    months.push({ name: monthName, year, dates: monthDates });
  }

  const getLevel = (count: number) => {
    if (!count) return 'bg-black/5';
    if (count < 200) return 'bg-orange-200';
    if (count < 500) return 'bg-orange-400';
    return 'bg-orange-600';
  };

  const currentStreak = calculateStreak(activityLog);

  return (
    <div className="space-y-6">
      {/* Live Tracker Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-orange-500 border-4 border-black p-4 flex items-center justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-black text-white">
            <Flame size={24} className={cn(currentStreak > 0 && "animate-bounce text-orange-500")} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest leading-none">Live Neural Streak</h4>
            <p className="text-[10px] font-bold opacity-60 uppercase">Infection active and spreading</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-4xl font-black italic tabular-nums leading-none">{currentStreak}</span>
          <p className="text-[10px] font-black uppercase tracking-widest mt-1">Days</p>
        </div>
      </motion.div>

      <div className="bg-white border-4 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
            <Calendar size={16} className="text-orange-500" /> Neural Activity Matrix
          </h3>
          <div className="flex items-center gap-4 text-[8px] font-black uppercase opacity-40">
            <div className="flex gap-1 items-center">
              <span>Less</span>
              <div className="w-2 h-2 bg-black/5" />
              <div className="w-2 h-2 bg-orange-200" />
              <div className="w-2 h-2 bg-orange-400" />
              <div className="w-2 h-2 bg-orange-600" />
              <span>More</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {months.map((month, mIdx) => (
            <div key={mIdx} className="space-y-2">
              <div className="flex justify-between items-end border-b border-black/10 pb-1">
                <span className="text-[10px] font-black uppercase italic">{month.name}</span>
                <span className="text-[8px] font-mono opacity-30">{month.year}</span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {month.dates.map(date => (
                  <div 
                    key={date}
                    title={`${date}: ${activityLog[date] || 0} XP`}
                    className={cn(
                      "aspect-square border border-black/5 transition-all hover:scale-125 hover:z-10 cursor-help",
                      getLevel(activityLog[date] || 0),
                      date === today.toISOString().split('T')[0] && "ring-1 ring-black ring-inset"
                    )}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Profile View ---
const ProfileView = ({ 
  profile, 
  stats, 
  onBack, 
  onLogout,
  onUpdateStats 
}: { 
  profile: LearningProfile, 
  stats: UserStats, 
  onBack: () => void, 
  onLogout: () => void,
  onUpdateStats: (newStats: Partial<UserStats>) => void
}) => {
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [isEditingCourses, setIsEditingCourses] = useState(false);
  const [courseForm, setCourseForm] = useState({ name: '', issuer: '', date: '' });

  const addSkill = () => {
    if (!newSkill.trim()) return;
    const skills = [...(stats.skills || []), newSkill.trim()];
    onUpdateStats({ skills });
    setNewSkill('');
  };

  const removeSkill = (index: number) => {
    const skills = stats.skills?.filter((_, i) => i !== index);
    onUpdateStats({ skills });
  };

  const addCourse = () => {
    if (!courseForm.name || !courseForm.issuer) return;
    const externalCourses = [...(stats.externalCourses || []), courseForm];
    onUpdateStats({ externalCourses });
    setCourseForm({ name: '', issuer: '', date: '' });
    setIsEditingCourses(false);
  };

  const removeCourse = (index: number) => {
    const externalCourses = stats.externalCourses?.filter((_, i) => i !== index);
    onUpdateStats({ externalCourses });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-black">
      <header className="border-b-4 border-black p-6 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="flex items-center gap-4 cursor-pointer" onClick={onBack}>
          <div className="p-2 bg-black text-white border-2 border-black rotate-12">
            <Users size={24} />
          </div>
          <span className="text-3xl font-black uppercase tracking-tighter italic leading-none">Subject Profile</span>
        </div>
        <button 
          onClick={onBack}
          className="px-8 py-3 bg-black text-white font-black uppercase italic text-sm hover:bg-orange-500 hover:text-black transition-all"
        >
          Close
        </button>
      </header>

      <main className="p-8 max-w-5xl mx-auto space-y-12 pb-32">
        {/* Profile Header Card */}
        <section className="bg-white border-8 border-black p-12 shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rotate-45 translate-x-32 -translate-y-32" />
          
          <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
            <div className="w-48 h-48 bg-orange-500 border-8 border-black flex items-center justify-center text-8xl font-black italic shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              {profile.name[0]}
            </div>
            <div className="text-center md:text-left space-y-4">
              <h2 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">{profile.name}</h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <span className="px-4 py-1 bg-black text-white text-sm font-black uppercase tracking-widest">{profile.level}</span>
                <span className="px-4 py-1 bg-orange-500 text-black text-sm font-black uppercase tracking-widest italic">{profile.learningStyle}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Neural Activity (Calendar) */}
        <StreakCalendar activityLog={stats.activityLog} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Neural Status Box */}
          <div className="bg-black text-white p-10 shadow-[12px_12px_0px_0px_rgba(249,115,22,1)]">
            <h3 className="text-2xl font-black uppercase italic text-orange-500 mb-8 border-b-2 border-orange-500 pb-2 flex items-center justify-between">
              Neural Status <TrendingUp size={20} />
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Integration Points</span>
                <span className="text-4xl font-black italic">{stats.xp.toLocaleString()} XP</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Synaptic Streak</span>
                <span className="text-4xl font-black italic text-orange-500">{calculateStreak(stats.activityLog)} DAYS</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Global Rank</span>
                <span className="text-4xl font-black italic">#{stats.rank}</span>
              </div>
            </div>
          </div>

          {/* Core Domain Box */}
          <div className="bg-white border-4 border-black p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-2xl font-black uppercase italic mb-8 border-b-2 border-black pb-2 flex items-center justify-between">
              Core Domain <Target size={20} />
            </h3>
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Primary Knowledge Source</span>
                <p className="text-2xl font-black uppercase italic">{profile.subject || 'Not Set'}</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Strategic Objective</span>
                <p className="text-lg font-bold leading-tight italic opacity-70">"{profile.goals || 'No goals defined.'}"</p>
              </div>
            </div>
          </div>
        </div>

        {/* Skills Section (LinkedIn Style) */}
        <section className="bg-white border-4 border-black p-10 shadow-[12px_12px_0px_0px_rgba(168,85,247,1)]">
          <div className="flex items-center justify-between mb-8 border-b-2 border-black pb-2">
            <h3 className="text-2xl font-black uppercase italic flex items-center gap-2">
              Neural Skills <Brain size={24} className="text-purple-500" />
            </h3>
            <button 
              onClick={() => setIsEditingSkills(!isEditingSkills)}
              className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-500 hover:text-black transition-all"
            >
              {isEditingSkills ? 'Finish Editing' : 'Edit Skills'}
            </button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {stats.skills?.map((skill, i) => (
              <div key={i} className="group px-4 py-2 bg-white border-2 border-black font-black uppercase italic text-xs flex items-center gap-3 hover:bg-black hover:text-white transition-all">
                {skill}
                {isEditingSkills && (
                  <button onClick={() => removeSkill(i)} className="text-red-500 hover:text-red-300">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
            {isEditingSkills && (
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="New Neural Pattern..."
                  className="px-3 py-1 border-2 border-black text-xs font-black uppercase italic focus:outline-none focus:border-orange-500"
                  onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                />
                <button onClick={addSkill} className="p-1 bg-black text-white hover:bg-orange-500 hover:text-black">
                  <Plus size={16} />
                </button>
              </div>
            )}
            {!isEditingSkills && (!stats.skills || stats.skills.length === 0) && (
              <p className="text-sm font-bold opacity-30 italic">No neural patterns synthesized yet.</p>
            )}
          </div>
        </section>

        {/* Courses & Certificates section (LinkedIn style) */}
        <section className="bg-white border-4 border-black p-10 shadow-[12px_12px_0px_0px_rgba(59,130,246,1)]">
          <div className="flex items-center justify-between mb-8 border-b-2 border-black pb-2">
            <h3 className="text-2xl font-black uppercase italic flex items-center gap-2">
              External Pathogens <ExternalLink size={24} className="text-blue-500" />
            </h3>
            <button 
              onClick={() => setIsEditingCourses(!isEditingCourses)}
              className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-500 hover:text-black transition-all"
            >
              Add Certificate
            </button>
          </div>

          <div className="space-y-6">
            {isEditingCourses && (
              <div className="p-6 bg-blue-50 border-4 border-dashed border-blue-500 grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <input 
                  placeholder="Course Name..."
                  className="p-2 border-2 border-black font-black uppercase italic text-xs focus:border-blue-500 outline-none"
                  value={courseForm.name}
                  onChange={e => setCourseForm({...courseForm, name: e.target.value})}
                />
                <input 
                  placeholder="Issuer/Authority..."
                  className="p-2 border-2 border-black font-black uppercase italic text-xs focus:border-blue-500 outline-none"
                  value={courseForm.issuer}
                  onChange={e => setCourseForm({...courseForm, issuer: e.target.value})}
                />
                <div className="flex gap-2">
                  <input 
                    type="month"
                    className="flex-1 p-2 border-2 border-black font-black uppercase italic text-xs focus:border-blue-500 outline-none"
                    value={courseForm.date}
                    onChange={e => setCourseForm({...courseForm, date: e.target.value})}
                  />
                  <button onClick={addCourse} className="p-2 bg-black text-white hover:bg-blue-500 hover:text-black">
                    <CheckCircle2 size={20} />
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stats.externalCourses?.map((course, i) => (
                <div key={i} className="group relative p-6 bg-white border-2 border-black hover:bg-blue-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-xl font-black uppercase italic leading-none">{course.name}</h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">{course.issuer}</p>
                      <p className="text-[8px] font-mono opacity-40">{course.date}</p>
                    </div>
                    <button onClick={() => removeCourse(i)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {(!stats.externalCourses || stats.externalCourses.length === 0) && !isEditingCourses && (
              <p className="text-sm font-bold opacity-30 italic">No external pathogen data archived.</p>
            )}
          </div>
        </section>

        {/* Mutations section */}
        <section className="bg-white border-4 border-black p-10 shadow-[12px_12px_0px_0px_rgba(34,197,94,1)]">
          <h3 className="text-2xl font-black uppercase italic mb-8 border-b-2 border-black pb-2">Acquired Mutations</h3>
          <div className="flex flex-wrap gap-4">
            {stats.mutations.map((m, i) => (
              <div key={i} className="px-6 py-3 bg-orange-50 text-black border-2 border-black font-black uppercase italic text-sm flex items-center gap-3">
                <Zap size={16} className="text-orange-500" />
                {m}
              </div>
            ))}
            {stats.mutations.length === 0 && <p className="text-sm font-bold opacity-40 uppercase tracking-widest">No mutations detected yet.</p>}
          </div>
        </section>

        <footer className="flex flex-col gap-4">
          <button 
            onClick={onLogout}
            className="w-full py-6 bg-red-600 text-white font-black uppercase italic text-xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:shadow-none transition-all"
          >
            Terminate Session (Logout)
          </button>
          <button 
            onClick={onBack}
            className="w-full py-6 bg-white text-black font-black uppercase italic text-xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:bg-orange-500 hover:shadow-none transition-all"
          >
            Back to Nexus
          </button>
        </footer>
      </main>
    </div>
  );
};

// --- Completion Modal ---

const CompletionModal = ({ 
  pathway, 
  onBack, 
  studentName: propStudentName 
}: { 
  pathway: LearningPath | CompletedPathway, 
  onBack: () => void, 
  studentName?: string 
}) => {
  const isArchived = 'topics' in pathway;
  const dateStr = isArchived ? (pathway as CompletedPathway).date : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const yearStr = isArchived ? (pathway as CompletedPathway).year : new Date().getFullYear().toString();
  const domainName = isArchived ? (pathway as CompletedPathway).name : (pathway as LearningPath).subject;
  const studentName = isArchived 
    ? (pathway as CompletedPathway).studentName || 'Neural Subject' 
    : propStudentName || 'Validated User';

  const certRef = React.useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const downloadCertAsImage = async () => {
    if (!certRef.current) return;
    setIsCapturing(true);
    try {
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await toPng(certRef.current, { 
        cacheBust: true, 
        quality: 1, 
        backgroundColor: '#ffffff',
        width: 1400,
        height: 1000,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      const link = document.createElement('a');
      link.download = `plague-cert-${domainName.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to capture certificate:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-6 overflow-y-auto backdrop-blur-xl font-sans">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-6xl shadow-[40px_40px_0px_0px_rgba(249,115,22,0.3)] relative"
      >
        <div className="bg-[#FDFDFD] p-2 border-4 border-black relative">
          {/* Certificate Container with Horizontal Visual Design */}
          <div 
            ref={certRef} 
            className="w-full aspect-[1.4/1] bg-white border-[16px] border-black p-16 md:p-24 relative flex flex-col items-center justify-between overflow-hidden"
          >
            {/* Subtle App Branding Watermark */}
            <div className="absolute -top-20 -right-20 opacity-[0.03] rotate-12 pointer-events-none">
              <Virus size={400} />
            </div>
            
            {/* Header branding */}
            <div className="w-full flex justify-between items-start z-10">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-500 border-2 border-black rotate-12">
                  <Virus size={24} className="text-black" />
                </div>
                <span className="text-xl font-black uppercase italic tracking-tighter text-black">Plague AI</span>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 text-black">Authentication Node</p>
                <p className="font-mono text-sm font-black uppercase tracking-widest text-orange-600">CERT-ID: {Math.random().toString(36).substr(2, 8).toUpperCase()}</p>
              </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full flex flex-col items-center text-center">
              <div className="space-y-4 mb-8">
                <h2 className="text-base font-mono font-black uppercase tracking-[1em] text-orange-500">Certificate of Specialization</h2>
                <div className="h-1 w-24 bg-black mx-auto" />
              </div>

              <div className="space-y-6">
                <p className="text-xl font-medium italic text-black/60">This certifies that</p>
                <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-black">
                  {studentName}
                </h1>
                
                <div className="py-8">
                  <p className="text-lg font-medium italic text-black/60 mb-2">has successfully demonstrated proficiency in the domain of</p>
                  <h3 className="text-3xl md:text-5xl font-black uppercase italic text-orange-500 tracking-tight">
                    {domainName}
                  </h3>
                </div>
                
                <p className="text-sm font-bold text-black/40 max-w-xl mx-auto uppercase tracking-widest">
                  Verified integration achieved through adaptive neural synthesis protocol v.2.
                </p>
              </div>
            </div>

            {/* Footer / Signatures */}
            <div className="w-full flex justify-between items-end z-10 border-t-2 border-black pt-12">
              <div className="text-left space-y-2">
                <p className="font-mono text-[10px] font-black uppercase tracking-widest opacity-40 text-black">Completion Date</p>
                <p className="text-xl font-black italic text-black">{dateStr}, {yearStr}</p>
              </div>
              
              <div className="text-center relative">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-20 rotate-12">
                  <Sparkles size={64} className="text-orange-500" />
                </div>
                <div className="w-48 h-px bg-black mb-4 mx-auto" />
                <p className="font-mono text-[10px] font-black uppercase tracking-widest leading-none text-black">Director of Synthesis</p>
                <p className="font-mono text-[8px] font-bold opacity-30 mt-1 uppercase text-black">Plague AI Neural Core</p>
              </div>

              <div className="text-right">
                <div className="p-4 border-4 border-black inline-block bg-white shadow-[4px_4px_0px_0px_rgba(249,115,22,1)]">
                  <Sparkles size={32} className="text-orange-500" />
                </div>
              </div>
            </div>

            {/* Corner Decorative Elements */}
            <div className="absolute top-0 left-0 w-24 h-24 border-t-[16px] border-l-[16px] border-black/5 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-24 h-24 border-b-[16px] border-r-[16px] border-black/5 pointer-events-none" />
          </div>

          {/* Action Buttons (outside capturable area) */}
          <div className="flex flex-col md:flex-row gap-6 p-8 bg-black/5 border-t-2 border-black">
            <button 
              onClick={downloadCertAsImage}
              disabled={isCapturing}
              className={cn(
                "flex-1 py-6 border-4 border-black font-black uppercase italic text-xl hover:bg-black hover:text-white transition-all flex items-center justify-center gap-4",
                isCapturing ? "opacity-50 cursor-wait bg-gray-200" : "bg-white"
              )}
            >
              {isCapturing ? "Transmitting..." : "Download Certificate"} <CheckCircle2 />
            </button>
            <button 
              onClick={onBack}
              className="flex-1 py-6 bg-black text-white font-black uppercase italic text-xl hover:bg-orange-500 hover:text-black transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<AppState>('landing');
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [selectedArchivedPathway, setSelectedArchivedPathway] = useState<CompletedPathway | null>(null);
  const [startStepIdx, setStartStepIdx] = useState(0);
  const [stats, setStats] = useState<UserStats>({
    xp: 0,
    rank: 99,
    streak: 1,
    completedSteps: [],
    mutations: ['Patient Zero'],
    dailyQuests: [
      { label: 'Complete 1 Step', xp: 100, done: false },
      { label: 'Share Knowledge', xp: 250, done: false },
      { label: '30m Focus Session', xp: 500, done: false },
    ]
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}`;
    const unsubscribe = onSnapshot(doc(db, path), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setProfile({
          name: data.name,
          learningStyle: data.learningStyle,
          goals: data.goals,
          level: data.level,
          subject: data.subject
        });
        setStats({
          xp: data.xp,
          rank: data.rank,
          streak: data.streak || 1,
          completedSteps: data.completedSteps || [],
          mutations: data.mutations || ['Patient Zero'],
          dailyQuests: data.dailyQuests || [],
          completedPathways: data.completedPathways || [],
          schedule: data.schedule || null,
          activityLog: data.activityLog || {},
          skills: data.skills || [],
          externalCourses: data.externalCourses || []
        });
        if (data.currentPath) {
          setPath(data.currentPath);
        }
        if (state === 'landing') setState('dashboard');
      } else {
        if (state === 'dashboard' || state === 'learning') setState('onboarding');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setState('landing');
      setProfile(null);
      setPath(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOnboardingComplete = async (newProfile: LearningProfile) => {
    if (!user) return;
    
    setProfile(newProfile);
    setState('dashboard');
    
    const resetStats = { ...stats, completedSteps: [] };
    setStats(resetStats);
    
    try {
      const newPath = await generateLearningPath(newProfile);
      setPath(newPath);
      
      const docPath = `users/${user.uid}`;
      await setDoc(doc(db, docPath), {
        ...newProfile,
        ...resetStats,
        currentPath: newPath,
        role: 'user'
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const handleUpdateUserStats = async (newStats: Partial<UserStats>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}`), newStats);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleCompleteStep = async (step: LearningStep) => {
    if (!user || !profile) return;

    const newStats = { ...stats };
    if (newStats.completedSteps.includes(step.title)) return;

    newStats.completedSteps = [...newStats.completedSteps, step.title];
    newStats.xp += 150;

    // Update Activity Log
    const today = new Date().toISOString().split('T')[0];
    const activityLog = { ...(stats.activityLog || {}) };
    activityLog[today] = (activityLog[today] || 0) + 150;
    newStats.activityLog = activityLog;

    // Check daily quests
    if (newStats.completedSteps.length === 1) {
      const questIdx = newStats.dailyQuests.findIndex(q => q.label === 'Complete 1 Step');
      if (questIdx !== -1 && !newStats.dailyQuests[questIdx].done) {
        newStats.dailyQuests[questIdx].done = true;
        newStats.xp += newStats.dailyQuests[questIdx].xp;
        
        // Add quest XP to log
        activityLog[today] = (activityLog[today] || 0) + newStats.dailyQuests[questIdx].xp;
      }
    }

    // Unlock mutations
    if (newStats.completedSteps.length === 3 && !newStats.mutations.includes('Fast Learner')) {
      newStats.mutations = [...newStats.mutations, 'Fast Learner'];
      newStats.xp += 500;
    }

    newStats.rank = Math.max(1, 99 - Math.floor(newStats.xp / 500));

    setStats(newStats);

    try {
      const docPath = `users/${user.uid}`;
      await updateDoc(doc(db, docPath), {
        xp: newStats.xp,
        rank: newStats.rank,
        completedSteps: newStats.completedSteps,
        mutations: newStats.mutations,
        dailyQuests: newStats.dailyQuests,
        activityLog: newStats.activityLog
      });

      // Check if pathway is complete
        if (path && newStats.completedSteps.length >= path.steps.length) {
          const completedPathway: CompletedPathway = {
            id: Math.random().toString(36).substr(2, 9),
            name: path.subject,
            date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
            year: new Date().getFullYear().toString(),
            topics: path.steps.map(s => s.title),
            studentName: profile?.name || user.displayName || 'Neural Subject'
          };

        const updatedCompletedPathways = [...(stats.completedPathways || []), completedPathway];
        
        await updateDoc(doc(db, docPath), {
          completedPathways: updatedCompletedPathways,
          currentPath: null, // Clear current path after completion
          subject: "" // Clear subject after completion
        });

        setStats(prev => ({ ...prev, completedPathways: updatedCompletedPathways }));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!user || !profile) return;
    try {
      const schedule = await generateSchedule(profile, profile.goals);
      setStats(prev => ({ ...prev, schedule }));
      
      const docPath = `users/${user.uid}`;
      await updateDoc(doc(db, docPath), {
        schedule
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-orange-500"
        >
          <Virus size={80} />
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="font-sans">
        <AnimatePresence mode="wait">
          {state === 'landing' && (
            <motion.div 
              key="landing" 
              initial={{ opacity: 0, scale: 1.1, rotateX: 10 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateX: -10 }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            >
              <Landing 
                onStart={user ? () => setState('onboarding') : handleLogin} 
                isLoggedIn={!!user}
              />
            </motion.div>
          )}

          {state === 'onboarding' && (
            <motion.div 
              key="onboarding" 
              initial={{ opacity: 0, x: 200, skewX: -10 }}
              animate={{ opacity: 1, x: 0, skewX: 0 }}
              exit={{ opacity: 0, x: -200, skewX: 10 }}
              transition={{ duration: 0.6, ease: "anticipate" }}
            >
              <Onboarding onComplete={handleOnboardingComplete} />
            </motion.div>
          )}

          {state === 'dashboard' && profile && (
            <motion.div 
              key="dashboard" 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              <Dashboard 
                profile={profile} 
                path={path} 
                stats={stats}
                onStartLearning={(idx) => {
                  if (path) {
                    setStartStepIdx(idx ?? stats.completedSteps.length);
                    setState('learning');
                  }
                }} 
                onNewInfection={() => setState('onboarding')}
                onGenerateSchedule={handleGenerateSchedule}
                onViewArchived={(cp) => setSelectedArchivedPathway(cp)}
                onViewProfile={() => setState('profile')}
                onLogout={handleLogout}
              />
            </motion.div>
          )}

          {state === 'profile' && profile && (
            <motion.div 
              key="profile" 
              initial={{ opacity: 0, x: '100vw' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100vw' }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
            >
              <ProfileView 
                profile={profile} 
                stats={stats} 
                onBack={() => setState('dashboard')} 
                onLogout={handleLogout} 
                onUpdateStats={handleUpdateUserStats}
              />
            </motion.div>
          )}

          {selectedArchivedPathway && (
            <motion.div 
              key="archived" 
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            >
              <CompletionModal 
                pathway={selectedArchivedPathway} 
                onBack={() => setSelectedArchivedPathway(null)} 
              />
            </motion.div>
          )}

          {state === 'learning' && path && stats && (
            <motion.div 
              key="learning" 
              initial={{ opacity: 0, filter: 'brightness(2) contrast(0.5)' }}
              animate={{ opacity: 1, filter: 'brightness(1) contrast(1)' }}
              exit={{ opacity: 0, filter: 'brightness(2) blur(10px)' }}
              transition={{ duration: 0.8 }}
            >
              <LearningView 
                path={path} 
                stats={stats}
                initialStepIdx={startStepIdx}
                onBack={() => setState('dashboard')} 
                onCompleteStep={handleCompleteStep}
                onFinish={() => setState('completed')}
              />
            </motion.div>
          )}

          {state === 'completed' && path && (
            <motion.div 
              key="completed" 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <CompletionModal 
                pathway={path} 
                studentName={profile?.name || user?.displayName || undefined}
                onBack={() => {
                  setPath(null);
                  setState('dashboard');
                }} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
