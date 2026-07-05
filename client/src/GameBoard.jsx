import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { LogOut, Send, MessageSquare, Volume2, VolumeX, Sparkles, Trophy, Clock, Users, Lock } from 'lucide-react';

export default function GameBoard({ room, socket, onLeave, activeTheme, checkIsVip, VipName }) {
  const [selectedCardFromHand, setSelectedCardFromHand] = useState(null);
  const [selectedCardsFromTable, setSelectedCardsFromTable] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [activeEmotes, setActiveEmotes] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(100);
  const chatRef = useRef(null);

  const me = room?.players?.find(p => p.id === socket.id);
  const isMyTurn = room?.players?.[room.currentTurn]?.id === socket.id;
  const amIVip = checkIsVip(me?.vipUntil);

  const standardEmotes = ['🔥', '😂', '😎', '🤯', '🃏', '⏳', '👏', '💀'];
  const vipEmotes = ['🤑', '🤬', '🍻', '🤡', '👽'];

  const playSoftSound = (isCapture = false) => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isCapture ? 220 : 330, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
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
  }, [socket]);

  const handlePlayCard = () => {
    if (!isMyTurn || !selectedCardFromHand) return;
    playSoftSound(selectedCardsFromTable.length > 0);
    socket.emit('playCard', { roomId: room.id, cardFromHand: selectedCardFromHand, cardsFromTable: selectedCardsFromTable });
    setSelectedCardFromHand(null);
    setSelectedCardsFromTable([]);
  };

  const handleSendEmote = (emote) => {
    socket.emit('sendEmote', { roomId: room.id, emote });
    const id = Date.now() + Math.random();
    setActiveEmotes(prev => [...prev, { id, playerId: socket.id, emote }]);
    setTimeout(() => { setActiveEmotes(prev => prev.filter(e => e.id !== id)); }, 3000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    socket.emit('sendMessage', { roomId: room.id, message: chatMessage });
    setChatMessage('');
  };

  const toggleTableCard = (card) => {
    const isSelected = selectedCardsFromTable.some(c => c.rank === card.rank && c.suit === card.suit);
    if (isSelected) {
      setSelectedCardsFromTable(prev => prev.filter(c => !(c.rank === card.rank && c.suit === card.suit)));
    } else {
      setSelectedCardsFromTable(prev => [...prev, card]);
    }
  };

  const getSuitColor = (suit) => (['♥', '♦'].includes(suit) ? 'text-rose-500' : 'text-stone-900');

  const cardBackStyles = {
    classic: 'bg-blue-900 border-white/20',
    crimson: 'bg-red-900 border-white/20',
    gold: 'bg-yellow-600 border-yellow-400',
    obsidian: 'bg-stone-950 border-stone-700'
  };
  const activeCardBack = cardBackStyles[room?.hostCardBack] || cardBackStyles['classic'];

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto min-h-[85vh] h-auto pb-10 lg:pb-0">
      
      <div className="w-full lg:w-80 flex flex-col gap-4 order-2 lg:order-1">
        <div className={`${activeTheme.card} backdrop-blur-md border border-white/5 rounded-3xl p-4 md:p-5 shadow-2xl flex flex-col gap-3 relative overflow-hidden transition-colors`}>
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50 ${activeTheme.accent}`}></div>
          <h3 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-1 md:mb-2 ${activeTheme.accent}`}>
            <Users size={14} /> მოთამაშეები
          </h3>
          {room?.players?.map((p, i) => {
            const isCurrentTurn = room.currentTurn === i;
            const emote = activeEmotes.find(e => e.playerId === p.id);
            
            // 🟢 მოთამაშის დეტალური სტატისტიკა
            const capturedCards = p.captured?.length || 0;
            const capturedClubs = p.captured?.filter(c => c.suit === '♣' || c.suit === '♣️').length || 0;
            const has10Diamond = p.captured?.some(c => c.rank === '10' && (c.suit === '♦' || c.suit === '♦️'));
            const has2Club = p.captured?.some(c => c.rank === '2' && (c.suit === '♣' || c.suit === '♣️'));

            return (
              <div key={p.id} className={`relative flex items-center justify-between p-2.5 md:p-3 rounded-2xl border transition-all duration-500 ${isCurrentTurn ? `bg-stone-900 border-white/10 shadow-2xl scale-[1.03] z-10 ${activeTheme.accent.replace('text-', 'ring-1 ring-')}` : 'bg-stone-950/40 border-white/5'}`}>
                
                {isCurrentTurn && <div className={`absolute inset-0 ${activeTheme.accentBg} opacity-[0.03] rounded-2xl`} />}
                {isCurrentTurn && <div className={`absolute -left-[1px] top-1/2 -translate-y-1/2 w-1.5 h-8 ${activeTheme.accentBg} rounded-r-md shadow-[0_0_12px_currentColor] animate-pulse z-20`} />}
                
                <div className="flex items-start gap-2.5 z-10">
                  <span className="text-2xl drop-shadow-md mt-0.5">{p.avatar || '😎'}</span>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs md:text-sm truncate max-w-[120px]">
                      <VipName name={`${p.name} ${p.id === socket.id ? '(შენ)' : ''}`} isVip={checkIsVip(p.vipUntil)} className={isCurrentTurn ? activeTheme.accent : 'text-stone-200'} />
                    </span>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[9px] md:text-[10px] text-stone-500 font-bold tracking-wider">ქულა: <span className="text-stone-200">{p.totalScore}</span></span>
                      
                      {/* 🟢 ბარათების და ჯვრების მთვლელი */}
                      <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-stone-950/60 rounded border border-white/5">
                        <span className="text-[9px] font-mono font-black text-stone-300" title="წაღებული კარტები">🃏 {capturedCards}</span>
                        <span className="text-stone-700 text-[8px]">|</span>
                        <span className="text-[9px] font-mono font-black text-stone-300" title="წაღებული ჯვრები">♣️ {capturedClubs}</span>
                      </div>
                      
                      {/* 🟢 10 აგურის და 2 ჯვრის ინდიკატორი */}
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
                        <div key={idx} className={`w-3.5 h-5 md:w-4 md:h-6 rounded-sm border shadow-md ${activeCardBack}`}></div>
                     ))}
                   </div>
                </div>

                {emote && (
                  <div className="absolute -right-2 -top-4 text-2xl md:text-3xl animate-bounce drop-shadow-xl z-20">
                    {emote.emote}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={`${activeTheme.card} backdrop-blur-md border border-white/5 rounded-3xl flex flex-col shadow-2xl overflow-hidden min-h-[200px] md:min-h-[250px] transition-colors`}>
          <div className="p-3 md:p-4 border-b border-white/5 flex items-center gap-2">
            <MessageSquare size={14} className={activeTheme.accent} />
            <h3 className="text-[10px] md:text-xs font-black text-stone-400 uppercase tracking-widest">Live Chat</h3>
          </div>
          <div ref={chatRef} className="flex-1 p-3 md:p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3">
            {messages.length === 0 ? (
              <div className="m-auto text-[10px] font-bold text-stone-600 uppercase tracking-widest text-center">მესიჯები არ არის</div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex flex-col max-w-[85%] ${m.senderId === socket.id ? 'self-end items-end' : 'self-start items-start'}`}>
                  <span className="text-[8px] md:text-[9px] text-stone-500 font-bold mb-1 ml-1">
                     <VipName name={m.sender} isVip={checkIsVip(m.isVip)} /> • {m.timestamp}
                  </span>
                  <div className={`px-2.5 md:px-3 py-1.5 md:py-2 rounded-2xl text-[10px] md:text-xs font-medium shadow-md ${m.senderId === socket.id ? `${activeTheme.accentBg} text-stone-950 rounded-tr-sm` : 'bg-stone-800 text-stone-200 rounded-tl-sm border border-white/5'}`}>
                    {m.text}
                  </div>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleSendMessage} className="p-2.5 md:p-3 bg-stone-950/60 border-t border-white/5 flex gap-2">
            <input type="text" value={chatMessage} onChange={e => setChatMessage(e.target.value)} placeholder="დაწერე..." className={`flex-1 bg-stone-900 border border-white/10 rounded-xl px-3 py-2 text-[10px] md:text-xs text-stone-200 focus:outline-none transition-all placeholder-stone-600 focus:border-opacity-50 focus:border-current ${activeTheme.accent}`} />
            <button type="submit" className={`${activeTheme.accentBg} hover:opacity-80 text-stone-950 p-2 rounded-xl transition-all shadow-md active:scale-95`}><Send size={14} /></button>
          </form>
        </div>
      </div>

      <div className="flex-1 bg-stone-900/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl flex flex-col relative overflow-visible order-1 lg:order-2">
        
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-white/5 bg-stone-950/40 rounded-t-3xl">
          <div className="flex items-center gap-2 md:gap-3">
            <span className={`text-[10px] md:text-xs font-black tracking-widest font-mono ${activeTheme.accent}`}>ROOM: {room.id}</span>
            <button onClick={onLeave} className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[9px] md:text-[10px] font-black transition-colors border border-rose-500/20 active:scale-95">
              <LogOut size={12} /> LEAVE
            </button>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => setIsMuted(!isMuted)} className={`text-stone-500 hover:${activeTheme.accent} transition-colors`}>
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <span className="text-[10px] md:text-xs font-bold text-stone-400 bg-stone-900/80 px-2.5 md:px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5 md:gap-2">
              <Trophy size={12} className={activeTheme.accent}/> {room.targetScore} ქულა
            </span>
          </div>
        </div>

        {isMyTurn && (
          <div className="w-full h-1 bg-stone-950 overflow-hidden">
            <div className={`h-full ${activeTheme.accentBg} transition-all duration-50`} style={{ width: `${timeLeft}%` }} />
          </div>
        )}

        <div className="flex-1 flex flex-col justify-between p-4 md:p-6 relative">
          
          <div className="text-center h-8 md:h-10 relative">
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

          <div className="flex-1 flex flex-col items-center justify-center relative mt-2 w-full">
            
            {/* 🟢 ბოლო სვლის ველი (აღარ ფარავს მაგიდას, ამოწეულია ზემოთ) */}
            <div className="h-10 md:h-14 mb-2 flex items-center justify-center w-full z-20">
              {room.lastAction && (
                <div className="bg-stone-900/90 border border-white/10 px-3 md:px-5 py-1.5 md:py-2 rounded-xl md:rounded-2xl shadow-xl flex items-center gap-1.5 md:gap-2 animate-in slide-in-from-bottom-2 duration-300">
                  <span className="text-[8px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest whitespace-nowrap">
                    <VipName name={room.lastAction.playerName} isVip={checkIsVip(room.lastAction.isVip)} className={activeTheme.accent} />-მ {room.lastAction.type === 'CAPTURE' ? 'მოჭრა' : 'დააგდო'}
                  </span>
                  <div className="flex items-center gap-1 md:gap-1.5 ml-1">
                    <div className="flex items-center gap-0.5 px-1.5 md:px-2 py-0.5 md:py-1 bg-stone-950 rounded-md md:rounded-lg border border-white/5">
                      <span className={`text-[10px] md:text-xs font-black ${getSuitColor(room.lastAction.cardFromHand.suit)}`}>{room.lastAction.cardFromHand.rank}</span>
                      <span className={`text-xs md:text-sm ${getSuitColor(room.lastAction.cardFromHand.suit)}`}>{room.lastAction.cardFromHand.suit}</span>
                    </div>
                    {room.lastAction.type === 'CAPTURE' && room.lastAction.cardsFromTable?.length > 0 && (
                      <>
                        <span className="text-stone-600 text-[10px] md:text-xs font-black">+</span>
                        <div className="flex items-center gap-0.5 md:gap-1">
                          {room.lastAction.cardsFromTable.map((c, idx) => (
                            <div key={idx} className="flex items-center gap-0.5 px-1.5 md:px-2 py-0.5 md:py-1 bg-stone-950 rounded-md md:rounded-lg border border-white/5">
                              <span className={`text-[10px] md:text-xs font-black ${getSuitColor(c.suit)}`}>{c.rank}</span>
                              <span className={`text-xs md:text-sm ${getSuitColor(c.suit)}`}>{c.suit}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-full md:w-[85%] max-w-2xl min-h-[11rem] md:min-h-[14rem] py-6 md:py-8 bg-stone-950/30 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 shadow-inner flex items-center justify-center px-2 md:px-4 z-10 relative">
              <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                {/* მაგიდის კარტები გაუმჯობესებული ანიმაციით */}
{room.tableCards?.length > 0 ? room.tableCards.map((c, i) => {
  const isSelected = selectedCardsFromTable.some(tc => tc.rank === c.rank && tc.suit === c.suit);
  
  // 🟢 ვამოწმებთ, ეს კარტი ახლახანს ხომ არ მოჭრეს
  const isBeingCaptured = room.lastAction?.type === 'CAPTURE' && room.lastAction.cardsFromTable.some(cap => cap.rank === c.rank && cap.suit === c.suit);

  return (
    <div 
      key={i} 
      onClick={() => isMyTurn && toggleTableCard(c)}
      className={`w-14 h-20 md:w-20 md:h-28 bg-stone-100 rounded-lg md:rounded-xl shadow-xl flex flex-col justify-between p-1.5 md:p-2 select-none cursor-pointer transition-all duration-300 
        ${isSelected ? `ring-2 md:ring-4 ${activeTheme.accent.replace('text-', 'ring-')} -translate-y-2 md:-translate-y-3 shadow-2xl` : 'hover:-translate-y-1 hover:shadow-2xl'}
        ${isBeingCaptured ? 'animate-fly-out z-50 pointer-events-none' : 'animate-in zoom-in'}
      `}
    >
      <span className={`text-xs md:text-base font-black ${getSuitColor(c.suit)} leading-none`}>{c.rank}</span>
      <span className={`text-xl md:text-3xl self-center ${getSuitColor(c.suit)} drop-shadow-md`}>{c.suit}</span>
      <span className={`text-xs md:text-base font-black ${getSuitColor(c.suit)} self-end rotate-180 leading-none`}>{c.rank}</span>
    </div>
  );
}) : (
  <span className="text-stone-700/50 font-black text-xs md:text-xl uppercase tracking-widest select-none">მაგიდა ცარიელია</span>
)}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 md:gap-5 mt-4">
            
            {/* 🟢 ემოჯები და მოქმედების ღილაკი (სქროლი მოიხსნა, იყენებს flex-wrap) */}
            <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4 bg-stone-950/60 p-2.5 rounded-2xl border border-white/5 backdrop-blur-md shadow-lg z-10 w-full max-w-[320px] md:max-w-max mx-auto">
              <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 px-1">
                {standardEmotes.map(emo => (
                  <button key={emo} onClick={() => handleSendEmote(emo)} className="text-lg md:text-xl hover:scale-125 hover:-translate-y-1 transition-all active:scale-95 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 flex-shrink-0">{emo}</button>
                ))}
                <div className="w-px h-6 bg-white/10 mx-1 shrink-0 hidden md:block"></div>
                {vipEmotes.map(emo => (
                  <button key={emo} onClick={() => amIVip && handleSendEmote(emo)} className={`relative text-lg md:text-xl transition-all shrink-0 ${amIVip ? 'hover:scale-125 hover:-translate-y-1 active:scale-95 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]' : 'opacity-20 cursor-not-allowed grayscale'}`}>
                    {emo} {!amIVip && <Lock size={10} className="absolute -bottom-1 -right-1 text-yellow-500/50"/>}
                  </button>
                ))}
              </div>
              <div className="w-full h-px bg-white/5 my-0.5 md:hidden"></div>
              <div className="hidden md:block w-px h-8 bg-white/10 mx-1"></div>
              <button 
                onClick={handlePlayCard}
                disabled={!isMyTurn || !selectedCardFromHand}
                className={`w-full md:w-auto px-5 md:px-6 py-2.5 md:py-2 rounded-xl text-[11px] md:text-xs font-black transition-all shadow-md active:scale-95 uppercase tracking-wide ${!isMyTurn || !selectedCardFromHand ? 'bg-stone-800 text-stone-500 cursor-not-allowed' : selectedCardsFromTable.length > 0 ? 'bg-white text-stone-900 shadow-xl' : `${activeTheme.accentBg} text-stone-950 shadow-xl`}`}
              >
                {selectedCardsFromTable.length > 0 ? 'მოჭრა ⚔️' : 'დაგდება 🃏'}
              </button>
            </div>

            {/* 🟢 ხელის კარტები (დაპატარავებულია, აღარ ფარავს ემოჯებს) */}
            <div className="flex justify-center gap-1.5 md:gap-3 h-24 md:h-32 pt-3 md:pt-4 items-end perspective-1000 overflow-visible w-full mt-2 md:mt-4">
              {me?.cards?.map((c, i) => {
                const isSelected = selectedCardFromHand?.rank === c.rank && selectedCardFromHand?.suit === c.suit;
                return (
                  <div 
                    key={i}
                    onClick={() => isMyTurn && setSelectedCardFromHand(isSelected ? null : c)}
                    className={`w-14 h-20 md:w-20 md:h-28 bg-stone-100 rounded-lg md:rounded-xl shadow-2xl flex flex-col justify-between p-1.5 md:p-2 select-none transition-all duration-300 ease-out cursor-pointer transform-gpu flex-shrink-0 ${isSelected ? `-translate-y-3 md:-translate-y-6 scale-105 shadow-[0_15px_30px_rgba(0,0,0,0.6)] ring-2 md:ring-4 ${activeTheme.accent.replace('text-', 'ring-')} z-20` : 'hover:-translate-y-1.5 md:hover:-translate-y-3 hover:shadow-[0_10px_20px_rgba(0,0,0,0.5)] z-10'}`}
                  >
                    <span className={`text-[11px] md:text-sm font-black ${getSuitColor(c.suit)} leading-none`}>{c.rank}</span>
                    <span className={`text-xl md:text-3xl self-center ${getSuitColor(c.suit)} drop-shadow-md`}>{c.suit}</span>
                    <span className={`text-[11px] md:text-sm font-black ${getSuitColor(c.suit)} self-end rotate-180 leading-none`}>{c.rank}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {room?.roundSummary && (
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
            <div className={`bg-stone-900 border border-opacity-30 border-current rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-sm md:max-w-md w-full shadow-2xl text-center space-y-4 md:space-y-6 relative overflow-hidden ${activeTheme.accent}`}>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-current/10 via-stone-900 to-stone-900"></div>
              
              <div className="relative z-10">
                <Trophy size={36} className="mx-auto mb-3 md:mb-4 drop-shadow-lg md:w-[48px] md:h-[48px]" />
                <h2 className="text-xl md:text-2xl font-black text-stone-100 mb-2 uppercase tracking-widest">
                  {room.roundSummary.matchWinner ? 'მატჩი დასრულდა' : 'რაუნდი დასრულდა'}
                </h2>
                
                {room.roundSummary.matchWinner && (
                  <div className={`${activeTheme.accentBg} bg-opacity-10 border border-opacity-30 border-current rounded-xl p-3 md:p-4 mb-4 md:mb-6`}>
                    <p className="text-[10px] md:text-sm font-bold uppercase opacity-80">გამარჯვებული</p>
                    <p className="text-xl md:text-2xl font-black mt-1">
                      <VipName name={room.roundSummary.matchWinner} isVip={checkIsVip(room.players.find(p=>p.name===room.roundSummary.matchWinner)?.vipUntil)} /> 🎉
                    </p>
                  </div>
                )}

                {!room.roundSummary.matchWinner && (
                  <div className="space-y-2 md:space-y-3 bg-stone-950/50 rounded-xl md:rounded-2xl p-3 md:p-4 border border-white/5 text-[10px] md:text-sm font-medium text-stone-300 mb-4 md:mb-6 text-left">
                    <div className="flex justify-between border-b border-white/5 pb-1.5 md:pb-2"><span>ბევრი კარტი:</span> <span className="font-black">{room.roundSummary.cardsWinner}</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-1.5 md:pb-2"><span>ბევრი ჯვარი:</span> <span className="font-black">{room.roundSummary.clubsWinner}</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-1.5 md:pb-2"><span>აგურის 10:</span> <span className="font-black">{room.roundSummary.diamond10Winner}</span></div>
                    <div className="flex justify-between"><span>ჯვრის 2:</span> <span className="font-black">{room.roundSummary.club2Winner}</span></div>
                  </div>
                )}

                <button 
                  onClick={() => socket.emit('nextRoundReady', { roomId: room.id })}
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