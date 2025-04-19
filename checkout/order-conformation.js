document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    const token = localStorage.getItem("token");
    if (!orderId) {
        showError("Order ID is missing. Please check your order history.");
        return;
    }

    try {
      
        const response = await fetch(`http://localhost:8080/user/orders/${orderId}`, {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });

        if (!response.ok) {
            throw new Error("Failed to fetch order");
        }

        const order = await response.json();
        displayOrderDetails(order);
    } catch (error) {
        console.error("Error fetching order:", error);
        showError("Could not load order. Please try again.");
    }
});

function displayOrderDetails(order) {
    document.getElementById('orderId').textContent = order.order_id;

    const orderDate = new Date(order.placed_at);
    document.getElementById('orderDate').textContent = formatDate(orderDate);

    const deliveryDate = new Date(order.placed_at);
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    document.getElementById('deliveryDate').textContent = formatDate(deliveryDate);

    const addressBox = document.getElementById('shippingAddress');
    let address = order.address;

    try {
        if (typeof address === "string") {
          const parts = address.split(',').map(p => p.trim());
      
          const name = parts[0] || '';
          const phone = parts[1] || '';
          const addressLine = parts[2] || '';
          const city = parts[3] || '';
          const state = parts[4] || '';
          const postalCode = parts[5] || '';
      
          addressBox.innerHTML = `
            <p><strong>${name}</strong></p>
            <p>${addressLine}</p>
            <p>${city}, ${state} ${postalCode}</p>
            <p>Phone: ${phone}</p>
          `;
        } else {
          addressBox.textContent = "Invalid address format.";
        }
      } catch (e) {
        console.error("Error parsing address:", e);
        addressBox.textContent = "Unable to load address.";
      }
}

function formatDate(date) {
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function showError(message) {
    const container = document.querySelector('.confirmation-card');
    container.innerHTML = `
      <div class="text-center text-danger">
        <i class="bi bi-exclamation-circle-fill" style="font-size: 60px;"></i>
        <h2 class="mt-3">Oops!</h2>
        <p>${message}</p>
        <a href="../home/home.html" class="btn btn-success mt-3">Back to Shop</a>
      </div>
    `;
}


async function downloadInvoice(invoiceId) {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login to download invoice.");
    return;
  }

  if (!invoiceId) {
    alert("Invoice ID not found.");
    return;
  }

  try {
    const response = await fetch(`http://localhost:8080/user/invoice/${invoiceId}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch invoice PDF");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoiceId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("❌ Error downloading invoice:", err);
    alert("Something went wrong while downloading the invoice.");
  }
}



document.addEventListener('DOMContentLoaded', () => {
  const downloadBtn = document.querySelector("button.btn-outline-primary");

  const urlParams = new URLSearchParams(window.location.search);
  const invoiceId = urlParams.get("invoiceId");

  if (downloadBtn && invoiceId) {
    downloadBtn.addEventListener("click", () => downloadInvoice(invoiceId));

    // Auto-download on page load (optional)
    downloadInvoice(invoiceId);
  }
});
