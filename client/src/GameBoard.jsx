import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { LogOut, MessageSquare, Volume2, VolumeX, Sparkles, Trophy, Clock, Users, Lock, X } from 'lucide-react';

export default function GameBoard({ room, socket, onLeave, activeTheme, checkIsVip, VipName }) {
  const [selectedCardFromHand, setSelectedCardFromHand] = useState(null);
  const [selectedCardsFromTable, setSelectedCardsFromTable] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeEmotes, setActiveEmotes] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(100);
  
  const [mobileModal, setMobileModal] = useState(null); 
  const [unreadChat, setUnreadChat] = useState(false);

  const chatRef = useRef(null);

  const me = room?.players?.find(p => p.id === socket.id);
  const isMyTurn = room?.players?.[room.currentTurn]?.id === socket.id;
  const amIVip = checkIsVip(me?.vipUntil);

  const standardEmotes = ['🔥', '😂', '😎', '🤯', '🃏', '⏳', '👏', '💀'];
  const vipEmotes = ['🤑', '🤬', '🍻', '🤡', '👽'];

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

  const getLeague = (xp = 0) => {
    if (xp < 1000) return { name: 'ბრინჯაო', icon: '🥉', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' };
    if (xp < 3000) return { name: 'ვერცხლი', icon: '🥈', color: 'text-slate-300', bg: 'bg-slate-300/10', border: 'border-slate-300/20' };
    if (xp < 6000) return { name: 'ოქრო', icon: '🥇', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' };
    if (xp < 10000) return { name: 'პლატინა', icon: '💎', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' };
    return { name: 'ლეგენდა', icon: '👑', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' };
  };

  // 🟢 დავაბრუნეთ ძალიან რბილი და სასიამოვნო "პოპ" ხმები
  const playSoftSound = (isCapture = false) => {
    if (isMuted) return;
    try {
      // isCapture ამოწმებს მოჭრაა თუ უბრალოდ დაგდება
      // შეგიძლია ორი სხვადასხვა ხმა გქონდეს, ან ერთი და იგივე გამოიყენო
      const soundFile = isCapture ? '/card-drop.wav' : '/card-drop.wav'; 
      const audio = new Audio(soundFile);
      audio.volume = 0.4; // ხმის სიმაღლე (0-დან 1-მდე)
      audio.play().catch(e => console.log("Audio play error:", e));
      
      // თუ მოჭრაა, მეორე კარტის ხმაც დავამატოთ ოდნავ დაგვიანებით
      if (isCapture) {
        setTimeout(() => {
          const audio2 = new Audio(soundFile);
          audio2.volume = 0.3;
          audio2.play().catch(e => {});
        }, 150);
      }
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
    const handleReceiveMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
      if (window.innerWidth < 1024 && mobileModal !== 'chat') setUnreadChat(true);
      setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, 100);
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
  }, [socket, mobileModal]);

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

  const getSuitColor = (suit) => (['♥', '♦'].includes(suit) ? 'text-rose-600' : 'text-stone-900');

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

  return (
    <div className="w-full flex flex-col lg:flex-row gap-5 md:gap-6 max-w-7xl mx-auto h-auto lg:h-[82vh] min-h-[85vh] lg:min-h-0 relative pb-6 lg:pb-0">
      
      <div className={`
        ${mobileModal ? 'fixed inset-0 z-[100] bg-stone-950/60 backdrop-blur-sm flex flex-col justify-end p-0' : 'hidden lg:flex lg:w-80 lg:flex-col lg:gap-5 order-2 lg:order-1 h-full'}
      `}>
        
        {mobileModal && <div className="absolute inset-0 z-0" onClick={() => setMobileModal(null)}></div>}

        <div className={`
          ${mobileModal ? 'bg-stone-900 w-full h-[65dvh] rounded-t-[2rem] p-4 md:p-5 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] relative z-10 animate-in slide-in-from-bottom-full duration-300' : 'flex flex-col gap-5 w-full h-full'}
        `}>
          
          {mobileModal && (
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/10 lg:hidden shrink-0">
              <span className={`text-sm font-black uppercase tracking-widest ${activeTheme.accent}`}>
                {mobileModal === 'players' ? '👥 მოთამაშეები' : '💬 Quick Chat'}
              </span>
              <button onClick={() => setMobileModal(null)} className="p-2 bg-stone-800 text-stone-400 hover:text-white rounded-xl transition-all active:scale-95 border border-white/5 shadow-md">
                <X size={18} />
              </button>
            </div>
          )}

          <div className={`${mobileModal === 'chat' ? 'hidden lg:flex' : 'flex'} flex-col w-full shrink-0 ${mobileModal ? 'h-full overflow-hidden' : 'max-h-[50%]'}`}>
            <div className={`${mobileModal ? 'bg-transparent shadow-none border-none p-0 h-full' : `${activeTheme.card} backdrop-blur-md border border-white/5 rounded-3xl p-4 shadow-2xl relative flex flex-col h-full`} transition-colors`}>
              
              {!mobileModal && <div className={`absolute top-0 left-0 w-full h-1 rounded-t-3xl bg-gradient-to-r from-transparent via-current to-transparent opacity-50 ${activeTheme.accent}`}></div>}
              
              {!mobileModal && (
                <h3 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-3 shrink-0 ${activeTheme.accent}`}>
                  <Users size={14} /> მოთამაშეები
                </h3>
              )}
              
              <div className={`flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-2 min-h-0`}>
                {room?.players?.map((p, i) => {
                  const isCurrentTurn = room.currentTurn === i;
                  const isDealer = room.dealerIndex === i; 
                  const capturedCards = p.captured?.length || 0;
                  const capturedClubs = p.captured?.filter(c => c.suit === '♣' || c.suit === '♣️').length || 0;
                  const has10Diamond = p.captured?.some(c => c.rank === '10' && (c.suit === '♦' || c.suit === '♦️'));
                  const has2Club = p.captured?.some(c => c.rank === '2' && (c.suit === '♣' || c.suit === '♣️'));
                  const league = getLeague(p.xp);

                  return (
                    <div key={p.id} className={`relative flex items-center justify-between p-2.5 md:p-3 rounded-2xl border-2 transition-all duration-300 ${isCurrentTurn ? `bg-stone-900 ${borderColorClass} shadow-xl z-10` : 'bg-stone-950/40 border-white/5'}`}>
                      {isCurrentTurn && <div className={`absolute inset-0 ${activeTheme.accentBg} opacity-[0.03] rounded-2xl`} />}
                      
                      <div className="flex items-start gap-2.5 z-10 relative">
                        <span className="text-2xl drop-shadow-md mt-0.5">{p.avatar || '😎'}</span>
                        <div className="flex flex-col">
                          
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs md:text-sm truncate max-w-[120px]">
                              <VipName name={`${p.name} ${p.id === socket.id ? '(შენ)' : ''}`} isVip={checkIsVip(p.vipUntil)} className={isCurrentTurn ? activeTheme.accent : 'text-stone-200'} />
                            </span>
                            {isDealer && (
                              <span className="bg-stone-800 text-stone-400 text-[8px] px-1.5 py-0.5 rounded border border-white/10 uppercase font-black" title="ამჟამინდელი დილერი">D</span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-1">
                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${league.bg} ${league.border} shadow-sm`}>
                               <span className="text-[9px] drop-shadow-md">{league.icon}</span>
                               <span className={`text-[8px] font-black uppercase tracking-wider ${league.color}`}>{league.name}</span>
                            </div>

                            <span className="text-[9px] text-stone-500 font-bold">ქულა: <span className="text-stone-200">{p.totalScore}</span></span>
                            
                            <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-stone-950/60 rounded border border-white/5 shrink-0">
                              <span className="text-[9px] font-mono font-black text-stone-300">🃏 {capturedCards}</span>
                              <span className="text-stone-700 text-[8px]">|</span>
                              <span className="text-[9px] font-mono font-black text-stone-300">♣️ {capturedClubs}</span>
                            </div>
                            
                            <div className="flex gap-1">
                              {has10Diamond && <span className="text-[11px] drop-shadow-md" title="10 აგური">💎</span>}
                              {has2Club && <span className="text-[11px] drop-shadow-md" title="2 ჯვარი">♣️</span>}
                            </div>
                          </div>

                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end z-10">
                        <div className="flex items-center -space-x-1.5">
                          {Array.from({length: p.cards?.length || 0}).map((_, idx) => (
                              <div 
                                key={idx} 
                                style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'backwards' }}
                                className={`w-3.5 h-5 md:w-4 md:h-6 rounded-sm border shadow-md ${activeCardBack} animate-in zoom-in-50 fade-in duration-500`}
                              ></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={`${mobileModal === 'players' ? 'hidden lg:flex' : 'flex'} flex-col w-full flex-1 min-h-0 overflow-hidden`}>
            <div className={`${mobileModal ? 'bg-transparent shadow-none border-none p-0' : `${activeTheme.card} backdrop-blur-md border border-white/5 rounded-3xl shadow-2xl transition-colors`} flex flex-col h-full overflow-hidden`}>
              
              {!mobileModal && (
                <div className={`p-4 border-b border-white/5 flex items-center gap-2 shrink-0`}>
                  <MessageSquare size={14} className={activeTheme.accent} />
                  <h3 className="text-[10px] md:text-xs font-black text-stone-400 uppercase tracking-widest">Quick Chat</h3>
                </div>
              )}
              
              <div ref={chatRef} className="flex-1 p-3 md:p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3 min-h-[150px]">
                {messages.length === 0 ? (
                  <div className="m-auto text-[10px] font-bold text-stone-600 uppercase tracking-widest text-center">ფრაზები არ არის</div>
                ) : (
                  messages.map((m, i) => {
                    const isMsgVip = checkIsVip(m.isVip);
                    return (
                      <div key={i} className={`flex flex-col max-w-[85%] ${m.senderId === socket.id ? 'self-end items-end' : 'self-start items-start'}`}>
                        <span className="text-[8px] md:text-[9px] text-stone-500 font-bold mb-1 ml-1">
                           <VipName name={m.sender} isVip={isMsgVip} />
                        </span>
                        <div className={`px-2.5 md:px-3 py-1.5 md:py-2 rounded-2xl text-[10px] md:text-xs font-medium shadow-md transition-all
                          ${m.senderId === socket.id 
                            ? (isMsgVip ? `${activeTheme.accentBg} text-stone-950 rounded-tr-sm ring-1 ring-yellow-400` : `${activeTheme.accentBg} text-stone-950 rounded-tr-sm`) 
                            : (isMsgVip ? 'bg-stone-800/90 text-yellow-500 rounded-tl-sm border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.1)]' : 'bg-stone-800 text-stone-200 rounded-tl-sm border border-white/5')
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              
              <div className={`p-2.5 md:p-3 ${mobileModal ? 'bg-stone-950/60 rounded-2xl mt-2' : 'bg-stone-950/60 border-t border-white/5'} shrink-0 grid grid-cols-2 gap-2`}>
                {QUICK_PHRASES.map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      handleSendQuickMessage(phrase);
                      if(mobileModal) setMobileModal(null);
                    }}
                    className="bg-stone-900 hover:bg-stone-800 border border-white/5 hover:border-white/10 rounded-lg py-2 px-2.5 text-[9px] md:text-[11px] font-bold text-stone-300 text-left truncate active:scale-95 transition-all shadow-sm"
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className={`flex-1 bg-stone-900/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl flex flex-col relative overflow-hidden order-1 lg:order-2 ${mobileModal ? 'hidden lg:flex' : 'flex'}`}>
        
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

        <div className="flex items-center justify-between p-2.5 md:p-4 border-b border-white/5 bg-stone-950/40 rounded-t-3xl shrink-0">
          
          <div className="flex items-center gap-2">
            <span className={`text-[10px] md:text-xs font-black tracking-widest font-mono ${activeTheme.accent} hidden sm:block`}>ROOM: {room.id}</span>
            <button onClick={onLeave} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[9px] md:text-[10px] font-black transition-colors border border-rose-500/20 active:scale-95">
              <LogOut size={12} /> <span className="hidden sm:block">LEAVE</span>
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex lg:hidden items-center gap-2 mr-2 border-r border-white/10 pr-2">
               <button onClick={() => setMobileModal('players')} className="p-1.5 bg-stone-900 border border-white/5 rounded-lg text-stone-300 active:scale-95 shadow-sm">
                 <Users size={14} className={activeTheme.accent} />
               </button>
               <button onClick={() => { setMobileModal('chat'); setUnreadChat(false); }} className="relative p-1.5 bg-stone-900 border border-white/5 rounded-lg text-stone-300 active:scale-95 shadow-sm">
                 <MessageSquare size={14} className={activeTheme.accent} />
                 {unreadChat && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-stone-900 animate-pulse shadow-[0_0_5px_rgba(244,63,94,0.8)]"></span>}
               </button>
            </div>

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

        <div className="flex-1 flex flex-col justify-between p-3 md:p-6 relative min-h-0">
          
          {room.deck?.length > 0 && (
            <div className="absolute top-2 left-2 md:top-4 md:left-6 flex flex-col items-center z-40" title="დარჩენილი ბანქო">
              <div className={`relative w-10 h-14 md:w-14 md:h-20 rounded-md md:rounded-lg border shadow-lg flex items-center justify-center ${activeCardBack}`}>
                <div className={`absolute inset-0 rounded-md md:rounded-lg border ${activeCardBack} translate-x-[3px] -translate-y-[3px] -z-10 shadow-sm`}></div>
                <div className={`absolute inset-0 rounded-md md:rounded-lg border ${activeCardBack} translate-x-[6px] -translate-y-[6px] -z-20 shadow-sm`}></div>
                <div className="bg-stone-950/90 px-2 py-0.5 md:py-1 rounded text-white text-[10px] md:text-xs font-black shadow-inner border border-white/10">
                  {room.deck.length}
                </div>
              </div>
            </div>
          )}

          <div className="text-center h-8 md:h-10 relative z-10 shrink-0">
            {isMyTurn ? (
              <div className={`inline-flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-stone-900 border border-white/10 rounded-full ${activeTheme.accent} text-[10px] md:text-xs font-black shadow-[0_0_15px_currentColor] animate-pulse`}>
                <Sparkles size={14} className="md:w-[16px] md:h-[16px]" /> შენი სვლაა!
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-stone-950/60 border border-white/5 rounded-full text-stone-400 text-[10px] md:text-xs font-bold shadow-inner">
                <Clock size={12} className="animate-spin-slow md:w-[14px] md:h-[14px]" /> ველოდებით...
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative mt-2 w-full z-10 min-h-0">
            
            <div className="h-10 md:h-14 mb-2 flex items-center justify-center w-full z-20 shrink-0">
              {room.lastAction && (() => {
                const isCapture = room.lastAction.type === 'CAPTURE';
                const isSweep = isCapture && ['J', 'j', 'ვალეტი'].includes(room.lastAction.cardFromHand.rank);
                
                const has10Diamond = isCapture && (
                  (room.lastAction.cardFromHand.rank === '10' && ['♦', '♦️'].includes(room.lastAction.cardFromHand.suit)) ||
                  room.lastAction.cardsFromTable?.some(c => c.rank === '10' && ['♦', '♦️'].includes(c.suit))
                );
                
                const has2Club = isCapture && (
                  (room.lastAction.cardFromHand.rank === '2' && ['♣', '♣️'].includes(room.lastAction.cardFromHand.suit)) ||
                  room.lastAction.cardsFromTable?.some(c => c.rank === '2' && ['♣', '♣️'].includes(c.suit))
                );

                const renderCardInLog = (c, isHandCard = false) => {
                  const is10D = c.rank === '10' && ['♦', '♦️'].includes(c.suit);
                  const is2C = c.rank === '2' && ['♣', '♣️'].includes(c.suit);
                  
                  let extraClasses = "bg-stone-950 border-white/5";
                  if (is10D) {
                    extraClasses = "bg-rose-500/20 border-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.8)] animate-pulse";
                  } else if (is2C) {
                    extraClasses = "bg-sky-500/20 border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)] animate-pulse";
                  } else if (isSweep && isHandCard) {
                    extraClasses = "bg-yellow-500/20 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)] animate-pulse";
                  }

                  return (
                    <div key={`${c.rank}-${c.suit}-${isHandCard ? 'hand' : 'table'}`} className={`flex items-center gap-0.5 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md md:rounded-lg border ${extraClasses}`}>
                      <span className={`text-[10px] md:text-xs font-black ${getSuitColor(c.suit)}`}>{c.rank}</span>
                      <span className={`text-xs md:text-sm ${getSuitColor(c.suit)}`}>{c.suit}</span>
                    </div>
                  );
                };

                let containerBorder = "border-white/10";
                let actionText = isCapture ? 'მოჭრა' : 'დააგდო';
                let actionColor = "text-stone-400";
                
                if (isSweep) {
                  containerBorder = "border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]";
                  actionText = "გაასუფთავა 🧹";
                  actionColor = "text-yellow-400 drop-shadow-md";
                } else if (has10Diamond) {
                  containerBorder = "border-rose-500/50 shadow-[0_0_15px_rgba(225,29,72,0.2)]";
                } else if (has2Club) {
                  containerBorder = "border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.2)]";
                }

                return (
                  <div className={`bg-stone-900/95 border px-3 md:px-5 py-1.5 md:py-2 rounded-xl md:rounded-2xl flex items-center gap-1.5 md:gap-2 animate-in slide-in-from-bottom-2 duration-300 ${containerBorder}`}>
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap flex items-center gap-1 text-stone-400">
                      <VipName name={room.lastAction.playerName} isVip={checkIsVip(room.lastAction.isVip)} className={activeTheme.accent} />-მ 
                      <span className={actionColor}>{actionText}</span>
                    </span>
                    <div className="flex items-center gap-1 md:gap-1.5 ml-1">
                      {renderCardInLog(room.lastAction.cardFromHand, true)}
                      
                      {isCapture && room.lastAction.cardsFromTable?.length > 0 && (
                        <>
                          <span className="text-stone-600 text-[10px] md:text-xs font-black">+</span>
                          <div className="flex items-center gap-0.5 md:gap-1">
                            {room.lastAction.cardsFromTable.map(c => renderCardInLog(c))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="w-full md:w-[85%] max-w-2xl min-h-[11rem] md:min-h-[14rem] py-6 md:py-8 bg-stone-950/30 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 shadow-inner flex items-center justify-center px-2 md:px-4 z-10 relative">
              <div className="flex flex-wrap justify-center gap-2 md:gap-3 z-10">
                {room.tableCards?.length > 0 ? room.tableCards.map((c, i) => {
                  const isSelected = selectedCardsFromTable.some(tc => tc.rank === c.rank && tc.suit === c.suit);
                  const isBeingCaptured = room.lastAction?.type === 'CAPTURE' && room.lastAction.cardsFromTable.some(cap => cap.rank === c.rank && cap.suit === c.suit);

                  return (
                    <div 
                      key={`${c.rank}-${c.suit}`} 
                      onClick={() => isMyTurn && toggleTableCard(c)}
                      style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'backwards' }}
                      className={`relative w-14 h-20 md:w-20 md:h-28 bg-gradient-to-br from-stone-50 to-stone-300 rounded-md md:rounded-xl shadow-xl flex flex-col justify-between p-1 md:p-1.5 select-none cursor-pointer transition-all duration-300 border border-stone-400
                        ${isSelected ? `ring-2 md:ring-4 ${activeTheme.accent.replace('text-', 'ring-')} -translate-y-2 md:-translate-y-3 shadow-2xl scale-105` : 'hover:-translate-y-1 hover:shadow-2xl'}
                        ${isBeingCaptured ? 'animate-fly-out z-50 pointer-events-none' : 'animate-in zoom-in-50 fade-in duration-500'}
                      `}
                    >
                      <div className="flex flex-col items-center self-start">
                        <span className={`text-[10px] md:text-[14px] font-black ${getSuitColor(c.suit)} leading-none`}>{c.rank}</span>
                        <span className={`text-[8px] md:text-[10px] ${getSuitColor(c.suit)} leading-none mt-0.5`}>{c.suit}</span>
                      </div>
                      <span className={`text-2xl md:text-3xl self-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-90 drop-shadow-sm ${getSuitColor(c.suit)}`}>{c.suit}</span>
                      <div className="flex flex-col items-center self-end rotate-180">
                        <span className={`text-[10px] md:text-[14px] font-black ${getSuitColor(c.suit)} leading-none`}>{c.rank}</span>
                        <span className={`text-[8px] md:text-[10px] ${getSuitColor(c.suit)} leading-none mt-0.5`}>{c.suit}</span>
                      </div>
                    </div>
                  );
                }) : (
                  <span className="text-stone-700/50 font-black text-xs md:text-xl uppercase tracking-widest select-none z-10">მაგიდა ცარიელია</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 md:gap-5 mt-4 z-20 shrink-0">
            
            <div className="flex flex-col md:flex-row justify-between items-center bg-stone-950/60 p-1.5 md:p-2 rounded-2xl md:rounded-full border border-white/5 backdrop-blur-md shadow-lg z-10 w-full max-w-[95vw] md:max-w-max mx-auto overflow-hidden gap-2 md:gap-0">
              <div className="flex overflow-x-auto custom-scrollbar gap-2 md:gap-3 px-2 py-1 items-center flex-1 w-full md:w-auto md:max-w-max">
                {standardEmotes.map(emo => (
                  <button 
                    key={emo} 
                    onClick={() => !hasActiveEmote && handleSendEmote(emo)} 
                    disabled={hasActiveEmote}
                    className={`text-lg md:text-xl transition-all flex-shrink-0 ${hasActiveEmote ? 'opacity-20 cursor-not-allowed grayscale' : 'hover:scale-125 hover:-translate-y-1 active:scale-95 grayscale opacity-70 hover:grayscale-0 hover:opacity-100'}`}
                  >
                    {emo}
                  </button>
                ))}
                
                <div className="w-px h-6 bg-white/10 shrink-0 mx-1 hidden md:block"></div>
                
                {vipEmotes.map(emo => (
                  <button 
                    key={emo} 
                    onClick={() => amIVip && !hasActiveEmote && handleSendEmote(emo)} 
                    disabled={!amIVip || hasActiveEmote}
                    className={`relative text-lg md:text-xl transition-all shrink-0 flex-shrink-0 ${amIVip && !hasActiveEmote ? 'hover:scale-125 hover:-translate-y-1 active:scale-95 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]' : 'opacity-20 cursor-not-allowed grayscale'}`}
                  >
                    {emo} {!amIVip && <Lock size={10} className="absolute -bottom-1 -right-1 text-yellow-500/50"/>}
                  </button>
                ))}
              </div>
              
              <div className="w-full h-px md:w-px md:h-8 bg-white/10 shrink-0 mx-1"></div>
              
              <button 
                onClick={handlePlayCard}
                disabled={!isMyTurn || !selectedCardFromHand}
                className={`w-full md:w-auto shrink-0 px-4 md:px-6 py-2.5 md:py-2.5 rounded-xl md:rounded-full text-[11px] md:text-xs font-black transition-all shadow-md active:scale-95 uppercase tracking-wide ${!isMyTurn || !selectedCardFromHand ? 'bg-stone-800 text-stone-500 cursor-not-allowed' : selectedCardsFromTable.length > 0 ? 'bg-white text-stone-900 shadow-xl' : `${activeTheme.accentBg} text-stone-950 shadow-xl`}`}
              >
                {selectedCardsFromTable.length > 0 ? 'მოჭრა ⚔️' : 'დაგდება 🃏'}
              </button>
            </div>

            <div className="flex justify-center items-end h-24 md:h-32 pt-4 pb-2 perspective-1000 w-full mt-2 md:mt-4 overflow-visible">
              {me?.cards?.map((c, i) => {
                const isSelected = selectedCardFromHand?.rank === c.rank && selectedCardFromHand?.suit === c.suit;
                
                const totalCards = me.cards.length;
                const centerIndex = (totalCards - 1) / 2;
                const offset = i - centerIndex;
                
                const rotation = offset * 8; 
                const yPush = Math.abs(offset) * 4; 
                const overlapMargin = i !== 0 ? '-ml-5 md:-ml-8' : ''; 

                return (
                  <div 
                    key={`${c.rank}-${c.suit}`}
                    style={{ 
                      transform: `rotate(${rotation}deg) translateY(${yPush}px)`,
                      transformOrigin: 'bottom center',
                      zIndex: isSelected ? 50 : i + 10,
                      animationDelay: `${(i + 2) * 100}ms`, animationFillMode: 'backwards'
                    }}
                    className={`relative transition-all duration-300 ease-out transform-gpu animate-in slide-in-from-top-[10vh] md:slide-in-from-top-[15vh] zoom-in-50 fade-in ${overlapMargin}`}
                  >
                    <div 
                      onClick={() => isMyTurn && setSelectedCardFromHand(isSelected ? null : c)}
                      className={`relative w-14 h-20 md:w-20 md:h-28 bg-gradient-to-br from-stone-50 to-stone-300 rounded-lg md:rounded-xl flex flex-col justify-between p-1 md:p-1.5 select-none cursor-pointer transition-all duration-300 border border-stone-400 shadow-[0_5px_15px_rgba(0,0,0,0.4)]
                        ${isSelected ? `-translate-y-5 md:-translate-y-8 scale-110 shadow-[0_20px_40px_rgba(0,0,0,0.6)] ring-2 md:ring-4 ${activeTheme.accent.replace('text-', 'ring-')}` : 'hover:-translate-y-2 md:hover:-translate-y-4 hover:shadow-[0_15px_30px_rgba(0,0,0,0.6)]'}
                      `}
                    >
                      <div className="flex flex-col items-center self-start">
                        <span className={`text-[11px] md:text-[14px] font-black ${getSuitColor(c.suit)} leading-none`}>{c.rank}</span>
                        <span className={`text-[9px] md:text-[10px] ${getSuitColor(c.suit)} leading-none mt-0.5`}>{c.suit}</span>
                      </div>
                      <span className={`text-2xl md:text-3xl self-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-90 drop-shadow-sm ${getSuitColor(c.suit)}`}>{c.suit}</span>
                      <div className="flex flex-col items-center self-end rotate-180">
                        <span className={`text-[11px] md:text-[14px] font-black ${getSuitColor(c.suit)} leading-none`}>{c.rank}</span>
                        <span className={`text-[9px] md:text-[10px] ${getSuitColor(c.suit)} leading-none mt-0.5`}>{c.suit}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

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
                  <div className="bg-stone-950/80 border border-white/10 rounded-2xl p-4 md:p-5 mb-4 md:mb-6 shadow-inner ring-1 ring-white/5">
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">გამარჯვებული</p>
                    <div className="text-2xl md:text-3xl font-black text-white drop-shadow-md">
                      <VipName name={room.roundSummary.matchWinner} isVip={checkIsVip(room.players.find(p=>p.name===room.roundSummary.matchWinner)?.vipUntil)} /> 🎉
                    </div>
                  </div>
                )}

                {room.roundSummary.matchWinner && (room.betAmount > 0 || room.bet > 0 || room.isRanked) && (() => {
                  const baseBet = 50;
                  const winXp = amIVip ? 35 : 25;
                  const loseXp = amIVip ? 5 : 10;
                  const winCoins = amIVip ? 75 : 50;
                  const loseCoins = amIVip ? 25 : 50;

                  return (
                    <div className="bg-stone-950/80 border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-4 mb-4 md:mb-6 shadow-inner flex justify-around items-center ring-1 ring-white/5">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-1">XP</span>
                        <span className={`text-base md:text-lg font-black ${room.roundSummary.matchWinner === me?.name ? 'text-green-400' : 'text-rose-400'} drop-shadow-md`}>
                          {room.roundSummary.matchWinner === me?.name ? `↑ +${winXp}` : `↓ -${loseXp}`}
                        </span>
                      </div>
                      <div className="w-px h-8 bg-white/10"></div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-1">ქოინები</span>
                        <span className={`text-base md:text-lg font-black ${room.roundSummary.matchWinner === me?.name ? 'text-yellow-400' : 'text-rose-400'} drop-shadow-md`}>
                          {room.roundSummary.matchWinner === me?.name ? `+${winCoins}` : `-${loseCoins}`} 🪙
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