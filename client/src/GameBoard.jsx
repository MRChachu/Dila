import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { LogOut, Send, MessageSquare, Volume2, VolumeX, Sparkles, Trophy, Clock } from 'lucide-react';

export default function GameBoard({ room, socket, onLeave }) {
  const [selectedCardFromHand, setSelectedCardFromHand] = useState(null);
  const [selectedCardsFromTable, setSelectedCardsFromTable] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [activeEmotes, setActiveEmotes] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const chatRef = useRef(null);

  const me = room?.players?.find(p => p.id === socket.id);
  const isMyTurn = room?.players?.[room.currentTurn]?.id === socket.id;

  // ემოციების სია
  const emotes = ['🔥', '😂', '😎', '🤯', '🃏', '⏳', '👏', '💀'];

  // კონფეტის ეფექტი მოგებისას
  useEffect(() => {
    if (room?.roundSummary?.matchWinner) {
      const isMeWinner = room.roundSummary.matchWinner === me?.name;
      if (isMeWinner) {
        // ოქროსფერი პრემიუმ კონფეტი
        const duration = 3000;
        const end = Date.now() + duration;
        const frame = () => {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#f59e0b', '#fbbf24', '#d97706']
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#f59e0b', '#fbbf24', '#d97706']
          });
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

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto h-[85vh]">
      
      {/* მარცხენა პანელი: ჩატი და მოთამაშეები */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        {/* მოთამაშეების სია (Premium Glassmorphism) */}
        <div className="bg-stone-900/60 backdrop-blur-md border border-white/5 rounded-3xl p-5 shadow-2xl flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/0 via-amber-500/50 to-amber-500/0"></div>
          <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-2">
            <Users size={14} /> მოთამაშეები
          </h3>
          {room?.players?.map((p, i) => {
            const isCurrentTurn = room.currentTurn === i;
            const emote = activeEmotes.find(e => e.playerId === p.id);
            return (
              <div key={p.id} className={`relative flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 ${isCurrentTurn ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'bg-stone-950/40 border-white/5'}`}>
                {isCurrentTurn && <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-6 bg-amber-500 rounded-r-full animate-pulse" />}
                
                <div className="flex flex-col z-10">
                  <span className={`font-bold text-sm ${p.id === socket.id ? 'text-amber-400' : 'text-stone-200'}`}>
                    {p.name} {p.id === socket.id && '(შენ)'}
                  </span>
                  <span className="text-[10px] text-stone-500 font-bold mt-0.5 tracking-wider">ქულა: {p.totalScore}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-stone-900/80 px-2 py-1 rounded-lg border border-white/5 font-mono text-stone-400">
                    {p.cards?.length} 🃏
                  </span>
                </div>

                {/* ლაივ ემოციის ანიმაცია */}
                {emote && (
                  <div className="absolute -right-2 -top-4 text-3xl animate-bounce drop-shadow-xl z-20">
                    {emote.emote}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ლაივ ჩატი */}
        <div className="flex-1 bg-stone-900/60 backdrop-blur-md border border-white/5 rounded-3xl flex flex-col shadow-2xl overflow-hidden min-h-[250px]">
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <MessageSquare size={14} className="text-amber-500" />
            <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest">Live Chat</h3>
          </div>
          <div ref={chatRef} className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3">
            {messages.length === 0 ? (
              <div className="m-auto text-[10px] font-bold text-stone-600 uppercase tracking-widest text-center">მესიჯები არ არის</div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex flex-col max-w-[85%] ${m.senderId === socket.id ? 'self-end items-end' : 'self-start items-start'}`}>
                  <span className="text-[9px] text-stone-500 font-bold mb-1 ml-1">{m.sender} • {m.timestamp}</span>
                  <div className={`px-3 py-2 rounded-2xl text-xs font-medium shadow-md ${m.senderId === socket.id ? 'bg-amber-600/90 text-stone-950 rounded-tr-sm' : 'bg-stone-800 text-stone-200 rounded-tl-sm border border-white/5'}`}>
                    {m.text}
                  </div>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleSendMessage} className="p-3 bg-stone-950/60 border-t border-white/5 flex gap-2">
            <input type="text" value={chatMessage} onChange={e => setChatMessage(e.target.value)} placeholder="დაწერე..." className="flex-1 bg-stone-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500/50 transition-all placeholder-stone-600" />
            <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-stone-950 p-2 rounded-xl transition-colors shadow-md active:scale-95"><Send size={14} /></button>
          </form>
        </div>
      </div>

      {/* მარჯვენა მთავარი არენა (GameBoard) */}
      <div className="flex-1 bg-stone-900/60 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* ჰედერი: ოთახის ინფო და გამოსვლა */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-stone-950/40">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-amber-500 tracking-widest font-mono">ROOM: {room.id}</span>
            <button onClick={onLeave} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[10px] font-black transition-colors border border-rose-500/20 active:scale-95">
              <LogOut size={12} /> LEAVE
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMuted(!isMuted)} className="text-stone-500 hover:text-amber-500 transition-colors">
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <span className="text-xs font-bold text-stone-400 bg-stone-900/80 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-2">
              <Trophy size={12} className="text-amber-500"/> {room.targetScore} ქულამდე
            </span>
          </div>
        </div>

        {/* სათამაშო მოედანი */}
        <div className="flex-1 flex flex-col justify-between p-6 relative">
          
          {/* მოწინააღმდეგეების სტატუსი (ზედა მხარე) */}
          <div className="text-center">
            {isMyTurn ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-black shadow-[0_0_20px_rgba(245,158,11,0.15)] animate-pulse">
                <Sparkles size={14} /> შენი სვლაა! აირჩიე კარტი.
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-950/60 border border-white/5 rounded-full text-stone-400 text-xs font-bold shadow-inner">
                <Clock size={14} className="animate-spin-slow" /> ველოდებით მოთამაშეს...
              </div>
            )}
          </div>

          {/* მაგიდის კარტები (ცენტრში) */}
          <div className="flex-1 flex items-center justify-center relative">
            <div className="w-[85%] max-w-2xl h-48 bg-stone-950/40 rounded-[2rem] border border-white/5 shadow-inner relative flex items-center justify-center p-4">
              <div className="flex flex-wrap justify-center gap-3">
                {room.tableCards?.length > 0 ? room.tableCards.map((c, i) => {
                  const isSelected = selectedCardsFromTable.some(tc => tc.rank === c.rank && tc.suit === c.suit);
                  return (
                    <div 
                      key={i} 
                      onClick={() => isMyTurn && toggleTableCard(c)}
                      className={`w-16 h-24 md:w-20 md:h-28 bg-stone-100 rounded-xl shadow-xl flex flex-col justify-between p-2 select-none animate-in zoom-in duration-300 transition-all cursor-pointer ${isSelected ? 'ring-4 ring-amber-500 -translate-y-3 shadow-[0_15px_30px_rgba(245,158,11,0.3)]' : 'hover:-translate-y-1 hover:shadow-2xl'}`}
                    >
                      <span className={`text-sm md:text-base font-black ${getSuitColor(c.suit)} leading-none`}>{c.rank}</span>
                      <span className={`text-2xl md:text-3xl self-center ${getSuitColor(c.suit)} drop-shadow-md`}>{c.suit}</span>
                      <span className={`text-sm md:text-base font-black ${getSuitColor(c.suit)} self-end rotate-180 leading-none`}>{c.rank}</span>
                    </div>
                  );
                }) : (
                  <span className="text-stone-700/50 font-black text-xl uppercase tracking-widest select-none">მაგიდა ცარიელია</span>
                )}
              </div>
            </div>
          </div>

          {/* შენი ხელი და მოქმედებები (ქვედა მხარე) */}
          <div className="flex flex-col items-center gap-5 mt-4">
            
            {/* Action Buttons & Emotes */}
            <div className="flex items-center gap-4 bg-stone-950/60 p-2 rounded-2xl border border-white/5 backdrop-blur-md shadow-lg">
              <div className="flex gap-1.5 px-2">
                {emotes.map(emo => (
                  <button key={emo} onClick={() => handleSendEmote(emo)} className="text-lg hover:scale-125 hover:-translate-y-1 transition-all active:scale-95 grayscale opacity-70 hover:grayscale-0 hover:opacity-100">{emo}</button>
                ))}
              </div>
              <div className="w-px h-6 bg-white/10 mx-1"></div>
              <button 
                onClick={handlePlayCard}
                disabled={!isMyTurn || !selectedCardFromHand}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 ${!isMyTurn || !selectedCardFromHand ? 'bg-stone-800 text-stone-500 cursor-not-allowed' : selectedCardsFromTable.length > 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-stone-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'}`}
              >
                {selectedCardsFromTable.length > 0 ? 'მოჭრა ⚔️' : 'დაგდება 🃏'}
              </button>
            </div>

            {/* შენი კარტები (Hand) */}
            <div className="flex justify-center gap-2 md:gap-4 h-36 items-end perspective-1000">
              {me?.cards?.map((c, i) => {
                const isSelected = selectedCardFromHand?.rank === c.rank && selectedCardFromHand?.suit === c.suit;
                return (
                  <div 
                    key={i}
                    onClick={() => isMyTurn && setSelectedCardFromHand(isSelected ? null : c)}
                    className={`w-20 h-28 md:w-24 md:h-36 bg-stone-100 rounded-xl shadow-2xl flex flex-col justify-between p-2.5 select-none transition-all duration-300 ease-out cursor-pointer transform-gpu ${isSelected ? '-translate-y-6 scale-110 shadow-[0_20px_40px_rgba(0,0,0,0.6)] ring-4 ring-amber-500 z-20' : 'hover:-translate-y-4 hover:shadow-[0_15px_30px_rgba(0,0,0,0.5)] z-10'}`}
                  >
                    <span className={`text-base md:text-lg font-black ${getSuitColor(c.suit)} leading-none`}>{c.rank}</span>
                    <span className={`text-3xl md:text-4xl self-center ${getSuitColor(c.suit)} drop-shadow-lg`}>{c.suit}</span>
                    <span className={`text-base md:text-lg font-black ${getSuitColor(c.suit)} self-end rotate-180 leading-none`}>{c.rank}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* რაუნდის / მატჩის დასრულების მოდალი (Overlay) */}
        {room?.roundSummary && (
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-stone-900 border border-amber-500/30 rounded-3xl p-8 max-w-md w-full shadow-[0_30px_60px_rgba(0,0,0,0.8)] text-center space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-stone-900 to-stone-900"></div>
              
              <div className="relative z-10">
                <Trophy size={48} className="mx-auto text-amber-500 mb-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                <h2 className="text-2xl font-black text-stone-100 mb-2 uppercase tracking-widest">
                  {room.roundSummary.matchWinner ? 'მატჩი დასრულდა' : 'რაუნდი დასრულდა'}
                </h2>
                
                {room.roundSummary.matchWinner && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
                    <p className="text-sm font-bold text-amber-500/80 uppercase">გამარჯვებული</p>
                    <p className="text-2xl font-black text-amber-400 mt-1">{room.roundSummary.matchWinner} 🎉</p>
                  </div>
                )}

                {!room.roundSummary.matchWinner && (
                  <div className="space-y-3 bg-stone-950/50 rounded-2xl p-4 border border-white/5 text-sm font-medium text-stone-300 mb-6 text-left">
                    <div className="flex justify-between border-b border-white/5 pb-2"><span>ბევრი კარტი:</span> <span className="font-black text-amber-400">{room.roundSummary.cardsWinner}</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-2"><span>ბევრი ჯვარი:</span> <span className="font-black text-amber-400">{room.roundSummary.clubsWinner}</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-2"><span>აგურის 10:</span> <span className="font-black text-amber-400">{room.roundSummary.diamond10Winner}</span></div>
                    <div className="flex justify-between"><span>ჯვრის 2:</span> <span className="font-black text-amber-400">{room.roundSummary.club2Winner}</span></div>
                  </div>
                )}

                <button 
                  onClick={() => socket.emit('nextRoundReady', { roomId: room.id })}
                  className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 rounded-xl font-black uppercase tracking-widest shadow-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95 transition-all"
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