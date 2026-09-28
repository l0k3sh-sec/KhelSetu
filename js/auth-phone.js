// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCXWjlSbvOTQZj_u1ealCsh04nuPdFcp80",
  authDomain: "khelsetu-cb915.firebaseapp.com",
  projectId: "khelsetu-cb915",
  storageBucket: "khelsetu-cb915.firebasestorage.app",
  messagingSenderId: "671711161753",
  appId: "1:671711161753:web:5a091eb5f43bcf38753708"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables
let confirmationResultSession = null;
let resendInterval = null;

// --- SMART ROUTING LOGIC ---
async function routeUserAfterLogin(user) {
  try {
    const docRef = doc(db, "athletes", user.uid);
    const docSnap = await getDoc(docRef);

    // If document exists and the profile was completed, route to dashboard
    if (docSnap.exists() && docSnap.data().metadata?.profileComplete) {
      console.log("[KhelSetu] Existing profile found. Routing to Dashboard.");
      if (typeof KhelSetu !== 'undefined') {
        KhelSetu.saveSession({ authComplete: true, role: 'athlete' });
        KhelSetu.navigate('athlete-dashboard.html');
      } else {
        window.location.href = "athlete-dashboard.html";
      }
    } else {
      // New user, send to onboarding
      console.log("[KhelSetu] New user. Routing to Onboarding.");
      if (typeof KhelSetu !== 'undefined') {
        KhelSetu.saveSession({ authComplete: true, role: 'athlete' });
        KhelSetu.navigate('auth-onboarding.html');
      } else {
        window.location.href = "auth-onboarding.html";
      }
    }
  } catch (error) {
    console.error("Error checking profile status:", error);
    window.location.href = "auth-onboarding.html"; // Safe fallback
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initAuthMethodToggle();
  setupFirebaseRecaptcha();
  setupOtpInputs();

  document.getElementById('authForm').addEventListener('submit', handleSendOtp);
  document.getElementById('verifyForm').addEventListener('submit', handleVerifyOtp);
  document.getElementById('btnBackToPhone').addEventListener('click', showPhoneEntry);
  document.getElementById('btnResendOtp').addEventListener('click', handleSendOtp);

  // --- EMAIL MAGIC LINK CHECKER ---
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      email = window.prompt('Please confirm your email address to log in:');
    }
    
    signInWithEmailLink(auth, email, window.location.href)
      .then(async (result) => {
        window.localStorage.removeItem('emailForSignIn');
        const btnVerify = document.getElementById('btnVerifyOtp'); // visual feedback
        if(btnVerify) btnVerify.textContent = "Loading Profile...";
        await routeUserAfterLogin(result.user);
      })
      .catch((error) => {
        console.error("Error signing in with email link", error);
        alert("This login link has expired or is invalid. Please try sending a new one.");
      });
  }
});

// --- UI Toggles ---
function initAuthMethodToggle() {
  const btnPhone = document.getElementById('authTogglePhone');
  const btnEmail = document.getElementById('authToggleEmail');
  const phoneFields = document.getElementById('authPhoneFields');
  const emailFields = document.getElementById('authEmailFields');

  if (!btnPhone || !btnEmail) return;

  btnPhone.addEventListener('click', () => {
    btnPhone.classList.add('active');
    btnPhone.setAttribute('aria-selected', 'true');
    btnEmail.classList.remove('active');
    btnEmail.setAttribute('aria-selected', 'false');
    phoneFields.classList.remove('auth-hidden');
    emailFields.classList.add('auth-hidden');
  });

  btnEmail.addEventListener('click', () => {
    btnEmail.classList.add('active');
    btnEmail.setAttribute('aria-selected', 'true');
    btnPhone.classList.remove('active');
    btnPhone.setAttribute('aria-selected', 'false');
    emailFields.classList.remove('auth-hidden');
    phoneFields.classList.add('auth-hidden');
  });
}

function showOtpVerification(phoneNumber) {
  document.getElementById('phoneEntrySection').classList.add('auth-hidden');
  document.getElementById('otpVerificationSection').classList.remove('auth-hidden');
  document.getElementById('verifySubtitle').textContent = `Code sent to ${phoneNumber}`;
  startResendTimer();
}

function showPhoneEntry() {
  document.getElementById('otpVerificationSection').classList.add('auth-hidden');
  document.getElementById('phoneEntrySection').classList.remove('auth-hidden');
  clearInterval(resendInterval);
}

// --- Firebase Auth Logic ---
function setupFirebaseRecaptcha() {
  window.recaptchaVerifier = new RecaptchaVerifier(auth, 'btnSendOtp', {
    'size': 'invisible',
    'callback': (response) => {
      // reCAPTCHA solved
    }
  });
}

function handleSendOtp(e) {
  if (e) e.preventDefault();

  const isPhoneActive = document.getElementById('authTogglePhone').classList.contains('active');
  const termsAccepted = document.getElementById('termsCheckbox').checked;

  if (!termsAccepted) {
    alert("Please accept the terms to proceed.");
    return;
  }

  if (isPhoneActive) {
    const countryCode = document.getElementById('countryCodeSelect').value;
    const phone = document.getElementById('phoneInput').value;
    const fullPhoneNumber = `${countryCode}${phone}`;

    if (!phone || phone.length < 10) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    const btnSend = document.getElementById('btnSendOtp');
    btnSend.disabled = true;
    btnSend.textContent = "Sending...";

    signInWithPhoneNumber(auth, fullPhoneNumber, window.recaptchaVerifier)
      .then((confirmationResult) => {
        confirmationResultSession = confirmationResult;
        btnSend.disabled = false;
        btnSend.textContent = "Send OTP";
        
        if (typeof KhelSetu !== 'undefined') {
          KhelSetu.saveSession({
            role: 'athlete',
            user: { ...KhelSetu.getSession().user, phone: fullPhoneNumber }
          });
        }
        showOtpVerification(fullPhoneNumber);
      })
      .catch((error) => {
        console.error("Error during signInWithPhoneNumber:", error);
        btnSend.disabled = false;
        btnSend.textContent = "Send OTP";
        alert("Failed to send OTP. Ensure the number is correct and you aren't spamming requests.");
      });
  } else {
    const email = document.getElementById('emailInput').value;
    
    if (!email || !email.includes('@')) {
      alert("Please enter a valid email address");
      return;
    }

    const btnSend = document.getElementById('btnSendOtp');
    btnSend.disabled = true;
    btnSend.textContent = "Sending Link...";

    const actionCodeSettings = {
      url: window.location.origin + window.location.pathname, 
      handleCodeInApp: true
    };

    sendSignInLinkToEmail(auth, email, actionCodeSettings)
      .then(() => {
        window.localStorage.setItem('emailForSignIn', email);
        btnSend.textContent = "Link Sent!";
        alert("Magic link sent! Check your email inbox (and spam folder) to log in.");
        setTimeout(() => {
          btnSend.disabled = false;
          btnSend.textContent = "Send OTP";
        }, 5000);
      })
      .catch((error) => {
        console.error("Error sending email link:", error);
        btnSend.disabled = false;
        btnSend.textContent = "Send OTP";
        alert("Failed to send email. Ensure you have enabled Email Link auth in the Firebase console.");
      });
  }
}

function handleVerifyOtp(e) {
  e.preventDefault();
  
  const container = document.getElementById('otpInputGroup');
  const inputs = container.querySelectorAll('.otp-box');
  let otpValue = '';
  inputs.forEach(input => otpValue += input.value);

  if (otpValue.length < 6) {
    alert('Please enter the full 6-digit OTP');
    return;
  }

  const btnVerify = document.getElementById('btnVerifyOtp');
  btnVerify.disabled = true;
  btnVerify.textContent = "Verifying...";

  confirmationResultSession.confirm(otpValue)
    .then(async (result) => {
      // Pass the user to the new router instead of hardcoding the onboarding redirect
      await routeUserAfterLogin(result.user);
    })
    .catch((error) => {
      console.error("OTP Verification failed", error);
      btnVerify.disabled = false;
      btnVerify.textContent = "VERIFY";
      alert("Incorrect OTP. Please try again.");
    });
}

// --- OTP Input UI UX ---
function setupOtpInputs() {
  const container = document.getElementById('otpInputGroup');
  if (!container) return;
  const inputs = container.querySelectorAll('.otp-box');

  inputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      const value = e.target.value;
      if (value && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && index > 0) {
        inputs[index - 1].focus();
      }
    });
  });
}

function startResendTimer() {
  const timerEl = document.getElementById('resendTimer');
  const btn = document.getElementById('btnResendOtp');
  let seconds = 28;

  btn.disabled = true;

  clearInterval(resendInterval);
  resendInterval = setInterval(() => {
    seconds--;
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    timerEl.textContent = `Resend Code in ${m}:${s}`;

    if (seconds <= 0) {
      clearInterval(resendInterval);
      timerEl.textContent = '';
      btn.disabled = false;
    }
  }, 1000);
}