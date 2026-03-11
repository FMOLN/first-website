// =============================================================================
// FMOLN PERFUMES - script.js (Final Version)
// =============================================================================

// --- 1. Global State ---
let cartItems = [];
const whatsappNumber = "251938073190";

// --- Product Data (used locally and as fallback on Netlify) ---
const FALLBACK_PRODUCTS = [
  { name: "BOSS HUGO", brand: "Hugo Boss", price: "ETB 2,500", image: "photo_2025-10-06_11-15-11.jpg", gender: "Men", size: "100ml", concentration: "Eau de Toilette", description: "A bold, fresh fragrance with notes of apple, pine, and musk. BOSS HUGO is the scent of the confident, independent man who plays by his own rules." },
  { name: "Bleu De Chanel", brand: "Chanel", price: "ETB 4,500", image: "BleuDeChanel.JPG", gender: "Men", size: "100ml", concentration: "Eau de Parfum", description: "An ode to masculine freedom. A woody, aromatic fragrance for the man who defies convention with citrus, labdanum, and sandalwood." },
  { name: "Dior Sauvage", brand: "Dior", price: "ETB 2,800", image: "photo_2025-10-06_11-15-28.jpg", gender: "Men", size: "100ml", concentration: "Eau de Toilette", description: "Raw and noble. Dior Sauvage opens with a radiant burst of Calabrian bergamot, underpinned by a peppery Sichuan note and a smooth Ambroxan base." },
  { name: "Creed Aventus", brand: "Creed", price: "ETB 3,100", image: "photo_2025-10-06_11-15-04.jpg", gender: "Men", size: "100ml", concentration: "Eau de Parfum", description: "Inspired by the life of a historical emperor, Aventus celebrates strength, power, and success with notes of blackcurrant, birch, and oakmoss." },
  { name: "Creed Original Santal", brand: "Creed", price: "ETB 2,699", image: "photo_2025-10-06_11-15-08.jpg", gender: "Unisex", size: "100ml", concentration: "Eau de Parfum", description: "A warm, sensual blend of sandalwood, spices, and musk. Original Santal is a timeless fragrance that wraps you in pure luxury." },
  { name: "YOU Exclusive", brand: "Zadig & Voltaire", price: "ETB 3,599", image: "photo_2025-10-06_11-15-21.jpg", gender: "Women", size: "100ml", concentration: "Eau de Parfum", description: "A floral, addictive fragrance with a surprising freshness. YOU Exclusive captures a free-spirited femininity with peony, iris, and white musks." },
  { name: "Eclaire Perfume", brand: "Eclaire", price: "ETB 3,699", image: "photo_2025-10-06_11-15-01.jpg", gender: "Unisex", size: "100ml", concentration: "Eau de Parfum", description: "A sophisticated and modern scent with a luminous personality. Eclaire blends bright citrus with warm amber and soft woods for an unforgettable impression." },
  { name: "ASAD Lattafa Black", brand: "Lattafa", price: "ETB 3,200", image: "photo_2025-10-06_11-15-50.jpg", gender: "Men", size: "100ml", concentration: "Eau de Parfum", description: "A rich, powerful oriental fragrance. ASAD Black by Lattafa opens with spicy pepper and oud, settling into a deep, smoky base of musk and amber." },
  { name: "Khamrah Lattafa", brand: "Lattafa", price: "ETB 3,950", image: "photo_2025-10-06_11-15-26.jpg", gender: "Unisex", size: "100ml", concentration: "Eau de Parfum", description: "An intoxicating oriental gourmand fragrance. Khamrah combines notes of praline, vanilla, and oud to create a warm, addictive, and deeply luxurious scent." },
  { name: "Colour Me", brand: "Colour Me", price: "ETB 2,499", image: "photo_2025-10-06_11-15-49.jpg", gender: "Unisex", size: "100ml", concentration: "Eau de Parfum", description: "A vibrant, playful fragrance that expresses individuality. Colour Me blends fresh florals with soft musks for an everyday scent that leaves a lasting impression." }
];


// =============================================================================
// --- 2. CART FUNCTIONS ---
// =============================================================================

function updateCartCount() {
    const total = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const el = document.getElementById('cart-count');
    if (el) {
        el.textContent = total;
        el.style.display = total > 0 ? 'inline-block' : 'none';
    }
    // Sync mobile badge too
    const mob = document.getElementById('cart-count-mobile');
    if (mob) {
        mob.textContent = total;
        mob.style.display = total > 0 ? 'inline-block' : 'none';
    }
}

function addToCart(event, name, price, image) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const existing = cartItems.find(item => item.name === name);
    if (existing) {
        existing.quantity += 1;
    } else {
        cartItems.push({ name, price, image, quantity: 1 });
    }
    localStorage.setItem('fmolnCart', JSON.stringify(cartItems));
    updateCartCount();
    alert(`✅ ${name} has been added to your cart.`);
}

function removeFromCart(name) {
    cartItems = cartItems.filter(item => item.name !== name);
    localStorage.setItem('fmolnCart', JSON.stringify(cartItems));
    updateCartCount();
    displayOrderSummary();
}


// =============================================================================
// --- 3. SHOP PAGE (index.html) ---
// =============================================================================

async function fetchProducts() {
    const container = document.querySelector('.featured-products');
    if (!container) return;

    container.innerHTML = `<div class="loading-state"><p>Curating your signature scent...</p></div>`;

    try {
        // Netlify CMS creates one JSON file per product in _products/
        // We fetch the directory listing to find all product files
        const response = await fetch('/_products/');
        if (!response.ok) throw new Error("No CMS folder");

        const text = await response.text();

        // Parse all .json filenames from the directory listing
        const matches = [...text.matchAll(/href="([^"]+\.json)"/g)];
        if (matches.length === 0) throw new Error("No product files found");

        // Fetch each product file in parallel
        const products = await Promise.all(
            matches.map(m => fetch('/_products/' + m[1].split('/').pop()).then(r => r.json()))
        );

        displayProducts(products);
        handleSearch(products);
    } catch (e) {
        // Fallback to hardcoded products (local dev or if CMS not set up yet)
        displayProducts(FALLBACK_PRODUCTS);
        handleSearch(FALLBACK_PRODUCTS);
    }
}

function displayProducts(products) {
    const container = document.querySelector('.featured-products');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `<p class="no-results">No perfumes match your search.</p>`;
        return;
    }

    const cards = products.map(product => {
        const imgPath = product.image ? `images/${product.image}` : 'images/default.jpg';
        const safeName = product.name.replace(/'/g, "\\'");
        const safePrice = product.price.replace(/'/g, "\\'");
        const safeImage = (product.image || '').replace(/'/g, "\\'");
        return `
            <div class="product-card">
                <a href="product-detail.html?name=${encodeURIComponent(product.name)}" class="product-link">
                    <img src="${imgPath}" alt="${product.name}" class="product-image" onerror="this.src='images/default.jpg'">
                    <div class="product-info">
                        <p class="product-brand">${product.brand || 'Premium'}</p>
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-price">${product.price}</p>
                    </div>
                </a>
                <button class="add-to-cart-btn" onclick="addToCart(event, '${safeName}', '${safePrice}', '${safeImage}')">
                    Add to Cart
                </button>
            </div>`;
    }).join('');

    container.innerHTML = `<div class="product-grid">${cards}</div>`;
}

function handleSearch(allProducts) {
    const input = document.getElementById('search-input');
    if (!input) return;
    input.addEventListener('keyup', () => {
        const term = input.value.toLowerCase().trim();
        if (term.length === 0) { displayProducts(allProducts); return; }
        const filtered = allProducts.filter(p =>
            p.name.toLowerCase().includes(term) ||
            (p.brand && p.brand.toLowerCase().includes(term))
        );
        displayProducts(filtered);
    });
}


// =============================================================================
// --- 4. ORDER PAGE (order.html) ---
// =============================================================================

function displayOrderSummary() {
    const summaryContainer = document.getElementById('order-summary-content');
    const orderTotalElement = document.getElementById('order-total');
    if (!summaryContainer || !orderTotalElement) return;

    let total = 0;
    let html = '';

    if (cartItems.length === 0) {
        html = `<p style="color:#aaa;">Your cart is empty. <a href="index.html" style="color:#C9A043;">Return to the Shop</a> to add a perfume.</p>`;
    } else {
        html = `<h3 style="color:#C9A043; margin-top:0;">Your Selection</h3>`;
        cartItems.forEach(item => {
            const priceValue = parseFloat(item.price.replace(/ETB|,/g, '').trim());
            const itemTotal = priceValue * item.quantity;
            total += itemTotal;
            const qtyLabel = item.quantity > 1 ? `${item.quantity}x ` : '1x ';
            const itemTotalFormatted = itemTotal.toLocaleString('en-US');
            const safeName = item.name.replace(/'/g, "\\'");
            html += `
                <div class="cart-item">
                    <span class="cart-item-name">${qtyLabel}<strong>${item.name}</strong> — ETB ${itemTotalFormatted}</span>
                    <button class="remove-btn" onclick="removeFromCart('${safeName}')">❌ Remove</button>
                </div>`;
        });
    }

    summaryContainer.innerHTML = html;
    orderTotalElement.textContent = `Order Total: ETB ${total.toLocaleString('en-US')}`;
}

function generateWhatsAppLink(customerName, customerPhone, customerLocation) {
    if (cartItems.length === 0) {
        alert("Your cart is empty. Please add a perfume first!");
        return;
    }
    const orderLines = cartItems.map(item => {
        const qty = item.quantity > 1 ? `${item.quantity}x ` : '';
        return `  - ${qty}${item.name} (${item.price})`;
    }).join('\n');

    const message =
`--- FMOLN Order Inquiry ---
Hello FMOLN, I would like to confirm my order.

Customer Info:
  Name: ${customerName}
  Phone: ${customerPhone}
  Location: ${customerLocation}

Order Details:
${orderLines}

Payment: Pay on Delivery (Addis Ababa)
Please contact me to confirm delivery. Thank you!`;

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    showThankYouScreen(customerName, customerPhone, customerLocation);
    cartItems = [];
    localStorage.removeItem('fmolnCart');
    updateCartCount();
}

function showThankYouScreen(name, phone, location) {
    const orderSection = document.getElementById('order-section');
    const thankYouSection = document.getElementById('thankyou-section');
    const thankYouDetails = document.getElementById('thankyou-details');
    if (!orderSection || !thankYouSection) return;
    if (thankYouDetails) {
        thankYouDetails.innerHTML = `
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Location:</strong> ${location}</p>`;
    }
    orderSection.style.display = 'none';
    thankYouSection.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// =============================================================================
// --- 5. PRODUCT DETAIL PAGE (product-detail.html) ---
// =============================================================================

function displayProductDetails() {
    const params = new URLSearchParams(window.location.search);
    const productName = decodeURIComponent(params.get('name') || '');

    if (!productName) {
        document.querySelector('.detail-container').innerHTML =
            '<h2>No product selected. <a href="index.html">Return to Shop</a>.</h2>';
        return;
    }

    const product = FALLBACK_PRODUCTS.find(p =>
        p.name.trim().toLowerCase() === productName.trim().toLowerCase()
    );

    if (!product) {
        document.querySelector('.detail-container').innerHTML =
            `<h2>Product not found. <a href="index.html">Return to Shop</a>.</h2>`;
        return;
    }

    const imgPath = product.image ? `images/${product.image}` : 'images/default.jpg';
    document.getElementById('page-title').textContent = `FMOLN - ${product.name}`;

    const detailImage = document.getElementById('detail-image');
    if (detailImage) {
        detailImage.src = imgPath;
        detailImage.alt = product.name;
        detailImage.onerror = () => { detailImage.src = 'images/default.jpg'; };
    }

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || 'N/A';
    };

    setText('detail-name', product.name);
    setText('detail-brand', product.brand);
    setText('detail-price', product.price);
    setText('detail-gender', product.gender);
    setText('detail-ml', product.size);
    setText('detail-concentration', product.concentration);
    setText('detail-description', product.description);

    const detailBtn = document.getElementById('add-to-cart-detail-btn');
    if (detailBtn) {
        detailBtn.onclick = function(event) {
            addToCart(event, product.name, product.price, product.image);
        };
    }
}



// =============================================================================
// --- 6. MOBILE NAV — Hamburger toggle & mobile search
// =============================================================================

function initMobileNav() {
    const hamburger = document.getElementById('hamburger-btn');
    const mobileNav = document.getElementById('mobile-nav');

    if (!hamburger || !mobileNav) return;

    // Toggle drawer open/close
    hamburger.addEventListener('click', () => {
        mobileNav.classList.toggle('open');
        const icon = hamburger.querySelector('i');
        icon.className = mobileNav.classList.contains('open')
            ? 'fas fa-times'
            : 'fas fa-bars';
    });

    // Close drawer when any nav link is tapped
    mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileNav.classList.remove('open');
            const icon = hamburger.querySelector('i');
            icon.className = 'fas fa-bars';
        });
    });

    // Close drawer when clicking outside of it
    document.addEventListener('click', (e) => {
        if (!mobileNav.contains(e.target) && !hamburger.contains(e.target)) {
            mobileNav.classList.remove('open');
            const icon = hamburger.querySelector('i');
            icon.className = 'fas fa-bars';
        }
    });

    // Mobile search mirrors desktop search input
    const mobileInput = document.getElementById('search-input-mobile');
    const desktopInput = document.getElementById('search-input');
    if (mobileInput && desktopInput) {
        mobileInput.addEventListener('keyup', (e) => {
            desktopInput.value = e.target.value;
            desktopInput.dispatchEvent(new Event('keyup'));
        });
    }
}


// =============================================================================
// --- 7. INITIALIZER ---
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {

    // Step 1: Restore cart from localStorage
    const savedCart = localStorage.getItem('fmolnCart');
    if (savedCart) {
        try {
            cartItems = JSON.parse(savedCart);
            cartItems = cartItems.map(item => ({ ...item, quantity: item.quantity || 1 }));
        } catch (e) {
            cartItems = [];
            localStorage.removeItem('fmolnCart');
        }
    }

    // Step 2: Update badge
    updateCartCount(); // also syncs mobile badge
    initMobileNav();

    // Step 3: Run page-specific logic
    if (document.querySelector('.featured-products')) {
        fetchProducts();
    }

    if (document.querySelector('.order-container')) {
        displayOrderSummary();
        const orderForm = document.getElementById('order-form');
        if (orderForm) {
            orderForm.addEventListener('submit', function(e) {
                e.preventDefault();
                if (cartItems.length === 0) {
                    alert("Your cart is empty. Please choose a scent first!");
                    return;
                }
                const name = document.getElementById('name').value.trim();
                const phone = document.getElementById('phone').value.trim();
                const location = document.getElementById('location').value.trim();
                if (!name || !phone || !location) {
                    alert("Please fill in all delivery details.");
                    return;
                }
                generateWhatsAppLink(name, phone, location);
            });
        }
    }

    if (document.querySelector('.detail-container')) {
        displayProductDetails();
    }

});
