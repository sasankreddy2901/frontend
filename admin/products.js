const token = localStorage.getItem("token");
const adminId = localStorage.getItem("userId");


// ➕ Add new product
document.getElementById("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData();
  formData.append("name", form.productName.value);
  formData.append("price", form.price.value);
  formData.append("description", form.description.value);
  formData.append("categoryId", form.categoryId.value);
  formData.append("adminId", adminId);

  const files = form.images.files;
  for (let file of files) {
    formData.append("images", file);
  }

  try {
    const res = await fetch("http://localhost:8080/admin/products/add", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });

    if (res.ok) {
      alert("✅ Product added!");
      form.reset();
      loadProducts();
    } else {
      const msg = await res.text();
      console.error("❌ Add failed:", msg);
      alert("❌ Failed to add product:\n" + msg);
    }
  } catch (err) {
    console.error("❌ Error adding product:", err);
    alert("❌ Error while adding product.");
  }
});


// 🔁 Load all products
async function loadProducts() {
  try {
    const res = await fetch("http://localhost:8080/admin/products/all", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const products = await res.json();

    const container = document.getElementById("productsContainer");
    container.innerHTML = "";

    if (products.length === 0) {
      container.innerHTML = `<p class="text-center text-muted">No products available.</p>`;
      return;
    }

    products.forEach(p => {
      const col = document.createElement("div");
      col.className = "col-md-4 mb-4";

      const imageUrl = (p.imagePaths && p.imagePaths.length)
        ? fixS3Url(p.imagePaths[0])
        : 'https://via.placeholder.com/400x300?text=No+Image';

      col.innerHTML = `
        <div class="card h-100 shadow-sm">
          <img src="${imageUrl}" class="card-img-top" alt="${p.productName}">
          <div class="card-body">
            <h5 class="card-title">${p.productName}</h5>
            <p class="text-muted mb-1">${p.categoryName || '—'}</p>
            <p class="fw-bold text-success">₹${p.price.toFixed(2)}</p>
            <p class="small">${p.description}</p>
            <div class="d-flex justify-content-between">
              <button class="btn btn-warning btn-sm" onclick="openEditModal(${p.productId})">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.productId})">Delete</button>
            </div>
          </div>
        </div>
      `;
      container.appendChild(col);
    });
  } catch (err) {
    console.error("❌ Error loading products:", err);
    document.getElementById("productsContainer").innerHTML =
      `<p class="text-center text-danger">Error loading products.</p>`;
  }
}

  
  // 🔽 Load categories into dropdown
  async function loadCategories() {
    try {
      const res = await fetch("http://localhost:8080/admin/categories/all", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const categories = await res.json();
  
      categorySelect.innerHTML = '<option value="">Select category</option>';
      categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat.categoryId;
        opt.textContent = cat.categoryType;
        categorySelect.appendChild(opt);
      });
    } catch (err) {
      console.error("❌ Error loading categories:", err);
      alert("Failed to load category list.");
    }
  }
  


  async function openEditModal(productId) {
    try {
      const res = await fetch(`http://localhost:8080/admin/products/get/${productId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const product = await res.json();
  
      document.getElementById("editProductId").value = product.productId;
      document.getElementById("editProductName").value = product.productName;
      document.getElementById("editPrice").value = product.price;
      document.getElementById("editDescription").value = product.description;
  
      const editCategorySelect = document.getElementById("editCategoryId");
      editCategorySelect.innerHTML = "";
  
      const categoryRes = await fetch("http://localhost:8080/admin/categories/all", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const categories = await categoryRes.json();
      categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat.categoryId;
        opt.textContent = cat.categoryType;
        if (cat.categoryId === product.categoryId) {
          opt.selected = true;
        }
        editCategorySelect.appendChild(opt);
      });
  
      const modal = new bootstrap.Modal(document.getElementById("editProductModal"));
      modal.show();
    } catch (err) {
      console.error("❌ Error opening edit modal:", err);
      alert("Failed to load product data.");
    }
  }
  

  async function deleteProduct(productId) {
    if (!confirm("Are you sure you want to delete this product?")) return;
  
    try {
      const res = await fetch(`http://localhost:8080/admin/products/delete/${productId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
  
      if (res.ok) {
        alert("🗑️ Product deleted.");
        loadProducts();
      } else {
        const msg = await res.text();
        alert("Failed to delete product:\n" + msg);
      }
    } catch (err) {
      console.error("❌ Delete error:", err);
      alert("Error deleting product.");
    }
  }
  
  
  
  document.getElementById("editProductForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const productId = form.editProductId.value;
  
    const formData = new FormData();
    formData.append("name", form.productName.value);
    formData.append("price", form.price.value);
    formData.append("description", form.description.value);
    formData.append("categoryId", form.categoryId.value);
    formData.append("adminId", adminId);
  
    if (form.images.files.length > 0) {
      for (let file of form.images.files) {
        formData.append("images", file);
      }
    }
  
    try {
      const res = await fetch(`http://localhost:8080/admin/products/update/${productId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
  
      if (res.ok) {
        alert("✅ Product updated!");
        const modal = bootstrap.Modal.getInstance(document.getElementById("editProductModal"));
        modal.hide();
        loadProducts();
      } else {
        const msg = await res.text();
        console.error("❌ Failed to update product:", msg);
        alert("Failed to update product:\n" + msg);
      }
    } catch (err) {
      console.error("❌ Edit error:", err);
      alert("Error updating product.");
    }
  });
  
  
  document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
    loadProducts();
  });
  