import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Howl } from 'howler';
import { INITIAL_RACERS } from './constants';
import { Racer } from './types';

const sfxStart = new Howl({ src: ['https://actions.google.com/sounds/v1/alarms/beep_short.ogg'], volume: 0.5 });
const sfxBoost = new Howl({ src: ['https://actions.google.com/sounds/v1/cartoon/pop.ogg'], volume: 0.7 });
const sfxWin = new Howl({ src: ['https://actions.google.com/sounds/v1/crowds/crowd_cheer.ogg'], volume: 0.6 });
const sfxBomb = new Howl({ src: ['https://actions.google.com/sounds/v1/explosions/explosion.ogg'], volume: 0.5 });

const FRUITS = ['🍎', '🍌', '🍉', '🍇', '🍓', '🍊', '🍍'];
const OBSTACLES = ['💣', '🧨'];

interface ChatMessage {
  id: string;
  username: string;
  text: string;
  item?: string;
  isObstacle?: boolean;
}

const BOOST_PARTICLES = [
  { x: -40, y: -15, duration: 0.5, scale: 0.8, color: 'from-yellow-300 to-orange-500', shape: 'rounded-full', rotate: 0 },
  { x: -60, y: 20, duration: 0.6, scale: 0.6, color: 'from-orange-400 to-red-500', shape: 'rounded-sm', rotate: 45 },
  { x: -35, y: -5, duration: 0.4, scale: 1, color: 'from-white to-yellow-200', shape: 'rounded-full', rotate: 0 },
  { x: -55, y: 10, duration: 0.7, scale: 0.7, color: 'from-blue-300 to-cyan-500', shape: 'rounded-full', rotate: 0 },
  { x: -45, y: -25, duration: 0.5, scale: 0.9, color: 'from-red-400 to-orange-600', shape: 'rounded-sm', rotate: 12 },
  { x: -65, y: 5, duration: 0.6, scale: 0.5, color: 'from-yellow-200 to-yellow-500', shape: 'rounded-full', rotate: 0 },
  { x: -30, y: 15, duration: 0.4, scale: 0.8, color: 'from-orange-300 to-red-400', shape: 'rounded-sm', rotate: 45 },
  { x: -50, y: -20, duration: 0.5, scale: 0.7, color: 'from-white to-blue-200', shape: 'rounded-full', rotate: 0 },
  { x: -70, y: -10, duration: 0.8, scale: 0.5, color: 'from-yellow-400 to-orange-500', shape: 'rounded-sm', rotate: 75 },
  { x: -25, y: 25, duration: 0.3, scale: 1.2, color: 'from-red-500 to-rose-600', shape: 'rounded-full', rotate: 0 },
  { x: -40, y: 0, duration: 0.45, scale: 1.1, color: 'from-cyan-300 to-blue-500', shape: 'rounded-sm', rotate: 30 },
  { x: -55, y: -15, duration: 0.65, scale: 0.8, color: 'from-orange-500 to-yellow-300', shape: 'rounded-full', rotate: 0 },
];

export default function App() {
  const [racers, setRacers] = useState<Racer[]>(INITIAL_RACERS);
  const [isRacing, setIsRacing] = useState(false);
  const [winner, setWinner] = useState<Racer | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [simulateChat, setSimulateChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const resetRace = useCallback(() => {
    setRacers(prev => prev.map(r => ({ ...r, progress: 0, speed: 0, boostEndTime: 0, isBoosting: false })));
    setWinner(null);
    setIsRacing(true);
    setChatMessages([]);
    sfxStart.play();
  }, []);

  const handleCommand = useCallback((text: string, username: string) => {
    if (!isRacing || winner) return;
    
    const command = text.toLowerCase().trim();
    const targetRacer = racers.find(r => r.id === command);
    
    let item: string | undefined;
    let isObstacle = false;

    if (targetRacer) {
      // 80% chance fruit, 20% chance obstacle
      isObstacle = Math.random() > 0.8;
      item = isObstacle 
        ? OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)]
        : FRUITS[Math.floor(Math.random() * FRUITS.length)];

      if (isObstacle) sfxBomb.play();
      else sfxBoost.play();

      setRacers(prev => {
        let newWinner: Racer | null = null;
        const updated = prev.map(r => {
          if (r.id === targetRacer.id) {
            // Move forward 2% for fruit, backward 2% for obstacle
            const progressDelta = isObstacle ? -2 : 2;
            let newProgress = Math.max(0, Math.min(100, r.progress + progressDelta));
            
            if (newProgress >= 100 && !newWinner) {
              newWinner = r;
            }
            
            return { 
              ...r, 
              progress: newProgress,
              isBoosting: !isObstacle,
              boostEndTime: performance.now() + 500
            };
          }
          return r;
        });

        if (newWinner) {
          sfxWin.play();
          setWinner(newWinner);
          setIsRacing(false);
          return updated.map(r => r.id === newWinner!.id ? { ...r, wins: r.wins + 1 } : r);
        }
        return updated;
      });
    }

    setChatMessages(prev => {
      const newMsg = { id: Math.random().toString(), username, text, item, isObstacle };
      return [...prev.slice(-49), newMsg];
    });
  }, [isRacing, winner, racers]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Simulate chat
  useEffect(() => {
    if (!isRacing || winner || !simulateChat) return;

    const interval = setInterval(() => {
      const randomRacer = racers[Math.floor(Math.random() * racers.length)];
      const randomUser = `User${Math.floor(Math.random() * 9999)}`;
      handleCommand(randomRacer.id, randomUser);
    }, 400); // 400ms per simulated comment

    return () => clearInterval(interval);
  }, [isRacing, winner, simulateChat, racers, handleCommand]);

  // Handle boost animation timeout
  useEffect(() => {
    if (!isRacing || winner) return;
    
    let animationFrameId: number;
    const update = () => {
      const now = performance.now();
      setRacers(prev => prev.map(r => {
        if (r.isBoosting && r.boostEndTime && now > r.boostEndTime) {
          return { ...r, isBoosting: false };
        }
        return r;
      }));
      animationFrameId = requestAnimationFrame(update);
    };
    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isRacing, winner]);

  const handleGift = (id: string) => {
    handleCommand(id, 'You (Gift)');
  };

  const toggleRacing = () => {
    setIsRacing(prev => {
      if (!prev && !winner) sfxStart.play();
      return !prev;
    });
  };

  const topWinners = [...racers].sort((a, b) => b.wins - a.wins).slice(0, 4);

  return (
    <div className="flex flex-col w-full h-screen bg-[#12121a] text-white font-sans overflow-hidden border-l-4 border-t-4 border-green-500 relative">
      {/* Header */}
      <div className="flex justify-center gap-4 p-4 border-b border-slate-800 bg-[#1a1a24]">
        {topWinners.map((r, i) => (
          <div key={r.id} className={`flex flex-col items-center border-2 rounded-xl px-4 py-1 min-w-[90px] bg-slate-900 shadow-lg ${i === 0 ? 'border-yellow-400 shadow-yellow-400/20' : i === 1 ? 'border-gray-400 shadow-gray-400/20' : i === 2 ? 'border-orange-400 shadow-orange-400/20' : 'border-slate-600'}`}>
            <span className="text-3xl mb-1">{r.flag}</span>
            <span className="text-sm font-bold tracking-wider">{r.wins}W</span>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tracks */}
        <div className="flex-1 flex flex-col relative py-2">
          {racers.map((r, i) => (
            <div key={r.id} className="flex-1 flex items-center border-b border-slate-800/50 relative group px-2">
            {/* Left Info */}
            <div className="w-36 flex items-center gap-3 z-10">
              <span className="text-yellow-400 font-bold w-4 text-right">{i + 1}</span>
              <span className="text-2xl drop-shadow-md">{r.flag}</span>
              <motion.button 
                whileHover={{ scale: 1.2, rotate: [0, -10, 10, -10, 0] }}
                whileTap={{ scale: 0.8 }}
                onClick={() => handleGift(r.id)} 
                className="text-3xl cursor-pointer drop-shadow-lg" 
                title={`Send ${r.giftIcon} to boost ${r.country}`}
              >
                {r.giftIcon}
              </motion.button>
            </div>

            {/* Track Area */}
            <div 
              className="flex-1 h-full relative flex items-center rounded-lg mx-2 overflow-hidden transition-colors duration-75 shadow-inner border-y border-slate-800/50"
              style={{
                backgroundColor: `rgba(${30 - (25 * (r.progress / 100))}, ${41 + (109 * (r.progress / 100))}, ${59 + (46 * (r.progress / 100))}, ${0.15 + (r.progress / 100) * 0.25})`,
                backgroundImage: `
                  url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E"),
                  repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 40px),
                  repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 2px, transparent 2px, transparent 8px)
                `,
                backgroundSize: '100px 100px, 40px 100%, 100% 8px'
              }}
            >
              {/* Starting Line */}
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IndoaXRlIi8+PHJlY3QgeD0iNCIgeT0iNCIgd2lkdGg9IjQiIGhlaWdodD0iNCIgZmlsbD0id2hpdGUiLz48cmVjdCB4PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJibGFjayIvPjxyZWN0IHk9IjQiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9ImJsYWNrIi8+PC9zdmc+')] opacity-60 z-10"></div>

              {/* Tire Tracks */}
              <div className="absolute inset-0 flex items-center pointer-events-none opacity-[0.15] z-0">
                <div className="w-full h-8 border-y-[3px] border-black blur-[1px]"></div>
              </div>

              {/* Distance Markers */}
              <div className="absolute inset-0 flex justify-between px-[25%] pointer-events-none opacity-20 z-0">
                <div className="h-full border-l-2 border-slate-400 border-dashed flex items-end pb-1"><span className="text-[10px] font-mono -ml-4 text-slate-300">25%</span></div>
                <div className="h-full border-l-2 border-slate-400 border-dashed flex items-end pb-1"><span className="text-[10px] font-mono -ml-4 text-slate-300">50%</span></div>
                <div className="h-full border-l-2 border-slate-400 border-dashed flex items-end pb-1"><span className="text-[10px] font-mono -ml-4 text-slate-300">75%</span></div>
              </div>

              {/* Speed Lines */}
              {isRacing && r.speed > 5 && (
                <motion.div 
                  className="absolute inset-0 w-[200%] flex gap-32 opacity-10 pointer-events-none z-0"
                  animate={{ x: ['0%', '-50%'] }}
                  transition={{ repeat: Infinity, ease: 'linear', duration: Math.max(0.2, 1.5 - (r.speed * 0.02)) }}
                >
                  {[...Array(15)].map((_, idx) => (
                    <div key={idx} className="h-full w-24 bg-gradient-to-r from-transparent via-white to-transparent skew-x-[-30deg]"></div>
                  ))}
                </motion.div>
              )}

              {/* Boost Track Glow */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent pointer-events-none z-0"
                animate={{ opacity: r.isBoosting ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              />

              {/* Faint Country Name */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none z-0">
                <span className="text-5xl font-black tracking-[0.3em] uppercase italic">{r.country}</span>
              </div>
              
              {/* Track boundaries (Road markings) */}
              <div className="absolute inset-0 flex flex-col justify-between py-1 opacity-40 pointer-events-none z-10">
                <div className="border-t-4 border-dashed border-slate-900 w-full shadow-[0_1px_0_rgba(255,255,255,0.1)]"></div>
                <div className="border-t-4 border-dashed border-slate-900 w-full shadow-[0_-1px_0_rgba(255,255,255,0.1)]"></div>
              </div>
              
              {/* Vehicle Container */}
              <motion.div 
                className="absolute z-20 flex items-center justify-center"
                animate={{ left: `${r.progress}%` }}
                transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
                style={{ transform: 'translateX(-50%)' }}
              >
                {/* Boost Text */}
                <motion.div
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ 
                    opacity: r.isBoosting ? [0, 1, 0] : 0, 
                    y: r.isBoosting ? -25 : 0,
                    scale: r.isBoosting ? [0.5, 1.2, 1] : 1
                  }}
                  transition={{ duration: 0.8 }}
                  className="absolute bottom-full mb-1 text-yellow-300 font-black text-sm italic drop-shadow-[0_0_5px_rgba(250,204,21,0.8)] whitespace-nowrap pointer-events-none"
                >
                  BOOST!
                </motion.div>

                {/* Boost Particles */}
                {r.isBoosting && (
                  <div className="absolute right-full pointer-events-none flex items-center justify-center">
                    {BOOST_PARTICLES.map((p, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 0, y: 0, rotate: p.rotate }}
                        animate={{ 
                          opacity: [0, 1, 0], 
                          scale: [0.2, p.scale, 0], 
                          x: [0, p.x], 
                          y: [0, p.y],
                          rotate: p.rotate ? [p.rotate, p.rotate + 180] : 0
                        }}
                        transition={{ 
                          duration: p.duration, 
                          repeat: Infinity, 
                          ease: "easeOut", 
                          delay: i * 0.08 // Staggered animation
                        }}
                        className={`absolute w-2 h-2 bg-gradient-to-r ${p.color} ${p.shape} drop-shadow-md`}
                      />
                    ))}
                  </div>
                )}

                {/* Fire Trail */}
                <motion.div
                  animate={{ 
                    opacity: r.isBoosting ? [0.6, 1, 0.6] : 0,
                    scale: r.isBoosting ? [1, 1.5, 1] : 0.5,
                    x: r.isBoosting ? [-10, -20, -10] : 0
                  }}
                  transition={{ duration: 0.3, repeat: r.isBoosting ? Infinity : 0 }}
                  className="absolute right-full mr-1 text-2xl drop-shadow-[0_0_10px_rgba(255,100,0,0.8)] pointer-events-none"
                >
                  🔥
                </motion.div>
                
                {/* Vehicle */}
                <motion.div
                  animate={{ 
                    y: isRacing ? [0, -4, 0] : 0,
                    rotate: r.isBoosting ? -5 : 0,
                    scale: r.isBoosting ? 1.1 : 1
                  }}
                  transition={{ 
                    y: { repeat: Infinity, duration: Math.max(0.15, 0.4 - (r.speed * 0.01)) },
                    rotate: { type: 'spring' },
                    scale: { type: 'spring' }
                  }}
                  className={`text-4xl drop-shadow-xl transition-all ${r.isBoosting ? 'drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]' : ''}`}
                >
                  <div className="scale-x-[-1]">
                    {r.vehicleIcon}
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Finish Line */}
            <div className="w-12 h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSJ3aGl0ZSIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSJ3aGl0ZSIvPjxyZWN0IHg9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9ImJsYWNrIi8+PHJlY3QgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iYmxhY2siLz48L3N2Zz4=')] z-10 border-l-4 border-slate-900 shadow-[-10px_0_20px_rgba(0,0,0,0.5)]"></div>
          </div>
        ))}

        {/* Winner Overlay */}
        {winner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 backdrop-blur-sm"
          >
            <motion.h2 
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="text-7xl font-black text-yellow-400 mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)] text-center"
            >
              {winner.country} WINS!
            </motion.h2>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-9xl mb-12 drop-shadow-2xl"
            >
              {winner.flag}
            </motion.div>
            <motion.button 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={resetRace}
              className="px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-full text-3xl shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:shadow-[0_0_60px_rgba(16,185,129,0.6)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              Next Race
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Live Chat Panel */}
      <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
        <div className="p-3 border-b border-slate-800 bg-slate-950 font-bold text-slate-300 flex justify-between items-center">
          <span>LIVE CHAT</span>
          <span className="text-xs text-slate-500">Type country code (e.g. vn)</span>
        </div>
        
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2 scroll-smooth">
          <AnimatePresence initial={false}>
            {chatMessages.map(msg => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm break-words"
              >
                <span className="font-bold text-slate-400">{msg.username}: </span>
                <span className="text-white">{msg.text}</span>
                {msg.item && (
                  <span className={`ml-2 font-bold ${msg.isObstacle ? 'text-red-400' : 'text-green-400'}`}>
                    {msg.item} {msg.isObstacle ? '-2' : '+2'}
                  </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-950">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (chatInput.trim()) {
                handleCommand(chatInput, 'You');
                setChatInput('');
              }
            }}
            className="flex gap-2"
          >
            <input 
              type="text" 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Type 'vn', 'id'..."
              className="flex-1 bg-slate-800 text-white px-3 py-2 rounded outline-none focus:ring-2 focus:ring-green-500"
              disabled={!isRacing || !!winner}
            />
            <button 
              type="submit"
              disabled={!isRacing || !!winner || !chatInput.trim()}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      </div>

      {/* Footer */}
      <div className="flex justify-between items-center p-3 text-xs font-mono bg-black border-t border-slate-800">
        <div className="flex gap-3">
          <button 
            onClick={toggleRacing} 
            className={`px-4 py-2 rounded font-bold transition-colors cursor-pointer ${isRacing ? 'bg-red-900/50 text-red-400 hover:bg-red-900/80' : 'bg-green-900/50 text-green-400 hover:bg-green-900/80'}`}
          >
            {isRacing ? 'PAUSE GAME' : 'START GAME'}
          </button>
          <button 
            onClick={() => setSimulateChat(!simulateChat)} 
            className={`px-4 py-2 rounded font-bold transition-colors cursor-pointer ${simulateChat ? 'bg-blue-900/50 text-blue-400 hover:bg-blue-900/80' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            disabled={!isRacing || !!winner}
          >
            {simulateChat ? 'STOP AUTO-CHAT' : 'AUTO-CHAT BOT'}
          </button>
          <button 
            onClick={resetRace} 
            className="px-4 py-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer"
          >
            RESET
          </button>
          <div className="flex items-center ml-4 text-slate-400">
            <span className="mr-2">💡</span>
            Type country codes (e.g. vn, id, th) in chat to move them!
          </div>
        </div>
        <div className="flex gap-6 items-center">
          <span className={`font-bold ${isRacing ? 'text-green-500 animate-pulse' : 'text-slate-500'}`}>
            LIVE STATUS: {isRacing ? 'ACTIVE' : 'PAUSED'}
          </span>
          <span className="text-slate-600 tracking-widest">FOR ENTERTAINMENT ONLY | NO GAMBLING</span>
        </div>
      </div>
    </div>
  );
}
