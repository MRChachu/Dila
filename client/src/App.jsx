import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Auth from './Auth';
import GameBoard from './GameBoard';
import DamkaBoard from './DamkaBoard';
import { Shield, PlusCircle, Play, LogOut, RefreshCw, User, Target, LayoutGrid, Lock, Unlock, Medal, UserPlus, BellRing, Settings, Music, Award, CheckCircle2, XCircle, Swords, Gift, ShoppingCart, Coins, Eye, Crown, Trophy, ShieldAlert, Clock, Search, Megaphone, Trash2, Download, Facebook, Instagram, Mail, Send, X, MessageSquare } from 'lucide-react';

const socket = io('https://purti.onrender.com');

const AVAILABLE_BADGES = [{ id: 'first_win', icon: '🥇', name: 'პირველი მოგება' }, { id: 'diamond_10', icon: '💎', name: '10 აგური' }, { id: 'club_2', icon: '♣️', name: '2 ჯვარი' }, { id: 'veteran', icon: '🛡️', name: 'ვეტერანი (10 მატჩი)' }, { id: 'sweeper', icon: '🧹', name: 'მესუფთავე (J)' }, { id: 'collector', icon: '🛍️', name: 'კოლექციონერი (20+ ემოჯი)' }, { id: 'legionnaire', icon: '🔥', name: 'ლეგიონერი (10 Win Streak)' }];
const SHOP_ITEMS = { avatars: [{ id: '😎', price: 0, name: 'სტანდარტული' }, { id: '😉', price: 50, name: 'თვალი' }, { id: '🤪', price: 100, name: 'გიჟი' }, { id: '🥷', price: 100, name: 'ნინძა' }, { id: '🤓', price: 150, name: 'ჭკვიანი' }, { id: '🧐', price: 150, name: 'მონოკლი' }, { id: '🤠', price: 200, name: 'კოვბოი' }, { id: '🥳', price: 200, name: 'წვეულება' }, { id: '🧙‍♂️', price: 250, name: 'ჯადოქარი' }, { id: '👽', price: 250, name: 'უცხოპლანეტელი' }, { id: '👻', price: 300, name: 'მოჩვენება' }, { id: '🤖', price: 300, name: 'რობოტი' }, { id: '🤡', price: 350, name: 'ჯამბაზი' }, { id: '💩', price: 350, name: 'პუპ' }, { id: '💀', price: 400, name: 'თავის ქალა' }, { id: '🧛', price: 400, name: 'ვამპირი' }, { id: '🎃', price: 450, name: 'გოგრა' }, { id: '😺', price: 500, name: 'კატა' }, { id: '🐶', price: 500, name: 'ძაღლი' }, { id: '🐭', price: 500, name: 'თაგვი' }, { id: '🦊', price: 600, name: 'მელია' }, { id: '🐻', price: 600, name: 'დათვი' }, { id: '🐼', price: 650, name: 'პანდა' }, { id: '🐨', price: 700, name: 'კოალა' }, { id: '🐯', price: 700, name: 'ვეფხვი' }, { id: '🐮', price: 750, name: 'ძროხა' }, { id: '🐷', price: 750, name: 'ღორი' }, { id: '👑', price: 800, name: 'მეფე' }, { id: '🐸', price: 800, name: 'ბაყაყი' }, { id: '🐵', price: 850, name: 'მაიმუნი' }, { id: '🐔', price: 850, name: 'ქათამი' }, { id: '🐧', price: 900, name: 'პინგვინი' }, { id: '🐦', price: 900, name: 'ჩიტი' }, { id: '🦆', price: 950, name: 'იხვი' }, { id: '🦉', price: 1000, name: 'ბუ' }, { id: '🦇', price: 1000, name: 'ღამურა' }, { id: '🐺', price: 1100, name: 'მგელი' }, { id: '🐗', price: 1100, name: 'ტახი' }, { id: '🐴', price: 1200, name: 'ცხენი' }, { id: '🦁', price: 1200, name: 'ლომი' }, { id: '🐝', price: 1300, name: 'ფუტკარი' }, { id: '🐛', price: 1300, name: 'მუხლუხო' }, { id: '🦋', price: 1400, name: 'პეპელა' }, { id: '🐌', price: 1400, name: 'ლოკოკინა' }, { id: '🐞', price: 1500, name: 'ჭიამაია' }, { id: '🦅', price: 1500, name: 'არწივი' }, { id: '🎱', price: 1500, name: 'რვიანი' }, { id: '🇬🇪', price: 1500, name: 'საქართველო' }, { id: '🐜', price: 1600, name: 'ჭიანჭველა' }, { id: '🐢', price: 1600, name: 'კუ' }, { id: '🐍', price: 1700, name: 'გველი' }, { id: '🐙', price: 1700, name: 'რვაფეხა' }, { id: '🦑', price: 1800, name: 'კალმარი' }, { id: '🦀', price: 1800, name: 'კიბორჩხალა' }, { id: '🐡', price: 1900, name: 'ფუგუ' }, { id: '🐠', price: 1900, name: 'თევზი' }, { id: '🐬', price: 2000, name: 'დელფინი' }, { id: '🦄', price: 2000, name: 'მარტორქა' }, { id: '🐳', price: 2100, name: 'ვეშაპი' }, { id: '🦈', price: 2200, name: 'ზვიგენი' }, { id: '🐊', price: 2300, name: 'ნიანგი' }, { id: '🐅', price: 2400, name: 'ვეფხვი 2' }, { id: '🐆', price: 2400, name: 'ლეოპარდი' }, { id: '🐉', price: 2500, name: 'დრაკონი' }, { id: '🦍', price: 2600, name: 'გორილა' }, { id: '🐘', price: 2700, name: 'სპილო' }, { id: '🦏', price: 2800, name: 'მარტორქა 2' }, { id: '🐪', price: 2900, name: 'აქლემი' }, { id: '🦒', price: 3000, name: 'ჟირაფი' }, { id: '🦘', price: 3200, name: 'კენგურუ' }, { id: '🦚', price: 3500, name: 'ფარშევანგი' }, { id: '🦢', price: 3800, name: 'გედი' }, { id: '🦩', price: 4000, name: 'ფლამინგო' }, { id: '🐲', price: 4500, name: 'დრაკონის თავი' }, { id: '🍎', price: 500, name: 'ვაშლი' }, { id: '🍓', price: 600, name: 'მარწყვი' }, { id: '🍉', price: 700, name: 'საზამთრო' }, { id: '🍌', price: 800, name: 'ბანანი' }, { id: '🍍', price: 900, name: 'ანანასი' }, { id: '🥝', price: 1000, name: 'კივი' }, { id: '🍔', price: 1200, name: 'ბურგერი' }, { id: '🍕', price: 1500, name: 'პიცა' }, { id: '🌮', price: 1800, name: 'ტაკო' }, { id: '🍣', price: 2000, name: 'სუში' }, { id: '🍩', price: 2200, name: 'დონატი' }, { id: '☕', price: 2500, name: 'ყავა' }, { id: '🍹', price: 2800, name: 'კოქტეილი' }, { id: '🍺', price: 3000, name: 'ლუდი' }, { id: '🍷', price: 3500, name: 'ღვინო' }, { id: '⚽', price: 1000, name: 'ფეხბურთი' }, { id: '🏀', price: 1200, name: 'კალათბურთი' }, { id: '🏈', price: 1500, name: 'რაგბი' }, { id: '🎾', price: 1800, name: 'ჩოგბურთი' }, { id: '🎸', price: 2500, name: 'გიტარა' }, { id: '🎷', price: 3000, name: 'საქსოფონი' }, { id: '🚀', price: 4000, name: 'რაკეტა' }, { id: '🛸', price: 5000, name: 'მფრინავი თეფში' }, { id: '🚁', price: 6000, name: 'ვერტმფრენი' }, { id: '⛵', price: 7000, name: 'იალქნიანი' }, { id: '⚓', price: 8000, name: 'ღუზა' }, { id: '❤️', price: 25000, name: 'გული' }, { id: '♦️', price: 25000, name: 'აგური' }, { id: '♠️', price: 25000, name: 'ყვავი' }, { id: '♣️', price: 25000, name: 'ჯვარი' }], tables: [{ id: 'wood', price: 0, name: 'Classic Wood' }, { id: 'lavender', price: 0, name: 'Soft Lavender' }, { id: 'casino', price: 1500, name: 'Dark Casino' }, { id: 'midnight', price: 2500, name: 'Midnight Gold' }, { id: 'neon', price: 4000, name: 'Cyberpunk Neon' }, { id: 'dark_club', price: 5000, name: 'VIP Dark Club' }, { id: 'vip_gold', price: 'VIP', name: '👑 Royal Gold', isVipExclusive: true }, { id: 'vip_diamond', price: 'VIP', name: '💎 Diamond Lounge', isVipExclusive: true }], cards: [{ id: 'classic', price: 0, name: 'Classic Blue' }, { id: 'crimson', price: 500, name: 'Deep Crimson' }, { id: 'gold', price: 1000, name: 'Solid Gold' }, { id: 'obsidian', price: 2000, name: 'Obsidian Black' }, { id: 'cyber', price: 3000, name: 'Neon Cyber' }, { id: 'royal', price: 4000, name: 'Royal Purple' }, { id: 'hacker', price: 5000, name: 'Matrix Hacker' }] };
const translations = { ka: { top10: "ტოპ 10", shop: "მაღაზია", admin: "ადმინ", settings: "პარამეტრები", xpProgress: "XP პროგრესი", matches: "მატჩი", wins: "მოგება", winRate: "Win %", myHistory: "📜 ჩემი ისტორია", achievements: "მიღწევები", online: "ონლაინ", friends: "მეგობრები", requests: "თხოვნები", noPlayers: "სხვა მოთამაშეები არ არიან", dailyQuests: "ყოველდღიური მისიები", createTable: "მაგიდის შექმნა", customRules: "შენი წესებით და დიზაინით!", join: "შესვლა", tables: "მაგიდები", noTables: "მაგიდები არ არის", music: "ფონური მუსიკა", on: "ჩართული", off: "გამორთული", changePass: "პაროლის შეცვლა", oldPass: "ძველი პაროლი", newPass: "ახალი პაროლი", change: "შეცვლა", close: "დახურვა", ranked: "რეიტინგული", casual: "გასართობი", invite: "მოწვევა", room: "ოთახი", password: "პაროლი", cancel: "გაუქმება", create: "შექმნა", bots: "რობოტები", targetScore: "მიზნობრივი ქულა", playerLimit: "მოთამაშეების ლიმიტი", roomIdPlaceholder: "ოთახის ID...", active: "აქტიურია", emptyHistory: "ისტორია ცარიელია", opponent: "წინააღმდეგ", score: "ქულა", contactUs: "საკონტაქტო", socials: "სოციალური ქსელები", sendMessage: "გაგზავნა", contactDesc: "მოგვწერეთ თქვენი იდეები, შეფასება ან გაასაჩივრეთ მოთამაშე.", complaint: "გასაჩივრება / რეპორტი", feedback: "იდეა / რჩევა", messagePlaceholder: "აღწერეთ დეტალურად...", emailPlaceholder: "თქვენი ელ-ფოსტა (პასუხისთვის)...", contactSuccess: "მადლობა! შეტყობინება მიღებულია." }, en: { top10: "Top 10", shop: "Shop", admin: "Admin", settings: "Settings", xpProgress: "XP Progress", matches: "Matches", wins: "Wins", winRate: "Win %", myHistory: "📜 My History", achievements: "Achievements", online: "Online", friends: "Friends", requests: "Requests", noPlayers: "No other players", dailyQuests: "Daily Quests", createTable: "Create Table", customRules: "With your rules & design!", join: "Join", tables: "Tables", noTables: "No tables available", music: "BG Music", on: "On", off: "Off", changePass: "Change Password", oldPass: "Old Password", newPass: "New Password", change: "Change", close: "Close", ranked: "Ranked", casual: "Casual", invite: "Invite", room: "Room", password: "Password", cancel: "Cancel", create: "Create", bots: "Bots", targetScore: "Target Score", playerLimit: "Player Limit", roomIdPlaceholder: "Room ID...", active: "Active", emptyHistory: "History is empty", opponent: "Versus", score: "Score", contactUs: "Contact Us", socials: "Social Media", sendMessage: "Send", contactDesc: "Send us your feedback, ideas, or report a player.", complaint: "Report Player", feedback: "Feedback / Idea", messagePlaceholder: "Describe in detail...", emailPlaceholder: "Your Email (optional)...", contactSuccess: "Thanks! Message received." }, ru: { top10: "Топ 10", shop: "Магазин", admin: "Админ", settings: "Настройки", xpProgress: "Прогресс XP", matches: "Матчи", wins: "Победы", winRate: "Победы %", myHistory: "📜 Моя история", achievements: "Достижения", online: "Онлайн", friends: "Друзья", requests: "Запросы", noPlayers: "Нет других игроков", dailyQuests: "Ежедневные задания", createTable: "Создать стол", customRules: "С вашими правилами!", join: "Войти", tables: "Столы", noTables: "Нет доступных столов", music: "Музыка", on: "Вкл", off: "Выкл", changePass: "Изменить пароль", oldPass: "Старый пароль", newPass: "Новый пароль", change: "Изменить", close: "Закрыть", ranked: "Рейтинг", casual: "Обычная", invite: "Пригласить", room: "Комната", password: "Пароль", cancel: "Отмена", create: "Создать", bots: "Боты", targetScore: "Целевой счет", playerLimit: "Лимит игроков", roomIdPlaceholder: "ID Комнаты...", active: "Активен", emptyHistory: "История пуста", opponent: "Против", score: "Счет", contactUs: "Контакты", socials: "Соц. сети", sendMessage: "Отправить", contactDesc: "Напишите нам свои идеи, отзывы или подайте жалобу.", complaint: "Жалоба / Репорт", feedback: "Идея / Отзыв", messagePlaceholder: "Опишите подробно...", emailPlaceholder: "Ваш Email (необязательно)...", contactSuccess: "Спасибо! Сообщение получено." } };

export const getLeague = (xp = 0) => { if (xp < 1000) return { name: 'ბრინჯაო', icon: '🥉', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' }; if (xp < 3000) return { name: 'ვერცხლი', icon: '🥈', color: 'text-slate-300', bg: 'bg-slate-300/10', border: 'border-slate-300/20' }; if (xp < 6000) return { name: 'ოქრო', icon: '🥇', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' }; if (xp < 10000) return { name: 'პლატინა', icon: '💎', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' }; return { name: 'ლეგენდა', icon: '👑', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' }; };
export const checkIsVip = (vipDate) => { return vipDate && new Date(vipDate) > new Date(); };
export const VipName = ({ name, isVip, className = '' }) => { if (isVip) { return ( <span className={`bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent font-black drop-shadow-[0_0_6px_rgba(251,191,36,0.6)] animate-pulse ${className}`}> 👑 {name} </span> ); } return <span className={className}>{name}</span>; };
export const DamkaIcon = ({ type = 'red', size = 'md', className = '' }) => { const dims = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-10 h-10', xl: 'w-16 h-16' }[size]; const cs = { sm: 6, md: 10, lg: 20, xl: 32 }[size]; const ibw = size === 'sm' ? 'border-[0.5px]' : size === 'xl' ? 'border-2' : 'border-[1px]'; const obw = size === 'sm' ? 'border-[1px]' : size === 'xl' ? 'border-[3px]' : 'border-[2px]'; const cols = type === 'red' ? 'bg-gradient-to-br from-red-500 to-red-800 border-red-950 shadow-[inset_0_-1px_3px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.6)]' : 'bg-gradient-to-br from-stone-100 to-stone-300 border-stone-400 shadow-[inset_0_-1px_3px_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.6)]'; const ib = type === 'red' ? 'border-red-950' : 'border-stone-400'; const cc = type === 'red' ? 'text-amber-400' : 'text-amber-500'; return ( <div className={`${dims} ${obw} rounded-full flex items-center justify-center shrink-0 ${cols} ${className}`}> <div className={`w-[65%] h-[65%] rounded-full ${ibw} flex items-center justify-center opacity-80 ${ib}`}> <Crown size={cs} strokeWidth={3} className={`${cc} drop-shadow-md`} /> </div> </div> ); };

export default function App() {
  const [userState, setUserState] = useState(() => { const s = localStorage.getItem('phurti_user'); return s ? JSON.parse(s) : null; });
  const user = userState?.user || userState; const safeUsername = user?.username || 'მოთამაშე';
  const [lang, setLang] = useState(() => localStorage.getItem('phurti_lang') || 'ka');
  useEffect(() => { localStorage.setItem('phurti_lang', lang); }, [lang]);
  const t = translations[lang];

  const [roomId, setRoomId] = useState(() => localStorage.getItem('phurti_roomId') || '');
  const [inRoom, setInRoom] = useState(() => localStorage.getItem('phurti_inRoom') === 'true');
  const [roomData, setRoomData] = useState(null); const roomDataRef = useRef(roomData); 
  const [profileData, setProfileData] = useState(null); const [liveRooms, setLiveRooms] = useState([]);
  const [error, setError] = useState(''); const [toastMsg, setToastMsg] = useState('');
  const [onlineUser, setOnlineUser] = useState([]); const [inviteAlert, setInviteAlert] = useState(null);
  const [inviteTarget, setInviteTarget] = useState(null);

  const [isMatchmakingOpen, setIsMatchmakingOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const searchIntervalRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const [startCountdown, setStartCountdown] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false); const [shopTab, setShopTab] = useState('vip'); 
  const [inspectProfile, setInspectProfile] = useState(null); const [isSettingsOpen, setIsSettingsOpen] = useState(false); const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(() => localStorage.getItem('phurti_music') === 'true'); const audioRef = useRef(typeof Audio !== 'undefined' ? new Audio('/bg-music.mp3') : null);
  const [selectedRoomIdForJoin, setSelectedRoomIdForJoin] = useState(''); const [joinPasswordInput, setJoinPasswordInput] = useState('');
  const [mGameType, setMGameType] = useState('phurti'); const [mTargetScore, setMTargetScore] = useState(11); const [mMaxPlayers, setMMaxPlayers] = useState(4); const [mAllowBots, setMAllowBots] = useState(false); const [mRoomPassword, setMRoomPassword] = useState(''); const [mIsRanked, setMIsRanked] = useState(true); 
  const [socialTab, setSocialTab] = useState('online'); const [leaderboard, setLeaderboard] = useState([]); const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false); const [adminPass, setAdminPass] = useState(''); const [adminUsers, setAdminUsers] = useState([]); const [adminMessage, setAdminMessage] = useState(''); const [adminStats, setAdminStats] = useState(null); const [searchQuery, setSearchQuery] = useState(''); const [broadcastText, setBroadcastText] = useState(''); const [systemAlert, setSystemAlert] = useState(null);
  const [dailyReward, setDailyReward] = useState(null); const [vipDailyReward, setVipDailyReward] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null); const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // 🟢 საკონტაქტო ფანჯრის State-ები
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactData, setContactData] = useState({ email: '', subject: 'feedback', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [contactStatus, setContactStatus] = useState('');

  useEffect(() => { const h = (e) => { e.preventDefault(); setDeferredPrompt(e); setShowInstallPrompt(true); }; window.addEventListener('beforeinstallprompt', h); return () => window.removeEventListener('beforeinstallprompt', h); }, []);
  const handleInstallApp = async () => { if (!deferredPrompt) return; deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') { setDeferredPrompt(null); setShowInstallPrompt(false); } };
  useEffect(() => { roomDataRef.current = roomData; }, [roomData]);
  useEffect(() => { if (audioRef.current) { audioRef.current.loop = true; audioRef.current.volume = 0.15; if (isMusicPlaying && userState) audioRef.current.play().catch(e => {}); else audioRef.current.pause(); localStorage.setItem('phurti_music', isMusicPlaying); } }, [isMusicPlaying, userState]);

  const fetchDashboardData = async (username) => { try { const resProf = await fetch(`https://purti.onrender.com/api/auth/profile/${username}`); if (resProf.ok) setProfileData(await resProf.json()); const resLead = await fetch(`https://purti.onrender.com/api/auth/leaderboard`); if (resLead.ok) setLeaderboard(await resLead.json()); } catch (err) {} };
  useEffect(() => { const cd = async () => { if (!safeUsername || safeUsername === 'მოთამაშე') return; try { const r = await fetch('https://purti.onrender.com/api/auth/daily-reward', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: safeUsername }) }); const d = await r.json(); if (d.success) { setDailyReward(d); fetchDashboardData(safeUsername); } } catch (err) {} }; cd(); }, [safeUsername]);

  useEffect(() => {
    socket.on('roomUpdated', (room) => { 
        setRoomData(room); 
        if (room.players.length < room.maxPlayers) setStartCountdown(null);
    });
    socket.on('gameStarted', (room) => { setRoomData(room); setStartCountdown(null); });
    socket.on('gameUpdated', (room) => setRoomData(room));
    socket.on('error', (msg) => setError(msg));
    
    socket.on('gameStartingCountdown', (sec) => {
        setStartCountdown(sec);
        let t = sec;
        const int = setInterval(() => {
            t--;
            if (t <= 0) { clearInterval(int); setStartCountdown(null); }
            else setStartCountdown(t);
        }, 1000);
    });

    socket.on('joinError', (msg) => { setError(msg); socket.emit('leaveRoom'); setInRoom(false); setRoomId(''); setRoomData(null); localStorage.removeItem('phurti_roomId'); localStorage.removeItem('phurti_inRoom'); });
    socket.on('joinedMatchedRoom', (rId) => {
      clearInterval(searchIntervalRef.current); clearTimeout(searchTimeoutRef.current);
      setInRoom(true); setRoomId(rId); localStorage.setItem('phurti_roomId', rId); localStorage.setItem('phurti_inRoom', 'true');
      setIsMatchmakingOpen(false); setIsSearching(false); setSearchFailed(false);
    });

    socket.on('activeRoomsList', (r) => setLiveRooms(r)); socket.on('updateOnlineUsers', (u) => setOnlineUser(u)); socket.on('receiveInvite', (d) => setInviteAlert(d));
    socket.on('inviteRejected', (rN) => { setToastMsg(`${rN}-მ უარყო ❌`); if (roomDataRef.current && roomDataRef.current.players.length === 1) setTimeout(() => handleResetToLobby(), 2500); });
    socket.on('successMessage', (m) => setToastMsg(m)); socket.on('friendRequestReceived', (s) => { setToastMsg(`${s}-მ გამოგიგზავნა!`); fetchDashboardData(safeUsername); });
    socket.on('friendListUpdated', () => fetchDashboardData(safeUsername)); socket.on('receiveUserProfile', (d) => setInspectProfile(d)); socket.on('roomNotFound', () => handleResetToLobby());
    socket.on('vipBonusClaimed', (a) => { setVipDailyReward(a); fetchDashboardData(safeUsername); }); socket.on('systemBroadcast', (m) => setSystemAlert(m));

    const hOC = () => { const o = localStorage.getItem('phurti_socketId'); const u = localStorage.getItem('phurti_user'); const r = localStorage.getItem('phurti_roomId'); const iR = localStorage.getItem('phurti_inRoom') === 'true'; if (u) { const p = JSON.parse(u); const a = p?.user || p; const uN = a?.username; if (uN) { socket.emit('setOnlineUser', uN); if (iR && r) socket.emit('reconnectUser', { oldSocketId: o, playerName: uN, roomId: r.trim() }); else socket.emit('getLiveRooms'); } } localStorage.setItem('phurti_socketId', socket.id); };
    socket.on('connect', hOC); if (socket.connected) hOC();
    return () => { socket.off('roomUpdated'); socket.off('gameStarted'); socket.off('gameUpdated'); socket.off('error'); socket.off('joinError'); socket.off('activeRoomsList'); socket.off('updateOnlineUsers'); socket.off('receiveInvite'); socket.off('inviteRejected'); socket.off('successMessage'); socket.off('friendRequestReceived'); socket.off('friendListUpdated'); socket.off('receiveUserProfile'); socket.off('roomNotFound'); socket.off('vipBonusClaimed'); socket.off('systemBroadcast'); socket.off('joinedMatchedRoom'); socket.off('gameStartingCountdown'); socket.off('connect', hOC); };
  }, []);

  useEffect(() => { if (userState && !inRoom && safeUsername !== 'მოთამაშე') { fetchDashboardData(safeUsername); socket.emit('getLiveRooms'); socket.emit('setOnlineUser', safeUsername); } }, [userState, inRoom, safeUsername]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(''), 4000); return () => clearTimeout(t); } }, [error]);
  useEffect(() => { if (toastMsg) { const t = setTimeout(() => setToastMsg(''), 4000); return () => clearTimeout(t); } }, [toastMsg]);

  const loadLeaderboard = async () => { try { const r = await fetch('https://purti.onrender.com/api/auth/leaderboard'); const d = await r.json(); setLeaderboard(d); setIsLeaderboardOpen(true); } catch(e) {} };
  const loginAdmin = async (e) => { if (e) e.preventDefault(); try { const r = await fetch('https://purti.onrender.com/api/auth/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminPass }) }); const d = await r.json(); if (r.ok) { setAdminUsers(d); const sR = await fetch('https://purti.onrender.com/api/admin/stats'); if (sR.ok) setAdminStats(await sR.json()); } else setAdminMessage(d.message); } catch (e) { setAdminMessage('შეცდომა!'); } };
  const adminAction = async (tU, a, am = 0) => { try { const r = await fetch('https://purti.onrender.com/api/auth/admin/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminPass, targetUser: tU, action: a, amount: am }) }); if (r.ok) { setAdminMessage(`${tU} განახლდა!`); loginAdmin(); } } catch (e) {} };
  const handleAdvancedAdminAction = async (tU, a) => { if (!window.confirm(`ნამდვილად გინდა?`)) return; try { const r = await fetch('https://purti.onrender.com/api/admin/advanced-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminPass, targetUser: tU, action: a }) }); const d = await r.json(); setToastMsg(d.message); if (r.ok) loginAdmin(); } catch (e) {} };
  const handleAuthSuccess = (uD) => { setUserState(uD); localStorage.setItem('phurti_user', JSON.stringify(uD)); const aU = uD?.user || uD; if (aU?.username) socket.emit('setOnlineUser', aU.username); };
  const handleJoinSpecificRoom = (tI, p = '') => { if (!tI || !tI.trim()) return; setError(''); socket.emit('joinRoom', { action: 'join', roomId: tI.trim(), playerName: safeUsername, roomPassword: p }); setInRoom(true); localStorage.setItem('phurti_roomId', tI.trim()); localStorage.setItem('phurti_inRoom', 'true'); setIsPasswordModalOpen(false); setJoinPasswordInput(''); };
  
  const handleConfirmCreateRoom = (e) => {
    e.preventDefault(); const gId = Math.floor(1000 + Math.random() * 9000).toString(); const fM = mGameType === 'damka' ? 2 : mMaxPlayers;
    socket.emit('joinRoom', { action: 'create', roomId: gId, playerName: safeUsername, roomPassword: mRoomPassword ? mRoomPassword.trim() : null, maxPlayers: fM, targetScore: mGameType === 'damka' ? 12 : mTargetScore, allowBots: mAllowBots, isRanked: mIsRanked, gameType: mGameType });
    setInRoom(true); localStorage.setItem('phurti_roomId', gId); localStorage.setItem('phurti_inRoom', 'true'); setIsCreateModalOpen(false); setMRoomPassword('');
  };

  const handleFindMatchSubmit = (e) => {
    e.preventDefault(); setIsSearching(true); setSearchFailed(false);
    const cfg = { playerName: safeUsername, gameType: mGameType, maxPlayers: mGameType === 'damka' ? 2 : mMaxPlayers, isRanked: mIsRanked };
    socket.emit('tryFindMatch', cfg);
    searchIntervalRef.current = setInterval(() => { socket.emit('tryFindMatch', cfg); }, 2000);
    searchTimeoutRef.current = setTimeout(() => {
        clearInterval(searchIntervalRef.current); setIsSearching(false); setSearchFailed(true);
    }, 10000);
  };
  const cancelSearch = () => { clearInterval(searchIntervalRef.current); clearTimeout(searchTimeoutRef.current); setIsSearching(false); setSearchFailed(false); setIsMatchmakingOpen(false); };

  const handleSendInviteClick = (tId, tN) => { if (inRoom && roomData) { socket.emit('sendInvite', { targetSocketId: tId, roomId: roomData.id, password: roomData.password, fromName: safeUsername, gameType: roomData.gameType }); setToastMsg('გაიგზავნა!'); } else setInviteTarget({ socketId: tId, name: tN }); };
  const handleConfirmGameInvite = (sG) => { if (!inviteTarget) return; const gId = Math.floor(1000 + Math.random() * 9000).toString(); const iD = sG === 'damka'; socket.emit('joinRoom', { action: 'create', roomId: gId, playerName: safeUsername, roomPassword: null, maxPlayers: iD ? 2 : 4, targetScore: 11, allowBots: false, isRanked: true, gameType: sG }); setInRoom(true); localStorage.setItem('phurti_roomId', gId); localStorage.setItem('phurti_inRoom', 'true'); setTimeout(() => { socket.emit('sendInvite', { targetSocketId: inviteTarget.socketId, roomId: gId, password: null, fromName: safeUsername, gameType: sG }); setToastMsg('გაიგზავნა!'); }, 300); setInviteTarget(null); };
  const handleSendFriendReq = async (t) => { try { const r = await fetch('https://purti.onrender.com/api/auth/friend/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sender: safeUsername, target: t }) }); const d = await r.json(); setToastMsg(d.message); fetchDashboardData(safeUsername); } catch(e) {} };
  const handleAcceptFriend = async (s) => { try { const r = await fetch('https://purti.onrender.com/api/auth/friend/accept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ me: safeUsername, sender: s }) }); const d = await r.json(); setToastMsg(d.message); fetchDashboardData(safeUsername); } catch(e) {} };
  const handleRejectFriend = async (s) => { try { const r = await fetch('https://purti.onrender.com/api/auth/friend/reject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ me: safeUsername, sender: s }) }); const d = await r.json(); setToastMsg(d.message); fetchDashboardData(safeUsername); } catch(e) {} };
  const handleBuyItem = (t, i, p) => socket.emit('buyItem', { type: t, itemId: i, price: p }); const handleEquipItem = (t, i) => socket.emit('equipItem', { type: t, itemId: i }); const handleBuyVip = (d, p) => socket.emit('buyVip', { days: d, price: p }); const handleInspectPlayer = (u) => socket.emit('getUserProfile', { username: u }); const handleRoomClickFromList = (r) => { if (r.isPrivate) { setSelectedRoomIdForJoin(r.id); setIsPasswordModalOpen(true); } else handleJoinSpecificRoom(r.id); };
  const handleLogout = () => { socket.emit('leaveRoom'); setUserState(null); setInRoom(false); setRoomId(''); setRoomData(null); setProfileData(null); localStorage.clear(); socket.disconnect(); socket.connect(); };
  const handleResetToLobby = () => { socket.emit('leaveRoom'); setInRoom(false); setRoomId(''); setRoomData(null); setStartCountdown(null); localStorage.removeItem('phurti_roomId'); localStorage.removeItem('phurti_inRoom'); };

  // 🟢 საკონტაქტო ფორმის გაგზავნის ლოგიკა
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setContactStatus('');
    try {
      const res = await fetch(`https://purti.onrender.com/api/auth/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });
      const data = await res.json();
      if (res.ok) {
        setContactStatus(t.contactSuccess);
        setContactData({ email: '', subject: 'feedback', message: '' });
        setTimeout(() => { setIsContactOpen(false); setContactStatus(''); }, 3000);
      } else {
        setContactStatus(data.message || 'Error');
      }
    } catch (err) {
      setContactStatus('სერვერთან კავშირი ვერ მოხერხდა');
    } finally {
      setIsSending(false);
    }
  };

  if (!userState) return <Auth onAuthSuccess={handleAuthSuccess} />;

  const winRate = profileData?.stats?.gamesPlayed > 0 ? Math.round((profileData.stats.gamesWon / profileData.stats.gamesPlayed) * 100) : 0; const currentLevel = profileData?.level || 1; const currentXp = profileData?.xp || 0; const targetXp = currentLevel * 1000; const xpPercentage = Math.min((currentXp / targetXp) * 100, 100); const myCoins = profileData?.coins || 0; const myAvatar = profileData?.avatar || '😎'; const amIVip = checkIsVip(profileData?.vipUntil); const myLeague = getLeague(currentXp); const unlockedAvatars = profileData?.unlockedAvatars || ['😎']; const unlockedTables = profileData?.unlockedTableThemes || ['wood', 'lavender']; const unlockedCards = profileData?.unlockedCardBacks || ['classic']; const isHost = roomData && roomData.players[0] && roomData.players[0].id === socket.id; const myAchievements = profileData?.achievements || [];

  const themeStyles = { wood: { bg: "linear-gradient(135deg, #2c1a0f 0%, #0d0805 100%)", overlay: "bg-black/10", accent: "text-amber-500", accentBg: "bg-amber-500", card: "bg-stone-900/80" }, lavender: { bg: "linear-gradient(135deg, #251b38 0%, #0f0a1a 100%)", overlay: "bg-black/10", accent: "text-violet-400", accentBg: "bg-violet-500", card: "bg-indigo-950/70" }, casino: { bg: "linear-gradient(135deg, #062615 0%, #020c06 100%)", overlay: "bg-black/20", accent: "text-emerald-400", accentBg: "bg-emerald-500", card: "bg-stone-950/80" }, midnight: { bg: "linear-gradient(135deg, #0b1120 0%, #03050a 100%)", overlay: "bg-black/10", accent: "text-yellow-500", accentBg: "bg-yellow-500", card: "bg-slate-900/70" }, neon: { bg: "linear-gradient(135deg, #09090b 0%, #020617 100%)", overlay: "bg-fuchsia-900/10", accent: "text-fuchsia-400 drop-shadow-[0_0_5px_rgba(232,121,249,0.8)]", accentBg: "bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.5)]", card: "bg-slate-950/80 border-fuchsia-500/20" }, dark_club: { bg: "radial-gradient(circle at top right, #3f3f46 0%, #000000 100%)", overlay: "bg-rose-900/5", accent: "text-rose-500 drop-shadow-[0_0_5px_rgba(244,63,94,0.6)]", accentBg: "bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.5)]", card: "bg-black/80 border-rose-900/20" }, vip_gold: { bg: "linear-gradient(135deg, #1f1400 0%, #000000 100%)", overlay: "bg-yellow-900/10", accent: "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]", accentBg: "bg-gradient-to-r from-yellow-600 to-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]", card: "bg-black/90 border-yellow-500/30 ring-1 ring-yellow-500/20" }, vip_diamond: { bg: "linear-gradient(135deg, #040e1f 0%, #000000 100%)", overlay: "bg-cyan-900/10", accent: "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]", accentBg: "bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]", card: "bg-black/90 border-cyan-500/30 ring-1 ring-cyan-500/20" } };
  const activeThemeName = (inRoom && roomData?.hostTheme) ? roomData.hostTheme : (profileData?.tableTheme || 'wood'); const activeTheme = themeStyles[activeThemeName] || themeStyles['wood'];

  return (
    <div className="relative flex min-h-screen flex-col font-sans antialiased transition-all duration-700" style={{ background: activeTheme.bg }}>
      <div className={`absolute inset-0 ${activeTheme.overlay} backdrop-blur-[4px] z-0 transition-colors duration-700`}></div>
      {error && <div className="fixed top-20 md:top-24 right-4 md:right-6 z-[100] rounded-2xl bg-stone-900/95 border border-rose-500/20 px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-black shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-md animate-in slide-in-from-right-8 fade-in duration-300 flex items-center gap-3"><div className="flex items-center justify-center p-1 rounded-full bg-rose-500/20 text-rose-500 border border-rose-500/30"><XCircle size={16} className="md:w-5 md:h-5" /></div><span className="text-stone-100 tracking-wide uppercase">{error}</span></div>}
      {toastMsg && <div className="fixed top-20 md:top-24 left-1/2 -translate-x-1/2 z-[100] rounded-2xl bg-stone-900/95 border border-white/10 px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-black shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-md animate-in slide-in-from-top-5 fade-in duration-300 flex items-center gap-3"><div className={`flex items-center justify-center p-1 rounded-full ${activeTheme.accentBg} bg-opacity-20 ${activeTheme.accent} border border-current border-opacity-30`}><CheckCircle2 size={16} className="md:w-5 md:h-5" /></div><span className="text-stone-100 tracking-wide uppercase">{toastMsg}</span></div>}
      
      {/* Invite Target */}
      {inviteTarget && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`${activeTheme.card} border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-6 max-w-sm w-full space-y-4 shadow-2xl font-sans relative text-center`}>
            <h3 className={`text-sm md:text-base font-black ${activeTheme.accent} uppercase tracking-wider mb-2`}>აირჩიე თამაში</h3>
            <p className="text-xs text-stone-400 font-bold mb-4">იწვევთ მოთამაშეს: <span className="text-stone-200">{inviteTarget.name}</span></p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleConfirmGameInvite('phurti')} className="p-4 rounded-2xl flex flex-col items-center gap-2 bg-stone-900 border border-white/10 hover:border-white/30 transition-all shadow-md active:scale-95 group"><span className="text-3xl drop-shadow-md group-hover:scale-110 transition-transform">🃏</span><span className="text-[10px] font-black uppercase tracking-widest text-stone-200">ფურთი</span></button>
              <button onClick={() => handleConfirmGameInvite('damka')} className="p-4 rounded-2xl flex flex-col items-center gap-2 bg-stone-900 border border-white/10 hover:border-white/30 transition-all shadow-md active:scale-95 group"><div className="flex -space-x-3 group-hover:scale-110 transition-transform drop-shadow-md pb-2"><DamkaIcon type="red" size="lg" className="z-10 animate-bounce" /><DamkaIcon type="white" size="lg" className="mt-2 animate-bounce delay-100" /></div><span className="text-[10px] font-black uppercase tracking-widest text-stone-200">შაში</span></button>
            </div>
            <button onClick={() => setInviteTarget(null)} className="w-full mt-4 py-2.5 bg-stone-800 hover:bg-stone-700 border border-white/5 text-stone-300 rounded-xl text-[10px] md:text-xs font-black transition-all active:scale-95 shadow-inner uppercase">გაუქმება</button>
          </div>
        </div>
      )}

      {showInstallPrompt && (
        <div className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-[500] bg-stone-900 border border-cyan-500/30 p-4 rounded-2xl shadow-[0_10px_40px_rgba(6,182,212,0.2)] flex flex-col md:flex-row items-center gap-4 w-[90%] max-w-md animate-in slide-in-from-bottom-5">
           <div className="flex items-center gap-3 w-full"><div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"><Download size={24} /></div><div className="flex flex-col"><span className="text-xs md:text-sm font-black text-stone-100 uppercase tracking-wider">აპლიკაციის დაყენება</span><span className="text-[10px] md:text-xs text-stone-400 font-bold">გადმოწერე და ითამაშე უფრო სწრაფად!</span></div></div>
           <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 shrink-0"><button onClick={() => setShowInstallPrompt(false)} className="px-4 py-2.5 bg-stone-800 text-stone-400 hover:text-white text-[10px] font-black uppercase rounded-xl transition-all border border-white/5 w-full md:w-auto active:scale-95">დახურვა</button><button onClick={handleInstallApp} className="px-5 py-2.5 bg-cyan-500 text-stone-950 hover:bg-cyan-400 text-[10px] font-black uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] w-full md:w-auto active:scale-95">გადმოწერა</button></div>
        </div>
      )}

      {systemAlert && (
        <div className="fixed inset-0 bg-red-950/80 backdrop-blur-md z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-stone-900 border-2 border-red-500 rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-[0_0_80px_rgba(239,68,68,0.5)] relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-500/20 via-stone-900 to-stone-900 z-0"></div>
            <div className="relative z-10"><Megaphone size={56} className="mx-auto text-red-500 mb-4 animate-bounce drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" /><h2 className="text-xl md:text-2xl font-black text-red-500 uppercase tracking-widest mb-4">შეტყობინება!</h2><div className="bg-stone-950/80 rounded-2xl p-4 md:p-5 border border-white/10 shadow-inner mb-6"><p className="text-stone-200 font-bold text-sm md:text-base">{systemAlert}</p></div><button onClick={() => setSystemAlert(null)} className="w-full py-3 md:py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl uppercase transition-all shadow-lg active:scale-95">გასაგებია</button></div>
          </div>
        </div>
      )}

      {inviteAlert && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className={`bg-stone-900 border border-opacity-30 border-current ${activeTheme.accent} rounded-2xl p-6 max-w-sm w-full space-y-5 shadow-[0_0_50px_rgba(0,0,0,0.3)] font-sans text-center relative overflow-hidden animate-in zoom-in duration-200`}>
            <div className={`absolute top-0 left-0 w-full h-1 ${activeTheme.accentBg} animate-pulse`}></div>
            <div className={`w-16 h-16 ${activeTheme.accentBg} bg-opacity-10 border-opacity-30 border-current rounded-full flex items-center justify-center mx-auto border mb-2 shadow-lg`}><BellRing size={28} /></div>
            <h3 className="text-lg font-black text-stone-100 uppercase tracking-widest">ახალი გამოწვევა!</h3>
            <p className="text-sm font-bold text-stone-400 mb-1"><span className="font-black">{inviteAlert.fromName}</span> გიწვევს სათამაშოდ<br/>(Room #{inviteAlert.roomId})</p>
            <div className="bg-stone-950 px-3 py-1 rounded-md text-[10px] text-stone-500 uppercase font-black tracking-widest border border-white/5 inline-flex items-center gap-1.5 justify-center">{inviteAlert.gameType === 'damka' ? <><DamkaIcon type="red" size="sm" /> შაში</> : '🃏 ფურთი'}</div>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5 mt-4">
              <button onClick={() => { socket.emit('rejectInvite', { senderSocketId: inviteAlert.senderSocketId, rejecterName: safeUsername }); setInviteAlert(null); }} className="py-3 bg-stone-800 hover:bg-stone-700 border border-white/5 text-stone-300 rounded-xl text-xs font-black transition-all active:scale-95 shadow-md">უარყოფა</button>
              <button onClick={() => { handleJoinSpecificRoom(inviteAlert.roomId, inviteAlert.password); setInviteAlert(null); }} className={`py-3 ${activeTheme.accentBg} text-stone-950 rounded-xl text-xs font-black transition-all active:scale-95 shadow-lg`}>{t.join} 🎮</button>
            </div>
          </div>
        </div>
      )}

      {inspectProfile && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={(e) => { if(e.target === e.currentTarget) setInspectProfile(null); }}>
          <div className={`${activeTheme.card} border border-white/10 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl font-sans relative animate-in zoom-in-95 duration-200`}>
            <div className="flex flex-col items-center gap-3 mb-6">
               <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center text-5xl border border-white/10 shadow-xl relative`}>{inspectProfile.avatar || '😎'}<div className={`absolute -bottom-3 w-8 h-8 rounded-full ${activeTheme.accentBg} text-stone-950 flex items-center justify-center text-[10px] font-black border-2 border-stone-900 shadow-md`}>{inspectProfile.level || 1}</div></div>
               <h2 className="text-xl font-black tracking-wide mt-2"><VipName name={inspectProfile.username} isVip={checkIsVip(inspectProfile.vipUntil)} className="text-stone-100"/></h2>
               <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${getLeague(inspectProfile.xp || 0).bg} ${getLeague(inspectProfile.xp || 0).border} shadow-sm mb-2`}><span className="text-[12px] drop-shadow-md">{getLeague(inspectProfile.xp || 0).icon}</span><span className={`text-[10px] font-black uppercase tracking-wider ${getLeague(inspectProfile.xp || 0).color}`}>{getLeague(inspectProfile.xp || 0).name}</span></div>
               <div className="flex gap-2">{!profileData?.friends?.includes(inspectProfile.username) && inspectProfile.username !== safeUsername && ( <button onClick={() => { handleSendFriendReq(inspectProfile.username); setInspectProfile(null); }} className={`px-4 py-1.5 rounded-lg text-[10px] font-black ${activeTheme.accentBg} text-stone-950 shadow-md active:scale-95 transition-all flex items-center gap-1.5`}><UserPlus size={12} /> დამატება</button> )}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="bg-stone-950/60 border border-white/5 rounded-xl p-3 text-center shadow-inner"><p className="text-[9px] uppercase font-bold tracking-widest text-stone-500 mb-1">{t.wins}</p><p className={`text-lg font-mono font-black ${activeTheme.accent}`}>{inspectProfile.stats?.gamesWon || 0}</p></div>
              <div className="bg-stone-950/60 border border-white/5 rounded-xl p-3 text-center shadow-inner"><p className="text-[9px] uppercase font-bold tracking-widest text-stone-500 mb-1">{t.winRate}</p><p className="text-lg font-mono font-black text-emerald-400">{inspectProfile.stats?.gamesPlayed > 0 ? Math.round((inspectProfile.stats.gamesWon / inspectProfile.stats.gamesPlayed) * 100) : 0}%</p></div>
            </div>
            <h4 className={`text-[10px] font-bold text-stone-400 flex items-center gap-2 border-b border-white/5 pb-2 uppercase tracking-widest mb-3`}><Award size={14} className={activeTheme.accent} /> {t.achievements}</h4>
            
            <div className="flex flex-nowrap items-center justify-between w-full gap-1">
              {AVAILABLE_BADGES.map(b => { 
                const hasIt = inspectProfile.achievements?.includes(b.id); 
                return ( 
                  <div 
                    key={b.id} 
                    onClick={() => setToastMsg(hasIt ? `🏆 აქვს: ${b.name}` : `🔒 არ აქვს: ${b.name}`)}
                    className={`cursor-pointer shrink-0 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg md:rounded-xl border transition-all hover:scale-110 active:scale-95 ${hasIt ? `${activeTheme.accentBg} bg-opacity-20 border-opacity-50 border-current ${activeTheme.accent} text-sm sm:text-base md:text-lg shadow-[0_0_10px_currentColor]` : 'bg-stone-950/50 border-white/5 text-xs sm:text-sm md:text-base opacity-30 grayscale hover:opacity-80'}`}
                  >
                    <span className="drop-shadow-md">{b.icon}</span>
                  </div> 
                )
              })}
            </div>
            
            <button onClick={() => setInspectProfile(null)} className="w-full py-3 mt-6 bg-stone-800 hover:bg-stone-700 border border-white/5 text-stone-300 rounded-xl text-xs font-black transition-all active:scale-95 shadow-inner uppercase">{t.close}</button>
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
                <button onClick={() => setShopTab('tables')} className={`px-4 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase transition-all ${shopTab==='tables' ? `${activeTheme.accentBg} text-stone-950` : 'text-stone-500 hover:bg-stone-900'}`}>{t.tables}</button>
                <button onClick={() => setShopTab('cards')} className={`px-4 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase transition-all ${shopTab==='cards' ? `${activeTheme.accentBg} text-stone-950` : 'text-stone-500 hover:bg-stone-900'}`}>კარტები</button>
              </div>
              <div className="flex items-center gap-2 bg-stone-950 px-3 py-2 rounded-lg border border-white/5 shrink-0 w-fit"><Coins size={16} className="text-yellow-500"/><span className="font-mono font-black text-stone-200">{myCoins}</span></div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[300px]">
              {shopTab === 'vip' && (
                <div className="flex flex-col gap-4">
                  {amIVip && profileData?.vipUntil && (<div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-center animate-pulse shadow-inner"><p className="text-yellow-500 font-black text-[10px] md:text-xs tracking-wider uppercase">👑 VIP აქტიურია {new Date(profileData.vipUntil).toLocaleString('ka-GE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}-მდე</p></div>)}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    {[{ days: 3, price: 1500, title: '3 დღე' }, { days: 7, price: 3000, title: '7 დღე', best: true }, { days: 30, price: 10000, title: '30 დღე' }].map(pkg => (
                      <div key={pkg.days} className={`p-4 md:p-5 rounded-2xl flex flex-col items-center justify-between gap-4 border transition-all bg-gradient-to-br ${pkg.best ? 'from-yellow-900/60 to-stone-950 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'from-yellow-900/20 to-stone-950 border-yellow-500/30'}`}>{pkg.best && <span className="absolute -top-3 bg-yellow-500 text-stone-950 text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg uppercase tracking-wider">საუკეთესო ფასი</span>}<span className="text-4xl md:text-5xl drop-shadow-lg">👑</span><div className="text-center"><p className="text-sm md:text-base font-black text-yellow-500 tracking-wide">{pkg.title}</p><p className="text-[9px] md:text-[10px] font-bold text-stone-400 mt-1">უფრო მეტი XP, ქოინები და ექსკლუზივები!</p></div><button onClick={() => handleBuyVip(pkg.days, pkg.price)} disabled={amIVip} className={`w-full py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md ${amIVip ? 'bg-stone-800 text-stone-500 border border-white/5 cursor-not-allowed uppercase' : 'bg-stone-900 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500 hover:text-stone-950 active:scale-95'}`}>{amIVip ? t.active : <><Coins size={12} /> {pkg.price}</>}</button></div>
                    ))}
                  </div>
                </div>
              )}
              {shopTab === 'avatars' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pb-6">
                  {SHOP_ITEMS.avatars.map(item => { const isUnlocked = unlockedAvatars.includes(item.id); const isEquipped = profileData?.avatar === item.id; const isCardSuit = ['❤️', '♦️', '♠️', '♣️'].includes(item.id); return ( <div key={item.id} className={`p-3 rounded-2xl flex flex-col items-center justify-between gap-2 border transition-all ${isEquipped ? `${activeTheme.accentBg} bg-opacity-20 border-opacity-100 border-current ${activeTheme.accent}` : isCardSuit ? 'bg-gradient-to-br from-yellow-900/20 to-stone-950 border-yellow-500/30 hover:border-yellow-500/60' : 'bg-stone-950/50 border-white/5 hover:border-white/20'}`}><span className={`text-3xl md:text-4xl drop-shadow-lg ${isCardSuit ? 'animate-pulse' : ''}`}>{item.id}</span><span className={`text-[9px] font-bold text-center leading-tight ${isCardSuit ? 'text-yellow-500' : 'text-stone-400'}`}>{item.name}</span>{isEquipped ? <button disabled className="w-full py-1.5 rounded-lg text-[8px] font-black bg-stone-800 text-stone-500 uppercase mt-1">დაყენებულია</button> : isUnlocked ? <button onClick={() => handleEquipItem('avatar', item.id)} className={`w-full py-1.5 rounded-lg text-[8px] font-black ${activeTheme.accentBg} text-stone-950 shadow-md active:scale-95 transition-all uppercase mt-1`}>დაყენება</button> : <button onClick={() => handleBuyItem('avatar', item.id, item.price)} className={`w-full py-1.5 rounded-lg text-[9px] font-black transition-all flex items-center justify-center gap-1 mt-1 active:scale-95 ${isCardSuit ? 'bg-yellow-500 text-stone-950 shadow-lg' : 'bg-stone-800 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/10'}`}><Coins size={10} /> {item.price}</button>}</div> )})}
                </div>
              )}
              {shopTab === 'tables' && (
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {SHOP_ITEMS.tables.map(item => { const isUnlocked = item.isVipExclusive ? amIVip : unlockedTables.includes(item.id); const isEquipped = profileData?.tableTheme === item.id || (!profileData?.tableTheme && item.id === 'wood'); return ( <div key={item.id} className={`p-3 rounded-2xl flex flex-col justify-between gap-3 border transition-all ${isEquipped ? `${activeTheme.accentBg} bg-opacity-20 border-opacity-100 border-current ${activeTheme.accent}` : item.isVipExclusive ? 'bg-gradient-to-b from-stone-900 to-stone-950 border-yellow-500/30' : 'bg-stone-950/50 border-white/5 hover:border-white/20'}`}><div className="h-16 rounded-xl border border-white/10 relative overflow-hidden" style={{ background: themeStyles[item.id]?.bg || themeStyles.wood.bg }}>{item.isVipExclusive && <div className="absolute top-0 right-0 w-8 h-8 bg-yellow-500 blur-xl opacity-30"></div>}</div><span className={`text-[10px] md:text-xs font-bold text-center uppercase tracking-widest ${item.isVipExclusive ? 'text-yellow-400 drop-shadow-md' : 'text-stone-200'}`}>{item.name}</span>{isEquipped ? <button disabled className="w-full py-2 rounded-lg text-[9px] font-black bg-stone-800 text-stone-500 uppercase">დაყენებულია</button> : item.isVipExclusive && !amIVip ? <button onClick={() => setShopTab('vip')} className={`w-full py-2 rounded-lg text-[9px] font-black bg-stone-800 text-yellow-500 border border-yellow-500/30 shadow-md active:scale-95 transition-all uppercase flex items-center justify-center gap-1`}><Crown size={12}/> VIP გახსნა</button> : isUnlocked ? <button onClick={() => handleEquipItem('table', item.id)} className={`w-full py-2 rounded-lg text-[9px] font-black ${activeTheme.accentBg} text-stone-950 shadow-md active:scale-95 transition-all uppercase`}>დაყენება</button> : <button onClick={() => handleBuyItem('table', item.id, item.price)} className="w-full py-2 rounded-lg text-[10px] font-black bg-stone-800 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"><Coins size={12} /> {item.price}</button>}</div>)})}
                </div>
              )}
              {shopTab === 'cards' && (
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {SHOP_ITEMS.cards.map(item => { const isUnlocked = unlockedCards.includes(item.id); const isEquipped = profileData?.cardBack === item.id || (!profileData?.cardBack && item.id === 'classic'); const shopCardStyles = { classic: 'bg-blue-900 border-white/20', crimson: 'bg-red-900 border-white/20', gold: 'bg-yellow-600 border-yellow-400', obsidian: 'bg-stone-950 border-stone-700', cyber: 'bg-fuchsia-900 border-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.5)]', royal: 'bg-purple-900 border-yellow-500', hacker: 'bg-black border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' }; const cardStyle = shopCardStyles[item.id] || shopCardStyles.classic; return ( <div key={item.id} className={`p-3 rounded-2xl flex flex-col justify-between items-center gap-3 border transition-all ${isEquipped ? `${activeTheme.accentBg} bg-opacity-20 border-opacity-100 border-current ${activeTheme.accent}` : 'bg-stone-950/50 border-white/5 hover:border-white/20'}`}><div className={`w-12 h-16 rounded-md ${cardStyle} border-2 shadow-lg flex items-center justify-center`}><Shield size={16} className={item.id==='gold'?'text-stone-900':'text-white/30'}/></div><span className="text-[10px] md:text-xs font-bold text-stone-200 text-center uppercase tracking-widest">{item.name}</span>{isEquipped ? <button disabled className="w-full py-2 rounded-lg text-[9px] font-black bg-stone-800 text-stone-500 uppercase">დაყენებულია</button> : isUnlocked ? <button onClick={() => handleEquipItem('card', item.id)} className={`w-full py-2 rounded-lg text-[9px] font-black ${activeTheme.accentBg} text-stone-950 shadow-md active:scale-95 transition-all uppercase`}>დაყენება</button> : <button onClick={() => handleBuyItem('card', item.id, item.price)} className="w-full py-2 rounded-lg text-[10px] font-black bg-stone-800 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"><Coins size={12} /> {item.price}</button>}</div> )})}
                </div>
              )}
            </div>
            <button onClick={() => setIsShopOpen(false)} className="w-full py-3 bg-stone-800 hover:bg-stone-700 border border-white/5 text-stone-300 rounded-xl text-xs font-black transition-all active:scale-95 shadow-inner mt-4 uppercase">{t.close}</button>
          </div>
        </div>
      )}

      {/* Settings / Leaderboard / History Modals (minified) */}
      {isSettingsOpen && ( <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4"><div className={`${activeTheme.card} border border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-6 shadow-2xl font-sans relative`}><h3 className={`text-base font-black ${activeTheme.accent} border-b border-white/10 pb-3 uppercase tracking-wider flex items-center gap-2`}><Settings size={18}/> {t.settings}</h3><div className="space-y-3 border-b border-white/10 pb-4"><label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2"><Music size={14}/> {t.music}</label><div className="flex bg-stone-950/50 rounded-xl p-1 border border-white/5"><button onClick={() => setIsMusicPlaying(true)} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${isMusicPlaying ? `${activeTheme.accentBg} text-stone-950 shadow-md` : 'text-stone-500'}`}>{t.on}</button><button onClick={() => setIsMusicPlaying(false)} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${!isMusicPlaying ? 'bg-stone-800 text-stone-200 shadow-md' : 'text-stone-500'}`}>{t.off}</button></div></div><form onSubmit={async (e) => { e.preventDefault(); try { const res = await fetch(`https://purti.onrender.com/api/auth/change-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: safeUsername, currentPassword: e.target.currentPass.value, newPassword: e.target.newPass.value }) }); const data = await res.json(); if(res.ok) { setToastMsg('პაროლი შეიცვალა!'); e.target.reset(); } else setError(data.message); } catch(err) { setError('შეცდომა!'); } }} className="space-y-3"><label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2"><Lock size={14}/> {t.changePass}</label><input name="currentPass" type="password" placeholder={t.oldPass} className="w-full rounded-xl bg-stone-950/60 border border-white/10 px-3 py-2 text-[10px] md:text-xs font-bold text-stone-100 outline-none" required /><input name="newPass" type="password" placeholder={t.newPass} className="w-full rounded-xl bg-stone-950/60 border border-white/10 px-3 py-2 text-[10px] md:text-xs font-bold text-stone-100 outline-none" required /><button type="submit" className={`w-full py-2.5 ${activeTheme.accentBg} text-stone-950 rounded-xl text-xs font-black transition-all active:scale-95 shadow-md`}>{t.change}</button></form><button onClick={() => setIsSettingsOpen(false)} className="w-full py-3 bg-stone-800 hover:bg-stone-700 border border-white/5 text-stone-300 rounded-xl text-xs font-black transition-all active:scale-95 shadow-inner mt-4">{t.close}</button></div></div> )}
      {isLeaderboardOpen && ( <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4"><div className="bg-stone-900 border border-yellow-500/30 rounded-[2rem] p-6 max-w-md w-full shadow-[0_0_50px_rgba(234,179,8,0.1)] relative max-h-[80vh] overflow-y-auto custom-scrollbar"><h2 className="text-xl font-black text-stone-100 uppercase mb-6 flex items-center gap-3 justify-center"><Trophy className="text-yellow-500"/> {t.top10}</h2><div className="space-y-3">{leaderboard.map((u, i) => { const rank = getLeague(u.xp); return ( <div key={i} className={`flex items-center justify-between p-3 rounded-2xl border ${i === 0 ? 'bg-yellow-500/20 border-yellow-500 text-stone-100 scale-105 shadow-lg' : 'bg-stone-950/50 border-white/5 text-stone-300'}`}><div className="flex items-center gap-3"><span className="text-sm font-black w-4 text-stone-500">{i + 1}.</span><div className="text-2xl drop-shadow-md">{u.avatar}</div><div><div className="text-xs font-black uppercase tracking-wider flex items-center gap-2">{u.username} {u.vipUntil && new Date(u.vipUntil) > new Date() && <span className="text-[10px] bg-yellow-500 text-stone-900 px-1.5 rounded uppercase font-black">VIP</span>}</div><div className={`text-[10px] font-bold mt-0.5 flex items-center gap-1 ${rank.color}`}>{rank.icon} {rank.name} • {u.xp} XP</div></div></div><div className="text-right"><div className="text-xs font-black text-stone-400">{t.wins}</div><div className="text-sm font-black text-yellow-500">{u.stats.gamesWon}</div></div></div> ); })}</div><button onClick={() => setIsLeaderboardOpen(false)} className="w-full mt-6 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 font-black text-xs uppercase rounded-xl transition-all">{t.close}</button></div></div> )}
      {isAdminOpen && ( <div className="fixed inset-0 bg-stone-950/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4"><div className="bg-stone-900 border border-rose-500/50 rounded-3xl p-6 max-w-4xl w-full shadow-[0_0_50px_rgba(244,63,94,0.2)] max-h-[90vh] overflow-y-auto custom-scrollbar relative"><div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 sticky top-0 bg-stone-900 z-10"><h2 className="text-xl font-black text-rose-500 uppercase flex items-center gap-2"><ShieldAlert/> Control Panel</h2><button onClick={() => {setIsAdminOpen(false); setAdminUsers([]); setAdminPass(''); setAdminMessage('');}} className="text-stone-500 hover:text-stone-300">{t.close}</button></div>{adminUsers.length === 0 ? ( <form onSubmit={loginAdmin} className="space-y-4 max-w-xs mx-auto py-10"><input type="password" placeholder="ადმინისტრატორის პაროლი" value={adminPass} onChange={e => setAdminPass(e.target.value)} className="w-full bg-stone-950 border border-rose-500/30 rounded-xl px-4 py-3 text-xs text-stone-100 outline-none text-center" /><button type="submit" className="w-full py-3 bg-rose-500 text-stone-950 font-black rounded-xl text-xs uppercase shadow-lg hover:bg-rose-400 transition-all">შესვლა</button>{adminMessage && <p className="text-[10px] text-rose-400 text-center font-bold">{adminMessage}</p>}</form> ) : ( <div>{adminStats && ( <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"><div className="bg-stone-950 p-4 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center shadow-inner"><span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-1">სულ მოთამაშე</span><div className="text-3xl font-black text-stone-100">{adminStats.totalUsers}</div></div><div className="bg-stone-950 p-4 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center shadow-inner"><span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-1">ჯამური თამაშები</span><div className="text-3xl font-black text-blue-400">{adminStats.totalGamesPlayed}</div></div><div className="bg-stone-950 p-4 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center shadow-inner"><span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-1">ეკონომიკა (ქოინები)</span><div className="text-3xl font-black text-yellow-500">{adminStats.totalCoins} 🪙</div></div></div> )}<div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-3 items-center"><Megaphone className="text-red-500 shrink-0" size={24}/><input type="text" placeholder="დაწერე გლობალური შეტყობინება ყველასთვის..." value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} className="flex-1 bg-stone-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-stone-100 outline-none" /><button onClick={() => { if(broadcastText.trim()) { socket.emit('adminBroadcast', broadcastText.trim()); setBroadcastText(''); setToastMsg('გლობალური შეტყობინება გაიგზავნა!'); } }} className="w-full md:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase rounded-xl transition-all shadow-md shrink-0">გაგზავნა</button></div><div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={16} /><input type="text" placeholder="მოძებნე მოთამაშე სახელით..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-stone-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-stone-100 outline-none" /></div>{adminMessage && <div className="mb-4 p-2 bg-emerald-500/20 text-emerald-400 text-xs text-center rounded-lg font-bold border border-emerald-500/30">{adminMessage}</div>}<div className="grid gap-3">{adminUsers.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())).map((u, i) => ( <div key={i} className={`p-4 rounded-2xl border ${u.isBanned ? 'bg-rose-950/30 border-rose-500/30' : 'bg-stone-950/50 border-white/5'} flex flex-wrap items-center justify-between gap-4 transition-all hover:bg-stone-800/40`}><div className="min-w-[150px]"><div className="text-sm font-black text-stone-100">{u.username}</div><div className="text-[10px] text-stone-400 font-mono mt-1">🔑 პაროლი: <span className="text-yellow-500">{u.password}</span></div><div className="text-[10px] text-stone-500 font-mono mt-0.5">📅 თარიღი: {u.dateOfBirth} | 📝 სიტყვა: {u.secretWord}</div></div><div className="flex items-center gap-4 text-xs font-black"><div className="text-yellow-500">🪙 {u.coins}</div><div className="text-blue-400">⭐ {u.xp} XP</div></div><div className="flex flex-wrap items-center gap-2"><button onClick={() => adminAction(u.username, 'addCoins', 500)} className="px-3 py-1.5 bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 rounded-lg text-[10px] font-black transition-colors border border-yellow-500/20">+500 🪙</button><button onClick={() => adminAction(u.username, 'addXP', 1000)} className="px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-[10px] font-black transition-colors border border-blue-500/20">+1000 XP</button><button onClick={() => handleAdvancedAdminAction(u.username, 'reset')} className="px-3 py-1.5 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-lg text-[10px] font-black transition-colors border border-orange-500/20" title="სტატისტიკის განულება">RESET</button>{u.isBanned ? ( <button onClick={() => adminAction(u.username, 'unban')} className="px-3 py-1.5 bg-emerald-500 text-stone-950 hover:bg-emerald-400 rounded-lg text-[10px] font-black transition-colors shadow-md">UNBAN</button> ) : ( <button onClick={() => adminAction(u.username, 'ban')} className="px-3 py-1.5 bg-rose-500 text-stone-950 hover:bg-rose-400 rounded-lg text-[10px] font-black transition-colors shadow-md">BAN</button> )}<button onClick={() => handleAdvancedAdminAction(u.username, 'delete')} className="p-1.5 bg-red-950 text-red-500 hover:bg-red-900 rounded-lg transition-colors border border-red-500/30" title="ექაუნთის წაშლა"><Trash2 size={14}/></button></div></div> ))}</div></div> )}</div></div> )}
      {isHistoryOpen && ( <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4"><div className="bg-stone-900 border border-white/10 rounded-[2rem] p-5 md:p-6 max-w-lg w-full shadow-2xl relative max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200"><h2 className={`text-lg md:text-xl font-black text-stone-100 uppercase mb-4 flex items-center gap-3 justify-center border-b border-white/5 pb-4`}><Clock className={activeTheme.accent}/> {t.myHistory}</h2><div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 min-h-[250px]">{profileData?.gameHistory?.length > 0 ? ( profileData.gameHistory.map((game, i) => { const isWin = game.isWinner; return ( <div key={i} className={`p-3 md:p-4 rounded-2xl border flex flex-col gap-2 transition-all hover:scale-[1.01] ${isWin ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}><div className="flex justify-between items-center border-b border-white/5 pb-2"><div className="flex items-center gap-2"><span className={`font-black text-xs md:text-sm uppercase tracking-wider flex items-center gap-1.5 ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>{isWin ? `🏆 ${t.wins}` : '💔'}</span><span className="text-[8px] bg-stone-950 border border-white/5 text-stone-400 px-1.5 py-0.5 rounded-md font-black uppercase flex items-center gap-1">{game.gameType === 'damka' ? <><DamkaIcon type="red" size="sm" /> შაში</> : '🃏 ფურთი'}</span></div><span className="text-[9px] md:text-[10px] text-stone-400 font-bold bg-stone-950/50 px-2 py-1 rounded-lg">{new Date(game.playedAt).toLocaleString('ka-GE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div><div className="flex justify-between items-center text-[10px] md:text-xs pt-1"><span className="text-stone-400 font-medium truncate max-w-[50%]">{t.opponent}: <span className="font-bold text-stone-200 truncate">{game.opponents?.length ? game.opponents.join(', ') : t.bots}</span></span><span className="font-mono font-black text-stone-400 bg-stone-950/40 px-2 py-1 rounded-md border border-white/5 shrink-0">{t.score}: <span className={isWin ? 'text-emerald-400' : 'text-rose-400'}>{game.myFinalScore}</span> / {game.targetScore}</span></div></div> ) }) ) : ( <div className="flex flex-col items-center justify-center py-12 text-stone-500 opacity-50"><Clock size={40} className="mb-3"/><p className="text-xs font-bold uppercase tracking-widest">{t.emptyHistory}</p></div> )}</div><button onClick={() => setIsHistoryOpen(false)} className="w-full mt-5 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 font-black text-xs uppercase rounded-xl transition-all active:scale-95 shadow-inner">{t.close}</button></div></div> )}

      {/* 🟢 3-სვეტიანი Footer შიდა დაფისთვის (როცა თამაშში არ ვართ) */}
      {!inRoom && (
        <footer className="w-full bg-stone-950/60 backdrop-blur-md pt-10 pb-6 border-t border-white/5 mt-auto z-10 relative">
          <div className="max-w-[1340px] mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8">
              
              <div className="flex flex-col items-start gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                     <Shield size={18} className="text-yellow-500" />
                  </div>
                  <span className="text-sm font-black tracking-widest text-stone-100">PHURTI.GE</span>
                </div>
                <p className="text-[10px] md:text-xs text-stone-500 leading-relaxed font-medium max-w-xs">
                  ქართული დეველოპერული პროექტი. კლასიკური ბანქოს თამაშის თანამედროვე, სანდო და აზარტული ონლაინ სივრცე.
                </p>
              </div>

              <div className="flex flex-col items-start md:items-center gap-4">
                <h4 className="text-[10px] font-black text-stone-300 uppercase tracking-widest">{t.socials}</h4>
                <div className="flex items-center gap-3">
                  <a href="https://facebook.com/phurti.ge" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-stone-900 border border-white/5 flex items-center justify-center text-stone-400 hover:text-[#1877F2] hover:bg-[#1877F2]/10 hover:border-[#1877F2]/30 transition-all">
                    <Facebook size={18}/>
                  </a>
                  <a href="https://instagram.com/phurti.ge" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-stone-900 border border-white/5 flex items-center justify-center text-stone-400 hover:text-[#E4405F] hover:bg-[#E4405F]/10 hover:border-[#E4405F]/30 transition-all">
                    <Instagram size={18}/>
                  </a>
                  <a href="https://discord.gg/phurti" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-stone-900 border border-white/5 flex items-center justify-center text-stone-400 hover:text-[#5865F2] hover:bg-[#5865F2]/10 hover:border-[#5865F2]/30 transition-all">
                    <MessageSquare size={18}/>
                  </a>
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end gap-4">
                <h4 className="text-[10px] font-black text-stone-300 uppercase tracking-widest">{t.contactUs}</h4>
                <p className="text-[10px] text-stone-500 text-left md:text-right max-w-[200px] mb-1">გაქვთ იდეა ან გსურთ მოთამაშის გასაჩივრება?</p>
                <button onClick={() => setIsContactOpen(true)} className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 border border-white/10 text-stone-200 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 active:scale-95 shadow-lg">
                  <Mail size={14} className="text-yellow-500"/> {t.contactUs}
                </button>
              </div>
            </div>
            <div className="pt-6 border-t border-white/5 text-center flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-[9px] text-stone-600 font-bold tracking-widest uppercase">
                &copy; {new Date().getFullYear()} PHURTI.GE. ყველა უფლება დაცულია.
              </p>
              <div className="flex gap-4 text-[9px] font-bold text-stone-600 uppercase tracking-widest">
                <span className="hover:text-stone-300 cursor-pointer">წესები</span>
                <span className="hover:text-stone-300 cursor-pointer">კონფიდენციალურობა</span>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* 🟢 საკონტაქტო მოდალური ფანჯარა */}
      {isContactOpen && (
        <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className={`${activeTheme.card} border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95`}>
              <button onClick={() => setIsContactOpen(false)} className="absolute top-4 right-4 text-stone-500 hover:text-white"><X size={20}/></button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-500 border border-yellow-500/30"><Mail size={20}/></div>
                <h3 className="text-lg font-black text-stone-100 uppercase tracking-widest">{t.contactUs}</h3>
              </div>
              <p className="text-[10px] text-stone-400 mb-5 font-medium">{t.contactDesc}</p>
              
              {contactStatus && <div className={`mb-4 p-2 text-[10px] font-bold text-center border rounded-lg ${contactStatus.includes('მადლობა') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>{contactStatus}</div>}
              
              <form onSubmit={handleContactSubmit} className="space-y-3">
                <input type="email" placeholder={t.emailPlaceholder} value={contactData.email} onChange={e=>setContactData({...contactData, email: e.target.value})} className="w-full bg-stone-950/50 border border-white/5 focus:border-yellow-500/50 rounded-xl px-4 py-3 text-xs text-stone-200 outline-none transition-all placeholder-stone-600 shadow-inner" />
                
                <select value={contactData.subject} onChange={e=>setContactData({...contactData, subject: e.target.value})} className="w-full bg-stone-950/50 border border-white/5 focus:border-yellow-500/50 rounded-xl px-4 py-3 text-xs text-stone-200 outline-none transition-all cursor-pointer shadow-inner">
                  <option value="feedback">{t.feedback}</option>
                  <option value="complaint">{t.complaint}</option>
                  <option value="other">სხვა...</option>
                </select>
                
                <textarea placeholder={t.messagePlaceholder} value={contactData.message} onChange={e=>setContactData({...contactData, message: e.target.value})} className="w-full bg-stone-950/50 border border-white/5 focus:border-yellow-500/50 rounded-xl px-4 py-3 text-xs text-stone-200 outline-none transition-all placeholder-stone-600 min-h-[100px] resize-none shadow-inner" required></textarea>
                
                <button type="submit" disabled={isSending} className={`w-full ${activeTheme.accentBg} hover:opacity-90 text-stone-950 font-black text-[11px] uppercase tracking-widest py-3 rounded-xl mt-2 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg`}>
                  {isSending ? t.wait : <><Send size={14}/> {t.sendMessage}</>}
                </button>
              </form>
           </div>
        </div>
      )}

    </div>
  );
}