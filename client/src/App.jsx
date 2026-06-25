import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Auth from './Auth';
import GameBoard from './GameBoard';
// 🟢 დამატებულია ახალი აიკონები მოწვევისთვის (UserPlus, BellRing)
import { Trophy, Shield, PlusCircle, Play, LogOut, RefreshCw, History, User, Target, LayoutGrid, Lock, Unlock, Medal, UserCheck, Star, UserPlus, BellRing } from 'lucide-react';

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

  // 🟢 ონლაინ მოთამაშეების და მოწვევების State
  const [onlineUser, setOnlineUser] = useState([]);
  const [inviteAlert, setInviteAlert] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedRoomIdForJoin, setSelectedRoomIdForJoin] = useState('');
  const [joinPasswordInput, setJoinPasswordInput] = useState('');

  const [mTargetScore, setMTargetScore] = useState(11);
  const [mMaxPlayers, setMMaxPlayers] = useState(4);
  const [mAllowBots, setMAllowBots] = useState(true);
  const [mRoomPassword, setMRoomPassword] = useState('');

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
    
    // 🟢 ვუსმენთ ონლაინ მოთამაშეების განახლებას და მოწვევებს
    socket.on('updateOnlineUsers', (user) => setOnlineUser(user));
    socket.on('receiveInvite', (data) => setInviteAlert(data));

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
          socket.emit('setOnlineUser', uName); // 🟢 ვატყობინებთ სერვერს რომ ონლაინ ვართ
          
          if (savedInRoom && savedRoomId) {
            if (oldSocketId) {
              socket.emit('reconnectUser', { oldSocketId, playerName: uName, roomId: savedRoomId.trim() });
            } else {
              socket.emit('joinRoom', { roomId: savedRoomId.trim(), playerName: uName });
            }
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
      socket.off('updateOnlineUser'); socket.off('receiveInvite');
      socket.off('connect', handleOnConnect);
    };
  }, []);

  useEffect(() => {
    if (userState && !inRoom && safeUsername !== 'მოთამაშე') {
      fetchDashboardData(safeUsername);
      socket.emit('getLiveRooms');
      socket.emit('setOnlineUser', safeUsername); // 🟢 განახლება
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
    if (actualUser?.username) socket.emit('setOnlineUser', actualUser.username); // 🟢 რეგისტრაციის/შესვლისთანავე გამოჩნდება ონლაინში
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
    socket.emit('joinRoom', { roomId: generatedId, playerName: safeUsername, roomPassword: mRoomPassword ? mRoomPassword.trim() : null, maxPlayers: mMaxPlayers, targetScore: mTargetScore, allowBots: mAllowBots });
    setInRoom(true);
    localStorage.setItem('phurti_roomId', generatedId); localStorage.setItem('phurti_inRoom', 'true');
    setIsCreateModalOpen(false); setMRoomPassword('');
  };

  // 🟢 მოწვევის გაგზავნის ლოგიკა
  const handleSendInvite = (targetSocketId) => {
    if (inRoom && roomData) {
      // თუ უკვე ოთახშია, იწვევს თავის ოთახში
      socket.emit('sendInvite', { targetSocketId, roomId: roomData.id, password: roomData.password, fromName: safeUsername });
    } else {
      // თუ ლობიშია, სისტემა ავტომატურად ქმნის ოთახს და იწვევს
      const generatedId = Math.floor(1000 + Math.random() * 9000).toString();
      socket.emit('joinRoom', { roomId: generatedId, playerName: safeUsername, roomPassword: null, maxPlayers: 4, targetScore: 11, allowBots: true });
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

  return (
    <div 
      className="relative flex min-h-screen flex-col font-sans antialiased bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=2560&auto=format&fit=crop')" }}
    >
      <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-[4px] z-0"></div>

      {/* 🟢 შემოსული მოწვევის პრემიუმ მოდალი (ამოხტება ყველგან) */}
      {inviteAlert && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full space-y-5 shadow-[0_0_50px_rgba(16,185,129,0.15)] font-sans text-center relative overflow-hidden animate-in zoom-in duration-200">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse"></div>
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 mb-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <BellRing size={28} className="text-emerald-400" />
            </div>
            <h3 className="text-lg font-black text-stone-100 uppercase tracking-widest">ახალი გამოწვევა!</h3>
            <p className="text-sm font-bold text-stone-400">
              <span className="text-emerald-400 font-black">{inviteAlert.fromName}</span> გიწვევს სათამაშოდ<br/>(Room #{inviteAlert.roomId})
            </p>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
              <button onClick={() => setInviteAlert(null)} className="py-3 bg-stone-800 hover:bg-stone-700 border border-white/5 text-stone-300 rounded-xl text-xs font-black transition-all active:scale-95 shadow-md">უარყოფა</button>
              <button onClick={() => { handleJoinSpecificRoom(inviteAlert.roomId, inviteAlert.password); setInviteAlert(null); }} className="py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-stone-950 rounded-xl text-xs font-black transition-all active:scale-95 border-b-2 border-emerald-800 shadow-[0_0_15px_rgba(16,185,129,0.3)]">შესვლა 🎮</button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col flex-1 w-full h-full text-stone-100">
        <header className="flex items-center justify-between border-b border-white/5 bg-stone-950/40 backdrop-blur-xl px-8 py-4 sticky top-0 z-40 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-900/80 rounded-xl border border-white/10 shadow-inner">
              <Shield size={20} className="text-amber-500" />
            </div>
            <span className="text-lg font-black tracking-widest bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">PHURTI ARENA</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 bg-stone-900/60 border border-white/5 rounded-xl px-4 py-2 shadow-inner">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="text-xs font-bold text-stone-200 tracking-wide">{safeUsername}</span>
            </div>
            <button onClick={handleLogout} className="p-2.5 bg-stone-900/80 border border-white/5 text-stone-400 hover:text-amber-500 hover:border-amber-500/30 rounded-xl transition-all active:scale-95 shadow-md">
              <LogOut size={15} />
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1340px] mx-auto p-4 md:p-6 lg:p-8 flex items-center justify-center relative">
          {error && (
            <div className="fixed top-24 right-6 z-50 rounded-xl bg-rose-500/10 border border-rose-500/20 px-5 py-3 text-xs font-black text-rose-400 shadow-2xl backdrop-blur-md animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {!inRoom ? (
            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* მარცხენა პანელი */}
              <div className="space-y-5">
                {/* პროფილის ბარათი */}
                <div className="bg-stone-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5 space-y-5 shadow-2xl">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center font-black text-xl text-amber-500 border border-white/10 shadow-xl">
                      {initial}
                    </div>
                    <div className="truncate">
                      <h2 className="text-base font-black text-stone-100 tracking-wide truncate">{safeUsername}</h2>
                      <p className="text-xs text-stone-400 font-medium mt-0.5 truncate">{user?.email || profileData?.email || 'Premium Player'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-stone-950/60 border border-white/5 rounded-xl p-2.5 text-center shadow-inner">
                      <p className="text-[9px] uppercase font-bold tracking-widest text-stone-500">მატჩი</p>
                      <p className="text-base font-mono font-black text-stone-200 mt-1">{profileData?.stats?.gamesPlayed || 0}</p>
                    </div>
                    <div className="bg-stone-950/60 border border-white/5 rounded-xl p-2.5 text-center shadow-inner">
                      <p className="text-[9px] uppercase font-bold tracking-widest text-stone-500">მოგება</p>
                      <p className="text-base font-mono font-black text-amber-500 mt-1">{profileData?.stats?.gamesWon || 0}</p>
                    </div>
                    <div className="bg-stone-950/60 border border-white/5 rounded-xl p-2.5 text-center shadow-inner">
                      <p className="text-[9px] uppercase font-bold tracking-widest text-stone-500">Win %</p>
                      <p className="text-base font-mono font-black text-emerald-400 mt-1">{winRate}%</p>
                    </div>
                  </div>
                </div>

                {/* პირადი ისტორია */}
                <div className="bg-stone-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5 space-y-3 shadow-2xl">
                  <h4 className="text-xs font-bold text-stone-400 flex items-center gap-2 border-b border-white/5 pb-3 uppercase tracking-widest">
                    <History size={14} className="text-amber-500" /> პირადი ისტორია
                  </h4>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                    {profileData?.gameHistory && profileData.gameHistory.length > 0 ? (
                      profileData.gameHistory.map((h, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-stone-950/40 border border-white/5 text-xs transition-all hover:bg-stone-900/60">
                          <span className="font-bold text-stone-300">Room #{h.roomId}</span>
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide border ${h.isWinner ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-stone-800/50 text-stone-500 border-stone-700/40'}`}>
                            {h.isWinner ? 'WIN' : 'LOSS'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-stone-600 font-medium italic py-4 text-center">ისტორია ცარიელია</p>
                    )}
                  </div>
                </div>

                {/* 🟢 ონლაინ მოთამაშეები */}
                <div className="bg-stone-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5 space-y-3 shadow-2xl">
                  <h4 className="text-xs font-bold text-stone-400 flex items-center justify-between border-b border-white/5 pb-3 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-emerald-500" /> ონლაინ მოთამაშეები
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-black text-[10px]">
                      {onlineUser.length}
                    </span>
                  </h4>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                    {onlineUser.filter(u => u.username !== safeUsername).length > 0 ? (
                      onlineUser.filter(u => u.username !== safeUsername).map(u => (
                        <div key={u.socketId} className="flex items-center justify-between p-2.5 rounded-xl bg-stone-950/40 border border-white/5 text-xs transition-all hover:border-emerald-500/20">
                          <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                            <span className="font-bold text-stone-200 truncate max-w-[100px]">{u.username}</span>
                          </div>
                          <button onClick={() => handleSendInvite(u.socketId)} className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-stone-800 text-amber-500 border border-white/5 hover:bg-stone-700 hover:text-amber-400 active:scale-95 transition-all flex items-center gap-1.5 shadow-md">
                            <UserPlus size={12} /> მოწვევა
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-stone-600 font-medium italic py-4 text-center">სხვა მოთამაშეები არ არიან</p>
                    )}
                  </div>
                </div>

              </div>

              {/* მარჯვენა დიდი სვეტი */}
              <div className="lg:col-span-2 space-y-5 w-full">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => setIsCreateModalOpen(true)} className="p-5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 rounded-2xl flex items-center justify-between text-left transition-all shadow-[0_10px_20px_rgba(245,158,11,0.2)] active:scale-95 text-stone-950 border-b-2 border-amber-800 group">
                    <div>
                      <h4 className="font-black text-sm flex items-center gap-2 tracking-wide uppercase"><PlusCircle size={16} /> მაგიდის შექმნა</h4>
                      <p className="text-xs text-stone-900/80 mt-1 font-bold">გახსენი ახალი ოთახი ბოტებით ან მეგობრებით</p>
                    </div>
                    <Play size={20} className="text-stone-950 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <div className="bg-stone-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex gap-2.5 items-center shadow-2xl">
                    <input type="text" placeholder="შეიყვანე ოთახის ID..." value={roomId} onChange={(e) => setRoomId(e.target.value)} className="flex-1 rounded-xl bg-stone-950/60 border border-white/5 px-4 py-2.5 text-xs font-bold text-stone-100 focus:border-amber-500/40 outline-none transition-all placeholder-stone-600 shadow-inner" />
                    <button onClick={() => handleJoinSpecificRoom(roomId)} className="px-5 py-2.5 bg-stone-800 hover:bg-stone-700 border border-white/10 text-amber-500 rounded-xl text-xs font-black transition-all active:scale-95 shadow-md">შესვლა</button>
                  </div>
                </div>

                <div className="bg-stone-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5 space-y-4 shadow-2xl">
                  <h3 className="text-xs font-bold text-stone-400 flex items-center gap-2 border-b border-white/5 pb-3 uppercase tracking-widest">
                    <Medal size={14} className="text-amber-500" /> გლობალური რეიტინგი (TOP 10)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {leaderboard.map((player, idx) => (
                      <div key={player._id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${player.username === safeUsername ? 'bg-amber-500/[0.05] border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-stone-950/40 border-white/5 hover:border-white/10'} text-xs`}>
                        <div className="flex items-center gap-3 truncate">
                          <span className={`w-6 h-6 flex items-center justify-center font-mono font-black text-[11px] rounded-lg ${idx === 0 ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 shadow-[0_0_8px_rgba(234,179,8,0.2)]' : idx === 1 ? 'bg-zinc-400/10 text-zinc-400 border border-zinc-400/30' : idx === 2 ? 'bg-amber-700/10 text-amber-500 border border-amber-700/30' : 'bg-stone-800/80 text-stone-500 border border-white/5'}`}>{idx + 1}</span>
                          <span className={`font-bold truncate tracking-wide ${player.username === safeUsername ? 'text-amber-400' : 'text-stone-200'}`}>{player.username}</span>
                        </div>
                        <div className="text-stone-400 font-bold font-mono text-[11px] bg-stone-950/60 px-2 py-0.5 rounded-md border border-white/5 shrink-0">{player.stats?.gamesWon || 0} მოგება</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-stone-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h3 className="text-xs font-bold text-stone-400 flex items-center gap-2 uppercase tracking-widest"><LayoutGrid size={14} className="text-amber-500" /> აქტიური მაგიდები</h3>
                    <button onClick={() => socket.emit('getLiveRooms')} className="p-2 hover:bg-stone-800 text-amber-500 rounded-xl transition-all bg-stone-950/60 border border-white/5 shadow-md active:scale-95"><RefreshCw size={13} /></button>
                  </div>
                  {liveRooms.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-white/10 rounded-xl bg-stone-950/30">
                      <p className="text-xs text-stone-500 font-bold tracking-wide">ამ წამს ღია მაგიდები არ არის. შექმენი შენი!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                      {liveRooms.map((room) => (
                        <div key={room.id} className="p-4 rounded-xl bg-stone-950/40 border border-white/5 flex flex-col justify-between space-y-3 shadow-md hover:border-amber-500/30 transition-all duration-300">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5 text-xs font-black text-amber-500 font-mono">
                              #{room.id} {room.isPrivate ? <Lock size={13} className="text-stone-500" /> : <Unlock size={13} className="text-stone-500" />}
                            </div>
                            <span className="text-[10px] font-bold text-stone-300 bg-stone-900/80 px-2 py-0.5 rounded-md border border-white/5 font-mono shadow-inner">👥 {room.currentPlayers} / {room.maxPlayers}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
                            <span className="text-[11px] font-bold text-stone-400">🎯 {room.targetScore} ქულა</span>
                            <button onClick={() => handleRoomClickFromList(room)} className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all active:scale-95 ${room.isPrivate ? 'bg-stone-800 border border-white/10 text-stone-300 hover:bg-stone-700' : 'bg-amber-600 text-stone-950 hover:bg-amber-500 shadow-md'}`}>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto py-4">
                      <div className="bg-stone-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl">
                        <div className="border-b border-white/10 pb-4">
                          <h3 className="text-xl font-black text-amber-400 font-mono">ROOM #{roomData.id}</h3>
                          <p className="text-xs font-bold text-stone-400 mt-1">სათამაშო რიგი: {roomData.players?.length} / {roomData.maxPlayers}</p>
                        </div>
                        <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                          {roomData.players?.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-xl bg-stone-950/60 p-3.5 border border-white/5 shadow-inner">
                              <span className="font-bold text-xs text-stone-200">{p.name} {p.id === socket.id && '(შენ)'}</span>
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-md border ${idx === 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-stone-900 text-stone-500 border-white/5'}`}>{idx === 0 ? 'HOST' : 'READY'}</span>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                          <button onClick={handleResetToLobby} className="py-3 bg-stone-800/80 hover:bg-stone-700 border border-white/10 text-stone-300 rounded-xl text-xs font-black transition-all active:scale-95 shadow-md">გამოსვლა ↩️</button>
                          {isHost && (
                            <button onClick={() => socket.emit('startGame', { roomId: roomData.id })} className="py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 rounded-xl text-xs font-black transition-all active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.3)] border-b-2 border-amber-800">დაწყება 🎮</button>
                          )}
                        </div>
                      </div>

                      <div className="bg-stone-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl">
                        <h4 className="text-xs font-bold text-stone-400 border-b border-white/10 pb-4 flex items-center gap-2 uppercase tracking-widest"><Target size={14} className="text-amber-500" /> მაგიდის წესები</h4>
                        <div className="space-y-2.5">
                          <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">მიზნობრივი ქულა</label>
                          <div className="grid grid-cols-2 gap-2.5">
                            {[11, 21].map((score) => (
                              <button key={score} disabled={!isHost} onClick={() => socket.emit('updateConfig', { roomId: roomData.id, targetScore: score, maxPlayers: roomData.maxPlayers, allowBots: roomData.allowBots })} className={`py-2.5 rounded-xl text-xs font-black transition-all ${roomData.targetScore === score ? 'bg-amber-600 text-stone-950 font-black shadow-md' : 'bg-stone-950 border border-white/5 text-stone-400 hover:bg-stone-900'}`}>{score} ქულამდე</button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2.5 pt-2">
                          <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">მოთამაშეთა ლიმიტი</label>
                          <div className="grid grid-cols-3 gap-2.5">
                            {[2, 3, 4].map((num) => (
                              <button key={num} disabled={!isHost} onClick={() => socket.emit('updateConfig', { roomId: roomData.id, targetScore: roomData.targetScore, maxPlayers: num, allowBots: roomData.allowBots })} className={`py-2.5 rounded-xl text-xs font-black transition-all ${roomData.maxPlayers === num ? 'bg-amber-600 text-stone-950 font-black shadow-md' : 'bg-stone-950 border border-white/5 text-stone-400 hover:bg-stone-900'}`}>{num} კაცი</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <GameBoard room={roomData} socket={socket} onLeave={handleResetToLobby} />
                  )}
                </>
              )}
            </div>
          )}

          {isCreateModalOpen && (
            <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <form onSubmit={handleConfirmCreateRoom} className="bg-stone-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] font-sans">
                <h3 className="text-base font-black text-amber-400 border-b border-white/10 pb-3 uppercase tracking-wider">ახალი მაგიდის კონფიგურაცია</h3>
                <div className="space-y-2.5">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">მიზნობრივი ქულა</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[11, 21].map(sc => (
                      <button type="button" key={sc} onClick={() => setMTargetScore(sc)} className={`py-2.5 rounded-xl text-xs font-black transition-all ${mTargetScore === sc ? 'bg-amber-600 text-stone-950 shadow-md' : 'bg-stone-950 text-stone-400 border border-white/5 hover:bg-stone-900'}`}>{sc} ქულამდე</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">მოთამაშეების ლიმიტი</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[2, 3, 4].map(num => (
                      <button type="button" key={num} onClick={() => setMMaxPlayers(num)} className={`py-2.5 rounded-xl text-xs font-black transition-all ${mMaxPlayers === num ? 'bg-amber-600 text-stone-950 shadow-md' : 'bg-stone-950 text-stone-400 border border-white/5 hover:bg-stone-900'}`}>{num} კაცი</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">🤖 რობოტების დაშვება</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setMAllowBots(true)} className={`py-2.5 rounded-xl text-xs font-black transition-all ${mAllowBots ? 'bg-amber-600 text-stone-950 shadow-md' : 'bg-stone-950 text-stone-400 border border-white/5 hover:bg-stone-900'}`}>ჩართული</button>
                    <button type="button" onClick={() => setMAllowBots(false)} className={`py-2.5 rounded-xl text-xs font-black transition-all ${!mAllowBots ? 'bg-amber-600 text-stone-950 shadow-md' : 'bg-stone-950 text-stone-400 border border-white/5 hover:bg-stone-900'}`}>გამორთული</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">ოთახის პაროლი (საჯაროსთვის ცარიელი)</label>
                  <input type="password" value={mRoomPassword} onChange={(e) => setMRoomPassword(e.target.value)} className="w-full rounded-xl bg-stone-950/80 border border-white/10 px-4 py-2.5 text-xs font-bold text-stone-100 focus:border-amber-500/50 outline-none placeholder-stone-700 shadow-inner" placeholder="••••••••" />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="py-2.5 bg-stone-800 hover:bg-stone-700 border border-white/5 text-stone-300 rounded-xl text-xs font-black transition-all active:scale-95 shadow-inner">გაუქმება</button>
                  <button type="submit" className="py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 rounded-xl text-xs font-black transition-all active:scale-95 border-b-2 border-amber-800 shadow-[0_0_15px_rgba(245,158,11,0.2)]">შექმნა</button>
                </div>
              </form>
            </div>
          )}

          {isPasswordModalOpen && (
            <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-stone-900 border border-white/10 rounded-2xl p-5 max-w-xs w-full space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] font-sans">
                <h3 className="text-sm font-black text-amber-400 border-b border-white/10 pb-2.5 uppercase tracking-wider">დაცული მაგიდა</h3>
                <input type="password" placeholder="შეიყვანე პაროლი..." value={joinPasswordInput} onChange={(e) => setJoinPasswordInput(e.target.value)} className="w-full rounded-xl bg-stone-950/80 border border-white/10 px-4 py-2.5 text-xs font-bold text-stone-100 focus:border-amber-500/50 outline-none shadow-inner" />
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button onClick={() => setIsPasswordModalOpen(false)} className="py-2.5 bg-stone-800 hover:bg-stone-700 border border-white/5 text-stone-300 rounded-xl text-xs font-black transition-all active:scale-95 shadow-inner">უკან</button>
                  <button onClick={() => handleJoinSpecificRoom(selectedRoomIdForJoin, joinPasswordInput)} className="py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 rounded-xl text-xs font-black transition-all active:scale-95 border-b-2 border-amber-800 shadow-[0_0_15px_rgba(245,158,11,0.2)]">შესვლა</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}