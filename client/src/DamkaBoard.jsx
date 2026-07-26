import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { LogOut, Trophy, Clock, Crown, Flag } from 'lucide-react';

export default function DamkaBoard({ room, socket, onLeave, activeTheme, checkIsVip, VipName }) {
  const [selectedCell, setSelectedCell] = useState(null);
  const [timeLeft, setTimeLeft] = useState(100);
  const [showSurrenderModal, setShowSurrenderModal] = useState(false);

  const myIndex = room?.players?.findIndex(p => p.id === socket.id);
  const isSpectator = myIndex === -1;
  const isMyTurn = room?.currentTurn === myIndex;
  
  const board = room?.damkaBoard || Array(8).fill(Array(8).fill(null));

  const opponentIndex = myIndex === 0 ? 1 : (myIndex === 1 ? 0 : 0);
  const me = room?.players?.[isSpectator ? 0 : myIndex];
  const opponent = room?.players?.[isSpectator ? 1 : opponentIndex];

  useEffect(() => {
    if (isMyTurn && room.turnExpiresAt) {
      const interval = setInterval(() => {
        const remaining = room.turnExpiresAt - Date.now();
        const percent = Math.max(0, (remaining / 30000) * 100);
        setTimeLeft(percent);
      }, 50);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(100);
    }
  }, [isMyTurn, room.turnExpiresAt]);

  useEffect(() => {
    if (room?.roundSummary?.matchWinner === me?.name) {
      const duration = 3000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#f59e0b', '#fbbf24', '#d97706'] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#f59e0b', '#fbbf24', '#d97706'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [room?.roundSummary, me?.name]);

  const handleCellClick = (r, c) => {
    if (!isMyTurn || isSpectator || room.roundSummary) return;

    const cell = board[r][c];

    if (cell && cell.player === myIndex) {
      setSelectedCell({ r, c });
      return;
    }

    if (cell === null && selectedCell) {
      socket.emit('playDamkaMove', { 
        roomId: room.id, 
        from: { r: selectedCell.r, c: selectedCell.c }, 
        to: { r, c } 
      });
      setSelectedCell(null); 
    }
  };

  const renderRows = myIndex === 1 ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const renderCols = myIndex === 1 ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="w-full flex flex-col items-center max-w-4xl mx-auto h-auto min-h-[85vh] relative pb-6 lg:pb-0 gap-6">
      
      {/* მოწინააღმდეგის პანელი */}
      <div className="w-full flex items-center justify-between bg-stone-950/40 p-3 md:p-4 border border-white/5 rounded-2xl shadow-md">
         <div className="flex items-center gap-3">
           <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-stone-900 border border-white/10 flex items-center justify-center text-xl shadow-inner ${room.currentTurn === opponentIndex && !room.roundSummary ? 'ring-2 ' + activeTheme.accent.replace('text-', 'ring-') + ' animate-pulse' : ''}`}>
             {opponent?.avatar || '🤖'}
           </div>
           <div className="flex flex-col">
             <span className="text-xs md:text-sm font-black text-stone-200 tracking-wider">
               <VipName name={opponent?.name || 'მოლოდინი...'} isVip={checkIsVip(opponent?.vipUntil)} />
             </span>
             <span className="text-[10px] font-bold text-stone-500 uppercase flex items-center gap-1 mt-0.5">
                {opponentIndex === 0 
                  ? <span className="w-2 h-2 rounded-full bg-stone-200 inline-block shadow-sm"></span> 
                  : <span className="w-2 h-2 rounded-full bg-red-600 inline-block shadow-sm"></span>}
                {opponentIndex === 0 ? 'თეთრები' : 'შავები'}
             </span>
           </div>
         </div>

         <div className="flex items-center gap-2">
            <span className="text-[10px] md:text-xs font-black tracking-widest font-mono text-stone-500 hidden sm:block mr-2">ROOM: {room.id}</span>
            
            {/* 🟢 დანებების ღილაკი */}
            {!room.roundSummary && !isSpectator && (
               <button onClick={() => setShowSurrenderModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-[10px] font-black transition-colors border border-white/10 active:scale-95 shadow-sm">
                 <Flag size={14} /> დანებება
               </button>
            )}

            <button onClick={onLeave} className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[10px] font-black transition-colors border border-rose-500/20 active:scale-95 shadow-sm">
              <LogOut size={14} /> LEAVE
            </button>
         </div>
      </div>

      {/* შაშის დაფა */}
      <div className="w-full flex items-center justify-center relative">
        <div className="grid grid-cols-8 w-[95vw] max-w-[400px] md:max-w-[500px] aspect-square border-4 border-stone-800 rounded-lg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-stone-300/5">
          
          {renderRows.map((r) => (
            renderCols.map((c) => {
              const isDark = (r + c) % 2 !== 0;
              const piece = board[r]?.[c];
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;

              return (
                <div 
                  key={`${r}-${c}`}
                  onClick={() => isDark ? handleCellClick(r, c) : null}
                  className={`relative w-full h-full flex items-center justify-center
                    ${isDark ? 'bg-[#1e1c1a]' : 'bg-[#d2c4b5]/10'} 
                    ${isDark && !piece && selectedCell && isMyTurn && !room.roundSummary ? 'hover:bg-[#2c2825] cursor-pointer' : ''}
                    ${isSelected ? 'bg-[#362e28] ring-inset ring-2 ring-white/20' : ''}
                  `}
                >
                  {piece && (
                    <div className={`absolute w-[80%] h-[80%] rounded-full border-[2px] flex items-center justify-center transition-all duration-200 ease-out z-10
                      ${piece.player === 0 
                        ? 'bg-gradient-to-br from-stone-100 to-stone-300 border-stone-400 shadow-[inset_0_-3px_5px_rgba(0,0,0,0.2),0_4px_6px_rgba(0,0,0,0.6)]' 
                        : 'bg-gradient-to-br from-red-500 to-red-800 border-red-950 shadow-[inset_0_-3px_5px_rgba(0,0,0,0.4),0_4px_6px_rgba(0,0,0,0.6)]'}
                      ${isSelected ? 'scale-110 shadow-[0_5px_15px_rgba(255,255,255,0.4)] -translate-y-1' : 'scale-100'}
                      ${isMyTurn && piece.player === myIndex && !isSelected && !room.roundSummary ? 'hover:scale-[1.05] cursor-pointer hover:-translate-y-0.5' : ''}
                    `}>
                       <div className={`w-[65%] h-[65%] rounded-full border-[1.5px] flex items-center justify-center opacity-80
                         ${piece.player === 0 ? 'border-stone-400' : 'border-red-950'}
                       `}>
                          {piece.isKing && (
                            <Crown 
                              size={20} 
                              fill="currentColor" 
                              strokeWidth={1.5} 
                              className={`drop-shadow-md animate-in zoom-in duration-300
                                ${piece.player === 0 ? 'text-amber-500' : 'text-amber-400'}
                              `} 
                            />
                          )}
                       </div>
                    </div>
                  )}
                  
                  {isDark && !piece && selectedCell && isMyTurn && !room.roundSummary && (
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-white/20 opacity-0 hover:opacity-100 transition-opacity"></div>
                  )}
                </div>
              )
            })
          ))}

        </div>
      </div>

      <div className="w-full max-w-[500px] h-1.5 bg-stone-950 rounded-full overflow-hidden shrink-0 shadow-inner">
         <div className={`h-full ${isMyTurn && !room.roundSummary ? activeTheme.accentBg : 'bg-stone-700'} transition-all duration-50`} style={{ width: `${room.roundSummary ? 0 : timeLeft}%` }} />
      </div>

      <div className="w-full flex items-center justify-between bg-stone-900 p-3 md:p-4 border border-white/10 rounded-2xl shadow-xl mt-auto">
         <div className="flex flex-col text-left">
           <span className="text-xs md:text-sm font-black text-stone-100 tracking-wider">
             <VipName name={`${me?.name || 'შენ'} (შენ)`} isVip={checkIsVip(me?.vipUntil)} />
           </span>
           <span className="text-[10px] font-bold text-stone-400 uppercase flex items-center gap-1 mt-0.5">
              {myIndex === 0 
                ? <span className="w-2 h-2 rounded-full bg-stone-200 inline-block shadow-sm"></span> 
                : <span className="w-2 h-2 rounded-full bg-red-600 inline-block shadow-sm"></span>}
              {myIndex === 0 ? 'თეთრები' : 'შავები'}
           </span>
         </div>

         <div className="flex items-center gap-3">
           {isMyTurn && !room.roundSummary ? (
              <div className={`inline-flex items-center gap-1.5 px-4 py-2 bg-stone-950 border border-white/10 rounded-xl ${activeTheme.accent} text-[10px] md:text-xs font-black shadow-[0_0_10px_currentColor] animate-pulse`}>
                შენი სვლაა!
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-950/60 border border-white/5 rounded-xl text-stone-400 text-[10px] md:text-xs font-bold shadow-inner">
                {room.roundSummary ? 'მატჩი დასრულდა' : <><Clock size={12} className="animate-spin-slow" /> მოლოდინი...</>}
              </div>
            )}
           <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-stone-800 border-2 flex items-center justify-center text-2xl shadow-lg ${isMyTurn && !room.roundSummary ? activeTheme.accent.replace('text-', 'border-') : 'border-stone-700'}`}>
             {me?.avatar || '😎'}
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

      {/* მატჩის დასრულება */}
      {room?.roundSummary && (
        <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300 rounded-3xl">
          <div className={`bg-stone-900 border border-opacity-30 border-current rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6 ${activeTheme.accent}`}>
            <Trophy size={48} className="mx-auto drop-shadow-lg" />
            <h2 className="text-2xl font-black text-stone-100 uppercase tracking-widest">
              მატჩი დასრულდა
            </h2>
            
            <div className="bg-stone-950/80 border border-white/10 rounded-2xl p-5 shadow-inner relative">
              {/* 🟢 შეტყობინება, თუ ვინმე დანებდა */}
              {room.roundSummary.surrendered && (
                 <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[9px] font-black px-2 py-1 rounded-md uppercase shadow-md whitespace-nowrap">
                   {room.roundSummary.surrendered} დანებდა 🏳️
                 </span>
              )}
              
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">გამარჯვებული</p>
              <div className="text-3xl font-black text-white drop-shadow-md">
                <VipName name={room.roundSummary.matchWinner} isVip={false} /> 🎉
              </div>
            </div>

            <button 
              onClick={() => {
                if (room.roundSummary.matchWinner) {
                  onLeave();
                } else {
                  socket.emit('nextRoundReady', { roomId: room.id });
                }
              }}
              className={`w-full py-4 ${activeTheme.accentBg} text-stone-950 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all`}
            >
              {room.readyForNextRound?.includes(socket.id) ? 'მოლოდინი...' : 'ლობიში დაბრუნება'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}