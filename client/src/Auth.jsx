import React, { useState } from 'react';
import { Shield, Mail, Lock, User, Play, ChevronRight, Trophy, BookOpen, Users, Star, Target, Globe, Share2, MessageCircle, Info, Sparkles, Gem, Swords, Coins, Store, Palette, Crown } from 'lucide-react';

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { username, password } : { username, email, password };

    try {
      const res = await fetch(`https://purti.onrender.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok) {
        onAuthSuccess(data);
      } else {
        setError(data.message || 'შეცდომა კავშირისას');
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
      
      {/* 🟢 ნავიგაცია (Navbar) */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={scrollToTop}>
            <div className="p-2 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.3)]">
              <Shield size={20} className="text-stone-950" />
            </div>
            <span className="text-lg md:text-xl font-black tracking-widest text-stone-100">PHURTI ARENA</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-[11px] font-black tracking-widest text-stone-400 uppercase">
            <a href="#rules" className="hover:text-yellow-500 transition-colors">წესები</a>
            <a href="#shop" className="hover:text-yellow-500 transition-colors">მაღაზია</a>
            <a href="#achievements" className="hover:text-yellow-500 transition-colors">მიღწევები</a>
            <a href="#invite" className="hover:text-yellow-500 transition-colors">მოწვევა</a>
            <a href="#about" className="hover:text-yellow-500 transition-colors">ჩვენს შესახებ</a>
          </div>
          <div className="md:hidden">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-4 py-2 bg-yellow-500 text-stone-950 rounded-lg text-xs font-black uppercase shadow-lg active:scale-95">შესვლა</button>
          </div>
        </div>
      </nav>

      {/* 🟢 მთავარი ბლოკი (Hero Section + Auth Form) */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-4 md:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="flex-1 space-y-6 md:space-y-8 z-10 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900/80 border border-yellow-500/20 text-yellow-500 text-[10px] md:text-xs font-black uppercase tracking-widest">
            <Sparkles size={14} /> ახალი თაობის ონლაინ პლატფორმა
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-stone-100 leading-[1.1] tracking-tight">
            ითამაშე ფურთი <br/>
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 bg-clip-text text-transparent">პროფესიონალურად</span>
          </h1>
          <p className="text-sm md:text-base text-stone-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
            შეუერთდი საქართველოს ყველაზე დახვეწილ სათამაშო პორტალს. ითამაშე რეიტინგული მატჩები, მოიპოვე უნიკალური მიღწევები და მოხვდი საუკეთესო მოთამაშეების ტოპ ათეულში.
          </p>
          <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-stone-500 text-sm font-bold">
            <div className="flex items-center gap-2"><Trophy size={18} className="text-yellow-500"/> რეიტინგული</div>
            <div className="flex items-center gap-2"><Swords size={18} className="text-rose-500"/> 2v2 / 1v1</div>
            <div className="flex items-center gap-2"><Gem size={18} className="text-emerald-500"/> მაღაზია</div>
          </div>
        </div>

        {/* 🟢 Auth (შესვლა/რეგისტრაცია) პანელი */}
        <div className="w-full max-w-md z-10 relative" id="auth-form">
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/20 to-transparent blur-xl rounded-[2.5rem] -z-10 transform scale-[1.02]"></div>
          <div className="bg-stone-900/90 backdrop-blur-2xl border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-2xl relative">
            <div className="flex gap-2 p-1.5 bg-stone-950/50 rounded-xl mb-6 border border-white/5">
              <button onClick={() => {setIsLogin(true); setError('');}} className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${isLogin ? 'bg-stone-800 text-yellow-500 shadow-md border border-white/5' : 'text-stone-500 hover:text-stone-300'}`}>შესვლა</button>
              <button onClick={() => {setIsLogin(false); setError('');}} className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${!isLogin ? 'bg-stone-800 text-yellow-500 shadow-md border border-white/5' : 'text-stone-500 hover:text-stone-300'}`}>რეგისტრაცია</button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-bold text-rose-400 text-center animate-in fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-1">მომხმარებელი</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-stone-950 border border-white/5 focus:border-yellow-500/50 rounded-xl pl-11 pr-4 py-3.5 text-xs text-stone-200 outline-none transition-all placeholder-stone-600" placeholder="შეიყვანე სახელი..." required />
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-1">ელ-ფოსტა</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-stone-950 border border-white/5 focus:border-yellow-500/50 rounded-xl pl-11 pr-4 py-3.5 text-xs text-stone-200 outline-none transition-all placeholder-stone-600" placeholder="your@email.com" required={!isLogin} />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-1">პაროლი</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-stone-950 border border-white/5 focus:border-yellow-500/50 rounded-xl pl-11 pr-4 py-3.5 text-xs text-stone-200 outline-none transition-all placeholder-stone-600" placeholder="••••••••" required />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-stone-950 font-black text-xs uppercase tracking-widest py-4 rounded-xl mt-6 shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isLoading ? <span className="animate-pulse">გთხოვთ დაელოდოთ...</span> : (isLogin ? 'სისტემაში შესვლა' : 'ანგარიშის შექმნა')} <Play size={14} className={isLoading ? 'hidden' : ''} />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 🟢 თამაშის წესები */}
      <section id="rules" className="py-20 bg-stone-900/30 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-black text-stone-100 uppercase tracking-wider mb-3">როგორ ვითამაშოთ?</h2>
            <p className="text-stone-400 text-sm">ფურთის კლასიკური წესები მარტივი და აზარტულია</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Target, title: 'მიზანი', desc: 'მოთამაშეების მიზანია დააგროვონ 11 ან 21 ქულა დადგენილი წესებით.' },
              { icon: BookOpen, title: 'ქულების სისტემა', desc: 'ბევრი კარტი (2 ქულა), მეტი ჯვარი (1 ქულა), 10 აგური (1 ქულა), 2 ჯვარი (1 ქულა).' },
              { icon: Shield, title: 'მოჭრა და გასუფთავება', desc: 'ვალეტი (J) ჭრის ნებისმიერ კარტს. მაგიდის სრულად გასუფთავება უპირატესობას გაძლევს.' }
            ].map((rule, i) => (
              <div key={i} className="bg-stone-900/50 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4 border border-yellow-500/20 text-yellow-500">
                  <rule.icon size={24} />
                </div>
                <h3 className="text-sm font-black text-stone-200 mb-2 uppercase">{rule.title}</h3>
                <p className="text-xs text-stone-400 leading-relaxed font-medium">{rule.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🟢 მისიები და მაღაზია (ᲐᲮᲐᲚᲘ ᲡᲔᲥᲪᲘᲐ) */}
      <section id="shop" className="py-20 md:py-32 relative bg-[#050505] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900/80 border border-yellow-500/20 text-yellow-500 text-[10px] md:text-xs font-black uppercase tracking-widest">
                <Coins size={14} /> ეკონომიკა და პერსონალიზაცია
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-stone-100 uppercase tracking-tight">შეასრულე მისიები,<br/>გამოირჩიე სხვებისგან</h2>
              <p className="text-sm text-stone-400 leading-relaxed max-w-lg font-medium">
                თამაში არ მთავრდება მხოლოდ მაგიდასთან. ყოველდღიურად დაგხვდება 3 ახალი მისია. მათი შესრულებით შენ გამოიმუშავებ გამოცდილებას (XP) და ოქროს მონეტებს. გადაცვალე დაგროვებული მონეტები უნიკალურ დიზაინებსა და პრემიუმ სტატუსში!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                {[
                  { icon: Target, title: 'დღიური მისიები', desc: 'განახლებადი გამოწვევები ყოველ 24 საათში.' },
                  { icon: Store, title: 'პრემიუმ მაღაზია', desc: 'გადაცვალე მონეტები ექსკლუზიურ ნივთებში.' },
                  { icon: Palette, title: 'დიზაინის შეცვლა', desc: 'შეიძინე მაგიდის თემები და კარტის ბექები.' },
                  { icon: Crown, title: 'VIP სტატუსი', desc: 'გახდი VIP, მიიღე მანათობელი სახელი და ემოჯები.' }
                ].map((feat, i) => (
                  <div key={i} className="flex flex-col gap-2 p-4 rounded-2xl bg-stone-900/50 border border-white/5 hover:border-yellow-500/20 transition-all">
                    <feat.icon size={24} className="text-yellow-500" />
                    <h4 className="text-xs font-black text-stone-200 uppercase tracking-wide mt-2">{feat.title}</h4>
                    <p className="text-[10px] text-stone-500 font-medium">{feat.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 relative w-full h-[450px]">
               {/* 🟢 მაღაზიის და მონეტების ვიზუალური ილუსტრაცია */}
               <div className="absolute inset-0 bg-stone-900 rounded-3xl border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden">
                 <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-900/20 via-[#0a0a0a] to-[#0a0a0a]"></div>
                 <div className="relative z-10 flex flex-col items-center gap-6">
                   <div className="flex items-center gap-3 bg-stone-950/80 px-6 py-3 rounded-2xl border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                     <Coins size={32} className="text-yellow-500" />
                     <span className="text-2xl font-mono font-black text-stone-100">1,250</span>
                   </div>
                   <div className="flex gap-4">
                     <div className="w-16 h-16 bg-stone-800 rounded-2xl border border-white/10 flex items-center justify-center text-3xl shadow-lg">🥷</div>
                     <div className="w-16 h-16 bg-stone-800 rounded-2xl border border-yellow-500/50 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(234,179,8,0.3)]">👑</div>
                     <div className="w-16 h-16 bg-blue-900 rounded-2xl border border-white/10 flex items-center justify-center text-white shadow-lg"><Shield size={24}/></div>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🟢 მიღწევების (Hardcore) გზამკვლევი */}
      <section id="achievements" className="py-20 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900/80 border border-white/10 text-stone-300 text-[10px] md:text-xs font-black uppercase tracking-widest">
                <Star size={14} className="text-yellow-500" /> Hardcore Progression
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-stone-100 uppercase tracking-tight">მიღწევების სისტემა</h2>
              <p className="text-sm text-stone-400 leading-relaxed max-w-lg font-medium">
                ჩვენთან ბეჯების მოპოვება მხოლოდ რჩეულებს შეუძლიათ. ეს არ არის მარტივი თამაში — შენი სტატუსი შენს გამოცდილებასა და სტრატეგიაზე მეტყველებს.
              </p>
              <div className="space-y-4 pt-4">
                {[
                  { icon: '🛡️', title: 'ვეტერანი', desc: 'მოიგე ჯამში 100 რეიტინგული მატჩი.' },
                  { icon: '💎', title: '10 აგური', desc: '50 მოგებულ მატჩში გქონდეს წაღებული 10 აგური.' },
                  { icon: '♣️', title: '2 ჯვარი', desc: '50 მოგებულ მატჩში გქონდეს წაღებული 2 ჯვარი.' },
                  { icon: '🧹', title: 'მესუფთავე', desc: '50 მოგებულ მატჩში ვალეტით გაასუფთავე 4+ კარტი.' }
                ].map((ach, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-stone-900/50 border border-white/5">
                    <span className="text-2xl md:text-3xl drop-shadow-md bg-stone-950 p-2 rounded-xl border border-white/5">{ach.icon}</span>
                    <div>
                      <h4 className="text-sm font-black text-stone-200 uppercase tracking-wide">{ach.title}</h4>
                      <p className="text-xs text-stone-500 mt-1 font-medium">{ach.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 relative w-full h-[500px]">
               <div className="absolute inset-0 bg-stone-900 rounded-3xl border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden">
                 <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-900/20 via-[#0a0a0a] to-[#0a0a0a]"></div>
                 <Trophy size={120} className="text-yellow-500/20" />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🟢 მეგობრების მოწვევა */}
      <section id="invite" className="py-20 bg-gradient-to-b from-stone-900/30 to-[#0a0a0a] border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center space-y-6">
          <div className="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center mx-auto border border-white/10 shadow-xl mb-4 text-emerald-500">
            <Users size={32} />
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-stone-100 uppercase tracking-tight">ითამაშე მეგობრებთან ერთად</h2>
          <p className="text-sm md:text-base text-stone-400 font-medium">
            შექმენი პრივატული ოთახი პაროლით, გაუზიარე მეგობრებს და გაარკვიეთ, ვინ არის საუკეთესო მოთამაშე თქვენს შორის. მეგობრების სია და ონლაინ სტატუსი ყოველთვის ხელმისაწვდომია!
          </p>
          <button onClick={scrollToTop} className="mt-4 px-8 py-3.5 bg-stone-100 hover:bg-white text-stone-950 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 inline-flex items-center gap-2">
            დარეგისტრირდი ახლავე <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {/* 🟢 Footer (ჩვენს შესახებ & კონტაქტი) */}
      <footer id="about" className="bg-[#050505] pt-16 pb-8 border-t border-white/5 mt-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-yellow-500" />
                <span className="text-sm font-black tracking-widest text-stone-200">PHURTI ARENA</span>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed font-medium max-w-sm">
                ეს არის დამოუკიდებელი, ქართული დეველოპერული პროექტი, რომელიც მიზნად ისახავს ტრადიციული ბანქოს თამაშების თანამედროვე, სანდო და აზარტულ ონლაინ სივრცეში გადმოტანას.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-xs font-black text-stone-200 uppercase tracking-widest">ნავიგაცია</h4>
              <ul className="space-y-2 text-xs font-medium text-stone-500">
                <li><a href="#rules" className="hover:text-yellow-500 transition-colors">წესები</a></li>
                <li><a href="#shop" className="hover:text-yellow-500 transition-colors">მაღაზია</a></li>
                <li><a href="#achievements" className="hover:text-yellow-500 transition-colors">მიღწევები</a></li>
                <li><a href="#invite" className="hover:text-yellow-500 transition-colors">მოწვევა</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-stone-200 uppercase tracking-widest">კონტაქტი</h4>
              <ul className="space-y-2 text-xs font-medium text-stone-500">
                <li className="flex items-center gap-2"><Mail size={14}/> support@phurti.ge</li>
                <li className="flex items-center gap-2"><Info size={14}/> FAQ</li>
              </ul>
              <div className="flex items-center gap-3 pt-2">
                <a href="#" className="p-2 bg-stone-900 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors border border-white/5"><Globe size={16}/></a>
                <a href="#" className="p-2 bg-stone-900 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors border border-white/5"><Share2 size={16}/></a>
                <a href="#" className="p-2 bg-stone-900 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors border border-white/5"><MessageCircle size={16}/></a>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 text-center flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] text-stone-600 font-bold tracking-widest uppercase">
              &copy; {new Date().getFullYear()} PHURTI ARENA. ყველა უფლება დაცულია.
            </p>
            <div className="text-[10px] text-stone-600 font-bold flex gap-4 uppercase tracking-widest">
              <a href="#" className="hover:text-stone-400 transition-colors">კონფიდენციალურობა</a>
              <a href="#" className="hover:text-stone-400 transition-colors">წესები და პირობები</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}