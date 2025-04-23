const BASE_API_URL = "https://kapilagroshopnew.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const checkModalLoaded = setInterval(() => {
    const phoneInput = document.getElementById('loginPhone');
    const sendOtpBtn = document.getElementById('loginSendOtpBtn');
    const otpSection = document.getElementById('loginOtpSection');
    const loginBtn = document.getElementById('loginSubmitBtn');
    const messageBox = document.getElementById('loginMessage');
    const loginForm = document.getElementById('loginForm');

    if (phoneInput && sendOtpBtn && otpSection && loginBtn && messageBox && loginForm) {
      clearInterval(checkModalLoaded);
      bindLoginEvents();
    }
  }, 100);
});

function bindLoginEvents() {
  const phoneInput = document.getElementById('loginPhone');
  const sendOtpBtn = document.getElementById('loginSendOtpBtn');
  const otpSection = document.getElementById('loginOtpSection');
  const loginBtn = document.getElementById('loginSubmitBtn');
  const messageBox = document.getElementById('loginMessage');
  const loginForm = document.getElementById('loginForm');

  let tempPhone = '';

  sendOtpBtn.addEventListener('click', async () => {
    const rawPhone = phoneInput.value.trim();
    const phone = rawPhone.startsWith('+91') ? rawPhone : `+91${rawPhone}`;

    if (!rawPhone) return showMessage('Phone number is required.', 'danger');
    if (phone.length !== 13 || !/^\+91\d{10}$/.test(phone)) return showMessage('Please enter a valid 10-digit phone number.', 'danger');

    otpSection.style.display = 'none';
    loginBtn.style.display = 'none';

    try {
      const res = await fetch(`${BASE_API_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNo: phone })
      });

      const result = await res.text();

      if (result.includes('User not found')) {
        showMessage(result + ' Redirecting to register...', 'danger');
        setTimeout(() => {
          window.location.href = '../Register/register.html';
        }, 2000);
      } else {
        showMessage(result, 'success');
        otpSection.style.display = 'block';
        loginBtn.style.display = 'block';
        tempPhone = phone;
      }
    } catch {
      showMessage('Something went wrong. Try again.', 'danger');
    }
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const otp = document.getElementById('loginOtp').value.trim();
    if (!otp) return showMessage('Please enter the OTP.', 'danger');

    try {
      const res = await fetch(`${BASE_API_URL}/user/verify-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNo: tempPhone, otp: otp })
      });

      const result = await res.json(); //except json response.

      
      if (result.token && result.userId) {
        
      // ✅ Save JWT and user info to localStorage
      localStorage.setItem("token", result.token);
      localStorage.setItem("userId", result.userId);
      localStorage.setItem("userName", result.name);
      localStorage.setItem("role", result.role);

       
      showMessage("Login successful! Redirecting...", 'success');

      setTimeout(() => window.location.href = '../home/home.html', 2000);
    } else {
      showMessage("Login failed. Please try again.", 'danger');
    }
  } catch (err) {
    console.error("Login error:", err);
    showMessage('Error verifying OTP. Try again.', 'danger');
  }
});

  function showMessage(msg, type) {
    if (messageBox) {
      messageBox.className = `message text-${type}`;
      messageBox.textContent = msg;
    }
  }
}
