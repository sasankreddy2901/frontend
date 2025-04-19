// code for the cart icon in the navbar

function toggleCart() {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  if (!userId || !token) {
    alert("Please log in to view your cart.");
    return;
  }

  const modal = document.getElementById("cartModal");
  modal.style.display = "flex";

  const cartContainer = document.getElementById("cartItemsContainer");
  const cartTotal = document.getElementById("cartTotalAmount");
  cartContainer.innerHTML = "";
  cartTotal.textContent = "0.00";

  fetch(`http://localhost:8080/user/cart/${userId}`, {
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  })
    .then(res => {
      if (!res.ok) {
        throw new Error("Failed to load cart");
      }
      return res.json();
    })
    .then(cartItems => {
      let total = 0;

      if (!cartItems.length) {
        cartContainer.innerHTML = `<p class="text-muted text-center">Your cart is empty.</p>`;
        return;
      }


      cartItems.forEach(item => {
        const product = item.product;
        const imageUrl = product.images?.[0]?.url?.replace("s3://agrobckt/", "https://agrobckt.s3.amazonaws.com/")
          || "https://via.placeholder.com/300x200?text=No+Image";
        const subtotal = product.price * item.quantity;
        total += subtotal;

        const card = document.createElement('div');
        card.className = 'cart-card';
        card.innerHTML = `
          <img src="${imageUrl}" class="card-img-top" style="height:180px; object-fit:cover; border-radius:8px;">
          <div class="card-body text-center">
            <h5 class="card-title">${product.productName}</h5>
            <p class="product-price">₹${product.price.toFixed(2)}</p>
            <input type="number" id="qty-${product.productId}" value="${item.quantity}" min="1" class="form-control mb-2" />
            <div class="d-flex justify-content-center gap-2">
              <button class="btn btn-update" onclick="updateQuantity('${userId}', ${product.productId})">Update</button>
              <button class="btn btn-remove" onclick="removeItem('${userId}', ${product.productId})">Remove</button>
            </div>
          </div>
        `;
        cartContainer.appendChild(card);
      });

      updateCartCount(userId);
      cartTotal.textContent = total.toFixed(2);

      // ✅ Bind checkout button here after DOM is injected
      const checkoutBtn = document.getElementById("checkoutBtn");
      if (checkoutBtn) {
        checkoutBtn.onclick = () => {
          window.location.href = "../checkout/checkout.html";
        };
      }
    })
    .catch(err => {
      console.error("❌ Failed to load cart:", err);
      cartContainer.innerHTML = `<p class="text-danger text-center">Failed to load cart.</p>`;
    });
}


function closeCart() {
  document.getElementById("cartModal").style.display = "none";
}

async function updateQuantity(userId, productId) {
  const token = localStorage.getItem("token");
  const input = document.getElementById(`qty-${productId}`);
  const quantity = parseInt(input.value);
  if (isNaN(quantity) || quantity <= 0) {
    alert("Enter a valid quantity.");
    return;
  }

  try {
    const res = await fetch(`http://localhost:8080/user/cart/update?userId=${userId}&productId=${productId}&quantity=${quantity}`, {
      method: 'PUT',
      headers: {
        "Authorization": `Bearer ${token}`
      }

    });
    if (res.ok) {
      toggleCart(); // Reload the modal
    } else {
      alert(await res.text());
    }
  } catch (err) {
    alert("Failed to update cart.");
    console.error(err);
  }
}

async function removeItem(userId, productId) {

  const token = localStorage.getItem("token"); // ✅ Get token from localStorage

  if (!token) {
    alert("User not authenticated");
    return;
  }
  
  try {
    await fetch(`http://localhost:8080/user/cart/remove?userId=${userId}&productId=${productId}`, {
      method: 'DELETE',
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    toggleCart(); // Reload the modal
  } catch (err) {
    alert('Failed to remove item');
    console.error(err);
  }
}



