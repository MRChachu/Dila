import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { LogOut, MessageSquare, Volume2, VolumeX, Sparkles, Trophy, Clock, Lock, Flag, X } from 'lucide-react';

const getLeague = (xp = 0) => {
  if (xp < 1000) return { name: 'ბრინჯაო', icon: '🥉', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' };
  if (xp < 3000) return { name: 'ვერცხლი', icon: '🥈', color: 'text-slate-300', bg: 'bg-slate-300/10', border: 'border-slate-300/20' };
  if (xp < 6000) return { name: 'ოქრო', icon: '🥇', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' };
  if (xp < 10000) return { name: 'პლატინა', icon: '💎', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' };
  return { name: 'ლეგენდა', icon: '👑', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' };
};

export default function GameBoard({ room, socket, onLeave, activeTheme, checkIsVip, VipName }) {
  const [selectedCardFromHand, setSelectedCardFromHand] = useState(null);
  const [selectedCardsFromTable, setSelectedCardsFromTable] = useState([]);
  
  // 🟢 შეცვლილი მესიჯების ლოგიკა (მხოლოდ დროებითი ბაბლებისთვის)
  const [messages, setMessages] = useState([]);
  
  const [activeEmotes, setActiveEmotes] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(100);
  
  const [showSurrenderModal, setShowSurrenderModal] = useState(false); 
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false); // 🟢 ახალი State ჩატის მენიუსთვის

  const me = room?.players?.find(p => p.id === socket.id);
  const isMyTurn = room?.players?.[room.currentTurn]?.id === socket.id;
  const amIVip = checkIsVip(me?.vipUntil);

  const standardEmotes = ['😁', '😝', '😉', '😤'];
  const vipEmotes = ['💩', '🖕', '🫦', '🤬', '😎', '😲', '🫶'];

  const QUICK_PHRASES = [
    "გამარჯობა! 👋",
    "კარგი სვლაა! 🔥",
    "ჩქარა ითამაშე ⏳",
    "იღბლიანი ხარ 🎲",
    "აუჰ... 🤦‍♂️",
    "ცუდი კარტი მყავს 🃏",
    "ბოდიში 😅",
    "კარგი თამაში იყო 🤝"
  ];

  const playSoftSound = (isCapture = false) => {
    if (isMuted) return;
    try {
      const soundFile = isCapture ? '/card-drop.wav' : '/card-drop.wav'; 
      const audio = new Audio(soundFile);
      audio.volume = 0.3; 
      audio.play().catch(e => console.log("Audio play error:", e));
    } catch (e) {}
  };

  useEffect(() => {
    if (room?.lastAction && !isMuted) {
      playSoftSound(room.lastAction.type === 'CAPTURE');
    }
  }, [room?.lastAction, isMuted]);

  useEffect(() => {
    if (isMyTurn && room.turnExpiresAt) {
      const interval = setInterval(() => {
        const remaining = room.turnExpiresAt - Date.now();
        const percent = Math.max(0, (remaining / 20000) * 100);
        setTimeLeft(percent);
      }, 50);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(100);
    }
  }, [isMyTurn, room.turnExpiresAt]);

  useEffect(() => {
    if (room?.roundSummary?.matchWinner) {
      const isMeWinner = room.roundSummary.matchWinner === me?.name;
      if (isMeWinner) {
        const duration = 3000;
        const end = Date.now() + duration;
        const frame = () => {
          confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#f59e0b', '#fbbf24', '#d97706'] });
          confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#f59e0b', '#fbbf24', '#d97706'] });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
      }
    }
  }, [room?.roundSummary, me?.name]);

  useEffect(() => {
    // 🟢 მესიჯის ეკრანზე გამოტანის და 4 წამში გაქრობის ლოგიკა
    const handleReceiveMessage = (msg) => {
      const msgId = Date.now() + Math.random();
      setMessages(prev => [...prev, { ...msg, id: msgId }]);
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== msgId));
      }, 4000);
    };
    
    const handleReceiveEmote = ({ playerId, emote }) => {
      const id = Date.now() + Math.random();
      setActiveEmotes(prev => [...prev, { id, playerId, emote }]);
      setTimeout(() => { setActiveEmotes(prev => prev.filter(e => e.id !== id)); }, 3000);
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('receiveEmote', handleReceiveEmote);
    
    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('receiveEmote', handleReceiveEmote);
    };
  }, [socket]);

  const handlePlayCard = () => {
    if (!isMyTurn || !selectedCardFromHand) return;
    playSoftSound(selectedCardsFromTable.length > 0);
    socket.emit('playCard', { roomId: room.id, cardFromHand: selectedCardFromHand, cardsFromTable: selectedCardsFromTable });
    setSelectedCardFromHand(null);
    setSelectedCardsFromTable([]);
  };

  const hasActiveEmote = activeEmotes.some(e => e.playerId === socket.id);

  const handleSendEmote = (emote) => {
    if (hasActiveEmote) return; 
    socket.emit('sendEmote', { roomId: room.id, emote });
    const id = Date.now() + Math.random();
    setActiveEmotes(prev => [...prev, { id, playerId: socket.id, emote }]);
    setTimeout(() => { setActiveEmotes(prev => prev.filter(e => e.id !== id)); }, 3000);
  };

  const handleSendQuickMessage = (phrase) => {
    socket.emit('sendMessage', { roomId: room.id, message: phrase });
  };

  const toggleTableCard = (card) => {
    const isSelected = selectedCardsFromTable.some(c => c.rank === card.rank && c.suit === card.suit);
    if (isSelected) {
      setSelectedCardsFromTable(prev => prev.filter(c => !(c.rank === card.rank && c.suit === card.suit)));
    } else {
      setSelectedCardsFromTable(prev => [...prev, card]);
    }
  };

  const getSuitColor = (suit) => (['♥', '♦', '❤️', '♦️'].includes(suit) ? 'text-red-600' : 'text-slate-800');

  const cardBackStyles = {
    classic: 'bg-blue-900 border-white/20',
    crimson: 'bg-red-900 border-white/20',
    gold: 'bg-yellow-600 border-yellow-400',
    obsidian: 'bg-stone-950 border-stone-700',
    cyber: 'bg-fuchsia-900 border-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.5)]',
    royal: 'bg-purple-900 border-yellow-500',
    hacker: 'bg-black border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
  };
  
  const activeCardBack = cardBackStyles[room?.hostCardBack] || cardBackStyles['classic'];
  const borderColorClass = activeTheme.accent.replace('text-', 'border-');

  // 🟢 ოვალური მაგიდისთვის მოთამაშეების გადალაგება
  const myIndex = room?.players?.findIndex(p => p.id === socket.id) || 0;
  const seatedPlayers = [];
  if (room?.players) {
    for (let i = 0; i < room.players.length; i++) {
      seatedPlayers.push(room.players[(myIndex + i) % room.players.length]);
    }
  }

  return (
    // 🟢 სრულად ცენტრალიზებული მაგიდა (dvh იცავს მობილურის ბრაუზერის ზოლებისგან)
    <div className="w-full flex flex-col items-center justify-center max-w-7xl mx-auto h-[82dvh] md:h-[88vh] relative pb-2 lg:pb-0">
      
      <div className={`flex-1 w-full max-w-5xl bg-stone-900/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl flex flex-col relative overflow-hidden`}>
        
        {/* ემოჯიების ანიმაცია (გლობალური) */}
        {activeEmotes.length > 0 && (
          <div className="absolute right-4 md:right-8 top-[20%] md:top-[25%] z-[150] pointer-events-none flex flex-col gap-4 items-end">
            {activeEmotes.map(e => {
              const player = room?.players?.find(p => p.id === e.playerId);
              return (
                <div key={e.id} className="flex flex-col items-center animate-in slide-in-from-right-10 fade-in zoom-in duration-300">
                  <span className="text-5xl md:text-6xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] animate-bounce">{e.emote}</span>
                  <span className={`text-[9px] md:text-[10px] font-black bg-stone-900/90 px-3 py-1.5 rounded-full ${activeTheme.accent} mt-1 backdrop-blur-md border border-white/10 uppercase tracking-wider shadow-xl`}>{player?.name || 'მოთამაშე'}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* 🟢 Header ნაწილი */}
        <div className="flex items-center justify-between p-2.5 md:p-4 border-b border-white/5 bg-stone-950/40 rounded-t-3xl shrink-0 z-20">
          
          <div className="flex items-center gap-2">
            <span className={`text-[10px] md:text-xs font-black tracking-widest font-mono ${activeTheme.accent} hidden sm:block`}>ROOM: {room.id}</span>
            
            {!room.roundSummary && me && !me.isBot && (
               <button onClick={() => setShowSurrenderModal(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-[9px] md:text-[10px] font-black transition-colors border border-white/10 active:scale-95 shadow-sm">
                 <Flag size={12} /> <span className="hidden sm:block">დანებება</span>
               </button>
            )}

            <button onClick={onLeave} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[9px] md:text-[10px] font-black transition-colors border border-rose-500/20 active:scale-95">
              <LogOut size={12} /> <span className="hidden sm:block">LEAVE</span>
            </button>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => setIsMuted(!isMuted)} className={`text-stone-500 hover:${activeTheme.accent} transition-colors`}>
              {isMuted ? <VolumeX size={14} className="md:w-4 md:h-4" /> : <Volume2 size={14} className="md:w-4 md:h-4" />}
            </button>
            <span className="text-[10px] md:text-xs font-bold text-stone-400 bg-stone-900/80 px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl border border-white/5 flex items-center gap-1 md:gap-1.5">
              <Trophy size={10} className={`${activeTheme.accent} md:w-3 md:h-3`}/> {room.targetScore}
            </span>
          </div>
        </div>

        {isMyTurn && (
          <div className="w-full h-1 bg-stone-950 overflow-hidden shrink-0">
            <div className={`h-full ${activeTheme.accentBg} transition-all duration-50`} style={{ width: `${timeLeft}%` }} />
          </div>
        )}

        <div className="flex-1 flex flex-col justify-between p-3 md:p-6 relative min-h-0 overflow-hidden w-full">
          
          {room.deck?.length > 0 && (
            <div className="absolute top-2 left-2 md:top-4 md:left-6 flex flex-col items-center z-40" title="დარჩენილი ბანქო">
              <div className={`relative w-10 h-14 md:w-14 md:h-20 rounded-md md:rounded-lg border shadow-lg flex items-center justify-center ${activeCardBack}`}>
                <div className={`absolute inset-0 rounded-md md:rounded-lg border ${activeCardBack} translate-x-[3px] -translate-y-[3px] -z-10 shadow-sm`}></div>
                <div className="bg-stone-950/90 px-2 py-0.5 md:py-1 rounded text-white text-[10px] md:text-xs font-black shadow-inner border border-white/10">
                  {room.deck.length}
                </div>
              </div>
            </div>
          )}

          {/* 🟢 სტატუსი და მოქმედებების ჟურნალი (მაგიდის ზემოთ) */}
          <div className="flex flex-col items-center gap-2 relative z-20 shrink-0 mt-2 min-h-[70px]">
            {isMyTurn ? (
              <div className={`inline-flex items-center gap-1.5 md:gap-2 px-5 py-2.5 bg-stone-900 border border-white/10 rounded-full ${activeTheme.accent} text-[10px] md:text-xs font-black shadow-[0_0_15px_currentColor] animate-pulse`}>
                <Sparkles size={14} className="md:w-[16px] md:h-[16px]" /> შენი სვლაა!
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 md:gap-2 px-4 py-2 bg-stone-950/60 border border-white/5 rounded-full text-stone-400 text-[10px] md:text-xs font-bold shadow-inner">
                <Clock size={12} className="animate-spin-slow md:w-[14px] md:h-[14px]" /> ველოდებით...
              </div>
            )}

            {room.lastAction && (() => {
              const isCapture = room.lastAction.type === 'CAPTURE';
              const isSweep = isCapture && ['J', 'j', 'ვალეტი'].includes(room.lastAction.cardFromHand.rank);
              
              const renderCardInLog = (c, isHandCard = false) => (
                <div key={`${c.rank}-${c.suit}-${isHandCard ? 'hand' : 'table'}`} className="flex items-center gap-0.5 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md border bg-stone-950 border-white/5 shadow-md">
                  <span className={`text-[9px] md:text-[11px] font-black ${getSuitColor(c.suit)}`}>{c.rank}</span>
                  <span className={`text-[10px] md:text-xs ${getSuitColor(c.suit)}`}>{c.suit}</span>
                </div>
              );

              let containerBorder = "border-white/10 bg-stone-900/95";
              let actionText = isCapture ? 'მოჭრა' : 'დააგდო';
              let actionColor = "text-stone-400";
              if (isSweep) { containerBorder = "border-yellow-500 bg-yellow-900/50 shadow-[0_0_15px_rgba(234,179,8,0.4)]"; actionText = "გაასუფთავა 🧹"; actionColor = "text-yellow-400 font-black uppercase"; } 

              return (
                <div className={`border px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-in slide-in-from-top-2 fade-in duration-300 shadow-lg ${containerBorder}`}>
                  <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest flex items-center gap-1 text-stone-300">
                    <VipName name={room.lastAction.playerName} isVip={checkIsVip(room.lastAction.isVip)} className={activeTheme.accent} /> 
                    <span className={actionColor}>{actionText}</span>
                  </span>
                  <div className="flex items-center gap-1 ml-1">
                    {renderCardInLog(room.lastAction.cardFromHand, true)}
                    {isCapture && room.lastAction.cardsFromTable?.length > 0 && (
                      <><span className="text-stone-500 font-black">+</span><div className="flex items-center gap-0.5">{room.lastAction.cardsFromTable.map(c => renderCardInLog(c))}</div></>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 🟢 ოვალური მაგიდა (სრულად გასუფთავებული) */}
          <div className="flex-1 flex flex-col items-center justify-center relative mt-4 md:mt-8 mb-4 md:mb-8 w-full z-10 min-h-[250px]">
            <div className={`relative w-[92%] md:w-[85%] max-w-3xl aspect-[4/3] md:aspect-[2.2/1] ${activeTheme.card} rounded-[100px] md:rounded-[200px] border-[8px] md:border-[16px] border-stone-900 shadow-[0_0_50px_rgba(0,0,0,0.6)] flex items-center justify-center`}>
              
              <div className="absolute inset-0 rounded-[92px] md:rounded-[184px] border border-white/5 shadow-inner pointer-events-none"></div>
              <div className={`absolute inset-0 opacity-20 blur-[40px] rounded-[100px] ${activeTheme.accentBg} pointer-events-none`}></div>

              {/* მაგიდის კარტები (ცენტრში) - პროფესიონალური კაზინოს სტილი */}
              <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3 z-10 px-4 md:px-8">
                {room.tableCards?.length > 0 ? room.tableCards.map((c, i) => {
                  const isSelected = selectedCardsFromTable.some(tc => tc.rank === c.rank && tc.suit === c.suit);
                  const isBeingCaptured = room.lastAction?.type === 'CAPTURE' && room.lastAction.cardsFromTable.some(cap => cap.rank === c.rank && cap.suit === c.suit);
                  return (
                    <div 
                      key={`${c.rank}-${c.suit}-${i}`} 
                      onClick={() => isMyTurn && toggleTableCard(c)}
                      className={`relative w-12 h-16 md:w-[72px] md:h-[104px] bg-white rounded-[5px] md:rounded-lg shadow-sm flex items-center justify-center select-none transition-all duration-300 border border-slate-200 transform-gpu cursor-pointer
                        ${isSelected ? `ring-2 md:ring-4 ${activeTheme.accent.replace('text-', 'ring-')} -translate-y-3 shadow-xl scale-110 z-30` : 'hover:-translate-y-1 hover:shadow-md z-10 hover:z-20'}
                        ${isBeingCaptured ? 'scale-0 opacity-0 rotate-180 z-50 pointer-events-none' : 'animate-in zoom-in-50 fade-in duration-300'}
                      `}
                    >
                      {/* ზედა მარცხენა რიცხვი (ზუსტად კუთხეში) */}
                      <span className={`absolute top-1 left-1.5 md:top-1.5 md:left-2 text-[13px] md:text-[18px] font-bold tracking-tighter leading-none ${getSuitColor(c.suit)}`}>
                        {c.rank}
                      </span>
                      
                      {/* ცენტრალური მასტი */}
                      <span className={`text-2xl md:text-4xl ${getSuitColor(c.suit)}`}>{c.suit}</span>
                      
                      {/* ქვედა მარჯვენა რიცხვი (შემოტრიალებული) */}
                      <span className={`absolute bottom-1 right-1.5 md:bottom-1.5 md:right-2 text-[13px] md:text-[18px] font-bold tracking-tighter leading-none rotate-180 ${getSuitColor(c.suit)}`}>
                        {c.rank}
                      </span>
                    </div>
                  );
                }) : (
                  <span className="text-stone-700/50 font-black text-xs md:text-xl uppercase tracking-widest select-none z-10">მაგიდა ცარიელია</span>
                )}
              </div>

              {/* 🟢 ოვალზე დასმული მოთამაშეები (ულტრა-კომპაქტური + მიკრო-სტატისტიკა) */}
              {seatedPlayers.map((p, idx) => {
                const isMe = idx === 0;
                const isCurrentTurn = room.currentTurn === room.players.findIndex(rp => rp.id === p.id);
                const isDealer = room.dealerIndex === room.players.findIndex(rp => rp.id === p.id);
                
                // 🟢 წაღებული კარტების კალკულაცია
                const capturedCards = p.captured?.length || 0;
                const capturedClubs = p.captured?.filter(c => c.suit === '♣' || c.suit === '♣️').length || 0;
                const has10Diamond = p.captured?.some(c => c.rank === '10' && (c.suit === '♦' || c.suit === '♦️'));
                const has2Club = p.captured?.some(c => c.rank === '2' && (c.suit === '♣' || c.suit === '♣️'));

                let posClass = "";
                let isVertical = false; 

                if (seatedPlayers.length === 2) {
                   if (idx === 0) { posClass = "top-[100%] left-1/2 -translate-x-1/2 -translate-y-1/2"; }
                   if (idx === 1) { posClass = "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"; }
                } else if (seatedPlayers.length === 3) {
                   if (idx === 0) { posClass = "top-[100%] left-1/2 -translate-x-1/2 -translate-y-1/2"; }
                   if (idx === 1) { posClass = "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2"; isVertical = true; }
                   if (idx === 2) { posClass = "top-1/2 left-[100%] -translate-x-1/2 -translate-y-1/2"; isVertical = true; }
                } else if (seatedPlayers.length === 4) {
                   if (idx === 0) { posClass = "top-[100%] left-1/2 -translate-x-1/2 -translate-y-1/2"; }
                   if (idx === 1) { posClass = "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2"; isVertical = true; }
                   if (idx === 2) { posClass = "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"; }
                   if (idx === 3) { posClass = "top-1/2 left-[100%] -translate-x-1/2 -translate-y-1/2"; isVertical = true; }
                }
                
                return (
                  <div key={p.id} className={`absolute flex items-center justify-center z-30 ${posClass}`}>
                     
                     {/* ჩატის მესიჯის ღრუბელი */}
                     {messages.find(m => m.senderId === p.id) && (
                       <div className="absolute -top-12 md:-top-16 left-1/2 -translate-x-1/2 bg-stone-100 text-stone-900 px-3 py-1.5 md:py-2 rounded-xl text-[10px] md:text-xs font-black shadow-[0_5px_15px_rgba(0,0,0,0.5)] z-50 animate-in zoom-in-50 fade-in slide-in-from-bottom-2 whitespace-nowrap">
                         {messages.find(m => m.senderId === p.id).text}
                         <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-stone-100 rotate-45 rounded-sm"></div>
                       </div>
                     )}

                     <div className={`relative flex items-center justify-center gap-1 md:gap-1.5 p-1 md:p-1.5 rounded-xl bg-stone-900/95 border transition-all
                        ${isCurrentTurn ? `${borderColorClass} shadow-[0_0_15px_currentColor] scale-110 z-40` : 'border-white/10 shadow-md'}
                        ${isVertical ? 'flex-col w-[50px] md:w-[60px]' : 'flex-row px-2 md:px-3'}
                     `}>
                        {isCurrentTurn && <div className={`absolute inset-0 ${activeTheme.accentBg} opacity-10 blur-[2px] rounded-xl`} />}
                        {isDealer && <span className="absolute -top-1.5 -right-1.5 bg-stone-800 text-stone-300 text-[6px] md:text-[7px] px-1 py-0.5 rounded border border-white/20 shadow-md font-black uppercase z-20">D</span>}
                        <span className="text-[16px] md:text-xl drop-shadow-md z-10 shrink-0 leading-none">{p.avatar || '😎'}</span>
                        
                        <div className={`flex flex-col justify-center z-10 ${isVertical ? 'items-center text-center w-full' : 'items-start min-w-[45px] md:min-w-[55px]'}`}>
                           <span className={`text-[6.5px] md:text-[8px] font-black uppercase truncate w-full ${isCurrentTurn ? activeTheme.accent : 'text-stone-200'}`}>
                              <VipName name={isMe ? 'შენ' : p.name} isVip={checkIsVip(p.vipUntil)} />
                           </span>
                           <span className="text-[6px] md:text-[7px] font-black text-stone-400 mt-0.5 leading-none">
                              ქულა:<span className={`ml-0.5 ${activeTheme.accent}`}>{p.totalScore}</span>
                           </span>

                           {/* 🟢 მიკრო-სტატისტიკის ზოლი (წაღებული კარტები) */}
                           <div className="flex items-center gap-1 mt-1 bg-stone-950/80 px-1 py-0.5 rounded flex-wrap border border-white/5 w-full justify-center shadow-inner">
                              <span className="text-[6px] md:text-[7px] font-mono font-bold text-stone-300" title="წაღებული კარტები">🃏 {capturedCards}</span>
                              <span className="text-[6px] md:text-[7px] font-mono font-bold text-stone-300" title="წაღებული ჯვრები">♣️ {capturedClubs}</span>
                              {(has10Diamond || has2Club) && (
                                  <div className="flex gap-0.5 ml-0.5 border-l border-white/10 pl-0.5">
                                    {has10Diamond && <span className="text-[6px] md:text-[7px] drop-shadow-md" title="10 აგური">💎</span>}
                                    {has2Club && <span className="text-[6px] md:text-[7px] drop-shadow-md text-sky-400" title="2 ჯვარი">♣️</span>}
                                  </div>
                              )}
                           </div>
                           
                        </div>
                     </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 🟢 მთლიანი ქვედა სექცია (ღილაკები + კარტები) - მობილურზე ეკრანში ჩასატევად */}
          <div className="flex flex-col items-center mt-auto pt-1 pb-1 md:pb-4 z-20 shrink-0 w-full max-w-lg mx-auto">
            
            {/* 🟢 ქვედა პანელი: ემოჯი, ჩატი და სვლის ღილაკი */}
            <div className="relative flex justify-center items-center gap-2 md:gap-3 w-full z-40 mb-5 md:mb-10 px-4">
              
              {/* ემოჯების მენიუ */}
              {showEmojiMenu && (
                <div className="absolute bottom-[115%] left-4 bg-stone-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex gap-1.5 md:gap-2 w-max max-w-[90vw] overflow-x-auto custom-scrollbar animate-in zoom-in-95 slide-in-from-bottom-2">
                  {standardEmotes.map(emo => (
                    <button key={emo} onClick={() => { if(!hasActiveEmote) { handleSendEmote(emo); setShowEmojiMenu(false); } }} disabled={hasActiveEmote} className={`text-xl md:text-2xl p-1.5 transition-all flex-shrink-0 rounded-lg hover:bg-stone-800 ${hasActiveEmote ? 'opacity-20 cursor-not-allowed grayscale' : 'hover:scale-125 hover:-translate-y-1 active:scale-95 grayscale opacity-70 hover:grayscale-0 hover:opacity-100'}`}>
                      {emo}
                    </button>
                  ))}
                  <div className="w-px h-8 bg-white/10 shrink-0 mx-1"></div>
                  {vipEmotes.map(emo => (
                    <button key={emo} onClick={() => { if(amIVip && !hasActiveEmote) { handleSendEmote(emo); setShowEmojiMenu(false); } }} disabled={!amIVip || hasActiveEmote} className={`relative text-xl md:text-2xl p-1.5 transition-all shrink-0 flex-shrink-0 rounded-lg hover:bg-stone-800 ${amIVip && !hasActiveEmote ? 'hover:scale-125 hover:-translate-y-1 active:scale-95 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]' : 'opacity-20 cursor-not-allowed grayscale'}`}>
                      {emo} {!amIVip && <Lock size={10} className="absolute -bottom-0 -right-0 text-yellow-500/50"/>}
                    </button>
                  ))}
                </div>
              )}

              {/* ჩატის ფრაზების მენიუ */}
              {showChatMenu && (
                <div className="absolute bottom-[115%] right-4 bg-stone-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col gap-1.5 w-max max-w-[200px] md:max-w-[250px] animate-in zoom-in-95 slide-in-from-bottom-2 z-50">
                  <h4 className="text-[9px] font-black text-stone-400 uppercase tracking-widest border-b border-white/10 pb-1 mb-1 text-center">Quick Chat</h4>
                  <div className="flex flex-col gap-1 max-h-[30vh] overflow-y-auto custom-scrollbar pr-1">
                    {QUICK_PHRASES.map(phrase => (
                      <button key={phrase} onClick={() => { handleSendQuickMessage(phrase); setShowChatMenu(false); }} className="text-[10px] md:text-xs font-bold text-stone-300 bg-stone-800/50 hover:bg-stone-700 hover:text-white py-1.5 px-3 rounded-lg text-left transition-all active:scale-95 border border-white/5">
                        {phrase}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ემოჯის ღილაკი */}
              <button 
                onClick={() => { setShowEmojiMenu(!showEmojiMenu); setShowChatMenu(false); }}
                className={`p-3 md:p-3.5 rounded-full transition-all active:scale-95 border shadow-lg flex items-center justify-center shrink-0
                  ${showEmojiMenu ? 'bg-stone-700 border-white/30 text-white shadow-inner' : 'bg-stone-900 border-white/10 text-stone-400 hover:bg-stone-800 hover:text-stone-200'}`}
              >
                 <span className="text-lg leading-none">😀</span>
              </button>

              {/* სვლის ღილაკი */}
              <button 
                onClick={() => { handlePlayCard(); setShowEmojiMenu(false); setShowChatMenu(false); }}
                disabled={!isMyTurn || !selectedCardFromHand}
                className={`flex-1 px-4 md:px-6 py-3.5 rounded-2xl md:rounded-full text-xs font-black transition-all shadow-md active:scale-95 uppercase tracking-wider 
                  ${!isMyTurn || !selectedCardFromHand ? 'bg-stone-800 text-stone-500 cursor-not-allowed' : selectedCardsFromTable.length > 0 ? 'bg-white text-stone-900 shadow-xl' : `${activeTheme.accentBg} text-stone-950 shadow-xl`}`}
              >
                {selectedCardsFromTable.length > 0 ? 'მოჭრა ⚔️' : 'დაგდება 🃏'}
              </button>

              {/* ჩატის ღილაკი */}
              <button 
                onClick={() => { setShowChatMenu(!showChatMenu); setShowEmojiMenu(false); }}
                className={`p-3 md:p-3.5 rounded-full transition-all active:scale-95 border shadow-lg flex items-center justify-center shrink-0
                  ${showChatMenu ? 'bg-stone-700 border-white/30 text-white shadow-inner' : 'bg-stone-900 border-white/10 text-stone-400 hover:bg-stone-800 hover:text-stone-200'}`}
              >
                 <MessageSquare size={18} />
              </button>
            </div>

            {/* 🟢 მოთამაშის ხელი (მარაო) */}
            <div className="flex justify-center items-end h-[70px] md:h-[130px] w-full relative overflow-visible">
              {me?.cards?.map((c, i) => {
                const isSelected = selectedCardFromHand?.rank === c.rank && selectedCardFromHand?.suit === c.suit;
                const totalCards = me.cards.length;
                const centerIndex = (totalCards - 1) / 2;
                const offset = i - centerIndex;
                const rotation = offset * 6; 
                const yPush = Math.abs(offset) * 4; 
                const overlapMargin = i !== 0 ? '-ml-6 md:-ml-10' : ''; 

                return (
                  <div 
                    key={`${c.rank}-${c.suit}`}
                    style={{ 
                      transform: `rotate(${rotation}deg) translateY(${yPush}px)`,
                      transformOrigin: 'bottom center',
                      zIndex: isSelected ? 50 : i + 10,
                      animationDelay: `${(i + 1) * 100}ms`, 
                      animationFillMode: 'backwards'
                    }}
                    className={`relative transition-all duration-300 ease-out transform-gpu animate-in slide-in-from-bottom-10 zoom-in-75 fade-in ${overlapMargin} group`}
                  >
                    <div 
                      onClick={() => isMyTurn && setSelectedCardFromHand(isSelected ? null : c)}
                      className={`relative w-[60px] h-[85px] md:w-[86px] md:h-[124px] bg-white rounded-md md:rounded-xl flex items-center justify-center select-none transition-all duration-300 border border-slate-200 shadow-sm
                        ${isSelected ? `-translate-y-6 md:-translate-y-8 scale-110 shadow-2xl ring-2 md:ring-4 ${activeTheme.accent.replace('text-', 'ring-')}` : 'hover:-translate-y-2 hover:shadow-lg cursor-pointer'}
                        ${!isMyTurn && 'opacity-90 hover:opacity-100'} 
                      `}
                    >
                      <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 flex flex-col items-center leading-none">
                        <span className={`text-[15px] md:text-[20px] font-bold tracking-tighter ${getSuitColor(c.suit)}`}>{c.rank}</span>
                        <span className={`text-[8px] md:text-[10px] mt-0.5 ${getSuitColor(c.suit)}`}>{c.suit}</span>
                      </div>
                      <span className={`text-3xl md:text-5xl opacity-95 ${getSuitColor(c.suit)}`}>{c.suit}</span>
                      <div className="absolute bottom-1.5 right-1.5 md:bottom-2 md:right-2 flex flex-col items-center leading-none rotate-180">
                        <span className={`text-[15px] md:text-[20px] font-bold tracking-tighter ${getSuitColor(c.suit)}`}>{c.rank}</span>
                        <span className={`text-[8px] md:text-[10px] mt-0.5 ${getSuitColor(c.suit)}`}>{c.suit}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 🟢 დანებების დადასტურების მოდალი */}
        {showSurrenderModal && (
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-md z-[250] flex items-center justify-center p-4 animate-in fade-in duration-200 rounded-3xl">
            <div className={`bg-stone-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center space-y-5`}>
              <Flag size={40} className="mx-auto text-rose-500 mb-2 drop-shadow-lg" />
              <h3 className="text-lg font-black text-stone-100 uppercase tracking-widest">ნამდვილად ნებდები?</h3>
              <p className="text-xs text-stone-400 font-bold">მატჩი დასრულდება და მოწინააღმდეგე გამარჯვებულად გამოცხადდება.</p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={() => setShowSurrenderModal(false)} className="py-3 bg-stone-800 hover:bg-stone-700 border border-white/5 text-stone-300 rounded-xl text-xs font-black transition-all active:scale-95 shadow-md uppercase">არა</button>
                <button onClick={() => { 
                  socket.emit('surrender', { roomId: room.id }); 
                  setShowSurrenderModal(false); 
                }} className="py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-lg uppercase">კი, ვნებდები</button>
              </div>
            </div>
          </div>
        )}

        {room?.roundSummary && (
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
            <div className={`bg-stone-900 border border-opacity-30 border-current rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-sm md:max-w-md w-full shadow-2xl text-center space-y-4 md:space-y-6 relative overflow-hidden ${activeTheme.accent}`}>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-current/10 via-stone-900 to-stone-900"></div>
              
              <div className="relative z-10">
                <Trophy size={36} className="mx-auto mb-3 md:mb-4 drop-shadow-lg md:w-[48px] md:h-[48px]" />
                <h2 className="text-xl md:text-2xl font-black text-stone-100 mb-2 uppercase tracking-widest">
                  {room.roundSummary.matchWinner ? 'მატჩი დასრულდა' : 'რაუნდი დასრულდა'}
                </h2>
                
                {room.roundSummary.matchWinner && (
                  <div className="bg-stone-950/80 border border-white/10 rounded-2xl p-4 md:p-5 mb-4 md:mb-6 shadow-inner ring-1 ring-white/5 relative">
                    {room.roundSummary.surrendered && (
                       <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[9px] font-black px-2 py-1 rounded-md uppercase shadow-md whitespace-nowrap">
                         {room.roundSummary.surrendered} დანებდა 🏳️
                       </span>
                    )}
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">გამარჯვებული</p>
                    <div className="text-2xl md:text-3xl font-black text-white drop-shadow-md">
                      <VipName name={room.roundSummary.matchWinner} isVip={checkIsVip(room.players.find(p=>p.name===room.roundSummary.matchWinner)?.vipUntil)} /> 🎉
                    </div>
                  </div>
                )}

                {room.roundSummary.matchWinner && room.isRanked && (() => {
                  const isMeWinner = room.roundSummary.matchWinner === me?.name;
                  const winXp = amIVip ? 35 : 25;
                  const loseXp = amIVip ? 5 : 10;
                  const winCoins = amIVip ? 75 : 50;
                  const loseCoins = amIVip ? 25 : 50;

                  return (
                    <div className="bg-stone-950/80 border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-4 mb-4 md:mb-6 shadow-inner flex justify-around items-center ring-1 ring-white/5">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-1">XP</span>
                        <span className={`text-base md:text-lg font-black ${isMeWinner ? 'text-green-400' : 'text-rose-400'} drop-shadow-md`}>
                          {isMeWinner ? `↑ +${winXp}` : `↓ -${loseXp}`}
                        </span>
                      </div>
                      <div className="w-px h-8 bg-white/10"></div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-1">ქოინები</span>
                        <span className={`text-base md:text-lg font-black ${isMeWinner ? 'text-yellow-400' : 'text-rose-400'} drop-shadow-md`}>
                          {isMeWinner ? `+${winCoins}` : `-${loseCoins}`} 🪙
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div className="bg-stone-950/80 rounded-xl md:rounded-2xl p-3 md:p-4 border border-white/5 mb-4 shadow-inner text-left">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3 border-b border-white/10 pb-2">
                    {room.roundSummary.matchWinner ? 'საბოლოო ანგარიში' : 'მიმდინარე ანგარიში'}
                  </h4>
                  <div className="space-y-2.5">
                    {room.players.map(p => (
                      <div key={p.id} className="flex justify-between items-center">
                        <span className={`text-xs md:text-sm font-bold ${p.name === room.roundSummary.matchWinner ? 'text-yellow-400' : 'text-stone-200'}`}>
                          {p.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm md:text-base font-black ${p.name === room.roundSummary.matchWinner ? 'text-yellow-400 drop-shadow-md' : 'text-stone-300'}`}>
                            {p.totalScore}
                          </span>
                          <span className="text-[10px] text-stone-500 font-bold">/ {room.targetScore}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {!room.roundSummary.matchWinner && (
                  <div className="space-y-2 md:space-y-3 bg-stone-950/80 rounded-xl md:rounded-2xl p-3 md:p-4 border border-white/5 text-[10px] md:text-sm font-medium text-stone-300 mb-4 md:mb-6 text-left shadow-inner">
                    <div className="flex justify-between border-b border-white/5 pb-1.5 md:pb-2"><span className="text-stone-400">ბევრი კარტი:</span> <span className="font-black text-stone-100">{room.roundSummary.cardsWinner}</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-1.5 md:pb-2"><span className="text-stone-400">ბევრი ჯვარი:</span> <span className="font-black text-stone-100">{room.roundSummary.clubsWinner}</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-1.5 md:pb-2"><span className="text-stone-400">აგურის 10:</span> <span className="font-black text-stone-100">{room.roundSummary.diamond10Winner}</span></div>
                    <div className="flex justify-between"><span className="text-stone-400">ჯვრის 2:</span> <span className="font-black text-stone-100">{room.roundSummary.club2Winner}</span></div>
                  </div>
                )}

                <button 
                  onClick={() => {
                    if (room.roundSummary.matchWinner) {
                      onLeave();
                    } else {
                      socket.emit('nextRoundReady', { roomId: room.id });
                    }
                  }}
                  className={`w-full py-3 md:py-4 ${activeTheme.accentBg} text-stone-950 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all`}
                >
                  {room.readyForNextRound?.includes(socket.id) ? 'მოლოდინი...' : room.roundSummary.matchWinner ? 'ლობიში დაბრუნება' : 'შემდეგი რაუნდი'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}