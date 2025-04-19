const form = document.getElementById("addAdminForm");
const messageBox = document.getElementById("messageBox");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("adminName").value.trim();
  const email = document.getElementById("adminEmail").value.trim();
  const rawPhone = document.getElementById("adminPhone").value.trim();
const phoneNo = rawPhone.startsWith("+91") ? rawPhone : `+91${rawPhone}`;

  const token = localStorage.getItem("token");

  if (!token) {
    showMessage("You must be logged in as an admin to perform this action.", "danger");
    return;
  }

  const payload = {
    name,
    email,
    phoneNo
  };

  try {
    const res = await fetch("http://localhost:8080/admin/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const msg = await res.text();

    if (res.ok) {
      showMessage("✅ Admin created successfully!", "success");
      form.reset();
    } else {
      showMessage("❌ " + msg, "danger");
    }
  } catch (err) {
    console.error("Error:", err);
    showMessage("❌ Something went wrong.", "danger");
  }
});

function showMessage(msg, type) {
  messageBox.className = `text-${type}`;
  messageBox.textContent = msg;
}
