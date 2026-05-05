/* ─────────────────────────────────────────────
   CHOPSTICK WORKSHOP — script.js
   
   SETUP CHECKLIST:
   1. Replace STRIPE_PUBLISHABLE_KEY with your real key from dashboard.stripe.com
   2. Replace PRICE_PER_PERSON with your actual price in the smallest currency unit
      e.g. 5000 = ¥5,000 or $50.00
   3. Set up a backend endpoint (see BACKEND NOTES below) or use Stripe Checkout
   
   BACKEND NOTES:
   This frontend collects card details via Stripe Elements, then sends a
   PaymentIntent to your server. You need a small backend (Node/Python/etc.)
   that calls Stripe's API to create a PaymentIntent and return a client_secret.
   
   Quick options:
   - Netlify Functions / Vercel Functions (serverless, pairs well with GitHub Pages alternative)
   - GitHub Pages doesn't support server-side code — for serverless functions
     consider deploying to Vercel or Netlify instead, or use Stripe Checkout
     (no backend needed — redirect to Stripe's hosted page)
   
   See README.md for full setup guide.
───────────────────────────────────────────── */

// ── CONFIG (edit these) ────────────────────
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_KEY_HERE';
const PRICE_PER_PERSON       = 5000;   // in smallest currency unit (e.g. ¥5000)
const CURRENCY_SYMBOL        = '¥';
const CURRENCY_CODE          = 'jpy';  // ISO 4217 code
const BACKEND_URL            = '/api/create-payment-intent'; // your server endpoint
// ───────────────────────────────────────────

// ── STATE ──────────────────────────────────
let guestCount = 2;
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

// ── SET MINIMUM DATE (today) ───────────────
function setMinDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('sessionDate').min = today;
}

// ── GUEST COUNTER ──────────────────────────
function initGuestCounter() {
  document.getElementById('guestMinus').addEventListener('click', () => {
    if (guestCount > 2) { guestCount--; updateGuests(); }
  });
  document.getElementById('guestPlus').addEventListener('click', () => {
    if (guestCount < 8) { guestCount++; updateGuests(); }
  });
}

function updateGuests() {
  document.getElementById('guestCount').textContent = guestCount;
  document.getElementById('guestInput').value = guestCount;
  updatePriceDisplay();
}

// ── PRICE PREVIEW ──────────────────────────
function initPricePreview() {
  updatePriceDisplay();
}

function updatePriceDisplay() {
  const total = PRICE_PER_PERSON * guestCount;
  document.getElementById('priceTotal').textContent = formatPrice(total);
}

function formatPrice(amount) {
  // For JPY no decimals; for others divide by 100
  if (CURRENCY_CODE === 'jpy') {
    return CURRENCY_SYMBOL + amount.toLocaleString();
  }
  return CURRENCY_SYMBOL + (amount / 100).toFixed(2);
}

// ── STRIPE INIT ────────────────────────────
function initStripe() {
  if (STRIPE_PUBLISHABLE_KEY === 'pk_test_YOUR_KEY_HERE') {
    // Demo mode — show placeholder
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

  cardElement.on('focus', () => {
    document.querySelector('.stripe-input').classList.add('focused');
  });
  cardElement.on('blur', () => {
    document.querySelector('.stripe-input').classList.remove('focused');
  });
  cardElement.on('change', (e) => {
    const errorEl = document.getElementById('card-errors');
    errorEl.textContent = e.error ? e.error.message : '';
  });
}

// ── FORM STEP NAVIGATION ───────────────────
function goToStep(step) {
  if (step > 1 && !validateCurrentStep(step - 1)) return;

  // Hide all steps
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  // Show target step
  document.getElementById('step' + step).classList.add('active');

  // Update dots
  document.querySelectorAll('.step-dot').forEach((dot, i) => {
    dot.classList.remove('active', 'done');
    if (i + 1 === step)      dot.classList.add('active');
    else if (i + 1 < step)   dot.classList.add('done');
  });

  // If going to payment step, populate summary
  if (step === 3) populateSummary();

  // Scroll form into view on mobile
  document.getElementById('booking').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── VALIDATION ────────────────────────────
function validateCurrentStep(stepNum) {
  if (stepNum === 1) {
    const date = document.getElementById('sessionDate').value;
    const time = document.getElementById('sessionTime').value;
    if (!date) { alert('Please choose a date.'); return false; }
    if (!time) { alert('Please choose a time.'); return false; }
    formData.date  = date;
    formData.time  = time;
    formData.guests = guestCount;
  }

  if (stepNum === 2) {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName  = document.getElementById('lastName').value.trim();
    const email     = document.getElementById('email').value.trim();

    if (!firstName) { alert('Please enter your first name.'); return false; }
    if (!lastName)  { alert('Please enter your last name.'); return false; }
    if (!email || !email.includes('@')) { alert('Please enter a valid email address.'); return false; }

    formData.firstName = firstName;
    formData.lastName  = lastName;
    formData.email     = email;
    formData.phone     = document.getElementById('phone').value.trim();
    formData.notes     = document.getElementById('notes').value.trim();
  }

  return true;
}

// ── BOOKING SUMMARY ───────────────────────
function populateSummary() {
  const dateFormatted = new Date(formData.date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
  });
  const total = PRICE_PER_PERSON * guestCount;

  document.getElementById('bookingSummary').innerHTML = `
    <div><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</div>
    <div><strong>Date:</strong> ${dateFormatted}</div>
    <div><strong>Time:</strong> ${formatTime(formData.time)}</div>
    <div><strong>Guests:</strong> ${formData.guests}</div>
    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08);">
      <strong>Total:</strong> <span style="color: #b8936a; font-size: 16px;">${formatPrice(total)}</span>
    </div>
  `;
}

function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour   = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2,'0')} ${suffix}`;
}

// ── FORM SUBMIT (Stripe Payment) ───────────
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateCurrentStep(2)) return;

  const submitBtn  = document.getElementById('submitBtn');
  const submitText = document.getElementById('submitText');
  const spinner    = document.getElementById('submitSpinner');
  const errorEl   = document.getElementById('card-errors');

  // Demo mode (no Stripe key)
  if (STRIPE_PUBLISHABLE_KEY === 'pk_test_YOUR_KEY_HERE') {
    simulateDemoSuccess();
    return;
  }

  // Disable button, show spinner
  submitBtn.disabled = true;
  submitText.classList.add('hidden');
  spinner.classList.remove('hidden');
  errorEl.textContent = '';

  try {
    // 1. Ask your backend to create a PaymentIntent
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount:   PRICE_PER_PERSON * formData.guests,
        currency: CURRENCY_CODE,
        metadata: {
          name:   `${formData.firstName} ${formData.lastName}`,
          email:  formData.email,
          date:   formData.date,
          time:   formData.time,
          guests: formData.guests,
          notes:  formData.notes || '',
        }
      })
    });

    const { clientSecret } = await res.json();

    // 2. Confirm the payment
    const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name:  `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone || undefined,
        }
      }
    });

    if (error) {
      errorEl.textContent = error.message;
      submitBtn.disabled = false;
      submitText.classList.remove('hidden');
      spinner.classList.add('hidden');
      return;
    }

    if (paymentIntent.status === 'succeeded') {
      showSuccess(paymentIntent.id);
    }

  } catch (err) {
    errorEl.textContent = 'Something went wrong. Please try again.';
    console.error(err);
    submitBtn.disabled = false;
    submitText.classList.remove('hidden');
    spinner.classList.add('hidden');
  }
});

// ── SUCCESS STATE ─────────────────────────
function showSuccess(paymentId) {
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  document.getElementById('step4').classList.add('active');
  document.querySelectorAll('.step-dot').forEach(d => d.classList.add('done'));

  if (paymentId) {
    document.getElementById('bookingRef').textContent = 'Booking ID: ' + paymentId.slice(-8).toUpperCase();
  }
}

function simulateDemoSuccess() {
  // For demo / testing without a real Stripe key
  setTimeout(() => {
    showSuccess('DEMO_' + Math.random().toString(36).slice(2,10).toUpperCase());
  }, 1200);
}

// ── RESET ─────────────────────────────────
function resetForm() {
  document.getElementById('bookingForm').reset();
  guestCount = 2;
  updateGuests();
  formData = {};
  goToStep(1);
  document.querySelectorAll('.step-dot').forEach((dot, i) => {
    dot.classList.remove('active', 'done');
    if (i === 0) dot.classList.add('active');
  });
}