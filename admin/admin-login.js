const phoneInput = document.getElementById('phone');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const otpSection = document.getElementById('otpSection');
const loginBtn = document.getElementById('loginBtn');
const messageBox = document.getElementById('message');
const loginForm = document.getElementById('adminLoginForm');

let tempPhone = '';

// 📲 Step 1: Send OTP
sendOtpBtn.addEventListener('click', async () => {
  const rawPhone = phoneInput.value.trim();
  const phone = rawPhone.startsWith('+91') ? rawPhone : `+91${rawPhone}`;

  if (!/^\+91\d{10}$/.test(phone)) {
    showMessage('Please enter a valid 10-digit phone number.', 'danger');
    return;
  }

  try {
    const res = await fetch('http://localhost:8080/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNo: phone })
    });

    const result = await res.text();
    console.log("🔁 OTP Send Result:", result);

    if (result.includes('User not found')) {
      showMessage('Not an admin. Please contact support.', 'danger');
    } else {
      showMessage('OTP sent. Enter to proceed.', 'success');
      tempPhone = phone;
      otpSection.style.display = 'block';
    }
  } catch (err) {
    console.error("⚠️ Error sending OTP:", err);
    showMessage('Something went wrong. Try again.', 'danger');
  }
});

// 🔐 Step 2: Verify OTP and login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const otp = document.getElementById('otp').value.trim();

  try {
    const res = await fetch('http://localhost:8080/admin/verify-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNo: tempPhone, otp: otp })
    });

    if (!res.ok) {
      const errMsg = await res.text();
      throw new Error(errMsg);
    }

    const result = await res.json(); // JwtLoginResponse
    console.log("✅ JWT Login Response:", result);

    if (result.role !== 'ADMIN') {
      showMessage("Access denied. Not an admin.", 'danger');
      return;
    }

    // ✅ Save session info
    localStorage.setItem("userId", result.userId);
    localStorage.setItem("role", result.role);
    localStorage.setItem("userName", result.name);
    localStorage.setItem("token", result.token);

    showMessage("Login successful. Redirecting...", 'success');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);

  } catch (err) {
    console.error("⚠️ OTP verification failed:", err);
    showMessage("OTP verification failed. See console.", 'danger');
  }
});

// 📢 Helper to show status messages
function showMessage(msg, type) {
  messageBox.className = `text-${type} fw-semibold`;
  messageBox.textContent = msg;
}
