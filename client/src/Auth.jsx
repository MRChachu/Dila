import React, { useState } from 'react';
import { Shield, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { username, password } : { username, email, password };

    try {
      const res = await fetch(`https://purti.onrender.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      // 🟢 ზუსტად აქ გასწორდა: data.error-ის მაგივრად ვკითხულობთ data.message-ს
      if (!res.ok) throw new Error(data.message || 'შეცდომა სერვერზე');
      
      onAuthSuccess(data);
    } catch (err) { 
      setError(err.message); 
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4 font-sans text-amber-100">
      <div className="max-w-md w-full bg-stone-900 border border-amber-900/30 rounded-3xl p-8 shadow-2xl">
        
        <div className="flex flex-col items-center mb-8 space-y-3">
          <div className="p-4 bg-stone-950 border border-amber-900/20 rounded-2xl">
            <Shield size={32} className="text-amber-500" />
          </div>
          <h1 className="text-2xl font-black tracking-widest text-amber-400">PHURTI ARENA</h1>
          <p className="text-sm text-amber-200/60 font-medium">
            {isLogin ? 'გთხოვთ გაიაროთ ავტორიზაცია' : 'შექმენით ახალი სათამაშო ანგარიში'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-900/40 rounded-xl text-sm text-red-400 text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-amber-500/80 uppercase tracking-wider ml-1">მომხმარებლის სახელი</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-3.5 text-amber-700" />
              <input 
                type="text" required value={username} onChange={(e) => setUsername(e.target.value)} 
                className="w-full bg-stone-950 border border-amber-900/20 rounded-xl py-3.5 pl-10 pr-4 text-sm font-bold text-amber-100 outline-none focus:border-amber-500 transition-colors" 
                placeholder="შეიყვანეთ სახელი" 
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-500/80 uppercase tracking-wider ml-1">ელ-ფოსტა</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3.5 text-amber-700" />
                <input 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)} 
                  className="w-full bg-stone-950 border border-amber-900/20 rounded-xl py-3.5 pl-10 pr-4 text-sm font-bold text-amber-100 outline-none focus:border-amber-500 transition-colors" 
                  placeholder="შეიყვანეთ ფოსტა" 
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-amber-500/80 uppercase tracking-wider ml-1">პაროლი</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3.5 text-amber-700" />
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-stone-950 border border-amber-900/20 rounded-xl py-3.5 pl-10 pr-4 text-sm font-bold text-amber-100 outline-none focus:border-amber-500 transition-colors" 
                placeholder="შეიყვანეთ პაროლი" 
              />
            </div>
          </div>

          <button type="submit" className="w-full mt-4 py-4 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 border-b-4 border-amber-800">
            {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
            {isLogin ? 'შესვლა მაგიდაზე' : 'რეგისტრაციის დასრულება'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-sm font-bold text-amber-500 hover:text-amber-400 transition-colors">
            {isLogin ? 'არ გაქვთ ანგარიში? დარეგისტრირდით აქ' : 'უკვე გაქვთ ანგარიში? ავტორიზაცია'}
          </button>
        </div>
      </div>
    </div>
  );
}