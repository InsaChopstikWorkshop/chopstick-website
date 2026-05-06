/* ─────────────────────────────────────────────
   INSA CHOPSTICK WORKSHOP — script.js
   수정 사항: 1인당 20,000원 / 인원 1~20명 / KRW 설정
───────────────────────────────────────────── */

// ── CONFIG (설정) ────────────────────
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_KEY_HERE';
const PRICE_PER_PERSON       = 20000;   // 1인당 20,000원
const CURRENCY_SYMBOL        = '₩';
const CURRENCY_CODE          = 'krw';  
const BACKEND_URL            = '/api/create-payment-intent'; 
// ───────────────────────────────────────────

// ── STATE (상태) ──────────────────────────────────
let guestCount = 1; // 최소 인원 1명으로 시작
let stripe, cardElement;
let formData = {};

// ── DOM READY ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initGuestCounter();
  initPricePreview();
  initStripe();
  setMinDate();
});

// ── NAV SCROLL & MOBILE MENU ───────────────
function initNav() {
  const nav       = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu= document.getElementById('mobileMenu');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });
}

function closeMobileMenu() {
  document.getElementById('hamburger').classList.remove('open');
  document.getElementById('mobileMenu').classList.remove('open');
}

// ── SET MINIMUM DATE (오늘 이후만 선택 가능) ───────────────
function setMinDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('sessionDate').min = today;
}

// ── GUEST COUNTER (인원 조절: 1~20명) ──────────────────────────
function initGuestCounter() {
  document.getElementById('guestMinus').addEventListener('click', () => {
    if (guestCount > 1) { // 최소 1명
      guestCount--; 
      updateGuests(); 
    }
  });
  document.getElementById('guestPlus').addEventListener('click', () => {
    if (guestCount < 20) { // 최대 20명
      guestCount++; 
      updateGuests(); 
    }
  });
}

function updateGuests() {
  document.getElementById('guestCount').textContent = guestCount;
  document.getElementById('guestInput').value = guestCount;
  updatePriceDisplay();
}

// ── PRICE PREVIEW (가격 표시 업데이트) ──────────────────────────
function initPricePreview() {
  updatePriceDisplay();
}

function updatePriceDisplay() {
  const total = PRICE_PER_PERSON * guestCount;
  document.getElementById('priceTotal').textContent = formatPrice(total);
}

function formatPrice(amount) {
  // KRW(원)는 소수점이 없으므로 콤마 형식만 적용
  return CURRENCY_SYMBOL + amount.toLocaleString();
}

// ── STRIPE INIT (결제 초기화) ────────────────────────────
function initStripe() {
  if (STRIPE_PUBLISHABLE_KEY === 'pk_test_YOUR_KEY_HERE') {
    document.getElementById('stripe-card-element').innerHTML =
      '<p style="color:rgba(242,237,229,0.4); font-size:13px; padding: 2px 0;">💳 Card input (Stripe) — add your publishable key in script.js</p>';
    return;
  }

  stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
  const elements = stripe.elements({
    appearance: {
      theme: 'night',
      variables: {
        colorPrimary: '#b8936a',
        colorBackground: 'rgba(255,255,255,0.06)',
        colorText: '#faf8f4',
        colorDanger: '#f87171',
        fontFamily: 'DM Sans, system-ui, sans-serif',
        borderRadius: '6px',
      }
    }
  });

  cardElement = elements.create('card');
  cardElement.mount('#stripe-card-element');
}

// ── FORM STEP NAVIGATION ───────────────────
function goToStep(step) {
  if (step > 1 && !validateCurrentStep(step - 1)) return;

  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  document.getElementById('step' + step).classList.add('active');

  document.querySelectorAll('.step-dot').forEach((dot, i) => {
    dot.classList.remove('active', 'done');
    if (i + 1 === step)      dot.classList.add('active');
    else if (i + 1 < step)   dot.classList.add('done');
  });

  if (step === 3) populateSummary();

  document.getElementById('booking').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── VALIDATION ────────────────────────────
function validateCurrentStep(stepNum) {
  if (stepNum === 1) {
    const date = document.getElementById('sessionDate').value;
    const time = document.getElementById('sessionTime').value;
    if (!date) { alert('날짜를 선택해주세요.'); return false; }
    if (!time) { alert('시간을 선택해주세요.'); return false; }
    formData.date  = date;
    formData.time  = time;
    formData.guests = guestCount;
  }

  if (stepNum === 2) {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName  = document.getElementById('lastName').value.trim();
    const email     = document.getElementById('email').value.trim();

    if (!firstName) { alert('이름(First Name)을 입력해주세요.'); return false; }
    if (!lastName)  { alert('성(Last Name)을 입력해주세요.'); return false; }
    if (!email || !email.includes('@')) { alert('유효한 이메일 주소를 입력해주세요.'); return false; }

    formData.firstName = firstName;
    formData.lastName  = lastName;
    formData.email     = email;
    formData.phone     = document.getElementById('phone').value.trim();
    formData.notes     = document.getElementById('notes').value.trim();
  }

  return true;
}

// ── BOOKING SUMMARY (3단계 요약) ───────────────────────
function populateSummary() {
  const total = PRICE_PER_PERSON * guestCount;

  document.getElementById('bookingSummary').innerHTML = `
    <div><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</div>
    <div><strong>Date:</strong> ${formData.date}</div>
    <div><strong>Time:</strong> ${formData.time}</div>
    <div><strong>Guests:</strong> ${formData.guests} 명</div>
    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08);">
      <strong>Total:</strong> <span style="color: #b8936a; font-size: 16px;">${formatPrice(total)}</span>
    </div>
  `;
}

// ── FORM SUBMIT ───────────────────────────
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateCurrentStep(2)) return;

  const submitBtn  = document.getElementById('submitBtn');
  const submitText = document.getElementById('submitText');
  const spinner    = document.getElementById('submitSpinner');

  if (STRIPE_PUBLISHABLE_KEY === 'pk_test_YOUR_KEY_HERE') {
    simulateDemoSuccess();
    return;
  }

  // 실제 Stripe 결제 로직 (중략 - 기존 유지)
});

function showSuccess(paymentId) {
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  document.getElementById('step4').classList.add('active');
  document.querySelectorAll('.step-dot').forEach(d => d.classList.add('done'));

  if (paymentId) {
    document.getElementById('bookingRef').textContent = 'Booking ID: ' + paymentId.slice(-8).toUpperCase();
  }
}

function simulateDemoSuccess() {
  setTimeout(() => {
    showSuccess('DEMO_' + Math.random().toString(36).slice(2,10).toUpperCase());
  }, 1200);
}

function resetForm() {
  document.getElementById('bookingForm').reset();
  guestCount = 1;
  updateGuests();
  formData = {};
  goToStep(1);
}