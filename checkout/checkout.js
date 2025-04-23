

document.addEventListener('DOMContentLoaded', async () => {
  const cartContainer = document.getElementById("cartItems");
  const totalAmountEl = document.getElementById("totalAmount");
  const subtotalEl = document.getElementById("subtotal");
  const taxEl = document.getElementById("tax");
  const discountRowEl = document.getElementById("discountRow");
  const discountEl = document.getElementById("discount");
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const shipping = 49;

  if (!userId || !token) {
    if (cartContainer) {
      cartContainer.innerHTML = "<p class='text-muted'>Please log in to view your cart.</p>";
    }
    alert("Please log in to proceed with checkout.");
    window.location.href = "../login/login.html?redirect=checkout/checkout.html";
    return;
  }

  try {
    const res = await fetch(`${BASE_API_URL}/user/cart/${userId}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Unauthorized or failed to fetch cart");
    const cartItems = await res.json();

    if (cartItems.length === 0) {
      cartContainer.innerHTML = "<p class='text-muted'>Your cart is empty.</p>";
      totalAmountEl.textContent = "0.00";
      subtotalEl.textContent = "₹0.00";
      taxEl.textContent = "₹0.00";
      discountEl.textContent = "₹0.00";
      document.getElementById("continueBtn")?.setAttribute("disabled", true);
      document.getElementById("payNowBtn")?.setAttribute("disabled", true);
      return;
    }

    let subtotal = 0;
    let tax = 0;
    let total = 0;
    let discountAmount = 0;
    let discountPercent = 0;

    // Render items
    cartContainer.innerHTML = '';
    cartItems.forEach(item => {
      const product = item.product;
      const itemSubtotal = item.quantity * product.price;
      subtotal += itemSubtotal;

      const imageUrl = product.images?.[0]?.url?.replace("s3://agrobckt/", "https://agrobckt.s3.amazonaws.com/")
        || "https://via.placeholder.com/300x200?text=No+Image";

      const cartItem = document.createElement('div');
      cartItem.className = 'cart-item';
      cartItem.innerHTML = `
        <img src="${imageUrl}" class="item-image" alt="${product.productName}">
        <div class="item-details">
          <h5 class="item-name">${product.productName}</h5>
          <p class="item-price">Price: ₹${product.price.toFixed(2)}</p>
          <p class="item-quantity">Quantity: ${item.quantity}</p>
          <p class="item-subtotal">Subtotal: ₹${itemSubtotal.toFixed(2)}</p>
        </div>
      `;
      cartContainer.appendChild(cartItem);
    });

    // Fetch order count for discount logic
    const orderCountRes = await fetch(`${BASE_API_URL}/user/orders/customer-count/${userId}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!orderCountRes.ok) throw new Error("Failed to fetch order count");
    const orderCountData = await orderCountRes.json();
    const orderCount = orderCountData.totalOrders || 0;

    // Apply the highest applicable discount
    const discountByOrderCount = orderCount < 5 ? 5 : 0;
    const discountByAmount = subtotal > 10000 ? 10 : (subtotal > 5000 ? 5 : 0);
    discountPercent = Math.max(discountByOrderCount, discountByAmount);

    if (discountPercent > 0) {
      discountAmount = subtotal * (discountPercent / 100);

      const discountInfo = document.createElement('div');
      discountInfo.className = 'discount-badge';
      discountInfo.innerHTML = `
        <span class="badge bg-success">Discount Applied: ${discountPercent}% Off</span>
        <p class="small text-muted">
          ${orderCount < 5 ? `New Customer Discount: ${discountByOrderCount}%` : ''}
          ${discountByAmount > 0 ? ` | Cart Amount Discount: ${discountByAmount}%` : ''}
        </p>
      `;
      cartContainer.insertBefore(discountInfo, cartContainer.firstChild);

      if (discountRowEl) {
        discountRowEl.style.display = 'flex';
        discountRowEl.querySelector('.discount-percent').textContent = `(${discountPercent}%)`;
        discountEl.textContent = `- ₹${discountAmount.toFixed(2)}`;
      }
    } else if (discountRowEl) {
      discountRowEl.style.display = 'none';
    }

    // Calculate final totals
    tax = (subtotal - discountAmount) * 0.05;
    total = subtotal - discountAmount + tax + shipping;

    subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
    discountEl.textContent = `- ₹${discountAmount.toFixed(2)}`;
    taxEl.textContent = `₹${tax.toFixed(2)}`;
    totalAmountEl.textContent = `₹${total.toFixed(2)}`;

    localStorage.setItem("checkoutDiscount", discountPercent);
    localStorage.setItem("checkoutDiscountAmount", discountAmount);

  } catch (err) {
    console.error("❌ Cart error:", err);
    cartContainer.innerHTML = "<p class='text-danger'>Something went wrong while loading your cart.</p>";
  }
});

// Handle Payment
async function createOrderAndPay() {
  const userId = localStorage.getItem("userId");
  if (!userId) return alert("Please log in to place an order.");

  const name = document.getElementById("deliveryName")?.value?.trim();
  const phone = document.getElementById("deliveryPhone")?.value?.trim();
  const addressLine = document.getElementById("addressLine")?.value?.trim();
  const city = document.getElementById("city")?.value?.trim();
  const state = document.getElementById("state")?.value?.trim();
  const postalCode = document.getElementById("postalCode")?.value?.trim();

  if (!name || !phone || !addressLine || !city || !state || !postalCode) {
    return alert("Please fill in all address fields.");
  }

  const addressObject = { name, phone, addressLine, city, state, postalCode };

  try {
    const payBtn = document.getElementById("payNowBtn");
    if (payBtn) {
      payBtn.innerHTML = "Processing...";
      payBtn.disabled = true;
    }

    const discountPercent = parseInt(localStorage.getItem("checkoutDiscount") || "0");
    const discountAmount = parseFloat(localStorage.getItem("checkoutDiscountAmount") || "0");
    const applyDiscount = discountPercent > 0;
    const token = localStorage.getItem("token");

    const res = await fetch(`${BASE_API_URL}/user/payments/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        userId,
        address: addressObject,
        paymentMethod: "RAZORPAY",
        applyDiscount,
        discountPercent,
        discountAmount
      })
    });

    if (payBtn) {
      payBtn.innerHTML = "Pay Now";
      payBtn.disabled = false;
    }

    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();
    if (!data.razorpayOrderId) return alert("Failed to create payment order.");

    const options = {
      key: data.razorpayKeyId,
      amount: data.amount * 100,
      currency: data.currency || "INR",
      name: "ShopKapilAgro",
      description: "Order Payment",
      order_id: data.razorpayOrderId,
      handler: function (response) {
        verifyPayment(response, data.paymentId, data.orderId);
      },
      theme: {
        color: "#28a745"
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();

  } catch (err) {
    console.error("Payment error:", err);
    alert("Something went wrong during payment: " + err.message);
  }
}

async function verifyPayment(razorpayResponse, paymentId, orderId) {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_API_URL}/user/payments/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        paymentId,
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id,
        razorpaySignature: razorpayResponse.razorpay_signature
      })
    });

    if (!res.ok) throw new Error(await res.text());
    const result = await res.json();

    if (result.status === "success") {
      const invoiceId = result.invoiceId;
      alert("Payment successful! Downloading invoice.");
      localStorage.removeItem("checkoutDiscount");
      localStorage.removeItem("checkoutDiscountAmount");
      await downloadInvoice(invoiceId);
      setTimeout(() => {
        window.location.href = `../checkout/order-confirmation.html?invoiceId=${invoiceId}&id=${orderId}`;
      }, 1000);
    } else {
      alert("Payment verification failed");
    }
  } catch (err) {
    console.error("Verification error:", err);
    alert("Verification failed: " + err.message);
  }
}

async function downloadInvoice(invoiceId) {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_API_URL}/user/payments/invoice/${invoiceId}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error("Failed to download invoice");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `invoice-${invoiceId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Invoice download error:", err);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById("payNowBtn")?.addEventListener("click", createOrderAndPay);
});