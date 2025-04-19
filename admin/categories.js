const categoryForm = document.getElementById('categoryForm');
const categoriesTableBody = document.querySelector('#categoriesTable tbody');
const adminId = localStorage.getItem('userId');
const token = localStorage.getItem('token');

// 🔁 Load categories on page load
document.addEventListener('DOMContentLoaded', loadCategories);

// 🚀 Load all categories
async function loadCategories() {
  try {
    const res = await fetch("http://localhost:8080/admin/categories/all", {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const categories = await res.json();
    const container = document.getElementById("categoriesContainer");
    container.innerHTML = "";

    if (!categories.length) {
      container.innerHTML = `<p class="text-muted text-center">No categories found.</p>`;
      return;
    }

    categories.forEach(cat => {
      const col = document.createElement("div");
      col.className = "col-md-4 mb-4";

      const img = fixS3Url(cat.categoryImagePath);

      col.innerHTML = `
        <div class="card h-100 shadow-sm">
          <img src="${img}" class="card-img-top" alt="${cat.categoryType}" style="height: 200px; object-fit: cover;">
          <div class="card-body">
            <h5 class="card-title">${cat.categoryType}</h5>
            <div class="d-flex justify-content-between">
              <button class="btn btn-warning btn-sm" onclick="openEditModal(${cat.categoryId}, '${cat.categoryType}')">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteCategory(${cat.categoryId})">Delete</button>
            </div>
          </div>
        </div>
      `;

      container.appendChild(col);
    });

  } catch (err) {
    console.error("❌ Failed to load categories:", err);
    document.getElementById("categoriesContainer").innerHTML =
      `<p class="text-danger text-center">Failed to load categories. Try again.</p>`;
  }
}

// 📤 Handle category add form
categoryForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(categoryForm);
  formData.append('adminId', adminId);

  try {
    const res = await fetch('http://localhost:8080/admin/categories/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const result = await res.text();
    alert('✅ Category added!');
    categoryForm.reset();
    loadCategories();
  } catch (err) {
    console.error('❌ Error adding category:', err);
    alert('Failed to add category. Try again.');
  }
});

// ❌ Delete category
async function deleteCategory(categoryId) {
  if (!confirm('Are you sure you want to delete this category?')) return;

  try {
    const res = await fetch(`http://localhost:8080/admin/categories/delete/${categoryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      alert('🗑️ Category deleted.');
      loadCategories();
    } else {
      alert('Failed to delete category.');
    }
  } catch (err) {
    console.error('❌ Delete error:', err);
    alert('Error deleting category.');
  }
}

// 🪄 Convert S3 URI to HTTP
function fixS3Url(path) {
  if (path.startsWith('s3://')) {
    const parts = path.replace('s3://', '').split('/');
    const bucket = parts.shift();
    return `https://${bucket}.s3.ap-south-1.amazonaws.com/${parts.join('/')}`;
  }
  return path;
}

// ✏️ Open modal with data
function openEditModal(categoryId, categoryType) {
  document.getElementById('editCategoryId').value = categoryId;
  document.getElementById('editCategoryType').value = categoryType;

  const modal = new bootstrap.Modal(document.getElementById('editCategoryModal'));
  modal.show();
}

// ✅ Handle edit form submit
document.getElementById('editCategoryForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const categoryId = form.categoryId.value;
  const categoryType = form.categoryType.value;
  const image = form.categoryImage.files[0];

  const formData = new FormData();
  formData.append("categoryType", categoryType);
  formData.append("adminId", adminId);
  if (image) formData.append("categoryImage", image);

  try {
    const res = await fetch(`http://localhost:8080/admin/categories/update/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (res.ok) {
      alert('✅ Category updated!');
      const modal = bootstrap.Modal.getInstance(document.getElementById('editCategoryModal'));
      modal.hide();
      loadCategories();
    } else {
      alert('Failed to update category.');
    }
  } catch (err) {
    console.error("❌ Edit error:", err);
    alert('Error updating category.');
  }
});
