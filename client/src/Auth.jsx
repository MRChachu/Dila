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
      
      {/* 🟢 ნავიგაცია */}
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

      {/* 🟢 მთავარი ბლოკი (კომპაქტური Hero) */}
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

        {/* 🟢 ავტორიზაცია */}
        <div className="w-full max-w-sm z-10">
          <div className="bg-stone-900/80 backdrop-blur-xl border border-white/10 p-5 md:p-6 rounded-[1.5rem] shadow-2xl relative">
            <div className="flex gap-2 p-1 bg-stone-950/50 rounded-lg mb-5 border border-white/5">
              <button onClick={() => {setIsLogin(true); setError('');}} className={`flex-1 py-2 rounded-md text-[11px] font-black transition-all ${isLogin ? 'bg-stone-800 text-yellow-500 shadow-sm border border-white/5' : 'text-stone-500'}`}>შესვლა</button>
              <button onClick={() => {setIsLogin(false); setError('');}} className={`flex-1 py-2 rounded-md text-[11px] font-black transition-all ${!isLogin ? 'bg-stone-800 text-yellow-500 shadow-sm border border-white/5' : 'text-stone-500'}`}>რეგისტრაცია</button>
            </div>

            {error && <div className="mb-3 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[10px] font-bold text-rose-400 text-center">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-stone-950 border border-white/5 focus:border-yellow-500/50 rounded-lg pl-9 pr-3 py-2.5 text-xs text-stone-200 outline-none transition-all placeholder-stone-600" placeholder="მომხმარებელი..." required />
              </div>
              {!isLogin && (
                <div className="relative animate-in fade-in">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-stone-950 border border-white/5 focus:border-yellow-500/50 rounded-lg pl-9 pr-3 py-2.5 text-xs text-stone-200 outline-none transition-all placeholder-stone-600" placeholder="ელ-ფოსტა..." required={!isLogin} />
                </div>
              )}
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-stone-950 border border-white/5 focus:border-yellow-500/50 rounded-lg pl-9 pr-3 py-2.5 text-xs text-stone-200 outline-none transition-all placeholder-stone-600" placeholder="პაროლი..." required />
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-black text-[11px] uppercase tracking-widest py-3 rounded-lg mt-4 transition-all active:scale-95 flex items-center justify-center gap-2">
                {isLoading ? 'გთხოვთ დაელოდოთ...' : (isLogin ? 'სისტემაში შესვლა' : 'ანგარიშის შექმნა')} <Play size={12} className={isLoading ? 'hidden' : ''} />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 🟢 წესები (Bento Grid) */}
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

      {/* 🟢 ეკონომიკა & მიღწევები (გაერთიანებული სექცია) */}
      <section id="features" className="py-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ეკონომიკა */}
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

            {/* მიღწევები */}
            <div className="bg-gradient-to-br from-stone-900/60 to-stone-950/40 p-6 rounded-[2rem] border border-white/5 space-y-5">
              <div>
                <div className="flex items-center gap-1.5 text-yellow-500 mb-1">
                  <Star size={14}/> <span className="text-[9px] font-black uppercase tracking-widest">Hardcore</span>
                </div>
                <h3 className="text-xl font-black text-stone-100 uppercase tracking-tight">მიღწევების სისტემა</h3>
              </div>
              <p className="text-[11px] text-stone-400 font-medium leading-relaxed">
                ბეჯების მოპოვება მხოლოდ რჩეულებს შეუძლიათ. პირობები ითვლება მხოლოდ და მხოლოდ მოგებულ মატჩებში!
              </p>
              <div className="space-y-2 pt-2">
                {[
                  { icon: '🛡️', title: 'ვეტერანი', desc: 'მოიგე 100 რეიტინგული მატჩი.' },
                  { icon: '💎', title: '10 აგური', desc: '50-ჯერ წაიღე მოგებულ მატჩში.' },
                  { icon: '♣️', title: '2 ჯვარი', desc: '50-ჯერ წაიღე მოგებულ მატჩში.' },
                  { icon: '🧹', title: 'მესუფთავე', desc: '50-ჯერ წაიღე 4+ კარტი ვალეტით (მოგებულში).' }
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

      {/* 🟢 მეგობრების მოწვევა (Slim Banner) */}
      <section id="invite" className="py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="bg-gradient-to-r from-stone-900 to-[#0a0a0a] border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0 border border-emerald-500/20 text-emerald-500">
                <Users size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-stone-100 uppercase tracking-tight">ითამაშე მეგობრებთან ერთად</h2>
                <p className="text-[11px] text-stone-400 font-medium mt-1">შექმენი პრივატული ოთახი პაროლით და დაამტკიცე ვინ არის საუკეთესო.</p>
              </div>
            </div>
            <button onClick={scrollToTop} className="px-6 py-2.5 bg-stone-100 hover:bg-white text-stone-950 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 shrink-0">
              დაწყება ახლავე
            </button>
          </div>
        </div>
      </section>

      {/* 🟢 Footer (კომპაქტური) */}
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
            <div className="flex gap-12">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-stone-200 uppercase tracking-widest">ნავიგაცია</h4>
                <ul className="space-y-1.5 text-[10px] font-medium text-stone-500">
                  <li><a href="#rules" className="hover:text-yellow-500 transition-colors">წესები</a></li>
                  <li><a href="#features" className="hover:text-yellow-500 transition-colors">სისტემა</a></li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-stone-200 uppercase tracking-widest">კონტაქტი</h4>
                <ul className="space-y-1.5 text-[10px] font-medium text-stone-500">
                  <li className="flex items-center gap-1.5"><Mail size={12}/> support@phurti.ge</li>
                </ul>
                <div className="flex items-center gap-2 pt-1">
                  <a href="#" className="p-1.5 bg-stone-900 rounded-md hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-white/5"><Globe size={12}/></a>
                  <a href="#" className="p-1.5 bg-stone-900 rounded-md hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-white/5"><Share2 size={12}/></a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-white/5 text-center flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-[9px] text-stone-600 font-bold tracking-widest uppercase">
              &copy; {new Date().getFullYear()} PHURTI ARENA. ყველა უფლება დაცულია.
            </p>
            <div className="text-[9px] text-stone-600 font-bold flex gap-4 uppercase tracking-widest">
              <a href="#" className="hover:text-stone-400 transition-colors">კონფიდენციალურობა</a>
              <a href="#" className="hover:text-stone-400 transition-colors">პირობები</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}