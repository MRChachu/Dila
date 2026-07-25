import React from 'react';
import { LogOut } from 'lucide-react';

export default function DamkaBoard({ room, socket, onLeave, activeTheme, checkIsVip, VipName }) {
  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] bg-stone-900/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl relative p-6">
        <h1 className={`text-6xl md:text-8xl mb-6 ${activeTheme.accent} drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] animate-bounce`}>♟️</h1>
        <h2 className="text-2xl md:text-4xl font-black text-stone-100 uppercase tracking-widest mb-4 text-center">შაშის დაფა იტვირთება...</h2>
        <p className="text-stone-400 font-bold mb-10 text-sm md:text-base text-center max-w-md">
           კოდის შემდეგ ეტაპზე აქ გაჩნდება ნამდვილი, კლასიკური 8x8 დამკას დაფა ულამაზესი ანიმაციებით და სვლების ლოგიკით!
        </p>
        
        <button onClick={onLeave} className="flex items-center gap-2 px-8 py-4 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-2xl font-black transition-all border border-rose-500/30 shadow-lg active:scale-95 uppercase tracking-wider text-sm">
          <LogOut size={18} /> ლობიში დაბრუნება
        </button>
    </div>
  );
}