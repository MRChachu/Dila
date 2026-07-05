import React, { useState } from 'react';
import { Shield, Lock, User, Play, ChevronRight, Trophy, BookOpen, Users, Star, Target, Globe, Share2, MessageCircle, Info, Sparkles, Gem, Swords, Coins, Store, Palette, Crown, KeyRound, CalendarDays, TextCursorInput } from 'lucide-react';

export default function Auth({ onAuthSuccess }) {
  const [authMode, setAuthMode] = useState('login'); 
  const [recoveryStep, setRecoveryStep] = useState(1); // 1 = მონაცემები, 2 = ახალი პაროლი

  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [secretWord, setSecretWord] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (pass) => {
    const regex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}$/;
    return regex.test(pass);
  };

  const resetState = () => {
    setError(''); setSuccessMsg('');
    setUsername(''); setDob(''); setSecretWord(''); setPassword(''); setConfirmPassword('');
    setRecoveryStep(1);
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!username || !dob || !secretWord) return setError('შეავსეთ ყველა ველი!');
    setError('');
    setRecoveryStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg('');

    if (authMode === 'register' && !validatePassword(password)) {
      return setError('პაროლი უნდა შეიცავდეს მინ. 6 სიმბოლოს, 1 ასოს და 1 ციფრს!');
    }

    if (authMode === 'forgot' && password !== confirmPassword) {
      return setError('პაროლები არ ემთხვევა!');
    }
    if (authMode === 'forgot' && !validatePassword(password)) {
      return setError('ახალი პაროლი უნდა შეიცავდეს მინ. 6 სიმბოლოს, 1 ასოს და 1 ციფრს!');
    }

    setIsLoading(true);

    let endpoint = '';
    let payload = {};

    if (authMode === 'login') {
      endpoint = '/api/auth/login';
      payload = { username, password };
    } else if (authMode === 'register') {
      endpoint = '/api/auth/register';
      payload = { username, dateOfBirth: dob, secretWord, password };
    } else if (authMode === 'forgot') {
      endpoint = '/api/auth/reset-password';
      payload = { username, dateOfBirth: dob, secretWord, newPassword: password };
    }

    try {
      const res = await fetch(`https://purti.onrender.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok) {
        if (authMode === 'forgot') {
           setSuccessMsg(data.message);
           setTimeout(() => { setAuthMode('login'); resetState(); }, 3000);
        } else {
           onAuthSuccess(data);
        }
      } else {
        setError(data.message || 'შეცდომა კავშირისას');
        if (authMode === 'forgot') setRecoveryStep(1); // უკან დაბრუნება შეცდომისას
      }
    } catch (err) {
      setError('სერვერთან კავშირი ვერ მოხერხდა');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-stone-200 font-sans selection:bg-yellow-500/30 overflow-x-hidden">
      
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={scrollToTop}>
            <div className="p-1.5 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg shadow-[0_0_10px_rgba(234,179,8,0.2)]">
              <Shield size={16} className="text-stone-950" />
            </div>
            <span className="text-sm md:text-base font-black tracking-widest text-stone-100">PHURTI ARENA</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-[10px] font-black tracking-widest text-stone-400 uppercase">
            <a href="#rules" className="hover:text-yellow-500 transition-colors">წესები</a>
            <a href="#features" className="hover:text-yellow-500 transition-colors">სისტემა</a>
            <a href="#about" className="hover:text-yellow-500 transition-colors">ჩვენს შესახებ</a>
          </div>
        </div>
      </nav>

      <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 px-4 md:px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        <div className="absolute top-0 -left-20 w-72 h-72 bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex-1 space-y-5 z-10 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/80 border border-yellow-500/20 text-yellow-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
            <Sparkles size={12} /> ონლაინ პლატფორმა
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-stone-100 leading-[1.1] tracking-tight">
            ითამაშე ფურთი <br/>
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 bg-clip-text text-transparent">პროფესიონალურად</span>
          </h1>
          <p className="text-xs md:text-sm text-stone-400 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
            რეიტინგული მატჩები, უნიკალური მიღწევები და ტოპ ათეული. შეუერთდი საქართველოს საუკეთესო მოთამაშეებს.
          </p>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-stone-500 text-[11px] font-bold">
            <div className="flex items-center gap-1.5"><Trophy size={14} className="text-yellow-500"/> რეიტინგული</div>
            <div className="flex items-center gap-1.5"><Swords size={14} className="text-rose-500"/> 2v2 / 1v1</div>
            <div className="flex items-center gap-1.5"><Gem size={14} className="text-emerald-500"/> მაღაზია</div>
          </div>
        </div>

        {/* 🟢 ავტორიზაციის პანელი */}
        <div className="w-full max-w-sm z-10">
          <div className="bg-stone-900/80 backdrop-blur-xl border border-white/10 p-5 md:p-6 rounded-[1.5rem] shadow-2xl relative transition-all duration-300">
            
            {authMode !== 'forgot' && (
              <div className="flex gap-2 p-1 bg-stone-950/50 rounded-lg mb-5 border border-white/5">
                <button onClick={() => {setAuthMode('login'); resetState();}} className={`flex-1 py-2 rounded-md text-[11px] font-black transition-all ${authMode === 'login' ? 'bg-stone-800 text-yellow-500 shadow-sm border border-white/5' : 'text-stone-500'}`}>შესვლა</button>
                <button onClick={() => {setAuthMode('register'); resetState();}} className={`flex-1 py-2 rounded-md text-[11px] font-black transition-all ${authMode === 'register' ? 'bg-stone-800 text-yellow-500 shadow-sm border border-white/5' : 'text-stone-500'}`}>რეგისტრაცია</button>
              </div>
            )}

            {authMode === 'forgot' && (
               <div className="text-center mb-5 animate-in fade-in">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-yellow-500/20">
                     <KeyRound size={20} className="text-yellow-500" />
                  </div>
                  <h3 className="text-sm font-black uppercase text-stone-100">პაროლის აღდგენა</h3>
                  <p className="text-[10px] text-stone-400 mt-1">{recoveryStep === 1 ? 'შეიყვანეთ თქვენი მონაცემები' : 'შეიყვანეთ ახალი პაროლი'}</p>
               </div>
            )}

            {error && <div className="mb-3 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[10px] font-bold text-rose-400 text-center animate-in fade-in">{error}</div>}
            {successMsg && <div className="mb-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-bold text-emerald-400 text-center animate-in fade-in">{successMsg}</div>}

            <form onSubmit={authMode === 'forgot' && recoveryStep === 1 ? handleNextStep : handleSubmit} className="space-y-3">
              
              {/* 🟢 STEP 1: Username, DOB, Secret Word (ჩანს Login-ის, Register-ის და Forgot Step 1-ის დროს) */}
              {(authMode === 'login' || authMode === 'register' || (authMode === 'forgot' && recoveryStep === 1)) && (
                <div className="relative animate-in fade-in">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-stone-950 border border-white/5 focus:border-yellow-500/50 rounded-lg pl-9 pr-3 py-2.5 text-xs text-stone-200 outline-none transition-all placeholder-stone-600" placeholder="მომხმარებელი..." required />
                </div>
              )}

              {(authMode === 'register' || (authMode === 'forgot' && recoveryStep === 1)) && (
                <>
                  <div className="relative animate-in slide-in-from-top-2">
                    <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full bg-stone-950 border border-white/5 focus:border-yellow-500/50 rounded-lg pl-9 pr-3 py-2.5 text-xs text-stone-400 outline-none transition-all" required />
                  </div>
                  <div className="relative animate-in slide-in-from-top-2">
                    <TextCursorInput size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input type="text" value={secretWord} onChange={e => setSecretWord(e.target.value)} className="w-full bg-stone-950 border border-white/5 focus:border-yellow-500/50 rounded-lg pl-9 pr-3 py-2.5 text-xs text-stone-200 outline-none transition-all placeholder-stone-600" placeholder="საიდუმლო სიტყვა..." required />
                  </div>
                </>
              )}

              {/* 🟢 STEP 2: პაროლები (ჩანს Login, Register და Forgot Step 2-ის დროს) */}
              {(authMode === 'login' || authMode === 'register' || (authMode === 'forgot' && recoveryStep === 2)) && (
                <div className="relative animate-in slide-in-from-right-4">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-stone-950 border border-white/5 focus:border-yellow-500/50 rounded-lg pl-9 pr-3 py-2.5 text-xs text-stone-200 outline-none transition-all placeholder-stone-600" placeholder={authMode === 'login' ? "პაროლი..." : "პაროლი (მინ. 6 სიმბოლო, 1 ციფრი)"} required />
                </div>
              )}

              {authMode === 'forgot' && recoveryStep === 2 && (
                <div className="relative animate-in slide-in-from-right-4">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-stone-950 border border-white/5 focus:border-yellow-500/50 rounded-lg pl-9 pr-3 py-2.5 text-xs text-stone-200 outline-none transition-all placeholder-stone-600" placeholder="გაიმეორეთ ახალი პაროლი..." required />
                </div>
              )}

              <button type="submit" disabled={isLoading} className="w-full bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-black text-[11px] uppercase tracking-widest py-3 rounded-lg mt-4 transition-all active:scale-95 flex items-center justify-center gap-2">
                {isLoading ? 'დაელოდეთ...' : (authMode === 'login' ? 'შესვლა' : authMode === 'register' ? 'რეგისტრაცია' : recoveryStep === 1 ? 'გაგრძელება' : 'პაროლის შეცვლა')} 
                <Play size={12} className={isLoading ? 'hidden' : ''} />
              </button>
            </form>

            {authMode === 'login' && (
               <div className="text-center mt-4">
                 <button onClick={() => {setAuthMode('forgot'); resetState();}} className="text-[10px] text-stone-500 hover:text-yellow-500 font-bold transition-colors">დაგავიწყდა პაროლი?</button>
               </div>
            )}
            {authMode === 'forgot' && (
               <div className="text-center mt-4 flex items-center justify-center gap-4">
                 {recoveryStep === 2 && <button onClick={() => setRecoveryStep(1)} className="text-[10px] text-stone-500 hover:text-yellow-500 font-bold transition-colors">უკან</button>}
                 <button onClick={() => {setAuthMode('login'); resetState();}} className="text-[10px] text-stone-500 hover:text-yellow-500 font-bold transition-colors">მთავარზე დაბრუნება</button>
               </div>
            )}
          </div>
        </div>
      </section>

      {/* 🟢 წესები */}
      <section id="rules" className="py-10 border-t border-white/5 bg-stone-950/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h2 className="text-xl font-black text-stone-100 uppercase tracking-wider mb-6 flex items-center gap-2"><Target size={18} className="text-yellow-500"/> როგორ ვითამაშოთ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Target, title: 'მიზანი', desc: 'მოთამაშეების მიზანია დააგროვონ 11 ან 21 ქულა დადგენილი წესებით.' },
              { icon: BookOpen, title: 'ქულების სისტემა', desc: 'ბევრი კარტი (2 ქულა), მეტი ჯვარი (1 ქულა), 10 აგური (1 ქულა), 2 ჯვარი (1 ქულა).' },
              { icon: Shield, title: 'მოჭრა / გასუფთავება', desc: 'ვალეტი (J) ჭრის ნებისმიერ კარტს და ასუფთავებს მაგიდას.' }
            ].map((rule, i) => (
              <div key={i} className="bg-stone-900/40 p-4 rounded-2xl border border-white/5 flex gap-3 items-start">
                <div className="w-8 h-8 bg-stone-950 rounded-lg flex items-center justify-center border border-white/5 text-yellow-500 shrink-0">
                  <rule.icon size={16} />
                </div>
                <div>
                  <h3 className="text-[11px] font-black text-stone-200 mb-1 uppercase">{rule.title}</h3>
                  <p className="text-[10px] text-stone-400 font-medium">{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🟢 ეკონომიკა და მიღწევები */}
      <section id="features" className="py-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-stone-900/60 to-stone-950/40 p-6 rounded-[2rem] border border-white/5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-yellow-500 mb-1">
                    <Coins size={14}/> <span className="text-[9px] font-black uppercase tracking-widest">ეკონომიკა</span>
                  </div>
                  <h3 className="text-xl font-black text-stone-100 uppercase tracking-tight">მაღაზია & მისიები</h3>
                </div>
              </div>
              <p className="text-[11px] text-stone-400 font-medium leading-relaxed">
                შეასრულე ყოველდღიური 3 მისია, გამოიმუშავე ოქროს მონეტები და გადაცვალე ისინი პრემიუმ კონტენტში.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { icon: Target, title: 'დღიური მისიები', desc: 'განახლებადი 24 სთ-ში' },
                  { icon: Palette, title: 'დიზაინები', desc: 'მაგიდა და კარტები' },
                  { icon: Store, title: 'პრემიუმ ავატარი', desc: 'უნიკალური ემოჯი' },
                  { icon: Crown, title: 'VIP სტატუსი', desc: 'მანათობელი სახელი' }
                ].map((f, i) => (
                  <div key={i} className="bg-stone-950/50 p-3 rounded-xl border border-white/5">
                    <f.icon size={14} className="text-yellow-500 mb-1.5" />
                    <h4 className="text-[10px] font-black text-stone-200 uppercase">{f.title}</h4>
                    <p className="text-[9px] text-stone-500 mt-0.5">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-stone-900/60 to-stone-950/40 p-6 rounded-[2rem] border border-white/5 space-y-5">
              <div>
                <div className="flex items-center gap-1.5 text-yellow-500 mb-1">
                  <Star size={14}/> <span className="text-[9px] font-black uppercase tracking-widest">Hardcore</span>
                </div>
                <h3 className="text-xl font-black text-stone-100 uppercase tracking-tight">მიღწევების სისტემა</h3>
              </div>
              <p className="text-[11px] text-stone-400 font-medium leading-relaxed">
                ბეჯების მოპოვება მხოლოდ რჩეულებს შეუძლიათ. პირობები ითვლება მხოლოდ და მხოლოდ მოგებულ მატჩებში!
              </p>
              <div className="space-y-2 pt-2">
                {[
                  { icon: '🛡️', title: 'ვეტერანი', desc: 'მოიგე 100 რეიტინგული მატჩი.' },
                  { icon: '💎', title: '10 აგური', desc: '50-ჯერ წაიღე მოგებულ მატჩში.' },
                  { icon: '♣️', title: '2 ჯვარი', desc: '50-ჯერ წაიღე მოგებულ მატჩში.' },
                  { icon: '🧹', title: 'მესუფთავე', desc: '50-ჯერ წაიღე 4+ კარტი ვალეტით.' }
                ].map((ach, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-950/50 border border-white/5">
                    <span className="text-xl drop-shadow-md bg-stone-900 p-1.5 rounded-lg border border-white/5">{ach.icon}</span>
                    <div>
                      <h4 className="text-[10px] font-black text-stone-200 uppercase">{ach.title}</h4>
                      <p className="text-[9px] text-stone-500">{ach.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🟢 Footer */}
      <footer id="about" className="bg-[#050505] pt-10 pb-6 border-t border-white/5 mt-4">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-yellow-500" />
                <span className="text-xs font-black tracking-widest text-stone-200">PHURTI ARENA</span>
              </div>
              <p className="text-[10px] text-stone-500 leading-relaxed font-medium">
                ქართული დეველოპერული პროექტი. კლასიკური ბანქოს თამაშის თანამედროვე, სანდო და აზარტული ონლაინ სივრცე.
              </p>
            </div>
          </div>
          <div className="pt-4 border-t border-white/5 text-center flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-[9px] text-stone-600 font-bold tracking-widest uppercase">
              &copy; {new Date().getFullYear()} PHURTI ARENA. ყველა უფლება დაცულია.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}