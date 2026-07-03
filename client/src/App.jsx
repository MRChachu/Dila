import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Auth from './Auth';
import GameBoard from './GameBoard';
import { Trophy, Shield, PlusCircle, Play, LogOut, RefreshCw, History, User, Target, LayoutGrid, Lock, Unlock, Medal, UserCheck, Star, UserPlus, BellRing, Users, Settings, Music, Palette } from 'lucide-react';

const socket = io('https://purti.onrender.com');

export default function App() {
  const [userState, setUserState] = useState(() => {
    const savedUser = localStorage.getItem('phurti_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const user = userState?.user || userState; 
  const safeUsername = user?.username || 'მოთამაშე';
  const initial = safeUsername.charAt(0).toUpperCase();

  const [roomId, setRoomId] = useState(() => localStorage.getItem('phurti_roomId') || '');
  const [inRoom, setInRoom] = useState(() => localStorage.getItem('phurti_inRoom') === 'true');
  const [roomData, setRoomData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [liveRooms, setLiveRooms] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]); 
  const [error, setError] = useState('');

  const [onlineUser, setOnlineUser] = useState([]);
  const [inviteAlert, setInviteAlert] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  // 🟢 პარამეტრების მოდალი
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // 🟢 დიზაინის და მუსიკის სტეიტები (ინახება ლოკალურად)
  const [theme, setTheme] = useState(() => localStorage.getItem('phurti_theme') || 'wood');
  const [isMusicPlaying, setIsMusicPlaying] = useState(() => localStorage.getItem('phurti_music') === 'true');
  const audioRef = useRef(typeof Audio !== 'undefined' ? new Audio('/bg-music.mp3') : null);

  const [selectedRoomIdForJoin, setSelectedRoomIdForJoin] = useState('');
  const [joinPasswordInput, setJoinPasswordInput] = useState('');

  const [mTargetScore, setMTargetScore] = useState(11);
  const [mMaxPlayers, setMMaxPlayers] = useState(4);
  const [mAllowBots, setMAllowBots] = useState(true);
  const [mRoomPassword, setMRoomPassword] = useState('');
  const [mIsRanked, setMIsRanked] = useState(false); 

  // 🟢 მუსიკის კონტროლი
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.volume = 0.15; // დაბალი ხმა ფონისთვის
      if (isMusicPlaying && userState) {
        audioRef.current.play().catch(e => console.log("Autoplay prevented:", e));
      } else {
        audioRef.current.pause();
      }
      localStorage.setItem('phurti_music', isMusicPlaying);
    }
  }, [isMusicPlaying, userState]);

  // 🟢 თემის შენახვა
  useEffect(() => {
    localStorage.setItem('phurti_theme', theme);
  }, [theme]);

  const fetchDashboardData = async (username) => {
    try {
      const resProf = await fetch(`https://purti.onrender.com/api/auth/profile/${username}`);
      if (resProf.ok) setProfileData(await resProf.json());

      const resLead = await fetch(`https://purti.onrender.com/api/auth/leaderboard`);
      if (resLead.ok) setLeaderboard(await resLead.json());
    } catch (err) {}
  };

  useEffect(() => {
    socket.on('roomUpdated', (room) => setRoomData(room));
    socket.on('gameStarted', (room) => setRoomData(room));
    socket.on('gameUpdated', (room) => setRoomData(room));
    socket.on('error', (msg) => setError(msg));
    socket.on('activeRoomsList', (rooms) => setLiveRooms(rooms));
    socket.on('updateOnlineUsers', (users) => setOnlineUser(users));
    socket.on('receiveInvite', (data) => setInviteAlert(data));

    socket.on('roomNotFound', () => {
      handleResetToLobby();
    });

    const handleOnConnect = () => {
      const oldSocketId = localStorage.getItem('phurti_socketId');
      const savedUserRaw = localStorage.getItem('phurti_user');
      const savedRoomId = localStorage.getItem('phurti_roomId');
      const savedInRoom = localStorage.getItem('phurti_inRoom') === 'true';

      if (savedUserRaw) {
        const parsedState = JSON.parse(savedUserRaw);
        const actualUser = parsedState?.user || parsedState;
        const uName = actualUser?.username;

        if (uName) {
          socket.emit('setOnlineUser', uName); 
          if (savedInRoom && savedRoomId) {
            socket.emit('reconnectUser', { oldSocketId, playerName: uName, roomId: savedRoomId.trim() });
          } else {
            socket.emit('getLiveRooms');
          }
        }
      }
      localStorage.setItem('phurti_socketId', socket.id);
    };

    socket.on('connect', handleOnConnect);
    if (socket.connected) handleOnConnect();

    return () => {
      socket.off('roomUpdated'); socket.off('gameStarted'); socket.off('gameUpdated'); socket.off('error'); socket.off('activeRoomsList'); 
      socket.off('updateOnlineUsers'); socket.off('receiveInvite'); socket.off('roomNotFound');
      socket.off('connect', handleOnConnect);
    };
  }, []);

  useEffect(() => {
    if (userState && !inRoom && safeUsername !== 'მოთამაშე') {
      fetchDashboardData(safeUsername);
      socket.emit('getLiveRooms');
      socket.emit('setOnlineUser', safeUsername); 
    }
  }, [userState, inRoom, safeUsername]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleAuthSuccess = (userData) => {
    setUserState(userData);
    localStorage.setItem('phurti_user', JSON.stringify(userData));
    const actualUser = userData?.user || userData;
    if (actualUser?.username) socket.emit('setOnlineUser', actualUser.username); 
  };

  const handleJoinSpecificRoom = (targetId, pass = '') => {
    if (!targetId || !targetId.trim()) return;
    setError('');
    socket.emit('joinRoom', { roomId: targetId.trim(), playerName: safeUsername, roomPassword: pass });
    setInRoom(true);
    localStorage.setItem('phurti_roomId', targetId.trim());
    localStorage.setItem('phurti_inRoom', 'true');
    setIsPasswordModalOpen(false); setJoinPasswordInput('');
  };

  const handleConfirmCreateRoom = (e) => {
    e.preventDefault();
    const generatedId = Math.floor(1000 + Math.random() * 9000).toString();
    socket.emit('joinRoom', { roomId: generatedId, playerName: safeUsername, roomPassword: mRoomPassword ? mRoomPassword.trim() : null, maxPlayers: mMaxPlayers, targetScore: mTargetScore, allowBots: mAllowBots, isRanked: mIsRanked });
    setInRoom(true);
    localStorage.setItem('phurti_roomId', generatedId); localStorage.setItem('phurti_inRoom', 'true');
    setIsCreateModalOpen(false); setMRoomPassword('');
  };

  const handleSendInvite = (targetSocketId) => {
    if (inRoom && roomData) {
      socket.emit('sendInvite', { targetSocketId, roomId: roomData.id, password: roomData.password, fromName: safeUsername });
    } else {
      const generatedId = Math.floor(1000 + Math.random() * 9000).toString();
      socket.emit('joinRoom', { roomId: generatedId, playerName: safeUsername, roomPassword: null, maxPlayers: 4, targetScore: 11, allowBots: true, isRanked: false });
      setInRoom(true);
      localStorage.setItem('phurti_roomId', generatedId); 
      localStorage.setItem('phurti_inRoom', 'true');
      
      setTimeout(() => {
        socket.emit('sendInvite', { targetSocketId, roomId: generatedId, password: null, fromName: safeUsername });
      }, 300);
    }
  };

  const handleRoomClickFromList = (room) => {
    if (room.isPrivate) { setSelectedRoomIdForJoin(room.id); setIsPasswordModalOpen(true); } else { handleJoinSpecificRoom(room.id); }
  };

  const handleLogout = () => {
    socket.emit('leaveRoom'); setUserState(null); setInRoom(false); setRoomId(''); setRoomData(null); setProfileData(null);
    localStorage.clear(); socket.disconnect(); socket.connect();
  };

  const handleResetToLobby = () => {
    socket.emit('leaveRoom'); setInRoom(false); setRoomId(''); setRoomData(null);
    localStorage.removeItem('phurti_roomId'); localStorage.removeItem('phurti_inRoom');
  };

  if (!userState) return <Auth onAuthSuccess={handleAuthSuccess} />;

  const winRate = profileData?.stats?.gamesPlayed > 0 ? Math.round((profileData.stats.gamesWon / profileData.stats.gamesPlayed) * 100) : 0;
  const isHost = roomData && roomData.players[0] && roomData.players[0].id === socket.id;

  // 🟢 თემების დინამიური სტილები
  const themeStyles = {
    wood: {
      bg: "url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2560&auto=format&fit=crop')", // მუქი ხის ტექსტურა
      overlay: "bg-stone-950/85",
      accent: "text-amber-500",
      accentBg: "bg-amber-500",
      card: "bg-stone-900/60",
    },
    lavender: {
      bg: "url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2560&auto=format&fit=crop')", // პასტელური/ლავანდისფერი გრადიენტი
      overlay: "bg-indigo-950/80",
      accent: "text-violet-400",
      accentBg: "bg-violet-500",
      card: "bg-indigo-900/50",
    }
  };
  const activeTheme = themeStyles[theme];

  return (
    <div 
      className={`relative flex min-h-screen flex-col font-sans antialiased bg-cover bg-center bg-fixed transition-all duration-700`}
      style={{ backgroundImage: activeTheme.bg }}
    >
      <div className={`absolute inset-0 ${activeTheme.overlay} backdrop-blur-[4px] z-0 transition-colors duration-700`}></div>

      {inviteAlert && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className={`bg-stone-900 border border-${theme==='lavender'?'violet':'emerald'}-500/30 rounded-2xl p-6 max-w-sm w-full space-y-5 shadow-[0_0_50px_rgba(0,0,0,0.3)] font-sans text-center relative overflow-hidden animate-in zoom-in duration-200`}>
            <div className={`absolute top-0 left-0 w-full h-1 ${theme==='lavender'?'bg-violet-500':'bg-emerald-500'} animate-pulse`}></div>
            <div className={`w-16 h-16 ${theme==='lavender'?'bg-violet-500/10 border-violet-500/20':'bg-emerald-500/10 border-emerald-500/20'} rounded-full flex items-center justify-center mx-auto border mb-2 shadow-lg`}>
              <BellRing size={28} className={theme==='lavender'?'text-violet-400':'text-emerald-400'} />
            </div>
            <h3 className="text-lg font-black text-stone-100 uppercase tracking-widest">ახალი გამოწვევა!</h3>
            <p className="text-sm font-bold text-stone-400">
              <span className={`${theme==='lavender'?'text-violet-400':'text-emerald-400'} font-black`}>{inviteAlert.fromName}</span> გიწვევს სათამაშოდ<br/>(Room #{inviteAlert.roomId})
            </p>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
              <button onClick={() => setInviteAlert(null)} className="py-3 bg-stone-800 hover:bg-stone-700 border border-white/5 text-stone-300 rounded-xl text-xs font-black transition-all active:scale-95 shadow-md">უარყოფა</button>
              <button onClick={() => { handleJoinSpecificRoom(inviteAlert.roomId, inviteAlert.password); setInviteAlert(null); }} className={`py-3 bg-gradient-to-r ${theme==='lavender'?'from-violet-600 to-violet-500 border-violet-800':'from-emerald-600 to-emerald-500 border-emerald-800'} text-stone-950 rounded-xl text-xs font-black transition-all active:scale-95 border-b-2 shadow-lg`}>შესვლა 🎮</button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 პარამეტრების მოდალი */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`${activeTheme.card} border border-white/10 rounded-3xl p-6 max-w-xs w-full space-y-6 shadow-2xl font-sans relative`}>
            <h3 className={`text-base font-black ${activeTheme.accent} border-b border-white/10 pb-3 uppercase tracking-wider flex items-center gap-2`}><Settings size={18}/> პარამეტრები</h3>
            
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2"><Music size={14}/> ფონური მუსიკა</label>
              <div className="flex bg-stone-950/50 rounded-xl p-1 border border-white/5">
                <button onClick={() => setIsMusicPlaying(true)} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${isMusicPlaying ? `${activeTheme.accentBg} text-stone-950 shadow-md` : 'text-stone-500'}`}>ჩართული</button>
                <button onClick={() => setIsMusicPlaying(false)} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${!isMusicPlaying ? 'bg-stone-800 text-stone-200 shadow-md' : 'text-stone-500'}`}>გამორთული</button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2"><Palette size={14}/> თემა (დიზაინი)</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setTheme('wood')} className={`py-3 rounded-xl text-xs font-black border-2 transition-all ${theme === 'wood' ? 'border-amber-500 text-amber-500 bg-amber-500/10' : 'border-transparent bg-stone-950/50 text-stone-500 hover:bg-stone-900'}`}>Classic Wood</button>
                <button onClick={() => setTheme('lavender')} className={`py-3 rounded-xl text-xs font-black border-2 transition-all ${theme === 'lavender' ? 'border-violet-400 text-violet-400 bg-violet-500/10' : 'border-transparent bg-stone-950/50 text-stone-500 hover:bg-stone-900'}`}>Lavender</button>
              </div>
            </div>

            <button onClick={() => setIsSettingsOpen(false)} className="w-full py-3 bg-stone-800 hover:bg-stone-700 border border-white/5 text-stone-300 rounded-xl text-xs font-black transition-all active:scale-95 shadow-inner mt-4">დახურვა</button>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col flex-1 w-full h-full text-stone-100">
        <header className={`${activeTheme.card} flex items-center justify-between border-b border-white/5 backdrop-blur-xl px-4 md:px-8 py-3 md:py-4 sticky top-0 z-40 shadow-lg transition-colors duration-700`}>
          <div className="flex items-center gap-2.5 md:gap-3">
            <div className={`p-1.5 md:p-2 bg-stone-900/80 rounded-lg md:rounded-xl border border-white/10 shadow-inner`}>
              <Shield size={18} className={activeTheme.accent} />
            </div>
            <span className={`text-sm md:text-lg font-black tracking-widest bg-gradient-to-r ${theme === 'lavender' ? 'from-violet-400 to-indigo-300' : 'from-amber-400 to-amber-200'} bg-clip-text text-transparent`}>PHURTI ARENA</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center gap-2.5 bg-stone-900/60 border border-white/5 rounded-xl px-4 py-2 shadow-inner">
              <div className={`w-2 h-2 ${activeTheme.accentBg} rounded-full animate-pulse`} />
              <span className="text-xs font-bold text-stone-200 tracking-wide">{safeUsername}</span>
            </div>
            
            {/* 🟢 პარამეტრების ღილაკი */}
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 md:p-2.5 bg-stone-900/80 border border-white/5 text-stone-400 hover:text-stone-100 rounded-lg md:rounded-xl transition-all active:scale-95 shadow-md">
              <Settings size={15} className="md:w-4 md:h-4" />
            </button>

            <button onClick={handleLogout} className={`p-2 md:p-2.5 bg-stone-900/80 border border-white/5 text-stone-400 hover:${activeTheme.accent} rounded-lg md:rounded-xl transition-all active:scale-95 shadow-md`}>
              <LogOut size={15} className="md:w-4 md:h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1340px] mx-auto p-4 md:p-6 lg:p-8 flex items-center justify-center relative">
          {error && (
            <div className="fixed top-20 md:top-24 right-4 md:right-6 z-50 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 md:px-5 py-2.5 md:py-3 text-[10px] md:text-xs font-black text-rose-400 shadow-2xl backdrop-blur-md animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {!inRoom ? (
            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 items-start">
              <div className="space-y-4 md:space-y-5">
                <div className={`${activeTheme.card} backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-5 space-y-4 md:space-y-5 shadow-2xl transition-colors duration-700`}>
                  <div className="flex items-center gap-3 md:gap-4 border-b border-white/5 pb-3 md:pb-4">
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center font-black text-lg md:text-xl ${activeTheme.accent} border border-white/10 shadow-xl`}>
                      {initial}
                    </div>
                    <div className="truncate">
                      <h2 className="text-sm md:text-base font-black text-stone-100 tracking-wide truncate">{safeUsername}</h2>
                      <p className="text-[10px] md:text-xs text-stone-400 font-medium mt-0.5 truncate">{user?.email || profileData?.email || 'Premium Player'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-stone-950/60 border border-white/5 rounded-lg md:rounded-xl p-2 md:p-2.5 text-center shadow-inner">
                      <p className="text-[8px] md:text-[9px] uppercase font-bold tracking-widest text-stone-500">მატჩი</p>
                      <p className="text-sm md:text-base font-mono font-black text-stone-200 mt-0.5 md:mt-1">{profileData?.stats?.gamesPlayed || 0}</p>
                    </div>
                    <div className="bg-stone-950/60 border border-white/5 rounded-lg md:rounded-xl p-2 md:p-2.5 text-center shadow-inner">
                      <p className="text-[8px] md:text-[9px] uppercase font-bold tracking-widest text-stone-500">მოგება</p>
                      <p className={`text-sm md:text-base font-mono font-black ${activeTheme.accent} mt-0.5 md:mt-1`}>{profileData?.stats?.gamesWon || 0}</p>
                    </div>
                    <div className="bg-stone-950/60 border border-white/5 rounded-lg md:rounded-xl p-2 md:p-2.5 text-center shadow-inner">
                      <p className="text-[8px] md:text-[9px] uppercase font-bold tracking-widest text-stone-500">Win %</p>
                      <p className="text-sm md:text-base font-mono font-black text-emerald-400 mt-0.5 md:mt-1">{winRate}%</p>
                    </div>
                  </div>
                </div>

                <div className={`${activeTheme.card} backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-5 space-y-3 shadow-2xl transition-colors duration-700`}>
                  <h4 className="text-[10px] md:text-xs font-bold text-stone-400 flex items-center gap-2 border-b border-white/5 pb-2.5 md:pb-3 uppercase tracking-widest">
                    <History size={14} className={activeTheme.accent} /> პირადი ისტორია
                  </h4>
                  <div className="space-y-1.5 md:space-y-2 max-h-[140px] md:max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                    {profileData?.gameHistory && profileData.gameHistory.length > 0 ? (
                      profileData.gameHistory.map((h, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 md:p-3 rounded-xl bg-stone-950/40 border border-white/5 text-[10px] md:text-xs transition-all hover:bg-stone-900/60">
                          <span className="font-bold text-stone-300">Room #{h.roomId}</span>
                          <span className={`px-2 md:px-2.5 py-0.5 rounded-md text-[9px] md:text-[10px] font-bold tracking-wide border ${h.isWinner ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-stone-800/50 text-stone-500 border-stone-700/40'}`}>
                            {h.isWinner ? 'WIN' : 'LOSS'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] md:text-xs text-stone-600 font-medium italic py-3 md:py-4 text-center">ისტორია ცარიელია</p>
                    )}
                  </div>
                </div>

                <div className={`${activeTheme.card} backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-5 space-y-3 shadow-2xl transition-colors duration-700`}>
                  <h4 className="text-[10px] md:text-xs font-bold text-stone-400 flex items-center justify-between border-b border-white/5 pb-2.5 md:pb-3 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <User size={14} className={activeTheme.accent} /> ონლაინ მოთამაშეები
                    </div>
                    <span className={`${theme==='lavender'?'bg-violet-500/20 text-violet-400':'bg-amber-500/20 text-amber-400'} px-2 py-0.5 rounded font-mono font-black text-[9px] md:text-[10px]`}>
                      {onlineUser.length}
                    </span>
                  </h4>
                  <div className="space-y-1.5 md:space-y-2 max-h-[140px] md:max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                    {onlineUser.filter(u => u.username !== safeUsername).length > 0 ? (
                      onlineUser.filter(u => u.username !== safeUsername).map(u => (
                        <div key={u.socketId} className={`flex items-center justify-between p-2 md:p-2.5 rounded-xl bg-stone-950/40 border border-white/5 text-[10px] md:text-xs transition-all hover:border-${theme==='lavender'?'violet':'amber'}-500/20`}>
                          <div className="flex items-center gap-2 md:gap-2.5">
                            <div className={`w-1.5 h-1.5 md:w-2 md:h-2 ${activeTheme.accentBg} rounded-full animate-pulse`} />
                            <span className="font-bold text-stone-200 truncate max-w-[80px] md:max-w-[100px]">{u.username}</span>
                          </div>
                          <button onClick={() => handleSendInvite(u.socketId)} className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black bg-stone-800 ${activeTheme.accent} border border-white/5 hover:bg-stone-700 active:scale-95 transition-all flex items-center gap-1 md:gap-1.5 shadow-md`}>
                            <UserPlus size={10} className="md:w-3 md:h-3" /> მოწვევა
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] md:text-xs text-stone-600 font-medium italic py-3 md:py-4 text-center">სხვა მოთამაშეები არ არიან</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4 md:space-y-5 w-full">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <button onClick={() => setIsCreateModalOpen(true)} className={`p-4 md:p-5 bg-gradient-to-r ${theme==='lavender' ? 'from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 border-indigo-800' : 'from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 border-amber-800'} rounded-2xl md:rounded-3xl flex items-center justify-between text-left transition-all shadow-lg active:scale-95 text-stone-950 border-b-2 group`}>
                    <div>
                      <h4 className="font-black text-xs md:text-sm flex items-center gap-1.5 md:gap-2 tracking-wide uppercase"><PlusCircle size={14} className="md:w-4 md:h-4"/> მაგიდის შექმნა</h4>
                      <p className="text-[9px] md:text-xs text-stone-900/80 mt-1 font-bold">გახსენი ოთახი შენი წესებით</p>
                    </div>
                    <Play size={18} className="md:w-5 md:h-5 text-stone-950 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <div className={`${activeTheme.card} backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-3xl p-3 md:p-4 flex gap-2 md:gap-2.5 items-center shadow-2xl transition-colors duration-700`}>
                    <input type="text" placeholder="ოთახის ID..." value={roomId} onChange={(e) => setRoomId(e.target.value)} className={`flex-1 rounded-xl bg-stone-950/60 border border-white/5 px-3 md:px-4 py-2 md:py-2.5 text-[10px] md:text-xs font-bold text-stone-100 outline-none transition-all placeholder-stone-600 shadow-inner focus:border-${theme==='lavender'?'violet':'amber'}-500/40`} />
                    <button onClick={() => handleJoinSpecificRoom(roomId)} className={`px-4 md:px-5 py-2 md:py-2.5 bg-stone-800 hover:bg-stone-700 border border-white/10 ${activeTheme.accent} rounded-xl text-[10px] md:text-xs font-black transition-all active:scale-95 shadow-md`}>შესვლა</button>
                  </div>
                </div>

                <div className={`${activeTheme.card} backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-5 space-y-3 md:space-y-4 shadow-2xl transition-colors duration-700`}>
                  <h3 className="text-[10px] md:text-xs font-bold text-stone-400 flex items-center gap-2 border-b border-white/5 pb-2.5 md:pb-3 uppercase tracking-widest">
                    <Medal size={14} className={activeTheme.accent} /> გლობალური რეიტინგი (TOP 10)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2 max-h-[180px] md:max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {leaderboard.map((player, idx) => (
                      <div key={player._id} className={`flex items-center justify-between p-2 md:p-3 rounded-xl border transition-all ${player.username === safeUsername ? `${theme==='lavender'?'bg-violet-500/10 border-violet-500/40':'bg-amber-500/10 border-amber-500/40'}` : 'bg-stone-950/40 border-white/5 hover:border-white/10'} text-[10px] md:text-xs`}>
                        <div className="flex items-center gap-2 md:gap-3 truncate">
                          <span className={`w-5 h-5 md:w-6 md:h-6 flex items-center justify-center font-mono font-black text-[9px] md:text-[11px] rounded-md md:rounded-lg ${idx === 0 ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30' : idx === 1 ? 'bg-zinc-400/10 text-zinc-400 border border-zinc-400/30' : idx === 2 ? 'bg-amber-700/10 text-amber-500 border border-amber-700/30' : 'bg-stone-800/80 text-stone-500 border border-white/5'}`}>{idx + 1}</span>
                          <span className={`font-bold truncate tracking-wide ${player.username === safeUsername ? activeTheme.accent : 'text-stone-200'}`}>{player.username}</span>
                        </div>
                        <div className="text-stone-400 font-bold font-mono text-[9px] md:text-[11px] bg-stone-950/60 px-1.5 md:px-2 py-0.5 rounded-md border border-white/5 shrink-0">{player.stats?.gamesWon || 0} მოგება</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`${activeTheme.card} backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-5 space-y-3 md:space-y-4 shadow-2xl transition-colors duration-700`}>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5 md:pb-3">
                    <h3 className="text-[10px] md:text-xs font-bold text-stone-400 flex items-center gap-2 uppercase tracking-widest"><LayoutGrid size={14} className={activeTheme.accent} /> აქტიური მაგიდები</h3>
                    <button onClick={() => socket.emit('getLiveRooms')} className={`p-1.5 md:p-2 hover:bg-stone-800 ${activeTheme.accent} rounded-lg md:rounded-xl transition-all bg-stone-950/60 border border-white/5 shadow-md active:scale-95`}><RefreshCw size={12} className="md:w-[13px] md:h-[13px]" /></button>
                  </div>
                  {liveRooms.length === 0 ? (
                    <div className="text-center py-8 md:py-10 border border-dashed border-white/10 rounded-xl bg-stone-950/30">
                      <p className="text-[10px] md:text-xs text-stone-500 font-bold tracking-wide">ამ წამს ღია მაგიდები არ არის. შექმენი შენი!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-3 max-h-[250px] md:max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                      {liveRooms.map((room) => (
                        <div key={room.id} className={`p-3 md:p-4 rounded-xl bg-stone-950/40 border border-white/5 flex flex-col justify-between space-y-2.5 md:space-y-3 shadow-md hover:border-${theme==='lavender'?'violet':'amber'}-500/30 transition-all duration-300`}>
                          <div className="flex justify-between items-center">
                            <div className={`flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs font-black ${activeTheme.accent} font-mono`}>
                              #{room.id} {room.isPrivate ? <Lock size={10} className="md:w-3 md:h-3 text-stone-500" /> : <Unlock size={10} className="md:w-3 md:h-3 text-stone-500" />}
                            </div>
                            <div className="flex gap-1.5 md:gap-2 items-center">
                              {room.isRanked ? (
                                <span className={`text-[8px] md:text-[9px] font-bold ${theme==='lavender'?'text-violet-400 bg-violet-500/10 border-violet-500/20':'text-amber-400 bg-amber-500/10 border-amber-500/20'} px-1.5 md:px-2 py-0.5 rounded border`}>RANKED</span>
                              ) : (
                                <span className="text-[8px] md:text-[9px] font-bold text-stone-400 bg-stone-500/10 px-1.5 md:px-2 py-0.5 rounded border border-stone-500/20">CASUAL</span>
                              )}
                              <span className="text-[9px] md:text-[10px] font-bold text-stone-300 bg-stone-900/80 px-1.5 md:px-2 py-0.5 rounded-md border border-white/5 font-mono shadow-inner">👥 {room.currentPlayers} / {room.maxPlayers}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className="text-[9px] md:text-[11px] font-bold text-stone-400">🎯 {room.targetScore} ქულა</span>
                            <button onClick={() => handleRoomClickFromList(room)} className={`px-3 md:px-4 py-1 md:py-1.5 rounded-lg text-[9px] md:text-[11px] font-black transition-all active:scale-95 ${room.isPrivate ? 'bg-stone-800 border border-white/10 text-stone-300 hover:bg-stone-700' : `bg-gradient-to-r ${theme==='lavender'?'from-violet-600 to-indigo-500':'from-amber-600 to-amber-500'} text-stone-950 shadow-md`}`}>
                              {room.isPrivate ? 'პაროლით' : 'შეერთება'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full">
              {roomData && (
                <>
                  {!roomData.gameStarted ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto py-2 md:py-4">
                      <div className={`${activeTheme.card} backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-6 space-y-4 md:space-y-5 shadow-2xl transition-colors duration-700`}>
                        <div className="border-b border-white/10 pb-3 md:pb-4">
                          <h3 className={`text-lg md:text-xl font-black ${activeTheme.accent} font-mono`}>ROOM #{roomData.id}</h3>
                          <p className="text-[10px] md:text-xs font-bold text-stone-400 mt-1">სათამაშო რიგი: {roomData.players?.length} / {roomData.maxPlayers}</p>
                        </div>
                        <div className="space-y-1.5 md:space-y-2 max-h-[180px] md:max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                          {roomData.players?.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-xl bg-stone-950/60 p-2.5 md:p-3.5 border border-white/5 shadow-inner">
                              <span className="font-bold text-[10px] md:text-xs text-stone-200">{p.name} {p.id === socket.id && '(შენ)'}</span>
                              <span className={`text-[8px] md:text-[10px] font-black px-2 md:px-2.5 py-0.5 md:py-1 rounded-md border ${idx === 0 ? `${theme==='lavender'?'bg-violet-500/10 text-violet-400 border-violet-500/20':'bg-amber-500/10 text-amber-400 border-amber-500/20'}` : 'bg-stone-900 text-stone-500 border-white/5'}`}>{idx === 0 ? 'HOST' : 'READY'}</span>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 md:gap-3 pt-3 md:pt-4 border-t border-white/10">
                          <button onClick={handleResetToLobby} className="py-2.5 md:py-3 bg-stone-800/80 hover:bg-stone-700 border border-white/10 text-stone-300 rounded-xl text-[10px] md:text-xs font-black transition-all active:scale-95 shadow-md">გამოსვლა ↩️</button>
                          {isHost && (
                            <button onClick={() => socket.emit('startGame', { roomId: roomData.id })} className={`py-2.5 md:py-3 bg-gradient-to-r ${theme==='lavender'?'from-violet-600 to-indigo-500 border-indigo-800':'from-amber-600 to-amber-500 border-amber-800'} text-stone-950 rounded-xl text-[10px] md:text-xs font-black transition-all active:scale-95 border-b-2 shadow-lg`}>დაწყება 🎮</button>
                          )}
                        </div>
                      </div>

                      <div className={`${activeTheme.card} backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-6 space-y-4 md:space-y-5 shadow-2xl transition-colors duration-700`}>
                        <h4 className="text-[10px] md:text-xs font-bold text-stone-400 border-b border-white/10 pb-3 md:pb-4 flex items-center gap-2 uppercase tracking-widest"><Target size={14} className={activeTheme.accent} /> მაგიდის წესები</h4>
                        
                        <div className="space-y-2 md:space-y-2.5">
                          <label className="text-[9px] md:text-[10px] font-bold text-stone-500 uppercase tracking-wider">სტატუსი</label>
                          <div className="w-full bg-stone-950 border border-white/5 rounded-xl py-2 md:py-2.5 text-center text-[10px] md:text-xs font-black">
                            {roomData.isRanked ? <span className={activeTheme.accent}>🏆 რეიტინგული</span> : <span className="text-stone-400">🎮 გასართობი (ბოტები)</span>}
                          </div>
                        </div>

                        <div className="space-y-2 md:space-y-2.5 pt-1 md:pt-2">
                          <label className="text-[9px] md:text-[10px] font-bold text-stone-500 uppercase tracking-wider">მიზნობრივი ქულა</label>
                          <div className="grid grid-cols-2 gap-2 md:gap-2.5">
                            {[11, 21].map((score) => (
                              <button key={score} disabled={!isHost} onClick={() => socket.emit('updateConfig', { roomId: roomData.id, targetScore: score, maxPlayers: roomData.maxPlayers, allowBots: roomData.allowBots })} className={`py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all ${roomData.targetScore === score ? `${activeTheme.accentBg} text-stone-950 shadow-md` : 'bg-stone-950 border border-white/5 text-stone-400 hover:bg-stone-900'}`}>{score} ქულამდე</button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2 md:space-y-2.5 pt-1 md:pt-2">
                          <label className="text-[9px] md:text-[10px] font-bold text-stone-500 uppercase tracking-wider">მოთამაშეთა ლიმიტი</label>
                          <div className="grid grid-cols-3 gap-2 md:gap-2.5">
                            {[2, 3, 4].map((num) => (
                              <button key={num} disabled={!isHost} onClick={() => socket.emit('updateConfig', { roomId: roomData.id, targetScore: roomData.targetScore, maxPlayers: num, allowBots: roomData.allowBots })} className={`py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all ${roomData.maxPlayers === num ? `${activeTheme.accentBg} text-stone-950 shadow-md` : 'bg-stone-950 border border-white/5 text-stone-400 hover:bg-stone-900'}`}>{num} კაცი</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <GameBoard room={roomData} socket={socket} onLeave={handleResetToLobby} theme={theme} activeTheme={activeTheme} />
                  )}
                </>
              )}
            </div>
          )}

          {/* 🟢 შექმნის მოდალი */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <form onSubmit={handleConfirmCreateRoom} className={`${activeTheme.card} border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-6 max-w-sm w-full space-y-4 md:space-y-5 shadow-2xl font-sans relative`}>
                <h3 className={`text-sm md:text-base font-black ${activeTheme.accent} border-b border-white/10 pb-2.5 md:pb-3 uppercase tracking-wider`}>ახალი მაგიდის კონფიგურაცია</h3>
                
                <div className="space-y-2 md:space-y-2.5">
                  <label className="text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-wider">🏆 თამაშის ტიპი</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" disabled={mAllowBots} onClick={() => setMIsRanked(true)} className={`py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all ${mIsRanked ? `${activeTheme.accentBg} text-stone-950 shadow-md` : 'bg-stone-950/50 text-stone-400 border border-white/5 hover:bg-stone-900'} ${mAllowBots ? 'opacity-30 cursor-not-allowed' : ''}`}>რეიტინგული</button>
                    <button type="button" onClick={() => setMIsRanked(false)} className={`py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all ${!mIsRanked ? 'bg-stone-500 text-stone-950 shadow-md' : 'bg-stone-950/50 text-stone-400 border border-white/5 hover:bg-stone-900'}`}>გასართობი</button>
                  </div>
                </div>

                <div className="space-y-2 md:space-y-2.5">
                  <label className="text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-wider">🤖 რობოტების დაშვება</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => { setMAllowBots(true); setMIsRanked(false); }} className={`py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all ${mAllowBots ? `${activeTheme.accentBg} text-stone-950 shadow-md` : 'bg-stone-950/50 text-stone-400 border border-white/5 hover:bg-stone-900'}`}>ჩართული</button>
                    <button type="button" onClick={() => setMAllowBots(false)} className={`py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all ${!mAllowBots ? 'bg-stone-500 text-stone-950 shadow-md' : 'bg-stone-950/50 text-stone-400 border border-white/5 hover:bg-stone-900'}`}>გამორთული</button>
                  </div>
                </div>

                <div className="space-y-2 md:space-y-2.5">
                  <label className="text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-wider">მიზნობრივი ქულა</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[11, 21].map(sc => (
                      <button type="button" key={sc} onClick={() => setMTargetScore(sc)} className={`py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all ${mTargetScore === sc ? `${activeTheme.accentBg} text-stone-950 shadow-md` : 'bg-stone-950/50 text-stone-400 border border-white/5 hover:bg-stone-900'}`}>{sc} ქულამდე</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 md:space-y-2.5">
                  <label className="text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-wider">მოთამაშეების ლიმიტი</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[2, 3, 4].map(num => (
                      <button type="button" key={num} onClick={() => setMMaxPlayers(num)} className={`py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all ${mMaxPlayers === num ? `${activeTheme.accentBg} text-stone-950 shadow-md` : 'bg-stone-950/50 text-stone-400 border border-white/5 hover:bg-stone-900'}`}>{num} კაცი</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-wider">ოთახის პაროლი (საჯაროსთვის ცარიელი)</label>
                  <input type="password" value={mRoomPassword} onChange={(e) => setMRoomPassword(e.target.value)} className={`w-full rounded-xl bg-stone-950/80 border border-white/10 px-3 md:px-4 py-2 md:py-2.5 text-[10px] md:text-xs font-bold text-stone-100 focus:border-${theme==='lavender'?'violet':'amber'}-500/50 outline-none placeholder-stone-700 shadow-inner`} placeholder="••••••••" />
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3 pt-2 md:pt-3 border-t border-white/5">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="py-2 md:py-2.5 bg-stone-800 hover:bg-stone-700 border border-white/5 text-stone-300 rounded-xl text-[10px] md:text-xs font-black transition-all active:scale-95 shadow-inner">გაუქმება</button>
                  <button type="submit" className={`py-2 md:py-2.5 bg-gradient-to-r ${theme==='lavender'?'from-violet-600 to-indigo-500 border-indigo-800':'from-amber-600 to-amber-500 border-amber-800'} text-stone-950 rounded-xl text-[10px] md:text-xs font-black transition-all active:scale-95 border-b-2 shadow-lg`}>შექმნა</button>
                </div>
              </form>
            </div>
          )}

          {isPasswordModalOpen && (
            <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className={`${activeTheme.card} border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-5 max-w-xs w-full space-y-3 md:space-y-4 shadow-2xl font-sans`}>
                <h3 className={`text-xs md:text-sm font-black ${activeTheme.accent} border-b border-white/10 pb-2 md:pb-2.5 uppercase tracking-wider`}>დაცული მაგიდა</h3>
                <input type="password" placeholder="შეიყვანე პაროლი..." value={joinPasswordInput} onChange={(e) => setJoinPasswordInput(e.target.value)} className={`w-full rounded-xl bg-stone-950/80 border border-white/10 px-3 md:px-4 py-2 md:py-2.5 text-[10px] md:text-xs font-bold text-stone-100 focus:border-${theme==='lavender'?'violet':'amber'}-500/50 outline-none shadow-inner`} />
                <div className="grid grid-cols-2 gap-2 md:gap-3 pt-1">
                  <button onClick={() => setIsPasswordModalOpen(false)} className="py-2 md:py-2.5 bg-stone-800 hover:bg-stone-700 border border-white/5 text-stone-300 rounded-xl text-[10px] md:text-xs font-black transition-all active:scale-95 shadow-inner">უკან</button>
                  <button onClick={() => handleJoinSpecificRoom(selectedRoomIdForJoin, joinPasswordInput)} className={`py-2 md:py-2.5 bg-gradient-to-r ${theme==='lavender'?'from-violet-600 to-indigo-500 border-indigo-800':'from-amber-600 to-amber-500 border-amber-800'} text-stone-950 rounded-xl text-[10px] md:text-xs font-black transition-all active:scale-95 border-b-2 shadow-lg`}>შესვლა</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}