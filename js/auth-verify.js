// Screen 2: OTP Verification (auth-verify.js)

document.addEventListener('DOMContentLoaded', () => {
  loadPhoneFromSession();
  setupOtpInputs();
  startResendTimer();
});

function loadPhoneFromSession() {
  const session = KhelSetu.getSession();
  const phone = session.user && session.user.phone;
  if (phone) {
    document.getElementById('verifySubtitle').textContent = `Code sent to ${phone}`;
  }
}

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

function verifyOtp() {
  const container = document.getElementById('otpInputGroup');
  const inputs = container.querySelectorAll('.otp-box');
  let otpValue = '';
  inputs.forEach(input => otpValue += input.value);

  if (otpValue.length < 6) {
    console.warn('[KhelSetu] Please enter the full 6-digit OTP');
    return;
  }

  console.log(`[KhelSetu] Verifying OTP: ${otpValue}`);

  KhelSetu.saveSession({ authComplete: true });
  KhelSetu.navigate('auth-onboarding.html');
}

let resendInterval = null;

function startResendTimer() {
  const timerEl = document.getElementById('resendTimer');
  const btn = document.getElementById('btnResendOtp');
  let seconds = 28;

  btn.disabled = true;

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

function resendOtpCode() {
  console.log('[KhelSetu] Resending OTP code...');
  startResendTimer();
}
