// ==========================================
// კონფიგურაცია და გლობალური ცვლადები
// ==========================================
const API_KEY = '9e3727602e1d5892852f2524389c72da';
let usdRate = 2.715;
let selectedCurrencyRate = 2.715;
let goldHistory = [30, 28, 35, 32, 40, 38, 45, 42, 48, 46];

const FIREBASE_DB_URL = 'https://dila-ge-default-rtdb.europe-west1.firebasedatabase.app/fuel.json'; 
const ADMIN_SECURE_PIN = '9988'; 

const CURRENCY_ORDER = [
    { code: 'USD', flag: '🇺🇸' }, { code: 'EUR', flag: '🇪🇺' }, { code: 'GBP', flag: '🇬🇧' },
    { code: 'TRY', flag: '🇹🇷' }, { code: 'RUB', flag: '🇷🇺' }, { code: 'AMD', flag: '🇦🇲' }
];

// ==========================================
// აპლიკაციის ინიციალიზაცია
// ==========================================
function initDashboard() {
    startClock();
    setupNavigation();
    setupMobileDropdown(); // ✅ ჩაირთო მობილურის სენსორული მენიუ
    checkAdminQuery(); 
    
    const savedCity = localStorage.getItem('dila-last-city') || 'Tbilisi';
    
    loadFallbackFinances();
    loadFallbackForecast();
    loadFuelPricesCloud();
    fetchCryptoCloud(); 
    
    fetchWeather(savedCity);
    fetchFinances();
    
    document.getElementById('calc-loan-btn').onclick = calculateLoan;
    setInterval(animateSparkline, 4000);
}

// ==========================================
// ✅ მობილურის Dropdown კლიკების მართვა
// ==========================================
function setupMobileDropdown() {
    const dropdownBlock = document.getElementById('main-nav-dropdown');
    const dropBtn = dropdownBlock.querySelector('.drop-btn');
    
    // როცა კალკულატორის ან სხვა ტაბის შიგნით დააჭერს - მენიუ დაიკეტოს
    const subItems = dropdownBlock.querySelectorAll('.dropdown-content .nav-item');

    dropBtn.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            e.stopPropagation(); // კლიკმა სხვაგან არ გაჟონოს
            dropdownBlock.classList.toggle('open');
        }
    });

    subItems.forEach(item => {
        item.addEventListener('click', () => {
            dropdownBlock.classList.remove('open'); // არჩევისას იკეტება
        });
    });

    // ეკრანის ნებისმიერ სხვა ადგილზე დაჭერისას მენიუ იხურება
    document.addEventListener('click', () => {
        dropdownBlock.classList.remove('open');
    });
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = type === 'success' ? `✅ ${message}` : `❌ ${message}`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'scale(0.9)';
        toast.style.transition = '0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function startClock() {
    const updateTime = () => {
        const timeEl = document.getElementById('current-time');
        if (timeEl) timeEl.textContent = new Date().toLocaleTimeString('ka-GE', {hour: '2-digit', minute: '2-digit'});
    };
    updateTime();
    setInterval(updateTime, 1000);
}

function checkAdminQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'admin') { 
        const adminTab = document.getElementById('nav-admin-tab');
        if (adminTab) adminTab.style.display = 'block';
    }
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const grid = document.getElementById('main-grid');
    const cards = {
        weather: document.getElementById('weather-card'),
        currency: document.getElementById('currency-card'),
        gold: document.getElementById('gold-card'),
        fuel: document.getElementById('fuel-card'),
        loan: document.getElementById('loan-card'),
        about: document.getElementById('about-card'),
        contact: document.getElementById('contact-card'),
        admin: document.getElementById('admin-card')
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // თუ ქვემენიუს ელემენტი გააქტიურდა, მთავარ ღილაკსაც მიეცეს აქტიური ვიზუალი
            if (item.closest('.dropdown-content')) {
                document.getElementById('main-nav-dropdown').classList.add('active');
            }

            const selectedTab = item.getAttribute('data-tab');

            if (selectedTab === 'all') {
                grid.classList.remove('single-view');
                Object.keys(cards).forEach(key => {
                    if (cards[key]) {
                        if (['weather', 'currency', 'gold', 'fuel'].includes(key)) cards[key].classList.remove('hidden');
                        else cards[key].classList.add('hidden');
                    }
                });
            } else {
                grid.classList.add('single-view');
                Object.keys(cards).forEach(key => {
                    if (cards[key]) {
                        if (key === selectedTab) cards[key].classList.remove('hidden');
                        else cards[key].classList.add('hidden');
                    }
                });
            }
        });
    });
}

function calculateLoan() {
    const amount = parseFloat(document.getElementById('loan-amount').value) || 0;
    const months = parseInt(document.getElementById('loan-months').value) || 0;
    const annualRate = parseFloat(document.getElementById('loan-rate').value) || 0;

    if (amount <= 0 || months <= 0 || annualRate <= 0) {
        showToast('გთხოვთ შეიყვანოთ სწორი მონაცემები', 'error');
        return;
    }

    const monthlyRate = (annualRate / 100) / 12;
    const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    
    let totalInterest = 0;
    let remainingBalance = amount;

    const scheduleList = document.getElementById('loan-schedule-list');
    scheduleList.innerHTML = ''; 

    for (let i = 1; i <= months; i++) {
        const interestPayment = remainingBalance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        totalInterest += interestPayment;

        scheduleList.innerHTML += `
            <div class="loan-sched-row">
                <span style="color: rgba(255,255,255,0.4); text-align: left;">#${i}</span>
                <b style="color: #00ff88;">${monthlyPayment.toFixed(2)} ₾</b>
                <span>${principalPayment.toFixed(2)} ₾</span>
                <span style="color: #ff8888;">${interestPayment.toFixed(2)} ₾</span>
            </div>
        `;
        remainingBalance -= principalPayment; 
    }

    const totalPayout = amount + totalInterest;

    document.getElementById('loan-res-fixed').textContent = monthlyPayment.toFixed(2) + " ₾";
    document.getElementById('loan-res-principal-total').textContent = amount.toFixed(2) + " ₾";
    document.getElementById('loan-res-interest').textContent = totalInterest.toFixed(2) + " ₾";
    document.getElementById('loan-res-total').textContent = totalPayout.toFixed(2) + " ₾";
    
    document.getElementById('loan-schedule-box').style.display = 'flex';
    showToast('ანუიტეტური გრაფიკი აიგო!');
}

async function refreshAllData() {
    const status = document.getElementById('sync-status');
    if(status) status.textContent = "ახლდება...";
    const savedCity = localStorage.getItem('dila-last-city') || 'Tbilisi';
    await fetchWeather(savedCity);
    await fetchFinances();
    await loadFuelPricesCloud();
    await fetchCryptoCloud();
    setTimeout(() => { if(status) status.textContent = "განახლდა"; }, 1200);
}

function changeAmbientTheme(weatherMain) {
    const bg = document.getElementById('ambient-bg');
    if(!bg) return;
    bg.className = "background-overlay";
    const condition = weatherMain.toLowerCase();
    if(condition.includes('clear') || condition.includes('sun')) bg.classList.add('theme-clear');
    else if(condition.includes('cloud')) bg.classList.add('theme-clouds');
    else if(condition.includes('rain') || condition.includes('drizzle')) bg.classList.add('theme-rain');
    else bg.classList.add('theme-default');
}

async function fetchWeather(city) {
    try {
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`);
        const geoData = await geoRes.json();
        if (!geoData || geoData.length === 0) {
            showToast('ქალაქი ვერ მოიძებნა', 'error');
            return;
        }
        const { lat, lon, local_names, name } = geoData[0];
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}&lang=ka`);
        const data = await res.json();
        
        document.getElementById('city-display').textContent = local_names?.ka || name;
        document.getElementById('temp-display').textContent = Math.round(data.main.temp) + "°C";
        document.getElementById('weather-desc').textContent = data.weather[0].description;
        document.getElementById('humidity').textContent = data.main.humidity + "%";
        document.getElementById('wind').textContent = Math.round(data.wind.speed) + " კმ/ს";
        document.getElementById('vis').textContent = (data.visibility / 1000).toFixed(1) + " კმ";
        document.getElementById('main-weather-icon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        
        localStorage.setItem('dila-last-city', city);
        changeAmbientTheme(data.weather[0].main);
        fetchForecast(lat, lon);
    } catch(e) { loadFallbackForecast(); }
}

async function fetchForecast(lat, lon) {
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}&lang=ka`);
        const data = await res.json();
        const fBox = document.getElementById('forecast-box');
        fBox.innerHTML = '';
        data.list.filter(f => f.dt_txt.includes("12:00:00")).slice(0, 4).forEach(d => {
            fBox.innerHTML += `<div style="text-align:center;"><span style="font-size:10px; color:rgba(255,255,255,0.4); display:block;">${d.dt_txt.split(' ')[0].slice(5)}</span><img src="https://openweathermap.org/img/wn/${d.weather[0].icon}.png" style="width:32px; display:block; margin: 2px auto;"><b style="font-size:12px; color: white;">${Math.round(d.main.temp)}°</b></div>`;
        });
    } catch(e) { loadFallbackForecast(); }
}

function loadFallbackForecast() {
    const fBox = document.getElementById('forecast-box');
    if(fBox) {
        fBox.innerHTML = '';
        ['05-18', '05-19', '05-20', '05-21'].forEach(day => {
            fBox.innerHTML += `<div style="text-align:center;"><span style="font-size:10px; color:rgba(255,255,255,0.4); display:block;">${day}</span><img src="https://openweathermap.org/img/wn/02d.png" style="width:32px; display:block; margin: 2px auto;"><b style="font-size:12px;">18°</b></div>`;
        });
    }
}

async function fetchFinances() {
    const list = document.getElementById('currency-list');
    try {
        const proxy = "https://api.allorigins.win/get?url=";
        const nbgUrl = encodeURIComponent("https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/ka/json");
        const res = await fetch(proxy + nbgUrl);
        const json = await res.json();
        const data = JSON.parse(json.contents)[0].currencies;
        const nbgRatesMap = {};
        data.forEach(c => { nbgRatesMap[c.code] = c; });
        list.innerHTML = '';
        
        CURRENCY_ORDER.forEach(target => {
            const c = nbgRatesMap[target.code];
            if (c) {
                const rate = c.rate / (c.quantity || 1);
                if (target.code === 'USD') usdRate = rate;
                renderCurrencyRow(list, target.flag, target.code, rate);
            }
        });
        animateSparkline();
    } catch(e) { loadFallbackFinances(); }
}

function loadFallbackFinances() {
    const list = document.getElementById('currency-list');
    if(!list) return;
    list.innerHTML = '';
    const fallbacks = [
        {c:'USD', f:'🇺🇸', r:2.715}, {c:'EUR', f:'🇪🇺', r:2.940}, {c:'GBP', f:'🇬🇧', r:3.445}, 
        {c:'TRY', f:'🇹🇷', r:0.084}, {c:'RUB', f:'🇷🇺', r:0.031}, {c:'AMD', f:'🇦🇲', r:0.0069}
    ];
    fallbacks.forEach(item => { renderCurrencyRow(list, item.f, item.c, item.r); });
    animateSparkline();
}

function renderCurrencyRow(container, flag, code, rate) {
    const isSmall = rate < 0.1;
    const buyPrice = (rate * 0.988).toFixed(isSmall ? 4 : 3);
    const sellPrice = (rate * 1.012).toFixed(isSmall ? 4 : 3);
    const row = document.createElement('div');
    row.className = 'curr-row';
    row.innerHTML = `
        <div class="curr-row-left"><span>${flag}</span><b style="font-size:13px;">${code}</b></div>
        <span class="curr-price" style="color:rgba(255,255,255,0.3);">${buyPrice}</span>
        <span class="curr-price" style="color:#f39c12; font-weight: bold;">${sellPrice}</span>
    `;
    row.onclick = () => openCalculator(code, rate);
    container.appendChild(row);
}

function openCalculator(code, rate) {
    selectedCurrencyRate = rate;
    document.getElementById('calc-title').textContent = `${code} ➔ GEL (კურსი: ${rate.toFixed(code === 'AMD' || code === 'RUB' ? 4 : 3)})`;
    document.getElementById('calc-panel').style.display = 'block';
    document.getElementById('calc-input').value = code === 'AMD' ? '10000' : '100';
    calculateResult();
}

function calculateResult() {
    const inputVal = parseFloat(document.getElementById('calc-input').value) || 0;
    document.getElementById('calc-result').textContent = (inputVal * selectedCurrencyRate).toFixed(2) + " ₾";
}

document.getElementById('calc-input').oninput = calculateResult;
document.getElementById('close-calc').onclick = () => document.getElementById('calc-panel').style.display = 'none';

function animateSparkline() {
    const goldUsd = 2335.50 + (Math.random() * 5);
    const goldGel = (goldUsd / 31.1035) * usdRate;
    document.getElementById('gold-live-price').textContent = goldUsd.toFixed(2) + " $";
    document.getElementById('gold-local-price').textContent = goldGel.toFixed(2) + " ₾";

    const silverUsd = 28.30 + (Math.random() * 0.3);
    const silverGel = (silverUsd / 31.1035) * usdRate;
    document.getElementById('silver-live-price').textContent = silverUsd.toFixed(2) + " $";
    document.getElementById('silver-local-price').textContent = silverGel.toFixed(2) + " ₾";

    goldHistory.push(15 + Math.random() * 20);
    if(goldHistory.length > 8) goldHistory.shift();
    let pathString = "M ";
    goldHistory.forEach((val, i) => { pathString += `${i * 28},${40 - val} `; });
    const pathEl = document.getElementById('sparkline-path');
    if(pathEl) pathEl.setAttribute('d', pathString);
}

async function fetchCryptoCloud() {
    try {
        const res = await fetch('https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH&tsyms=USD');
        const data = await res.json();
        if(data && data.BTC && data.ETH) {
            document.getElementById('btc-price').textContent = data.BTC.USD.toLocaleString() + " $";
            document.getElementById('eth-price').textContent = data.ETH.USD.toLocaleString() + " $";
        }
    } catch(e) {
        document.getElementById('btc-price').textContent = "64,250 $";
        document.getElementById('eth-price').textContent = "3,450 $";
    }
}

async function loadFuelPricesCloud() {
    try {
        const res = await fetch(FIREBASE_DB_URL);
        const data = await res.json();
        if(data) {
            document.getElementById('display-regular').textContent = parseFloat(data.regular || 2.50).toFixed(2) + " ₾";
            document.getElementById('display-premium').textContent = parseFloat(data.premium).toFixed(2) + " ₾";
            document.getElementById('display-super').textContent = parseFloat(data.super).toFixed(2) + " ₾";
            document.getElementById('display-diesel').textContent = parseFloat(data.diesel).toFixed(2) + " ₾";
            document.getElementById('input-regular').value = data.regular || 2.50;
            document.getElementById('input-premium').value = data.premium;
            document.getElementById('input-super').value = data.super;
            document.getElementById('input-diesel').value = data.diesel;
        }
    } catch(e) {
        document.getElementById('display-regular').textContent = "2.50 ₾";
        document.getElementById('display-premium').textContent = "2.85 ₾";
        document.getElementById('display-super').textContent = "3.10 ₾";
        document.getElementById('display-diesel').textContent = "2.70 ₾";
    }
}

document.getElementById('save-fuel-btn').onclick = async () => {
    const enteredPin = document.getElementById('input-admin-pin').value;
    if (enteredPin !== ADMIN_SECURE_PIN) {
        showToast('ადმინის პინ-კოდი არასწორია!', 'error');
        return;
    }
    const regular = document.getElementById('input-regular').value;
    const premium = document.getElementById('input-premium').value;
    const superFuel = document.getElementById('input-super').value;
    const diesel = document.getElementById('input-diesel').value;

    if(regular && premium && superFuel && diesel) {
        try {
            const res = await fetch(FIREBASE_DB_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ regular, premium, super: superFuel, diesel })
            });
            if(res.ok) {
                showToast('ფასები განახლდა ღრუბლოვან ბაზაში!');
                document.getElementById('input-admin-pin').value = '';
                loadFuelPricesCloud();
            } else { throw new Error(); }
        } catch(e) { showToast('ბაზასთან კავშირის შეცდომა', 'error'); }
    } else { showToast('გთხოვთ შეავსოთ ყველა ველი', 'error'); }
};

document.getElementById('search-btn').onclick = () => {
    const val = document.getElementById('city-input').value.trim();
    if(val) fetchWeather(val);
};
document.getElementById('city-input').onkeypress = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) fetchWeather(e.target.value.trim());
};
document.getElementById('sync-btn').onclick = refreshAllData;

initDashboard();