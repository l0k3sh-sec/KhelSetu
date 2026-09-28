import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { 
  getAuth, RecaptchaVerifier, signInWithPhoneNumber, 
  sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCXWjlSbvOTQZj_u1ealCsh04nuPdFcp80",
  authDomain: "khelsetu-cb915.firebaseapp.com",
  projectId: "khelsetu-cb915",
  storageBucket: "khelsetu-cb915.firebasestorage.app",
  messagingSenderId: "671711161753",
  appId: "1:671711161753:web:5a091eb5f43bcf38753708"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let confirmationResultSession = null;
let resendInterval = null;

// --- SMART ROUTING FOR SCOUTS (Updated for Permissions) ---
async function routeScoutAfterLogin(user) {
  try {
    const docRef = doc(db, "scouts", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const scoutData = docSnap.data();
      
      // Check if they are verified by admin
      if (scoutData.verificationStatus === 'approved') {
        console.log("[KhelSetu] Verified scout. Routing to Dashboard.");
        window.location.href = "scout-dashboard.html";
      } else {
        // They are registered but not approved yet
        console.log("[KhelSetu] Scout pending verification.");
        showPendingLockScreen();
      }
    } else {
      console.log("[KhelSetu] New scout. Showing registration form.");
      document.getElementById('otpVerificationSection').classList.add('auth-hidden');
      document.getElementById('phoneEntrySection').classList.add('auth-hidden');
      document.getElementById('scoutRegistrationSection').classList.remove('auth-hidden');
    }
  } catch (error) {
    console.error("Routing error:", error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initAuthMethodToggle();
  setupFirebaseRecaptcha();
  setupOtpInputs();
  initVerificationUpload();

  document.getElementById('authForm').addEventListener('submit', handleSendOtp);
  document.getElementById('verifyForm').addEventListener('submit', handleVerifyOtp);
  document.getElementById('btnBackToPhone').addEventListener('click', showPhoneEntry);
  document.getElementById('btnResendOtp').addEventListener('click', handleSendOtp);
  document.getElementById('scoutRegistrationForm').addEventListener('submit', submitScoutRegistration);

  // Email Magic Link Handler
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = window.localStorage.getItem('emailForSignIn');
    if (!email) email = window.prompt('Please confirm your email address:');
    
    signInWithEmailLink(auth, email, window.location.href)
      .then(async (result) => {
        window.localStorage.removeItem('emailForSignIn');
        await routeScoutAfterLogin(result.user);
      })
      .catch((error) => alert("Link expired or invalid."));
  }
});

// --- NEW SCOUT REGISTRATION (Updated for Permissions) ---
async function submitScoutRegistration(e) {
  e.preventDefault();
  
  const orgName = document.getElementById('scoutOrgInput').value;
  const fileInput = document.getElementById('scoutDocInput');

  if (!orgName || fileInput.files.length === 0) {
    alert("Please enter your organization and select a document.");
    return;
  }

  const btn = document.getElementById('btnCompleteScoutReg');
  btn.disabled = true;
  btn.textContent = "Submitting...";

  try {
    const scoutData = {
      uid: auth.currentUser.uid,
      organization: orgName,
      verificationDocName: fileInput.files[0].name, 
      verificationStatus: "pending", // Locked by default
      metadata: {
        authMethod: auth.currentUser.email ? 'email' : 'phone',
        phone: auth.currentUser.phoneNumber || "",
        email: auth.currentUser.email || "",
        profileComplete: true,
        createdAt: new Date().toISOString()
      }
    };

    // Save to Firestore
    await setDoc(doc(db, "scouts", auth.currentUser.uid), scoutData);
    
    if (typeof KhelSetu !== 'undefined') {
      KhelSetu.saveSession({ role: 'scout', authComplete: true });
    }
    
    // Show the lock screen instead of giving dashboard access
    showPendingLockScreen();

  } catch (error) {
    console.error("Scout Registration Error:", error);
    alert("Failed to submit verification. Check console.");
    btn.disabled = false;
    btn.textContent = "Submit for Verification";
  }
}

// --- HELPER TO TRAP PENDING SCOUTS ---
function showPendingLockScreen() {
  // Hide everything else
  document.getElementById('phoneEntrySection').classList.add('auth-hidden');
  document.getElementById('otpVerificationSection').classList.add('auth-hidden');
  
  const regSection = document.getElementById('scoutRegistrationSection');
  regSection.classList.remove('auth-hidden');
  
  // Replace the registration form with a professional pending message
  regSection.innerHTML = `
    <div style="text-align: center; padding: 24px 0;">
      <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
      <h2 style="font-size: 20px; color: var(--text-heading); margin-bottom: 8px;">Verification Pending</h2>
      <p class="auth-subtitle" style="line-height: 1.6;">
        Your document has been submitted securely. KhelSetu admins will review your organization details and scout license within 24 hours.
      </p>
      <button class="btn-secondary" style="margin-top: 24px; width: 100%;" onclick="window.location.href='../index.html'">Return to Home</button>
    </div>
  `;
}

// --- UI & AUTH HELPERS ---
function initVerificationUpload() {
  const uploadBtn = document.getElementById('btnUploadVerificationDoc');
  const fileInput = document.getElementById('scoutDocInput');
  const fileNameLabel = document.getElementById('scoutDocFileName');

  if (!uploadBtn || !fileInput) return;
  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      fileNameLabel.textContent = `Selected: ${fileInput.files[0].name}`;
      uploadBtn.textContent = '\u2713 Document Uploaded';
      uploadBtn.classList.add('has-file');
    }
  });
}

function initAuthMethodToggle() {
  const btnPhone = document.getElementById('authTogglePhone');
  const btnEmail = document.getElementById('authToggleEmail');
  const phoneFields = document.getElementById('authPhoneFields');
  const emailFields = document.getElementById('authEmailFields');

  if (!btnPhone || !btnEmail) return;

  btnPhone.addEventListener('click', () => {
    btnPhone.classList.add('active');
    btnEmail.classList.remove('active');
    phoneFields.classList.remove('auth-hidden');
    emailFields.classList.add('auth-hidden');
  });

  btnEmail.addEventListener('click', () => {
    btnEmail.classList.add('active');
    btnPhone.classList.remove('active');
    emailFields.classList.remove('auth-hidden');
    phoneFields.classList.add('auth-hidden');
  });
}

function showOtpVerification(phone) {
  document.getElementById('phoneEntrySection').classList.add('auth-hidden');
  document.getElementById('otpVerificationSection').classList.remove('auth-hidden');
  document.getElementById('verifySubtitle').textContent = `Code sent to ${phone}`;
  startResendTimer();
}

function showPhoneEntry() {
  document.getElementById('otpVerificationSection').classList.add('auth-hidden');
  document.getElementById('phoneEntrySection').classList.remove('auth-hidden');
  clearInterval(resendInterval);
}

function setupFirebaseRecaptcha() {
  window.recaptchaVerifier = new RecaptchaVerifier(auth, 'btnSendOtp', { 'size': 'invisible' });
}

function handleSendOtp(e) {
  if (e) e.preventDefault();
  if (!document.getElementById('termsCheckbox').checked) return alert("Accept terms to proceed.");

  const isPhoneActive = document.getElementById('authTogglePhone').classList.contains('active');
  const btnSend = document.getElementById('btnSendOtp');
  btnSend.disabled = true;

  if (isPhoneActive) {
    const phone = `${document.getElementById('countryCodeSelect').value}${document.getElementById('phoneInput').value}`;
    if (document.getElementById('phoneInput').value.length < 10) { btnSend.disabled = false; return alert("Valid 10-digit number required."); }
    
    btnSend.textContent = "Sending...";
    signInWithPhoneNumber(auth, phone, window.recaptchaVerifier)
      .then((res) => {
        confirmationResultSession = res;
        btnSend.disabled = false;
        btnSend.textContent = "Send OTP";
        showOtpVerification(phone);
      })
      .catch((err) => { btnSend.disabled = false; btnSend.textContent = "Send OTP"; alert("Failed to send OTP."); });
  } else {
    const email = document.getElementById('emailInput').value;
    if (!email.includes('@')) { btnSend.disabled = false; return alert("Valid email required."); }

    btnSend.textContent = "Sending Link...";
    const actionCodeSettings = { url: window.location.origin + window.location.pathname, handleCodeInApp: true };
    sendSignInLinkToEmail(auth, email, actionCodeSettings)
      .then(() => {
        window.localStorage.setItem('emailForSignIn', email);
        btnSend.textContent = "Link Sent!";
        alert("Check your email to log in.");
        setTimeout(() => { btnSend.disabled = false; btnSend.textContent = "Send OTP"; }, 5000);
      })
      .catch((err) => { btnSend.disabled = false; btnSend.textContent = "Send OTP"; alert("Email failed."); });
  }
}

function handleVerifyOtp(e) {
  e.preventDefault();
  let otpValue = '';
  document.querySelectorAll('#otpInputGroup .otp-box').forEach(i => otpValue += i.value);
  if (otpValue.length < 6) return alert('Enter full 6-digit OTP');

  const btnVerify = document.getElementById('btnVerifyOtp');
  btnVerify.disabled = true;
  btnVerify.textContent = "Verifying...";

  confirmationResultSession.confirm(otpValue)
    .then(async (result) => await routeScoutAfterLogin(result.user))
    .catch((err) => { btnVerify.disabled = false; btnVerify.textContent = "VERIFY"; alert("Incorrect OTP."); });
}

function setupOtpInputs() {
  const inputs = document.querySelectorAll('#otpInputGroup .otp-box');
  inputs.forEach((input, index) => {
    input.addEventListener('input', (e) => { if (e.target.value && index < inputs.length - 1) inputs[index + 1].focus(); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !input.value && index > 0) inputs[index - 1].focus(); });
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
    timerEl.textContent = `Resend Code in 00:${String(seconds).padStart(2, '0')}`;
    if (seconds <= 0) { clearInterval(resendInterval); timerEl.textContent = ''; btn.disabled = false; }
  }, 1000);
}