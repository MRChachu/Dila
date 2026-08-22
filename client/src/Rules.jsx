import React, { useEffect } from 'react';
import { Shield, ChevronLeft, BookOpen, Target, Star, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Rules({ onBack }) {
  // 🟢 SEO ოპტიმიზაცია - Google-ისთვის
  useEffect(() => {
    document.title = "ფურთის წესები - როგორ ვითამაშოთ ფურთი ონლაინ | Phurti.ge";
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = "გაეცანით ფურთის თამაშის ოფიციალურ წესებს. ისწავლეთ როგორ ვითამაშოთ ფურთი ონლაინ, ქულების დათვლის სისტემა, მოჭრა და მოგების სტრატეგიები საქართველოს საუკეთესო პლატფორმაზე.";
    
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-stone-200 font-sans selection:bg-yellow-500/30">
      
      {/* 🟢 ნავიგაცია */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 transition-all">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg shadow-[0_0_10px_rgba(234,179,8,0.2)]">
              <Shield size={16} className="text-stone-950" />
            </div>
            <span className="text-sm font-black tracking-widest text-stone-100">PHURTI.GE</span>
          </div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
          >
            <ChevronLeft size={16} className="text-yellow-500"/> უკან დაბრუნება
          </button>
        </div>
      </nav>

      {/* 🟢 მთავარი კონტენტი (SEO მეგობრული) */}
      <main className="pt-24 pb-20 px-4 md:px-6 max-w-4xl mx-auto">
        <header className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-widest mb-4">
            <BookOpen size={14} /> ოფიციალური სახელმძღვანელო
          </div>
          {/* h1 ტეგი კრიტიკულად მნიშვნელოვანია Google-ისთვის */}
          <h1 className="text-3xl md:text-5xl font-black text-stone-100 mb-4 tracking-tight">
            ფურთის წესები
          </h1>
          <p className="text-sm md:text-base text-stone-400 font-medium max-w-2xl mx-auto leading-relaxed">
            ისწავლეთ როგორ ვითამაშოთ ქართული ტრადიციული კარტის თამაში ფურთი პროფესიონალურ დონეზე. გაეცანით ქულების დათვლის სისტემას და ძირითად სტრატეგიებს.
          </p>
        </header>

        <div className="space-y-6 md:space-y-8">
          
          {/* სექცია 1: მიზანი */}
          <section className="bg-stone-900/60 border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl">
            <h2 className="text-xl font-black text-stone-100 uppercase tracking-widest mb-4 flex items-center gap-3">
              <Target className="text-yellow-500" /> თამაშის მიზანი
            </h2>
            <p className="text-sm text-stone-300 leading-relaxed font-medium">
              ფურთი (Phurti) არის აზარტული და სტრატეგიული კარტის თამაში. მოთამაშეების მთავარი მიზანია, მაგიდიდან აიღონ (მოჭრან) რაც შეიძლება მეტი და ღირებული კარტი, რათა დააგროვონ <strong className="text-yellow-500">11 ან 21 ქულა</strong>. თამაში მიმდინარეობს 36 კარტიანი დასტით (ექვსიანების გარეშე).
            </p>
          </section>

          {/* სექცია 2: ქულების სისტემა (მნიშვნელოვანი SEO ქივორდები) */}
          <section className="bg-gradient-to-br from-stone-900/80 to-stone-950/80 border border-yellow-500/20 rounded-3xl p-6 md:p-8 shadow-[0_0_30px_rgba(234,179,8,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-[80px]"></div>
            <h2 className="text-xl font-black text-yellow-500 uppercase tracking-widest mb-6 flex items-center gap-3 relative z-10">
              <Star /> ქულების დათვლის სისტემა
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              <div className="bg-stone-950/50 p-4 rounded-2xl border border-white/5 flex items-start gap-3">
                <span className="text-2xl drop-shadow-md">🃏</span>
                <div>
                  <h3 className="text-xs font-black text-stone-200 uppercase mb-1">ბევრი კარტი (2 ქულა)</h3>
                  <p className="text-[11px] text-stone-400">მოთამაშე, რომელიც აიღებს ყველაზე მეტ კარტს რაუნდში.</p>
                </div>
              </div>
              <div className="bg-stone-950/50 p-4 rounded-2xl border border-white/5 flex items-start gap-3">
                <span className="text-2xl drop-shadow-md">♣️</span>
                <div>
                  <h3 className="text-xs font-black text-stone-200 uppercase mb-1">მეტი ჯვარი (1 ქულა)</h3>
                  <p className="text-[11px] text-stone-400">მოთამაშე, რომელიც აიღებს ყველაზე მეტ ჯვრის (Clubs) ნიშნიან კარტს.</p>
                </div>
              </div>
              <div className="bg-stone-950/50 p-4 rounded-2xl border border-white/5 flex items-start gap-3">
                <span className="text-2xl drop-shadow-md">♦️</span>
                <div>
                  <h3 className="text-xs font-black text-stone-200 uppercase mb-1">10 აგური (1 ქულა)</h3>
                  <p className="text-[11px] text-stone-400">ვინც შეძლებს 10 აგურის (10 of Diamonds) მოჭრას მაგიდიდან.</p>
                </div>
              </div>
              <div className="bg-stone-950/50 p-4 rounded-2xl border border-white/5 flex items-start gap-3">
                <span className="text-2xl drop-shadow-md">♣️</span>
                <div>
                  <h3 className="text-xs font-black text-stone-200 uppercase mb-1">2 ჯვარი (1 ქულა)</h3>
                  <p className="text-[11px] text-stone-400">ვინც შეძლებს 2 ჯვრის (2 of Clubs) აღებას.</p>
                </div>
              </div>
            </div>
          </section>

          {/* სექცია 3: თამაშის მსვლელობა */}
          <section className="bg-stone-900/60 border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl">
            <h2 className="text-xl font-black text-stone-100 uppercase tracking-widest mb-6 flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500" /> თამაშის მსვლელობა და მოჭრა
            </h2>
            <ul className="space-y-4 text-sm text-stone-300 font-medium">
              <li className="flex gap-3">
                <span className="text-yellow-500 font-black mt-0.5">•</span>
                <p>მაგიდაზე თავდაპირველად იდება 4 კარტი, ხოლო თითოეულ მოთამაშეს ურიგდება 4-4 კარტი.</p>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-500 font-black mt-0.5">•</span>
                <p>მოთამაშეს შეუძლია მოჭრას კარტი მაგიდიდან, თუ ხელში აქვს იგივე რანგის კარტი (მაგ: 8 ჭრის 8-იანს, K ჭრის K-ს).</p>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-500 font-black mt-0.5">•</span>
                <p>შესაძლებელია რამდენიმე კარტის ერთდროულად აღება, თუ მათი ჯამი უდრის ხელში არსებული კარტის მნიშვნელობას (მაგ: 10-იანით შეგიძლიათ აიღოთ მაგიდაზე არსებული 6-იანი და 4-იანი ერთად).</p>
              </li>
              <li className="flex gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl mt-4 text-rose-200">
                <AlertCircle className="text-rose-500 shrink-0" size={18} />
                <p><strong>ვალეტის (J) წესი:</strong> ვალეტი არის უნიკალური კარტი ("მესუფთავე"). მას შეუძლია ნებისმიერ დროს აიღოს მაგიდაზე არსებული ყველა კარტი ერთიანად.</p>
              </li>
            </ul>
          </section>

        </div>
      </main>
    </div>
  );
}