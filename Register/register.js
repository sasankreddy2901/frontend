const BASE_API_URL = "https://kapilagroshopnew.onrender.com";

const phoneInput = document.getElementById('phone');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const otpSection = document.getElementById('otpSection');
const registerBtn = document.getElementById('registerBtn');
const messageBox = document.getElementById('registerMessage');
const registerForm = document.getElementById('registerForm');

let tempName = '';
let tempEmail = '';
let tempPhone = '';

sendOtpBtn.addEventListener('click', async () => {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const rawPhone = phoneInput.value.trim();
  const phone = rawPhone.startsWith('+91') ? rawPhone : `+91${rawPhone}`;

  if (!name || !rawPhone) {
    showMessage('Name and phone are required.', 'danger');
    return;
  }

  if (phone.length !== 13 || !/^\+91\d{10}$/.test(phone)) {
    showMessage('Please enter a valid 10-digit phone number.', 'danger');
    return;
  }

  const payload = { name, email, phoneNo: phone };

  try {
    const res = await fetch(`${BASE_API_URL}/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.text();

    if (result.includes('User already registered')) {
      showMessage(result + ' Redirecting to login...', 'danger');
      setTimeout(() => {
        window.location.href = '../home/home.html';
      }, 2000);
    } else {
      showMessage(result, 'success');
      otpSection.style.display = 'block';
      registerBtn.style.display = 'block';

      // Store values temporarily for verification
      tempName = name;
      tempEmail = email;
      tempPhone = phone;
    }
  } catch (err) {
    showMessage('Something went wrong. Try again.', 'danger');
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const otp = document.getElementById('otp').value.trim();

  if (!otp) {
    showMessage('Please enter the OTP.', 'danger');
    return;
  }

  const payload = {
    name: tempName,
    email: tempEmail,
    phoneNo: tempPhone,
    otp: otp
  };

  try {
    const res = await fetch(`${BASE_API_URL}/user/verify-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.text();

    if (result.includes('successful')) {
      showMessage(result + ' Redirecting to login...', 'success');
      setTimeout(() => {
        window.location.href = '../home/home.html';
      }, 2000);
    } else {
      showMessage(result, 'danger');
    }
  } catch (err) {
    showMessage('Error verifying OTP. Try again.', 'danger');
  }
});

function showMessage(msg, type) {
  messageBox.className = `message text-${type}`;
  messageBox.textContent = msg;
}


