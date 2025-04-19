document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    const adminsContainer = document.getElementById("adminsContainer");
  
    if (!token) {
      adminsContainer.innerHTML = `<p class="text-danger">You must be logged in as an admin to view this.</p>`;
      return;
    }
  
    try {
      const res = await fetch("http://localhost:8080/admin/list", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
  
      if (!res.ok) {
        throw new Error("Failed to fetch admins");
      }
  
      const admins = await res.json();
  
      if (!admins.length) {
        adminsContainer.innerHTML = `<p class="text-muted">No admins found.</p>`;
        return;
      }
  
      adminsContainer.innerHTML = admins.map(admin => `
        <div class="col-md-4 admin-card" data-user-id="${admin.userId}">
          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title">${admin.name}</h5>
              <p class="card-text mb-1"><strong>Email:</strong> ${admin.email}</p>
              <p class="card-text mb-1"><strong>Phone:</strong> ${admin.phoneNo}</p>
              <div class="d-flex justify-content-end">
                <button class="btn btn-sm btn-danger" onclick="deleteAdmin('${admin.userId}')">Delete</button>
              </div>
            </div>
          </div>
        </div>
      `).join("");
      
  
    } catch (err) {
      console.error("❌ Error loading admins:", err);
      adminsContainer.innerHTML = `<p class="text-danger">Something went wrong.</p>`;
    }
  });
  

//search functionality
  document.getElementById("searchInput").addEventListener("input", function () {
    const query = this.value.toLowerCase();
    document.querySelectorAll(".admin-card").forEach(card => {
      const content = card.textContent.toLowerCase();
      card.style.display = content.includes(query) ? "block" : "none";
    });
  });
  
//   delete admin functionality
async function deleteAdmin(userId) {
    const token = localStorage.getItem("token");
  
    if (!confirm("Are you sure you want to delete this admin?")) return;
  
    try {
      const res = await fetch(`http://localhost:8080/admin/delete/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
  
      const result = await res.text();
  
      if (res.ok) {
        alert("✅ Admin deleted successfully!");
        // Refresh the list
        location.reload(); // or call loadAdmins() if abstracted
      } else {
        alert("❌ " + result);
      }
    } catch (err) {
      console.error("Error deleting admin:", err);
      alert("Something went wrong while deleting the admin.");
    }
  }

//   load all admins
document.addEventListener("DOMContentLoaded", loadAdmins);
