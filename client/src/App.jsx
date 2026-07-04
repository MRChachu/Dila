import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Auth from './Auth';
import GameBoard from './GameBoard';
import { Shield, PlusCircle, Play, LogOut, RefreshCw, User, Target, LayoutGrid, Lock, Unlock, Medal, UserPlus, BellRing, Settings, Music, Award, CheckCircle2, XCircle, Swords, Gift, ShoppingCart, Coins, Eye, Crown } from 'lucide-react';

const socket = io('https://purti.onrender.com');

const AVAILABLE_BADGES = [
  { id: 'first_win', icon: '🥇', name: 'პირველი მოგება' },
  { id: 'diamond_10', icon: '💎', name: '10 აგური' },
  { id: 'club_2', icon: '♣️', name: '2 ჯვარი' },
  { id: 'veteran', icon: '🛡️', name: 'ვეტერანი (10 მატჩი)' },
  { id: 'sweeper', icon: '🧹', name: 'მესუფთავე (J)' }
];

const SHOP_ITEMS = {
  avatars: [
    { id: '😎', price: 0, name: 'სტანდარტული' },
    { id: '🥷', price: 100, name: 'ნინძა' },
    { id: '🧙‍♂️', price: 250, name: 'ჯადოქარი' },
    { id: '🧛', price: 400, name: 'ვამპირი' },
    { id: '👑', price: 800, name: 'მეფე' },
    { id: '🦁', price: 1200, name: 'ლომი' },
    { id: '🦅', price: 1500, name: 'არწივი' },
    { id: '🐉', price: 2500, name: 'დრაკონი' }
  ],
  tables: [
    { id: 'wood', price: 0, name: 'Classic Wood' },
    { id: 'lavender', price: 0, name: 'Soft Lavender' },
    { id: 'casino', price: 1500, name: 'Dark Casino' },
    { id: 'midnight', price: 2500, name: 'Midnight Gold' }
  ],
  cards: [
    { id: 'classic', price: 0, name: 'Classic Blue' },
    { id: 'crimson', price: 500, name: 'Deep Crimson' },
    { id: 'gold', price: 1000, name: 'Solid Gold' },
    { id: 'obsidian', price: 2000, name: 'Obsidian Black' }
  ]
};

// 🟢 VIP ფუნქციები
export const checkIsVip = (vipDate) => {
  return vipDate && new Date(vipDate) > new Date();
};

export const VipName = ({ name, isVip, className = '' }) => {
  if (isVip) {
    return (
      <span className={`bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent font-black drop-shadow-[0_0_6px_rgba(251,191,36,0.6)] animate-pulse ${className}`}>
        👑 {name}
      </span>
    );
  }
  return <span className={className}>{name}</span>;
};

export default function App() {
  const [userState, setUserState] = useState(() => {
    const savedUser = localStorage.getItem('phurti_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const user = userState?.user || userState; 
  const safeUsername = user?.username || 'მოთამაშე';

  const [roomId, setRoomId] = useState(() => localStorage.getItem('phurti_roomId') || '');
  const [inRoom, setInRoom] = useState(() => localStorage.getItem('phurti_inRoom') === 'true');
  const [roomData, setRoomData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [liveRooms, setLiveRooms] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]); 
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const [onlineUser, setOnlineUser] = useState([]);
  const [inviteAlert, setInviteAlert] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const [isShopOpen, setIsShopOpen] = useState(false); 
  const [shopTab, setShopTab] = useState('vip'); 
  const [inspectProfile, setInspectProfile] = useState(null); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [isMusicPlaying, setIsMusicPlaying] = useState(() => localStorage.getItem('phurti_music') === 'true');
  const audioRef = useRef(typeof Audio !== 'undefined' ? new Audio('/bg-music.mp3') : null);

  const [selectedRoomIdForJoin, setSelectedRoomIdForJoin] = useState('');
  const [joinPasswordInput, setJoinPasswordInput] = useState('');

  // 🟢 ნაგულისხმევად არჩეულია რეიტინგული რეჟიმი და გამორთულია ბოტები
  const [mTargetScore, setMTargetScore] = useState(11);
  const [mMaxPlayers, setMMaxPlayers] = useState(4);
  const [mAllowBots, setMAllowBots] = useState(false);
  const [mRoomPassword, setMRoomPassword] = useState('');
  const [mIsRanked, setMIsRanked] = useState(true); 

  const [socialTab, setSocialTab] = useState('online');

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.volume = 0.15; 
      if (isMusicPlaying && userState) {
        audioRef.current.play().catch(e => console.log("Autoplay prevented:", e));
      } else {
        audioRef.current.pause();
      }
      localStorage.setItem('phurti_music', isMusicPlaying);
    }
  }, [isMusicPlaying, userState]);

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

    socket.on('successMessage', (msg) => setToastMsg(msg));
    socket.on('friendRequestReceived', (sender) => {
      setToastMsg(`${sender}-მ მეგობრობის თხოვნა გამოგიგზავნა!`);
      fetchDashboardData(safeUsername);
    });
    socket.on('friendListUpdated', () => fetchDashboardData(safeUsername));
    
    socket.on('receiveUserProfile', (data) => setInspectProfile(data)); 
    socket.on('roomNotFound', () => handleResetToLobby());

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
      socket.off('updateOnlineUsers'); socket.off('receiveInvite'); socket.off('successMessage'); socket.off('friendRequestReceived'); socket.off('friendListUpdated'); socket.off('receiveUserProfile'); socket.off('roomNotFound');
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

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

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
      setTimeout(() => { socket.emit('sendInvite', { targetSocketId, roomId: generatedId, password: null, fromName: safeUsername }); }, 300);
    }
  };

  const handleSendFriendReq = (targetName) => socket.emit('sendFriendRequest', { targetUsername: targetName });
  const handleAcceptFriend = (senderName) => socket.emit('acceptFriendRequest', { senderUsername: senderName });
  const handleRejectFriend = (senderName) => socket.emit('rejectFriendRequest', { senderUsername: senderName });

  const handleBuyItem = (type, itemId, price) => socket.emit('buyItem', { type, itemId, price });
  const handleEquipItem = (type, itemId) => socket.emit('equipItem', { type, itemId });
  const handleBuyVip = (days, price) => socket.emit('buyVip', { days, price });

  const handleInspectPlayer = (username) => socket.emit('getUserProfile', { username });

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
  const currentLevel = profileData?.level || 1;
  const currentXp = profileData?.xp || 0;
  const targetXp = currentLevel * 1000;
  const xpPercentage = Math.min((currentXp / targetXp) * 100, 100);
  
  const myCoins = profileData?.coins || 0;
  const myAvatar = profileData?.avatar || '😎';
  const amIVip = checkIsVip(profileData?.vipUntil); 
  
  const unlockedAvatars = profileData?.unlockedAvatars || ['😎'];
  const unlockedTables = profileData?.unlockedTableThemes || ['wood', 'lavender'];
  const unlockedCards = profileData?.unlockedCardBacks || ['classic'];

  const isHost = roomData && roomData.players[0] && roomData.players[0].id === socket.id;
  const myAchievements = profileData?.achievements || [];

  const themeStyles = {
    wood: { bg: "linear-gradient(135deg, #2c1a0f 0%, #0d0805 100%)", overlay: "bg-black/10", accent: "text-amber-500", accentBg: "bg-amber-500", card: "bg-stone-900/80" },
    lavender: { bg: "linear-gradient(135deg, #251b38 0%, #0f0a1a 100%)", overlay: "bg-black/10", accent: "text-violet-400", accentBg: "bg-violet-500", card: "bg-indigo-950/70" },
    casino: { bg: "linear-gradient(135deg, #062615 0%, #020c06 100%)", overlay: "bg-black/20", accent: "text-emerald-400", accentBg: "bg-emerald-500", card: "bg-stone-950/80" },
    midnight: { bg: "linear-gradient(135deg, #0b1120 0%, #03050a 100%)", overlay: "bg-black/10", accent: "text-yellow-500", accentBg: "bg-yellow-500", card: "bg-slate-900/70" }
  };

  const activeThemeName = (inRoom && roomData?.hostTheme) ? roomData.hostTheme : (profileData?.tableTheme || 'wood');
  const activeTheme = themeStyles[activeThemeName] || themeStyles['wood'];

  return (
    <div className="relative flex min-h-screen flex-col font-sans antialiased transition-all duration-700" style={{ background: activeTheme.bg }}>
      <div className={`absolute inset-0 ${activeTheme.overlay} backdrop-blur-[4px] z-0 transition-colors duration-700`}></div>

      {error && (
        <div className={`fixed top-20 md:top-24 right-4 md:right-6 z-50 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 md:px-5 py-2.5 md:py-3 text-[10px] md:text-xs font-black text-rose-400 shadow-2xl backdrop-blur-md animate-in fade-in duration-200 flex items-center gap-2`}>
          <XCircle size={14} /> {error}
        </div>
      )}

      {toastMsg && (
        <div className={`fixed top-20 md:top-24 left-1/2 -translate-x-1/2 z-50 rounded-xl ${activeTheme.accentBg} bg-opacity-10 border-opacity-30 border-current ${activeTheme.accent} border px-4 md:px-5 py-2.5 md:py-3 text-[10px] md:text-xs font-black shadow-2xl backdrop-blur-md animate-in slide-in-from-top-10 duration-300 flex items-center gap-2`}>
          <CheckCircle2 size={14} /> {toastMsg}
        </div>
      )}

      {inviteAlert && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className={`bg-stone-900 border border-opacity-30 border-current ${activeTheme.accent} rounded-2xl p-6 max-w-sm w-full space-y-5 shadow-[0_0_50px_rgba(0,0,0,0.3)] font-sans text-center relative overflow-hidden animate-in zoom-in duration-200`}>
            <div className={`absolute top-0 left-0 w-full h-1 ${activeTheme.accentBg} animate-pulse`}></div>
            <div className={`w-16 h-16 ${activeTheme.accentBg} bg-opacity-10 border-opacity-30 border-current rounded-full flex items-center justify-center mx-auto border mb-2 shadow-lg`}>
              <BellRing size={28} />
            </div>
            <h3 className="text-lg font-black text-stone-100 uppercase tracking-widest">ახალი გამოწვევა!</h3>
            <p className="text-sm font-bold text-stone-400">
              <span className="font-black">{inviteAlert.fromName}</span> გიწვევს სათამაშოდ<br/>(Room #{inviteAlert.roomId})
            </p>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
              <button onClick={() => setInviteAlert(null)} className="py-3 bg-stone-800 hover:bg-stone-700 border border-white/5 text-stone-300 rounded-xl text-xs font-black transition-all active:scale-95 shadow-md">უარყოფა</button>
              <button onClick={() => { handleJoinSpecificRoom(inviteAlert.roomId, inviteAlert.password); setInviteAlert(null); }} className={`py-3 ${activeTheme.accentBg} text-stone-950 rounded-xl text-xs font-black transition-all active:scale-95 shadow-lg`}>შესვლა 🎮</button>
            </div>
          </div>
        </div>
      )}

      {inspectProfile && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={(e) => { if(e.target === e.currentTarget) setInspectProfile(null); }}>
          <div className={`${activeTheme.card} border border-white/10 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl font-sans relative animate-in zoom-in-95 duration-200`}>
            <div className="flex flex-col items-center gap-3 mb-6">
               <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center text-5xl border border-white/10 shadow-xl relative`}>
                 {inspectProfile.avatar || '😎'}
                 <div className={`absolute -bottom-3 w-8 h-8 rounded-full ${activeTheme.accentBg} text-stone-950 flex items-center justify-center text-[10px] font-black border-2 border-stone-900 shadow-md`}>{inspectProfile.level || 1}</div>
               </div>
               <h2 className="text-xl font-black tracking-wide mt-2">
                 <VipName name={inspectProfile.username} isVip={checkIsVip(inspectProfile.vipUntil)} className="text-stone-100"/>
               </h2>
               <div className="flex gap-2">
                 {!profileData?.friends?.includes(inspectProfile.username) && inspectProfile.username !== safeUsername && (
                    <button onClick={() => { handleSendFriendReq(inspectProfile.username); setInspectProfile(null); }} className={`px-4 py-1.5 rounded-lg text-[10px] font-black ${activeTheme.accentBg} text-stone-950 shadow-md active:scale-95 transition-all flex items-center gap-1.5`}>
                      <UserPlus size={12} /> დამატება
                    </button>
                 )}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="bg-stone-950/60 border border-white/5 rounded-xl p-3 text-center shadow-inner">
                <p className="text-[9px] uppercase font-bold tracking-widest text-stone-500 mb-1">მოგება</p>
                <p className={`text-lg font-mono font-black ${activeTheme.accent}`}>{inspectProfile.stats?.gamesWon || 0}</p>
              </div>
              <div className="bg-stone-950/60 border border-white/5 rounded-xl p-3 text-center shadow-inner">
                <p className="text-[9px] uppercase font-bold tracking-widest text-stone-500 mb-1">Win Rate</p>
                <p className="text-lg font-mono font-black text-emerald-400">
                  {inspectProfile.stats?.gamesPlayed > 0 ? Math.round((inspectProfile.stats.gamesWon / inspectProfile.stats.gamesPlayed) * 100) : 0}%
                </p>
              </div>
            </div>

            <h4 className={`text-[10px] font-bold text-stone-400 flex items-center gap-2 border-b border-white/5 pb-2 uppercase tracking-widest mb-3`}>
              <Award size={14} className={activeTheme.accent} /> მიღწევები
            </h4>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_BADGES.map(b => {
                 const hasIt = inspectProfile.achievements?.includes(b.id);
                 return (
                   <div key={b.id} className={`w-10 h-10 flex items-center justify-center rounded-xl border ${hasIt ? `${activeTheme.accentBg} bg-opacity-20 border-opacity-50 border-current ${activeTheme.accent} text-xl` : 'bg-stone-950/50 border-white/5 text-lg opacity-30 grayscale'}`} title={b.name}>
                     {b.icon}
                   </div>
                 )
              })}
            </div>

            <button onClick={() => setInspectProfile(null)} className="w-full py-3 mt-6 bg-stone-800 hover:bg-stone-700 border border-white/5 text-stone-300 rounded-xl text-xs font-black transition-all active:scale-95 shadow-inner uppercase">დახურვა</button>
          </div>
        </div>
      )}

      {isShopOpen && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`${activeTheme.card} border border-white/10 rounded-3xl p-5 md:p-6 max-w-xl w-full shadow-2xl font-sans relative flex flex-col max-h-[85vh]`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
              <div className="flex gap-2 bg-stone-950/50 p-1 rounded-xl border border-white/5 overflow-x-auto custom-scrollbar">
                <button onClick={() => setShopTab('vip')} className={`px-4 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase transition-all flex items-center gap-1 ${shopTab==='vip' ? `bg-yellow-500 text-stone-950 shadow-[0_0_10px_rgba(234,179,8,0.5)]` : 'text-stone-500 hover:bg-stone-900'}`}><Crown size={14}/> VIP</button>
                <button onClick={() => setShopTab('avatars')} className={`px-4 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase transition-all ${shopTab==='avatars' ? `${activeTheme.accentBg} text-stone-950` : 'text-stone-500 hover:bg-stone-900'}`}>ავატარები</button>
                <button onClick={() => setShopTab('tables')} className={`px-4 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase transition-all ${shopTab==='tables' ? `${activeTheme.accentBg} text-stone-950` : 'text-stone-500 hover:bg-stone-900'}`}>მაგიდები</button>
                <button onClick={() => setShopTab('cards')} className={`px-4 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase transition-all ${shopTab==='cards' ? `${activeTheme.accentBg} text-stone-950` : 'text-stone-500 hover:bg-stone-900'}`}>კარტები</button>
              </div>
              <div className="flex items-center gap-2 bg-stone-950 px-3 py-2 rounded-lg border border-white/5 shrink-0 w-fit">
                 <Coins size={16} className="text-yellow-500"/>
                 <span className="font-mono font-black text-stone-200">{myCoins}</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[300px]">
              
              {shopTab === 'vip' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                  {[
                    { days: 3, price: 1500, title: '3 დღე' },
                    { days: 7, price: 3000, title: '7 დღე', best: true },
                    { days: 30, price: 10000, title: '30 დღე' }
                  ].map(pkg => (
                    <div key={pkg.days} className={`p-4 md:p-5 rounded-2xl flex flex-col items-center justify-between gap-4 border transition-all bg-gradient-to-br ${pkg.best ? 'from-yellow-900/60 to-stone-950 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'from-yellow-900/20 to-stone-950 border-yellow-500/30'}`}>
                      {pkg.best && <span className="absolute -top-3 bg-yellow-500 text-stone-950 text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg uppercase tracking-wider">საუკეთესო ფასი</span>}
                      <span className="text-4xl md:text-5xl drop-shadow-lg">👑</span>
                      <div className="text-center">
                        <p className="text-sm md:text-base font-black text-yellow-500 tracking-wide">{pkg.title}</p>
                        <p className="text-[9px] md:text-[10px] font-bold text-stone-400 mt-1">მანათობელი სახელი და ექსკლუზიური ემოჯები</p>
                      </div>
                      <button onClick={() => handleBuyVip(pkg.days, pkg.price)} className="w-full py-2.5 rounded-xl text-[10px] md:text-xs font-black bg-stone-900 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500 hover:text-stone-950 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md">
                        <Coins size={12} /> {pkg.price}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {shopTab === 'avatars' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {SHOP_ITEMS.avatars.map(item => {
                    const isUnlocked = unlockedAvatars.includes(item.id);
                    const isEquipped = profileData?.avatar === item.id;
                    return (
                      <div key={item.id} className={`p-3 rounded-2xl flex flex-col items-center justify-between gap-2 border transition-all ${isEquipped ? `${activeTheme.accentBg} bg-opacity-20 border-opacity-100 border-current ${activeTheme.accent}` : 'bg-stone-950/50 border-white/5 hover:border-white/20'}`}>
                        <span className="text-3xl md:text-4xl drop-shadow-lg">{item.id}</span>
                        <span className="text-[9px] font-bold text-stone-400 text-center leading-tight">{item.name}</span>
                        {isEquipped ? <button disabled className="w-full py-1.5 rounded-lg text-[8px] font-black bg-stone-800 text-stone-500 uppercase mt-1">დაყენებულია</button> 
                        : isUnlocked ? <button onClick={() => handleEquipItem('avatar', item.id)} className={`w-full py-1.5 rounded-lg text-[8px] font-black ${activeTheme.accentBg} text-stone-950 shadow-md active:scale-95 transition-all uppercase mt-1`}>დაყენება</button>
                        : <button onClick={() => handleBuyItem('avatar', item.id, item.price)} className="w-full py-1.5 rounded-lg text-[9px] font-black bg-stone-800 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/10 active:scale-95 transition-all flex items-center justify-center gap-1 mt-1"><Coins size={10} /> {item.price}</button>}
                      </div>
                    )
                  })}
                </div>
              )}

              {shopTab === 'tables' && (
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {SHOP_ITEMS.tables.map(item => {
                    const isUnlocked = unlockedTables.includes(item.id);
                    const isEquipped = profileData?.tableTheme === item.id || (!profileData?.tableTheme && item.id === 'wood');
                    return (
                      <div key={item.id} className={`p-3 rounded-2xl flex flex-col justify-between gap-3 border transition-all ${isEquipped ? `${activeTheme.accentBg} bg-opacity-20 border-opacity-100 border-current ${activeTheme.accent}` : 'bg-stone-950/50 border-white/5 hover:border-white/20'}`}>
                        <div className="h-16 rounded-xl border border-white/10" style={{ background: themeStyles[item.id]?.bg || themeStyles.wood.bg }}></div>
                        <span className="text-[10px] md:text-xs font-bold text-stone-200 text-center uppercase tracking-widest">{item.name}</span>
                        {isEquipped ? <button disabled className="w-full py-2 rounded-lg text-[9px] font-black bg-stone-800 text-stone-500 uppercase">დაყენებულია</button> 
                        : isUnlocked ? <button onClick={() => handleEquipItem('table', item.id)} className={`w-full py-2 rounded-lg text-[9px] font-black ${activeTheme.accentBg} text-stone-950 shadow-md active:scale-95 transition-all uppercase`}>დაყენება</button>
                        : <button onClick={() => handleBuyItem('table', item.id, item.price)} className="w-full py-2 rounded-lg text-[10px] font-black bg-stone-800 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"><Coins size={12} /> {item.price}</button>}
                      </div>
                    )
                  })}
                </div>
              )}

              {shopTab === 'cards' && (
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {SHOP_ITEMS.cards.map(item => {
                    const isUnlocked = unlockedCards.includes(item.id);
                    const isEquipped = profileData?.cardBack === item.id || (!profileData?.cardBack && item.id === 'classic');
                    
                    const cBg = item.id === 'classic' ? 'bg-blue-900' : item.id === 'crimson' ? 'bg-red-900' : item.id === 'gold' ? 'bg-yellow-600' : 'bg-stone-950';
                    const cBorder = item.id === 'gold' ? 'border-yellow-400' : 'border-white/20';

                    return (
                      <div key={item.id} className={`p-3 rounded-2xl flex flex-col justify-between items-center gap-3 border transition-all ${isEquipped ? `${activeTheme.accentBg} bg-opacity-20 border-opacity-100 border-current ${activeTheme.accent}` : 'bg-stone-950/50 border-white/5 hover:border-white/20'}`}>
                        <div className={`w-12 h-16 rounded-md ${cBg} border-2 ${cBorder} shadow-lg flex items-center justify-center`}><Shield size={16} className={item.id==='gold'?'text-stone-900':'text-white/30'}/></div>
                        <span className="text-[10px] md:text-xs font-bold text-stone-200 text-center uppercase tracking-widest">{item.name}</span>
                        {isEquipped ? <button disabled className="w-full py-2 rounded-lg text-[9px] font-black bg-stone-800 text-stone-500 uppercase">დაყენებულია</button> 
                        : isUnlocked ? <button onClick={() => handleEquipItem('card', item.id)} className={`w-full py-2 rounded-lg text-[9px] font-black ${activeTheme.accentBg} text-stone-950 shadow-md active:scale-95 transition-all uppercase`}>დაყენება</button>
                        : <button onClick={() => handleBuyItem('card', item.id, item.price)} className="w-full py-2 rounded-lg text-[10px] font-black bg-stone-800 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"><Coins size={12} /> {item.price}</button>}
                      </div>
                    )
                  })}
                </div>
              )}

            </div>
            <button onClick={() => setIsShopOpen(false)} className="w-full py-3 bg-stone-800 hover:bg-stone-700 border border-white/5 text-stone-300 rounded-xl text-xs font-black transition-all active:scale-95 shadow-inner mt-4 uppercase">დახურვა</button>
          </div>
        </div>
      )}

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
            <span className={`text-sm md:text-lg font-black tracking-widest ${activeTheme.accent}`}>PHURTI ARENA</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => setIsShopOpen(true)} className="flex items-center gap-1.5 p-2 md:px-3 md:py-2 bg-stone-900/80 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 rounded-lg md:rounded-xl transition-all active:scale-95 shadow-md">
              <ShoppingCart size={15} /> <span className="hidden md:block text-[10px] font-black uppercase">მაღაზია</span>
            </button>
            <button onClick={() => setIsMusicPlaying(!isMusicPlaying)} className={`p-2 md:p-2.5 bg-stone-900/80 border border-white/5 rounded-lg md:rounded-xl transition-all active:scale-95 shadow-md ${isMusicPlaying ? activeTheme.accent : 'text-stone-500'}`}>
              <Music size={15} className="md:w-4 md:h-4" />
            </button>
            <button onClick={handleLogout} className={`p-2 md:p-2.5 bg-stone-900/80 border border-white/5 text-stone-400 hover:${activeTheme.accent} rounded-lg md:rounded-xl transition-all active:scale-95 shadow-md`}>
              <LogOut size={15} className="md:w-4 md:h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1340px] mx-auto p-4 md:p-6 lg:p-8 flex items-center justify-center relative">
          
          {!inRoom ? (
            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 items-start">
              
              <div className="space-y-4 md:space-y-5">
                
                <div className={`${activeTheme.card} backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-5 space-y-4 md:space-y-5 shadow-2xl transition-colors duration-700`}>
                  <div className="flex items-center justify-between border-b border-white/5 pb-3 md:pb-4">
                    <div className="flex items-center gap-3 md:gap-4 cursor-pointer hover:opacity-80 transition-all" onClick={() => handleInspectPlayer(safeUsername)}>
                      <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center font-black text-3xl md:text-4xl border border-white/10 shadow-xl relative`}>
                        {myAvatar}
                        <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ${activeTheme.accentBg} text-stone-950 flex items-center justify-center text-[10px] font-black border-2 border-stone-900 shadow-md`}>{currentLevel}</div>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <h2 className="text-sm md:text-base font-black text-stone-100 tracking-wide truncate flex items-center gap-1.5">
                          <VipName name={safeUsername} isVip={amIVip} /> <Eye size={12} className="text-stone-500"/>
                        </h2>
                        <div className="flex items-center gap-1.5 text-stone-400">
                           <Coins size={12} className="text-yellow-500"/> 
                           <span className="text-[10px] md:text-xs font-mono font-bold">{myCoins}</span>
                           {amIVip && <span className="ml-2 text-[8px] font-black bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/30 tracking-wider">VIP ACTIVE</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 md:space-y-2">
                    <div className="flex justify-between text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      <span>XP პროგრესი</span>
                      <span>{currentXp} / {targetXp}</span>
                    </div>
                    <div className="w-full h-2 md:h-2.5 bg-stone-950 rounded-full overflow-hidden border border-white/5">
                      <div className={`h-full ${activeTheme.accentBg} rounded-full transition-all duration-1000`} style={{ width: `${xpPercentage}%` }}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2">
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
                      <p className={`text-sm md:text-base font-mono font-black ${activeTheme.accent} mt-0.5 md:mt-1`}>{winRate}%</p>
                    </div>
                  </div>
                </div>

                <div className={`${activeTheme.card} backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-5 space-y-3 shadow-2xl transition-colors duration-700`}>
                  <h4 className="text-[10px] md:text-xs font-bold text-stone-400 flex items-center gap-2 border-b border-white/5 pb-2.5 md:pb-3 uppercase tracking-widest">
                    <Award size={14} className={activeTheme.accent} /> მიღწევები
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_BADGES.map((badge) => {
                      const isUnlocked = myAchievements.includes(badge.id);
                      return (
                        <div key={badge.id} className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${isUnlocked ? `${activeTheme.accentBg} bg-opacity-10 border-opacity-30 border-current` : 'bg-stone-950/50 border-white/5 opacity-50 grayscale'}`}>
                          <span className="text-xl md:text-2xl drop-shadow-md">{badge.icon}</span>
                          <span className={`text-[9px] md:text-[10px] font-bold leading-tight ${isUnlocked ? 'text-stone-200' : 'text-stone-500'}`}>{badge.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={`${activeTheme.card} backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-5 space-y-3 shadow-2xl transition-colors duration-700`}>
                  
                  <div className="flex border-b border-white/5 gap-4">
                    <button onClick={() => setSocialTab('online')} className={`pb-2.5 md:pb-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${socialTab === 'online' ? `${activeTheme.accent} border-b-2 border-current` : 'text-stone-500'}`}>
                      ონლაინ ({onlineUser.length})
                    </button>
                    <button onClick={() => setSocialTab('friends')} className={`pb-2.5 md:pb-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${socialTab === 'friends' ? `${activeTheme.accent} border-b-2 border-current` : 'text-stone-500'}`}>
                      მეგობრები
                    </button>
                    <button onClick={() => setSocialTab('requests')} className={`pb-2.5 md:pb-3 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all relative ${socialTab === 'requests' ? `${activeTheme.accent} border-b-2 border-current` : 'text-stone-500'}`}>
                      თხოვნები
                      {profileData?.friendRequests?.length > 0 && (
                        <span className="absolute -top-1 -right-3 w-3.5 h-3.5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px] font-black">{profileData.friendRequests.length}</span>
                      )}
                    </button>
                  </div>

                  <div className="space-y-1.5 md:space-y-2 max-h-[140px] md:max-h-[160px] overflow-y-auto pr-1 custom-scrollbar pt-2">
                    
                    {socialTab === 'online' && (
                      onlineUser.filter(u => u.username !== safeUsername).length > 0 ? (
                        onlineUser.filter(u => u.username !== safeUsername).map(u => (
                          <div key={u.socketId} className={`flex items-center justify-between p-2 md:p-2.5 rounded-xl bg-stone-950/40 border border-white/5 text-[10px] md:text-xs transition-all hover:border-white/10`}>
                            <div className="flex items-center gap-2 md:gap-2.5 cursor-pointer" onClick={() => handleInspectPlayer(u.username)}>
                              <div className={`w-1.5 h-1.5 md:w-2 md:h-2 ${activeTheme.accentBg} rounded-full animate-pulse`} />
                              <span className="font-bold text-stone-200 truncate max-w-[70px] md:max-w-[90px] hover:underline">{u.username}</span>
                            </div>
                            <div className="flex gap-1.5">
                              {!profileData?.friends?.includes(u.username) && (
                                <button onClick={() => handleSendFriendReq(u.username)} title="მეგობრებში დამატება" className={`p-1.5 md:p-2 rounded-lg bg-stone-800 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all shadow-md active:scale-95`}><UserPlus size={12} /></button>
                              )}
                              <button onClick={() => handleSendInvite(u.socketId)} title="თამაშში მოწვევა" className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black bg-stone-800 ${activeTheme.accent} border border-white/5 hover:bg-stone-700 active:scale-95 transition-all flex items-center gap-1.5 shadow-md`}>
                                <Swords size={12} /> მოწვევა
                              </button>
                            </div>
                          </div>
                        ))
                      ) : <p className="text-[10px] md:text-xs text-stone-600 font-medium italic text-center py-4">სხვა მოთამაშეები არ არიან</p>
                    )}

                    {socialTab === 'friends' && (
                      profileData?.friends?.length > 0 ? (
                        profileData.friends.map((friendName, i) => {
                          const isOnline = onlineUser.find(u => u.username === friendName);
                          return (
                            <div key={i} className={`flex items-center justify-between p-2 md:p-2.5 rounded-xl bg-stone-950/40 border border-white/5 text-[10px] md:text-xs transition-all hover:border-white/10`}>
                              <div className="flex items-center gap-2 md:gap-2.5 cursor-pointer" onClick={() => handleInspectPlayer(friendName)}>
                                <div className={`w-1.5 h-1.5 md:w-2 md:h-2 ${isOnline ? activeTheme.accentBg : 'bg-stone-600'} rounded-full`} />
                                <span className={`font-bold truncate max-w-[80px] hover:underline ${isOnline ? 'text-stone-200' : 'text-stone-500'}`}>{friendName}</span>
                              </div>
                              {isOnline && (
                                <button onClick={() => handleSendInvite(isOnline.socketId)} className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black bg-stone-800 ${activeTheme.accent} border border-white/5 hover:bg-stone-700 active:scale-95 transition-all flex items-center gap-1.5 shadow-md`}>
                                  <Swords size={12} /> მოწვევა
                                </button>
                              )}
                            </div>
                          )
                        })
                      ) : <p className="text-[10px] md:text-xs text-stone-600 font-medium italic text-center py-4">მეგობრების სია ცარიელია</p>
                    )}

                    {socialTab === 'requests' && (
                      profileData?.friendRequests?.length > 0 ? (
                        profileData.friendRequests.map((reqName, i) => (
                          <div key={i} className="flex items-center justify-between p-2 md:p-2.5 rounded-xl bg-stone-950/40 border border-white/5 text-[10px] md:text-xs">
                            <span className="font-bold text-stone-200 truncate cursor-pointer hover:underline" onClick={() => handleInspectPlayer(reqName)}>{reqName}</span>
                            <div className="flex gap-1.5">
                              <button onClick={() => handleAcceptFriend(reqName)} className="p-1.5 md:p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all shadow-md active:scale-95"><CheckCircle2 size={12} /></button>
                              <button onClick={() => handleRejectFriend(reqName)} className="p-1.5 md:p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all shadow-md active:scale-95"><XCircle size={12} /></button>
                            </div>
                          </div>
                        ))
                      ) : <p className="text-[10px] md:text-xs text-stone-600 font-medium italic text-center py-4">ახალი თხოვნები არ გაქვს</p>
                    )}

                  </div>
                </div>

              </div>

              <div className="lg:col-span-2 space-y-4 md:space-y-5 w-full">
                
                <div className={`${activeTheme.card} backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-2xl transition-colors duration-700 relative overflow-hidden`}>
                   <div className={`absolute top-0 right-0 w-32 h-32 ${activeTheme.accentBg} opacity-5 blur-[60px] rounded-full`}></div>
                   <h3 className="text-[10px] md:text-xs font-bold text-stone-400 flex items-center gap-2 border-b border-white/5 pb-2.5 md:pb-3 uppercase tracking-widest mb-3">
                    <Target size={14} className={activeTheme.accent} /> ყოველდღიური მისიები
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {profileData?.dailyQuests?.map((q, idx) => {
                      const isDone = q.isCompleted;
                      const p = Math.min((q.progress / q.target) * 100, 100);
                      return (
                        <div key={idx} className={`p-3 md:p-4 rounded-xl border transition-all ${isDone ? 'bg-stone-950/80 border-stone-800' : `bg-stone-950/40 border-white/5`} flex flex-col justify-between`}>
                          <div className="flex justify-between items-start mb-2">
                            <p className={`text-[10px] md:text-xs font-bold ${isDone ? 'text-stone-500 line-through' : 'text-stone-200'} leading-snug`}>{q.title}</p>
                            {isDone ? <CheckCircle2 size={14} className="text-stone-600 shrink-0 ml-2"/> : <Gift size={14} className={`${activeTheme.accent} shrink-0 ml-2`}/>}
                          </div>
                          
                          <div className="space-y-1 mt-auto">
                            <div className="flex justify-between text-[8px] md:text-[9px] font-black uppercase tracking-wider text-stone-500">
                              <span>{q.progress} / {q.target}</span>
                              <span className={isDone ? 'text-stone-600' : activeTheme.accent}>+{q.xpReward} XP</span>
                            </div>
                            <div className="w-full h-1.5 md:h-2 bg-stone-900 rounded-full overflow-hidden">
                              <div className={`h-full ${isDone ? 'bg-stone-700' : activeTheme.accentBg} transition-all duration-1000`} style={{ width: `${p}%` }}></div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <button onClick={() => setIsCreateModalOpen(true)} className={`p-4 md:p-5 bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-900 rounded-2xl md:rounded-3xl flex items-center justify-between text-left transition-all shadow-lg active:scale-95 border-b-4 group`}>
                    <div>
                      <h4 className="font-black text-xs md:text-sm flex items-center gap-1.5 md:gap-2 tracking-wide uppercase"><PlusCircle size={14} className="md:w-4 md:h-4"/> მაგიდის შექმნა</h4>
                      <p className="text-[9px] md:text-xs text-stone-500 mt-1 font-bold">შენი წესებით და შენი დიზაინით!</p>
                    </div>
                    <Play size={18} className="md:w-5 md:h-5 text-stone-900 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <div className={`${activeTheme.card} backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-3xl p-3 md:p-4 flex gap-2 md:gap-2.5 items-center shadow-2xl transition-colors duration-700`}>
                    <input type="text" placeholder="ოთახის ID..." value={roomId} onChange={(e) => setRoomId(e.target.value)} className={`flex-1 rounded-xl bg-stone-950/60 border border-white/5 px-3 md:px-4 py-2 md:py-2.5 text-[10px] md:text-xs font-bold text-stone-100 outline-none transition-all placeholder-stone-600 shadow-inner`} />
                    <button onClick={() => handleJoinSpecificRoom(roomId)} className={`px-4 md:px-5 py-2 md:py-2.5 bg-stone-800 hover:bg-stone-700 border border-white/10 ${activeTheme.accent} rounded-xl text-[10px] md:text-xs font-black transition-all active:scale-95 shadow-md`}>შესვლა</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`${activeTheme.card} backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-5 space-y-3 shadow-2xl transition-colors duration-700`}>
                    <h3 className="text-[10px] md:text-xs font-bold text-stone-400 flex items-center gap-2 border-b border-white/5 pb-2.5 md:pb-3 uppercase tracking-widest">
                      <Medal size={14} className={activeTheme.accent} /> ტოპ 10
                    </h3>
                    <div className="space-y-1.5 md:space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                      {leaderboard.map((player, idx) => (
                        <div key={player._id} className={`flex items-center justify-between p-2 md:p-2.5 rounded-xl border transition-all ${player.username === safeUsername ? 'bg-stone-800 border-stone-500 shadow-md' : 'bg-stone-950/40 border-white/5 hover:border-white/10'} text-[10px] md:text-xs`}>
                          <div className="flex items-center gap-2 md:gap-3 truncate cursor-pointer" onClick={() => handleInspectPlayer(player.username)}>
                            <span className={`w-5 h-5 md:w-6 md:h-6 flex items-center justify-center font-mono font-black text-[9px] md:text-[11px] rounded-md ${idx === 0 ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30' : idx === 1 ? 'bg-zinc-400/10 text-zinc-400 border border-zinc-400/30' : idx === 2 ? 'bg-amber-700/10 text-amber-500 border border-amber-700/30' : 'bg-stone-800/80 text-stone-500 border border-white/5'}`}>{idx + 1}</span>
                            <div className="flex flex-col truncate hover:underline">
                               <span className="font-bold truncate tracking-wide"><VipName name={player.username} isVip={checkIsVip(player.vipUntil)} className={player.username === safeUsername ? activeTheme.accent : 'text-stone-200'} /></span>
                               <span className="text-[8px] font-black text-stone-500">LVL {player.level || 1}</span>
                            </div>
                          </div>
                          <div className="text-stone-400 font-bold font-mono text-[9px] md:text-[11px] bg-stone-950/60 px-1.5 md:px-2 py-0.5 rounded-md border border-white/5 shrink-0">{player.stats?.gamesWon || 0} მოგება</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`${activeTheme.card} backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-5 space-y-3 shadow-2xl transition-colors duration-700`}>
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5 md:pb-3">
                      <h3 className="text-[10px] md:text-xs font-bold text-stone-400 flex items-center gap-2 uppercase tracking-widest"><LayoutGrid size={14} className={activeTheme.accent} /> მაგიდები</h3>
                      <button onClick={() => socket.emit('getLiveRooms')} className={`p-1.5 md:p-2 hover:bg-stone-800 ${activeTheme.accent} rounded-lg bg-stone-950/60 border border-white/5 shadow-md active:scale-95`}><RefreshCw size={12}/></button>
                    </div>
                    {liveRooms.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-white/10 rounded-xl bg-stone-950/30">
                        <p className="text-[10px] md:text-xs text-stone-500 font-bold">მაგიდები არ არის</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                        {liveRooms.map((room) => (
                          <div key={room.id} className="p-2.5 md:p-3 rounded-xl bg-stone-950/40 border border-white/5 flex justify-between items-center shadow-md">
                            <div className="flex flex-col gap-1">
                               <div className={`flex items-center gap-1.5 text-[10px] md:text-xs font-black ${activeTheme.accent} font-mono`}>
                                 <span className="text-xs">{room.hostAvatar || '😎'}</span> 
                                 <VipName name={room.hostName} isVip={checkIsVip(room.hostVip)} /> 
                                 {room.isPrivate && <Lock size={10} className="text-stone-500" />}
                               </div>
                               <div className="flex gap-1.5 items-center">
                                 {room.isRanked ? <span className={`text-[8px] font-bold ${activeTheme.accentBg} bg-opacity-10 border-opacity-20 border-current px-1 py-0.5 rounded border`}>RANKED</span> : <span className="text-[8px] font-bold text-stone-400 bg-stone-500/10 px-1 py-0.5 rounded border border-stone-500/20">CASUAL</span>}
                                 <span className="text-[8px] font-bold text-stone-400 bg-stone-900/80 px-1 py-0.5 rounded border border-white/5 font-mono">👥 {room.currentPlayers}/{room.maxPlayers}</span>
                               </div>
                            </div>
                            <button onClick={() => handleRoomClickFromList(room)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all active:scale-95 ${room.isPrivate ? 'bg-stone-800 border border-white/10 text-stone-300' : `bg-white text-stone-900 shadow-md`}`}>
                              შესვლა
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                        <div className="border-b border-white/10 pb-3 md:pb-4 flex justify-between items-center">
                          <h3 className={`text-lg md:text-xl font-black ${activeTheme.accent} font-mono`}>ROOM #{roomData.id}</h3>
                          <span className="text-[9px] font-bold uppercase tracking-widest bg-stone-950 px-2 py-1 rounded-md border border-white/5 text-stone-400">{roomData.hostTheme || 'wood'} Theme</span>
                        </div>
                        <div className="space-y-1.5 md:space-y-2 max-h-[180px] md:max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                          {roomData.players?.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-xl bg-stone-950/60 p-2.5 md:p-3.5 border border-white/5 shadow-inner">
                              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => handleInspectPlayer(p.name)}>
                                <span className="text-xl">{p.avatar || '😎'}</span>
                                <span className="font-bold text-[10px] md:text-xs text-stone-200"><VipName name={p.name} isVip={checkIsVip(p.vipUntil)} className={p.id === socket.id ? activeTheme.accent : 'text-stone-200'} /></span>
                              </div>
                              <span className={`text-[8px] md:text-[10px] font-black px-2 md:px-2.5 py-0.5 md:py-1 rounded-md border ${idx === 0 ? `${activeTheme.accentBg} bg-opacity-10 border-opacity-30 border-current ${activeTheme.accent}` : 'bg-stone-900 text-stone-500 border-white/5'}`}>{idx === 0 ? 'HOST' : 'READY'}</span>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 md:gap-3 pt-3 md:pt-4 border-t border-white/10">
                          <button onClick={handleResetToLobby} className="py-2.5 md:py-3 bg-stone-800/80 hover:bg-stone-700 border border-white/10 text-stone-300 rounded-xl text-[10px] md:text-xs font-black transition-all active:scale-95 shadow-md">გამოსვლა ↩️</button>
                          {isHost && (
                            <button onClick={() => socket.emit('startGame', { roomId: roomData.id })} className={`py-2.5 md:py-3 bg-white hover:bg-stone-200 text-stone-900 rounded-xl text-[10px] md:text-xs font-black transition-all active:scale-95 border-b-2 border-stone-300 shadow-lg`}>დაწყება 🎮</button>
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
                    <GameBoard room={roomData} socket={socket} onLeave={handleResetToLobby} activeTheme={activeTheme} checkIsVip={checkIsVip} VipName={VipName} />
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* მაგიდის შექმნის მოდალი */}
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
              <input type="password" value={mRoomPassword} onChange={(e) => setMRoomPassword(e.target.value)} className={`w-full rounded-xl bg-stone-950/80 border border-white/10 px-3 md:px-4 py-2 md:py-2.5 text-[10px] md:text-xs font-bold text-stone-100 outline-none placeholder-stone-700 shadow-inner`} placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-2 gap-2 md:gap-3 pt-2 md:pt-3 border-t border-white/5">
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="py-2 md:py-2.5 bg-stone-800 hover:bg-stone-700 border border-white/5 text-stone-300 rounded-xl text-[10px] md:text-xs font-black transition-all active:scale-95 shadow-inner">გაუქმება</button>
              <button type="submit" className={`py-2 md:py-2.5 ${activeTheme.accentBg} text-stone-950 rounded-xl text-[10px] md:text-xs font-black transition-all active:scale-95 shadow-lg`}>შექმნა</button>
            </div>
          </form>
        </div>
      )}

      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`${activeTheme.card} border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-5 max-w-xs w-full space-y-3 md:space-y-4 shadow-2xl font-sans`}>
            <h3 className={`text-xs md:text-sm font-black ${activeTheme.accent} border-b border-white/10 pb-2 md:pb-2.5 uppercase tracking-wider`}>დაცული მაგიდა</h3>
            <input type="password" placeholder="შეიყვანე პაროლი..." value={joinPasswordInput} onChange={(e) => setJoinPasswordInput(e.target.value)} className={`w-full rounded-xl bg-stone-950/80 border border-white/10 px-3 md:px-4 py-2 md:py-2.5 text-[10px] md:text-xs font-bold text-stone-100 outline-none shadow-inner`} />
            <div className="grid grid-cols-2 gap-2 md:gap-3 pt-1">
              <button onClick={() => setIsPasswordModalOpen(false)} className="py-2 md:py-2.5 bg-stone-800 hover:bg-stone-700 border border-white/5 text-stone-300 rounded-xl text-[10px] md:text-xs font-black transition-all active:scale-95 shadow-inner">უკან</button>
              <button onClick={() => handleJoinSpecificRoom(selectedRoomIdForJoin, joinPasswordInput)} className={`py-2 md:py-2.5 ${activeTheme.accentBg} text-stone-950 rounded-xl text-[10px] md:text-xs font-black transition-all active:scale-95 shadow-lg`}>შესვლა</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}