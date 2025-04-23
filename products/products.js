const BASE_API_URL = "https://kapilagroshopnew.onrender.com";

const productContainer = document.getElementById('productContainer');
const paginationContainer = document.getElementById('productPagination');
const categoryTitle = document.getElementById('categoryTitle');

const urlParams = new URLSearchParams(window.location.search);
const categoryId = urlParams.get('categoryId');
const productPageSize = 9;
let currentProductPage = 0;

document.addEventListener('DOMContentLoaded', () => {
  if (!categoryId) {
    productContainer.innerHTML = `<p class="text-center text-danger">Category ID missing. Please go back.</p>`;
    return;
  }

  loadProductPage(currentProductPage);
});

async function loadProductPage(page) {
  try {
    const res = await fetch(`${BASE_API_URL}/user/products/paged/category/${categoryId}?page=${page}&size=${productPageSize}`);
    const products = await res.json();

    productContainer.innerHTML = '';

    if (!products.length) {
      productContainer.innerHTML = `<p class="text-center text-muted">No products found in this category.</p>`;
      paginationContainer.innerHTML = '';
      return;
    }

    categoryTitle.textContent = `Products in ${products[0].categoryType || 'Selected Category'}`;

    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'col-md-4 mb-4';
      const imageUrl = product.images?.[0]?.url?.replace("s3://agrobckt/", "https://agrobckt.s3.amazonaws.com/")
        || "https://via.placeholder.com/300x200?text=No+Image";
      
      card.innerHTML = `
        <div class="card h-100">
          <img src="${imageUrl}" class="card-img-top" alt="${product.productName}">
          <div class="card-body">
            <h5 class="card-title">${product.productName}</h5>
            <p class="product-price">₹${product.price.toFixed(2)}</p>
            <button class="btn btn-cart" onclick="addToCart(${product.productId})">Add to Cart</button>
          </div>
        </div>
      `;

      productContainer.appendChild(card);
    });

    renderProductPaginationControls(page, products.length < productPageSize);

  } catch (err) {
    productContainer.innerHTML = `<p class="text-center text-danger">Error loading products. Try again later.</p>`;
    console.error(err);
  }
}

function renderProductPaginationControls(page, isLastPage) {
  paginationContainer.innerHTML = '';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'btn btn-outline-success mx-2';
  prevBtn.textContent = 'Previous';
  prevBtn.disabled = page === 0;
  prevBtn.onclick = () => {
    currentProductPage--;
    loadProductPage(currentProductPage);
  };

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn-outline-success mx-2';
  nextBtn.textContent = 'Next';
  nextBtn.disabled = isLastPage;
  nextBtn.onclick = () => {
    currentProductPage++;
    loadProductPage(currentProductPage);
  };

  paginationContainer.appendChild(prevBtn);
  paginationContainer.appendChild(nextBtn);
}



async function updateCartCount(userId) {
  const token = localStorage.getItem("token");

  if (!userId || !token) {
    console.warn("User not logged in or token missing");
    return;
  }

  try {
    const res = await fetch(`${BASE_API_URL}/user/cart/${userId}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error("Failed to fetch cart");
    }

    const items = await res.json();

    const badge = document.getElementById("cartCountBadge");
    if (badge) {
      badge.textContent = items.length;
      badge.style.display = items.length > 0 ? 'inline-block' : 'none';
    }
  } catch (err) {
    console.error("❌ Failed to update cart count:", err.message);
  }
}


async function addToCart(productId) {
  // Check if user is logged in
  const userId = localStorage.getItem("userId");
  const token =  localStorage.getItem("token");

  console.log("User ID:", userId);
  console.log("Token:", token);
  if (!userId || !token) {
    alert("Please log in to add items to your cart.");
    return;
  }

  try {
    const response = await fetch(`${BASE_API_URL}/user/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: userId,
        productId: productId,
        quantity: 1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error("❌ " + errorText);
      }

    const result = await response.text();
    alert(result);

    // Update cart count
    updateCartCount(userId);
  } catch (err) {
    console.error(err);
    alert("Failed to add item to cart");
  }
}

