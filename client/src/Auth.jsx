import React, { useState, useEffect } from 'react';
import { Shield, Lock, User, Play, ChevronRight, Trophy, BookOpen, Users, Star, Target, Globe, Share2, MessageCircle, Info, Sparkles, Gem, Swords, Coins, Store, Palette, Crown, KeyRound, Calendar, Key, Facebook, Instagram, Mail, Send, X, MessageSquare } from 'lucide-react';

const translations = {
  ka: {
    rules: "წესები", system: "სისტემა", about: "ჩვენს შესახებ",
    onlinePlatform: "ონლაინ პლატფორმა",
    heroTitle1: "ითამაშე ფურთი", heroTitle2: "პროფესიონალურად",
    heroDesc: "რეიტინგული მატჩები, უნიკალური მიღწევები და ტოპ ათეული. შეუერთდი საქართველოს საუკეთესო მოთამაშეებს.",
    ranked: "რეიტინგული", shop: "მაღაზია",
    login: "შესვლა", register: "რეგისტრაცია",
    passRecovery: "პაროლის აღდგენა", step1Desc: "შეიყვანეთ თქვენი მონაცემები", step2Desc: "შეიყვანეთ ახალი პაროლი",
    phUsername: "მომხმარებელი...", phSecret: "საიდუმლო სიტყვა...", phPass: "პაროლი...", phPassRule: "პაროლი (მინ. 6 სიმბოლო, 1 ციფრი)", phConfirm: "გაიმეორეთ ახალი პაროლი...",
    wait: "დაელოდეთ...", continue: "გაგრძელება", changePass: "პაროლის შეცვლა",
    forgot: "დაგავიწყდა პაროლი?", back: "უკან", backMain: "მთავარზე დაბრუნება",
    errFields: "შეავსეთ ყველა ველი!", errPassMatch: "პაროლები არ ემთხვევა!", errPassRule: "პაროლი უნდა შეიცავდეს მინ. 6 სიმბოლოს, 1 ასოს და 1 ციფრს!", errServer: "სერვერთან კავშირი ვერ მოხერხდა",
    errData: "მონაცემები არასწორია",
    errUserRule: "სახელი: მინ 3 ლათინური ასო/ციფრი, სფეისის გარეშე!", errAgeRule: "რეგისტრაციისთვის აუცილებელია იყოთ 16 წლის!",
    howToPlay: "როგორ ვითამაშოთ?", goal: "მიზანი", goalDesc: "მოთამაშეების მიზანია დააგროვონ 11 ან 21 ქულა დადგენილი წესებით.", scoring: "ქულების სისტემა", scoringDesc: "ბევრი კარტი (2 ქულა), მეტი ჯვარი (1 ქულა), 10 აგური (1 ქულა), 2 ჯვარი (1 ქულა).", capture: "მოჭრა / გასუფთავება", captureDesc: "ვალეტი (J) ჭრის ნებისმიერ კარტს და ასუფთავებს მაგიდას.",
    economy: "ეკონომიკა", shopQuests: "მაღაზია & მისიები", economyDesc: "შეასრულე ყოველდღიური 3 მისია, გამოიმუშავე ოქროს მონეტები და გადაცვალე ისინი პრემიუმ კონტენტში.",
    dailyQuests: "დღიური მისიები", dailyQuestsDesc: "განახლებადი 24 სთ-ში", designs: "დიზაინები", designsDesc: "მაგიდა და კარტები", premiumAvatar: "პრემიუმ ავატარი", premiumAvatarDesc: "უნიკალური ემოჯი", vipStatus: "VIP სტატუსი", vipStatusDesc: "მანათობელი სახელი",
    achievementsSys: "მიღწევების სისტემა", achievementsDesc: "ბეჯების მოპოვება მხოლოდ რჩეულებს შეუძლიათ. პირობები ითვლება მხოლოდ და მხოლოდ მოგებულ მატჩებში!",
    achVet: "ვეტერანი", achVetDesc: "მოიგე 100 რეიტინგული მატჩი.", ach10D: "10 აგური", ach10DDesc: "50-ჯერ წაიღე მოგებულ მატჩში.", ach2C: "2 ჯვარი", ach2CDesc: "50-ჯერ წაიღე მოგებულ მატჩში.", achSweep: "მესუფთავე", achSweepDesc: "50-ჯერ წაიღე 4+ კარტი ვალეტით.",
    footerDesc: "ქართული დეველოპერული პროექტი. კლასიკური ბანქოს თამაშის თანამედროვე, სანდო და აზარტული ონლაინ სივრცე.",
    allRights: "ყველა უფლება დაცულია.",
    contactUs: "საკონტაქტო", socials: "სოციალური ქსელები", sendMessage: "გაგზავნა", contactDesc: "მოგვწერეთ თქვენი იდეები, შეფასება ან გაასაჩივრეთ მოთამაშე.", subject: "თემა", complaint: "გასაჩივრება / რეპორტი", feedback: "იდეა / რჩევა", messagePlaceholder: "აღწერეთ დეტალურად...", emailPlaceholder: "თქვენი ელ-ფოსტა (პასუხისთვის)...", close: "დახურვა", contactSuccess: "მადლობა! შეტყობინება მიღებულია."
  },
  en: {
    rules: "Rules", system: "System", about: "About Us",
    onlinePlatform: "Online Platform",
    heroTitle1: "Play Phurti", heroTitle2: "Professionally",
    heroDesc: "Ranked matches, unique achievements, and top 10 leaderboards. Join the best players.",
    ranked: "Ranked", shop: "Shop",
    login: "Login", register: "Register",
    passRecovery: "Password Recovery", step1Desc: "Enter your details", step2Desc: "Enter new password",
    phUsername: "Username...", phSecret: "Secret word...", phPass: "Password...", phPassRule: "Password (min. 6 chars, 1 number)", phConfirm: "Confirm new password...",
    wait: "Please wait...", continue: "Continue", changePass: "Change Password",
    forgot: "Forgot password?", back: "Back", backMain: "Back to main",
    errFields: "Fill in all fields!", errPassMatch: "Passwords do not match!", errPassRule: "Password must contain min 6 chars, 1 letter, and 1 number!", errServer: "Server connection failed",
    errData: "Incorrect details",
    errUserRule: "Username: min 3 Latin chars/nums, no spaces!", errAgeRule: "You must be at least 16 years old!",
    howToPlay: "How to play?", goal: "Goal", goalDesc: "Players aim to score 11 or 21 points by the rules.", scoring: "Scoring System", scoringDesc: "Most cards (2 pts), Most clubs (1 pt), 10 of Diamonds (1 pt), 2 of Clubs (1 pt).", capture: "Capture / Sweep", captureDesc: "Jack (J) captures any card and sweeps the table.",
    economy: "Economy", shopQuests: "Shop & Quests", economyDesc: "Complete 3 daily quests, earn gold coins, and exchange them for premium content.",
    dailyQuests: "Daily Quests", dailyQuestsDesc: "Refreshes in 24h", designs: "Designs", designsDesc: "Table & Cards", premiumAvatar: "Premium Avatar", premiumAvatarDesc: "Unique Emoji", vipStatus: "VIP Status", vipStatusDesc: "Glowing Name",
    achievementsSys: "Achievement System", achievementsDesc: "Badges are for the elite. Conditions only count in won matches!",
    achVet: "Veteran", achVetDesc: "Win 100 ranked matches.", ach10D: "10 of Diamonds", ach10DDesc: "Capture 50 times in a won match.", ach2C: "2 of Clubs", ach2CDesc: "Capture 50 times in a won match.", achSweep: "Sweeper", achSweepDesc: "Capture 4+ cards with a Jack 50 times.",
    footerDesc: "A modern, reliable, and exciting online platform for the classic card game.",
    allRights: "All rights reserved.",
    contactUs: "Contact Us", socials: "Social Media", sendMessage: "Send", contactDesc: "Send us your feedback, ideas, or report a player.", subject: "Subject", complaint: "Report Player", feedback: "Feedback / Idea", messagePlaceholder: "Describe in detail...", emailPlaceholder: "Your Email (optional)...", close: "Close", contactSuccess: "Thanks! Message received."
  },
  ru: {
    rules: "Правила", system: "Система", about: "О нас",
    onlinePlatform: "Онлайн Платформа",
    heroTitle1: "Играй в Пурти", heroTitle2: "Профессионально",
    heroDesc: "Рейтинговые матчи, уникальные достижения и топ 10. Присоединяйся к лучшим игрокам.",
    ranked: "Рейтинг", shop: "Магазин",
    login: "Войти", register: "Регистрация",
    passRecovery: "Восстановление", step1Desc: "Введите ваши данные", step2Desc: "Введите новый пароль",
    phUsername: "Имя пользователя...", phSecret: "Секретное слово...", phPass: "Пароль...", phPassRule: "Пароль (мин. 6 симв., 1 цифра)", phConfirm: "Повторите пароль...",
    wait: "Подождите...", continue: "Продолжить", changePass: "Изменить пароль",
    forgot: "Забыли пароль?", back: "Назад", backMain: "На главную",
    errFields: "Заполните все поля!", errPassMatch: "Пароли не совпадают!", errPassRule: "Пароль: мин 6 символов, 1 буква и 1 цифра!", errServer: "Ошибка подключения к серверу",
    errData: "Неверные данные",
    errUserRule: "Имя: мин 3 лат. символа/цифры, без пробелов!", errAgeRule: "Вам должно быть минимум 16 лет!",
    howToPlay: "Как играть?", goal: "Цель", goalDesc: "Цель — набрать 11 или 21 очко по правилам.", scoring: "Система очков", scoringDesc: "Больше карт (2 оч.), Больше треф (1 оч.), 10 Бубен (1 оч.), 2 Треф (1 оч.).", capture: "Взятие / Очистка", captureDesc: "Валет (J) берет любую карту и очищает стол.",
    economy: "Экономика", shopQuests: "Магазин и Квесты", economyDesc: "Выполняйте 3 задания в день, зарабатывайте монеты и покупайте премиум контент.",
    dailyQuests: "Ежедневные задания", dailyQuestsDesc: "Обновление 24ч", designs: "Дизайны", designsDesc: "Стол и Карты", premiumAvatar: "Премиум Аватар", premiumAvatarDesc: "Уникальное эмодзи", vipStatus: "VIP Статус", vipStatusDesc: "Светящееся имя",
    achievementsSys: "Система Достижений", achievementsDesc: "Значки для избранных. Учитываются только в выигранных матчах!",
    achVet: "Ветеран", achVetDesc: "Выиграть 100 рейтинговых матчей.", ach10D: "10 Бубен", ach10DDesc: "Взять 50 раз в победном матче.", ach2C: "2 Треф", ach2CDesc: "Взять 50 раз в победном матче.", achSweep: "Уборщик", achSweepDesc: "Взять 4+ карт Валетом 50 раз.",
    footerDesc: "Современная, надежная и увлекательная онлайн-платформа для классической карточной игры.",
    allRights: "Все права защищены.",
    contactUs: "Контакты", socials: "Соц. сети", sendMessage: "Отправить", contactDesc: "Напишите нам свои идеи, отзывы или подайте жалобу.", subject: "Тема", complaint: "Жалоба / Репорт", feedback: "Идея / Отзыв", messagePlaceholder: "Опишите подробно...", emailPlaceholder: "Ваш Email (необязательно)...", close: "Закрыть", contactSuccess: "Спасибо! Сообщение получено."
  }
};

export default function Auth({ onAuthSuccess }) {
  const [lang, setLang] = useState(() => localStorage.getItem('phurti_lang') || 'ka');
  useEffect(() => { localStorage.setItem('phurti_lang', lang); }, [lang]);
  const t = translations[lang] || translations['ka'];

  const [authMode, setAuthMode] = useState('login'); 
  const [recoveryStep, setRecoveryStep] = useState(1); 

  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [secretWord, setSecretWord] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // საკონტაქტო მოდალის მდგომარეობები
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactData, setContactData] = useState({ email: '', subject: 'feedback', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [contactStatus, setContactStatus] = useState('');

  const validatePassword = (pass) => {
    const regex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}$/;
    return regex.test(pass);
  };

  const resetState = () => {
    setError(''); setSuccessMsg('');
    setUsername(''); setDob(''); setSecretWord(''); setPassword(''); setConfirmPassword('');
    setRecoveryStep(1);
  };

  const handleNextStep = async (e) => {
    e.preventDefault();
    if (!username || !dob || !secretWord) return setError(t.errFields);
    
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch(`https://purti.onrender.com/api/auth/verify-recovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, dateOfBirth: dob, secretWord })
      });
      const data = await res.json();
      
      if (res.ok) {
        setRecoveryStep(2);
      } else {
        setError(data.message || t.errData);
      }
    } catch (err) {
      setError(t.errServer);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg('');

    if (authMode === 'register') {
      const userRegex = /^[a-zA-Z0-9]+$/;
      if (username.length < 3 || !userRegex.test(username)) {
        return setError(t.errUserRule);
      }
      
      if (!dob) return setError(t.errFields);
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 16) {
        return setError(t.errAgeRule);
      }

      if (!validatePassword(password)) {
        return setError(t.errPassRule);
      }
    }

    if (authMode === 'forgot' && password !== confirmPassword) {
      return setError(t.errPassMatch);
    }
    if (authMode === 'forgot' && !validatePassword(password)) {
      return setError(t.errPassRule);
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
        setError(data.message || 'Error');
        if (authMode === 'forgot') setRecoveryStep(1); 
      }
    } catch (err) {
      setError(t.errServer);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setContactStatus('');
    try {
      const res = await fetch(`https://purti.onrender.com/api/auth/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });
      const data = await res.json();
      if (res.ok) {
        setContactStatus(t.contactSuccess);
        setContactData({ email: '', subject: 'feedback', message: '' });
        setTimeout(() => { setIsContactOpen(false); setContactStatus(''); }, 3000);
      } else {
        setContactStatus(data.message || 'Error');
      }
    } catch (err) {
      setContactStatus(t.errServer);
    } finally {
      setIsSending(false);
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
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6 text-[10px] font-black tracking-widest text-stone-400 uppercase">
              <a href="#rules" className="hover:text-yellow-500 transition-colors">{t.rules}</a>
              <a href="#features" className="hover:text-yellow-500 transition-colors">{t.system}</a>
              <a href="#about" className="hover:text-yellow-500 transition-colors">{t.about}</a>
            </div>
            
            <div className="flex bg-stone-900/80 rounded-lg border border-white/5 p-1 gap-1 shadow-md ml-2 md:ml-4">
              <button onClick={() => setLang('ka')} className={`p-1 rounded transition-all text-[10px] md:text-xs ${lang === 'ka' ? 'bg-yellow-500 text-stone-950 shadow-sm' : 'grayscale opacity-50 hover:grayscale-0 hover:opacity-100'}`}>🇬🇪</button>
              <button onClick={() => setLang('en')} className={`p-1 rounded transition-all text-[10px] md:text-xs ${lang === 'en' ? 'bg-yellow-500 text-stone-950 shadow-sm' : 'grayscale opacity-50 hover:grayscale-0 hover:opacity-100'}`}>🇬🇧</button>
              <button onClick={() => setLang('ru')} className={`p-1 rounded transition-all text-[10px] md:text-xs ${lang === 'ru' ? 'bg-yellow-500 text-stone-950 shadow-sm' : 'grayscale opacity-50 hover:grayscale-0 hover:opacity-100'}`}>🇷🇺</button>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 px-4 md:px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        <div className="absolute top-0 -left-20 w-72 h-72 bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex-1 space-y-5 z-10 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/80 border border-yellow-500/20 text-yellow-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
            <Sparkles size={12} /> {t.onlinePlatform}
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-stone-100 leading-[1.1] tracking-tight">
            {t.heroTitle1} <br/>
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 bg-clip-text text-transparent">{t.heroTitle2}</span>
          </h1>
          <p className="text-xs md:text-sm text-stone-400 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
            {t.heroDesc}
          </p>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-stone-500 text-[11px] font-bold">
            <div className="flex items-center gap-1.5"><Trophy size={14} className="text-yellow-500"/> {t.ranked}</div>
            <div className="flex items-center gap-1.5"><Swords size={14} className="text-rose-500"/> 2v2 / 1v1</div>
            <div className="flex items-center gap-1.5"><Gem size={14} className="text-emerald-500"/> {t.shop}</div>
          </div>
        </div>

        <div className="w-full max-w-sm z-10">
          <div className="bg-stone-900/80 backdrop-blur-xl border border-white/10 p-5 md:p-6 rounded-[1.5rem] shadow-2xl relative transition-all duration-300">
            
            {authMode !== 'forgot' && (
              <div className="flex gap-2 p-1 bg-stone-950/50 rounded-lg mb-5 border border-white/5">
                <button onClick={() => {setAuthMode('login'); resetState();}} className={`flex-1 py-2 rounded-md text-[11px] font-black transition-all ${authMode === 'login' ? 'bg-stone-800 text-yellow-500 shadow-sm border border-white/5' : 'text-stone-500'}`}>{t.login}</button>
                <button onClick={() => {setAuthMode('register'); resetState();}} className={`flex-1 py-2 rounded-md text-[11px] font-black transition-all ${authMode === 'register' ? 'bg-stone-800 text-yellow-500 shadow-sm border border-white/5' : 'text-stone-500'}`}>{t.register}</button>
              </div>
            )}

            {authMode === 'forgot' && (
               <div className="text-center mb-5 animate-in fade-in">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-yellow-500/20">
                     <KeyRound size={20} className="text-yellow-500" />
                  </div>
                  <h3 className="text-sm font-black uppercase text-stone-100">{t.passRecovery}</h3>
                  <p className="text-[10px] text-stone-400 mt-1">{recoveryStep === 1 ? t.step1Desc : t.step2Desc}</p>
               </div>
            )}

            {error && <div className="mb-3 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[10px] font-bold text-rose-400 text-center animate-in fade-in">{error}</div>}
            {successMsg && <div className="mb-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-bold text-emerald-400 text-center animate-in fade-in">{successMsg}</div>}

            <form onSubmit={authMode === 'forgot' && recoveryStep === 1 ? handleNextStep : handleSubmit} className="space-y-3">
              
              {(authMode === 'login' || authMode === 'register' || (authMode === 'forgot' && recoveryStep === 1)) && (
                <div className="relative animate-in fade-in">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-stone-950 border border-white/5 focus:border-yellow-500/50 rounded-lg pl-9 pr-3 py-2.5 text-xs text-stone-200 outline-none transition-all placeholder-stone-600" placeholder={t.phUsername} required />
                </div>
              )}

              {(authMode === 'register' || (authMode === 'forgot' && recoveryStep === 1)) && (
                <>
                  <div className="relative animate-in slide-in-from-top-2">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full bg-stone-950 border border-white/5 focus:border-yellow-500/50 rounded-lg pl-9 pr-3 py-2.5 text-xs text-stone-400 outline-none transition-all" required />
                  </div>
                  <div className="relative animate-in slide-in-from-top-2">
                    <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input type="text" value={secretWord} onChange={e => setSecretWord(e.target.value)} className="w-full bg-stone-950 border border-white/5 focus:border-yellow-500/50 rounded-lg pl-9 pr-3 py-2.5 text-xs text-stone-200 outline-none transition-all placeholder-stone-600" placeholder={t.phSecret} required />
                  </div>
                </>
              )}

              {(authMode === 'login' || authMode === 'register' || (authMode === 'forgot' && recoveryStep === 2)) && (
                <div className="relative animate-in slide-in-from-right-4">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-stone-950 border border-white/5 focus:border-yellow-500/50 rounded-lg pl-9 pr-3 py-2.5 text-xs text-stone-200 outline-none transition-all placeholder-stone-600" placeholder={authMode === 'login' ? t.phPass : t.phPassRule} required />
                </div>
              )}

              {authMode === 'forgot' && recoveryStep === 2 && (
                <div className="relative animate-in slide-in-from-right-4">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-stone-950 border border-white/5 focus:border-yellow-500/50 rounded-lg pl-9 pr-3 py-2.5 text-xs text-stone-200 outline-none transition-all placeholder-stone-600" placeholder={t.phConfirm} required />
                </div>
              )}

              <button type="submit" disabled={isLoading} className="w-full bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-black text-[11px] uppercase tracking-widest py-3 rounded-lg mt-4 transition-all active:scale-95 flex items-center justify-center gap-2">
                {isLoading ? t.wait : (authMode === 'login' ? t.login : authMode === 'register' ? t.register : recoveryStep === 1 ? t.continue : t.changePass)} 
                <Play size={12} className={isLoading ? 'hidden' : ''} />
              </button>
            </form>

            {authMode === 'login' && (
               <div className="text-center mt-4">
                 <button onClick={() => {setAuthMode('forgot'); resetState();}} className="text-[10px] text-stone-500 hover:text-yellow-500 font-bold transition-colors">{t.forgot}</button>
               </div>
            )}
            {authMode === 'forgot' && (
               <div className="text-center mt-4 flex items-center justify-center gap-4">
                 {recoveryStep === 2 && <button onClick={() => setRecoveryStep(1)} className="text-[10px] text-stone-500 hover:text-yellow-500 font-bold transition-colors">{t.back}</button>}
                 <button onClick={() => {setAuthMode('login'); resetState();}} className="text-[10px] text-stone-500 hover:text-yellow-500 font-bold transition-colors">{t.backMain}</button>
               </div>
            )}
          </div>
        </div>
      </section>

      <section id="rules" className="py-10 border-t border-white/5 bg-stone-950/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h2 className="text-xl font-black text-stone-100 uppercase tracking-wider mb-6 flex items-center gap-2"><Target size={18} className="text-yellow-500"/> {t.howToPlay}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Target, title: t.goal, desc: t.goalDesc },
              { icon: BookOpen, title: t.scoring, desc: t.scoringDesc },
              { icon: Shield, title: t.capture, desc: t.captureDesc }
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

      <section id="features" className="py-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-stone-900/60 to-stone-950/40 p-6 rounded-[2rem] border border-white/5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-yellow-500 mb-1">
                    <Coins size={14}/> <span className="text-[9px] font-black uppercase tracking-widest">{t.economy}</span>
                  </div>
                  <h3 className="text-xl font-black text-stone-100 uppercase tracking-tight">{t.shopQuests}</h3>
                </div>
              </div>
              <p className="text-[11px] text-stone-400 font-medium leading-relaxed">
                {t.economyDesc}
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { icon: Target, title: t.dailyQuests, desc: t.dailyQuestsDesc },
                  { icon: Palette, title: t.designs, desc: t.designsDesc },
                  { icon: Store, title: t.premiumAvatar, desc: t.premiumAvatarDesc },
                  { icon: Crown, title: t.vipStatus, desc: t.vipStatusDesc }
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
                <h3 className="text-xl font-black text-stone-100 uppercase tracking-tight">{t.achievementsSys}</h3>
              </div>
              <p className="text-[11px] text-stone-400 font-medium leading-relaxed">
                {t.achievementsDesc}
              </p>
              <div className="space-y-2 pt-2">
                {[
                  { icon: '🛡️', title: t.achVet, desc: t.achVetDesc },
                  { icon: '💎', title: t.ach10D, desc: t.ach10DDesc },
                  { icon: '♣️', title: t.ach2C, desc: t.ach2CDesc },
                  { icon: '🧹', title: t.achSweep, desc: t.achSweepDesc }
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

      {/* 🟢 განახლებული Footer (სარდაფი) სოციალური ქსელებით და საკონტაქტოთი */}
      <footer id="about" className="bg-[#050505] pt-12 pb-8 border-t border-white/5 mt-4 relative z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-10">
            
            <div className="flex flex-col items-start gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                   <Shield size={18} className="text-yellow-500" />
                </div>
                <span className="text-sm font-black tracking-widest text-stone-100">PHURTI.GE</span>
              </div>
              <p className="text-[10px] md:text-xs text-stone-500 leading-relaxed font-medium max-w-xs">
                {t.footerDesc}
              </p>
            </div>

            <div className="flex flex-col items-start md:items-center gap-4">
              <h4 className="text-[10px] font-black text-stone-300 uppercase tracking-widest">{t.socials}</h4>
              <div className="flex items-center gap-3">
                <a href="https://facebook.com/phurti.ge" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-stone-900 border border-white/5 flex items-center justify-center text-stone-400 hover:text-[#1877F2] hover:bg-[#1877F2]/10 hover:border-[#1877F2]/30 transition-all">
                  <Facebook size={18}/>
                </a>
                <a href="https://instagram.com/phurti.ge" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-stone-900 border border-white/5 flex items-center justify-center text-stone-400 hover:text-[#E4405F] hover:bg-[#E4405F]/10 hover:border-[#E4405F]/30 transition-all">
                  <Instagram size={18}/>
                </a>
                <a href="https://discord.gg/phurti" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-stone-900 border border-white/5 flex items-center justify-center text-stone-400 hover:text-[#5865F2] hover:bg-[#5865F2]/10 hover:border-[#5865F2]/30 transition-all">
                  <MessageSquare size={18}/>
                </a>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-4">
              <h4 className="text-[10px] font-black text-stone-300 uppercase tracking-widest">{t.contactUs}</h4>
              <p className="text-[10px] text-stone-500 text-left md:text-right max-w-[200px] mb-1">გაქვთ იდეა ან გსურთ მოთამაშის გასაჩივრება?</p>
              <button onClick={() => setIsContactOpen(true)} className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 border border-white/10 text-stone-200 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 active:scale-95 shadow-lg">
                <Mail size={14} className="text-yellow-500"/> {t.contactUs}
              </button>
            </div>

          </div>

          <div className="pt-6 border-t border-white/5 text-center flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[9px] text-stone-600 font-bold tracking-widest uppercase">
              &copy; {new Date().getFullYear()} PHURTI.GE. {t.allRights}
            </p>
            <div className="flex gap-4 text-[9px] font-bold text-stone-600 uppercase tracking-widest">
              <a href="#" className="hover:text-stone-300">წესები</a>
              <a href="#" className="hover:text-stone-300">კონფიდენციალურობა</a>
            </div>
          </div>
        </div>
      </footer>

      {/* 🟢 საკონტაქტო მოდალური ფანჯარა */}
      {isContactOpen && (
        <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-stone-900 border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95">
              <button onClick={() => setIsContactOpen(false)} className="absolute top-4 right-4 text-stone-500 hover:text-white"><X size={20}/></button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-500 border border-yellow-500/30"><Mail size={20}/></div>
                <h3 className="text-lg font-black text-stone-100 uppercase tracking-widest">{t.contactUs}</h3>
              </div>
              <p className="text-[10px] text-stone-400 mb-5 font-medium">{t.contactDesc}</p>
              
              {contactStatus && <div className={`mb-4 p-2 text-[10px] font-bold text-center border rounded-lg ${contactStatus.includes('მადლობა') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>{contactStatus}</div>}
              
              <form onSubmit={handleContactSubmit} className="space-y-3">
                <input type="email" placeholder={t.emailPlaceholder} value={contactData.email} onChange={e=>setContactData({...contactData, email: e.target.value})} className="w-full bg-stone-950 border border-white/5 focus:border-yellow-500/50 rounded-xl px-4 py-3 text-xs text-stone-200 outline-none transition-all placeholder-stone-600" />
                
                <select value={contactData.subject} onChange={e=>setContactData({...contactData, subject: e.target.value})} className="w-full bg-stone-950 border border-white/5 focus:border-yellow-500/50 rounded-xl px-4 py-3 text-xs text-stone-200 outline-none transition-all cursor-pointer">
                  <option value="feedback">{t.feedback}</option>
                  <option value="complaint">{t.complaint}</option>
                  <option value="other">სხვა...</option>
                </select>
                
                <textarea placeholder={t.messagePlaceholder} value={contactData.message} onChange={e=>setContactData({...contactData, message: e.target.value})} className="w-full bg-stone-950 border border-white/5 focus:border-yellow-500/50 rounded-xl px-4 py-3 text-xs text-stone-200 outline-none transition-all placeholder-stone-600 min-h-[100px] resize-none" required></textarea>
                
                <button type="submit" disabled={isSending} className="w-full bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-black text-[11px] uppercase tracking-widest py-3 rounded-xl mt-2 transition-all active:scale-95 flex items-center justify-center gap-2">
                  {isSending ? t.wait : <><Send size={14}/> {t.sendMessage}</>}
                </button>
              </form>
           </div>
        </div>
      )}

    </div>
  );
}