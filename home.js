import BASE_API_URL from '../frontend/config/config'

let currentPage = 0;
const pageSize = 6;

async function fetchCategories(page) {
  const container = document.getElementById('categoryContainer');
  const pagination = document.getElementById('categoryPagination');

  try {
    const res = await fetch(`${BASE_API_URL}/user/categories/paged?page=${page}&size=${pageSize}`);
    const categories = await res.json();

    container.innerHTML = '';

    if (!categories.length) {
      container.innerHTML = `<p class="text-center text-muted">No categories available.</p>`;
      pagination.innerHTML = '';
      return;
    }

    // 🧱 Render category cards
    categories.forEach(category => {
      const card = document.createElement('div');
      card.className = 'col-md-4 mb-4';
      card.innerHTML = `
        <div class="card h-100">
          <img src="${category.categoryImagePath}" class="card-img-top" alt="${category.categoryType}">
          <div class="card-body">
            <h5 class="card-title">${category.categoryType}</h5>
            <a href="../products/products.html?categoryId=${category.categoryId}" class="btn btn-view">View Products</a>
          </div>
        </div>`;
      container.appendChild(card);
    });

    // 🎯 Add Prev/Next buttons
    pagination.innerHTML = `
      <button class="btn btn-outline-success me-2" ${page === 0 ? 'disabled' : ''} onclick="changePage(${page - 1})">⬅ Prev</button>
      <button class="btn btn-outline-success" ${categories.length < pageSize ? 'disabled' : ''} onclick="changePage(${page + 1})">Next ➡</button>
    `;
  } catch (err) {
    container.innerHTML = `<p class="text-center text-danger">Failed to load categories.</p>`;
    console.error(err);
  }
}

// 🔄 Called when buttons are clicked
function changePage(newPage) {
  currentPage = newPage;
  fetchCategories(currentPage);
}

// 🚀 Initial call
document.addEventListener('DOMContentLoaded', () => {
  fetchCategories(currentPage);
});
