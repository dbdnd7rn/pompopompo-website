// This file contains the JavaScript for the PompoPompo website.
// It handles UI interactions, modals, and prepares for dynamic data fetching.

// ===================================================================
// FIREBASE IMPORTS

// TODO: Add SDKs for other Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


// ===================================================================
// FIREBASE CONFIGURATION & INITIALIZATION
// ===================================================================
// Paste your Firebase config here
// This is what connects your site to your database

// ===================================================================
// DUMMY DATA (for demonstration purposes)
// REPLACE THIS WITH LIVE DATA FETCHED FROM YOUR FIREBASE FIRESTORE
// ===================================================================
const restaurants = {
  'must': [
    { id: 'must-grill', name: 'MUST Grill', rating: 4.5, time: '25-35 min', delivery: 500, img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', description: 'Grilled foods, snacks, and beverages' },
    { id: 'science-cafe', name: 'Science Cafe', rating: 4.2, time: '20-30 min', delivery: 400, img: 'https://images.unsplash.com/photo-1552566626-52f8b828add9', description: 'Breakfast, lunch, and coffee' },
    { id: 'the-kiosk', name: 'The Kiosk', rating: 4.0, time: '15-20 min', delivery: 300, img: 'https://images.unsplash.com/photo-1551633513-e4ddb70498ed', description: 'Drinks, snacks and quick bites' }
  ],
  'unima': [], // Add your UNIMA restaurants here
  'mubas': [], // Add your MUBAS restaurants here
  'mzuni': [], // Add your MZUNI restaurants here
  'luana': [] // Add your LUANAR restaurants here
};

const menus = {
  'must-grill': {
    name: 'MUST Grill',
    subtitle: 'Delicious grilled foods and more',
    items: [
      { id: 'item-1', name: 'Peri-Peri Chicken', price: 4500, image: 'https://images.unsplash.com/photo-1626804803926-d62f0f4a88f7', description: 'Succulent chicken with peri-peri marinade.' },
      { id: 'item-2', name: 'Beef Burger', price: 3200, image: 'https://images.unsplash.com/photo-1568901006509-3226a0c201a3', description: 'Char-grilled patty with cheese and veggies.' },
      { id: 'item-3', name: 'Chicken Wings (6pcs)', price: 2500, image: 'https://images.unsplash.com/photo-1621852178550-93a9c7b2c5d1', description: 'Crispy wings with a choice of sauce.' }
    ]
  },
  'science-cafe': {
    name: 'Science Cafe',
    subtitle: 'Your daily dose of breakfast & coffee',
    items: [
      { id: 'item-4', name: 'Full English Breakfast', price: 3500, image: 'https://images.unsplash.com/photo-1620131498064-9276229497e2', description: 'Eggs, sausage, bacon, baked beans, toast.' },
      { id: 'item-5', name: 'Latte', price: 1500, image: 'https://images.unsplash.com/photo-1574044199974-9b2f275e5233', description: 'A classic espresso-based coffee drink.' }
    ]
  },
};

// ===================================================================
// UI REFERENCES
// ===================================================================
const nav = document.querySelector('nav');
const loginBtn = document.getElementById('login-button');
const signupBtn = document.getElementById('signup-button');
const userProfile = document.getElementById('user-profile');
const loginModal = document.getElementById('login-modal');
const signupModal = document.getElementById('signup-modal');
const menuModal = document.getElementById('menu-modal');
const universityTabs = document.querySelectorAll('.uni-tab');
const universitySelector = document.getElementById('university-selector');
const restaurantList = document.getElementById('restaurant-list');
const cartSidebar = document.getElementById('cart-sidebar');
const cartCount = document.getElementById('cart-count');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartTotal = document.getElementById('cart-total');

// ===================================================================
// GLOBAL STATE
// ===================================================================
let cart = []; // Array to hold cart items

// ===================================================================
// EVENT LISTENERS
// ===================================================================
// Scroll event for shrinking nav
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// Modal open/close listeners
loginBtn.addEventListener('click', () => openModal('login-modal'));
signupBtn.addEventListener('click', () => openModal('signup-modal'));
document.getElementById('show-signup').addEventListener('click', (e) => {
  e.preventDefault();
  closeModal('login-modal');
  openModal('signup-modal');
});
document.getElementById('show-login').addEventListener('click', (e) => {
  e.preventDefault();
  closeModal('signup-modal');
  openModal('login-modal');
});

// University tabs and selector
universityTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    switchUniversity(tab.dataset.university);
  });
});
universitySelector.addEventListener('change', (e) => {
  switchUniversity(e.target.value);
});

// Add to Cart Button Event Listener (Delegation)
// This listens for clicks on any element within the document.
// It checks if the clicked element has the class 'add-to-cart-btn'.
document.addEventListener('click', (e) => {
  // View menu button logic
  if (e.target.classList.contains('view-menu-btn')) {
    const restaurantId = e.target.dataset.restaurantId;
    showRestaurantMenu(restaurantId);
  }

  // Add to cart button logic
  if (e.target.classList.contains('add-to-cart-btn')) {
    const itemId = e.target.dataset.itemId;
    // Find the item from our dummy data using its ID
    let itemToAdd;
    for (const resId in menus) {
      itemToAdd = menus[resId].items.find(item => item.id === itemId);
      if (itemToAdd) break;
    }
    
    if (itemToAdd) {
      addItemToCart(itemToAdd);
      // Optional: Give the user feedback
      e.target.textContent = 'Added!';
      setTimeout(() => e.target.textContent = '+ Add', 1000);
      window.toggleCart(); // Open cart after adding
    }
  }

  // Cart quantity buttons logic
  if (e.target.classList.contains('quantity-btn')) {
    const itemId = e.target.closest('.cart-item').dataset.itemId;
    const action = e.target.dataset.action;
    updateItemQuantity(itemId, action);
  }

  // Remove item button logic
  if (e.target.classList.contains('remove-item')) {
    const itemId = e.target.closest('.cart-item').dataset.itemId;
    removeItemFromCart(itemId);
  }
});

// ===================================================================
// FIREBASE AUTHENTICATION LOGIC
// ===================================================================
// Login form submission
document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = e.target.elements[0].value;
  const password = e.target.elements[1].value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // User successfully logged in
      const user = userCredential.user;
      console.log("User logged in:", user);
      closeModal('login-modal');
      updateAuthUI(user);
    })
    .catch((error) => {
      const errorMessage = error.message;
      alert(errorMessage);
      console.error("Login failed:", errorMessage);
    });
});

// Sign-up form submission
document.getElementById('signup-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = e.target.elements[1].value;
  const password = e.target.elements[2].value;

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // User successfully signed up
      const user = userCredential.user;
      console.log("User signed up:", user);
      closeModal('signup-modal');
      updateAuthUI(user);
    })
    .catch((error) => {
      const errorMessage = error.message;
      alert(errorMessage);
      console.error("Sign-up failed:", errorMessage);
    });
});

// Logout function
window.logoutUser = function() {
  signOut(auth).then(() => {
    // Sign-out successful.
    console.log("User signed out.");
    updateAuthUI(null);
  }).catch((error) => {
    // An error happened.
    console.error("Logout failed:", error.message);
  });
}

// ===================================================================
// CORE FUNCTIONS
// ===================================================================

/**
 * Handles opening a modal.
 * @param {string} id The ID of the modal to open.
 */
function openModal(id) {
  const modal = document.getElementById(id);
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden'; // Prevents scrolling
}

/**
 * Handles closing a modal.
 * @param {string} id The ID of the modal to close.
 */
function closeModal(id) {
  const modal = document.getElementById(id);
  modal.style.display = 'none';
  document.body.style.overflow = 'auto'; // Re-enables scrolling
}

/**
 * Switches the active university tab and content.
 * @param {string} uniId The ID of the university to switch to.
 */
function switchUniversity(uniId) {
  // Update tabs
  document.querySelectorAll('.uni-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelector(`.uni-tab[data-university="${uniId}"]`).classList.add('active');

  // Update content
  document.querySelectorAll('.uni-content').forEach(content => content.classList.remove('active'));
  document.getElementById(`${uniId}-content`).classList.add('active');

  // Load and display restaurants for the selected university
  loadRestaurants(uniId);
}

/**
 * Renders the restaurant cards for a given university.
 * @param {string} uniId The ID of the university.
 */
function loadRestaurants(uniId) {
  const uniRestaurants = restaurants[uniId];
  restaurantList.innerHTML = ''; // Clear current restaurants

  if (!uniRestaurants || uniRestaurants.length === 0) {
    restaurantList.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">No restaurants available for this campus yet.</p>`;
    return;
  }

  uniRestaurants.forEach(restaurant => {
    const card = document.createElement('div');
    card.classList.add('restaurant-card');
    card.innerHTML = `
      <div class="restaurant-image">
        <img src="${restaurant.img}" alt="${restaurant.name}">
        <div class="rating">${restaurant.rating} ★</div>
      </div>
      <div class="restaurant-info">
        <h3>${restaurant.name}</h3>
        <p>${restaurant.description}</p>
        <div class="delivery-info">
          <span>${restaurant.time} • MK ${restaurant.delivery} delivery</span>
        </div>
        <button class="view-menu-btn" data-restaurant-id="${restaurant.id}">View Menu</button>
      </div>
    `;
    restaurantList.appendChild(card);
  });
}

/**
 * Shows the menu modal with items for a specific restaurant.
 * @param {string} restaurantId The ID of the restaurant.
 */
function showRestaurantMenu(restaurantId) {
  const menuData = menus[restaurantId];
  if (!menuData) {
    alert('Menu not found!');
    return;
  }

  const menuTitle = document.getElementById('menu-modal-title');
  const menuSubtitle = document.getElementById('menu-modal-subtitle');
  const menuItemsContainer = document.getElementById('menu-modal-items');

  menuTitle.textContent = menuData.name;
  menuSubtitle.textContent = menuData.subtitle;
  menuItemsContainer.innerHTML = ''; // Clear previous menu items

  menuData.items.forEach(item => {
    const itemCard = document.createElement('div');
    itemCard.classList.add('menu-item-card');
    itemCard.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div class="item-info">
        <h4>${item.name}</h4>
        <p>${item.description}</p>
        <div class="item-price-add">
          <span>MK ${item.price}</span>
          <button class="add-to-cart-btn" data-item-id="${item.id}">+ Add</button>
        </div>
      </div>
    `;
    menuItemsContainer.appendChild(itemCard);
  });

  openModal('menu-modal');
}

/**
 * Toggles the visibility of the cart sidebar.
 */
window.toggleCart = function() {
  cartSidebar.classList.toggle('open');
  if (cartSidebar.classList.contains('open')) {
    document.body.style.overflow = 'hidden';
    renderCart(); // Always re-render when opening
  } else {
    document.body.style.overflow = 'auto';
  }
}

/**
 * Adds an item to the cart. If the item already exists, it increases the quantity.
 * @param {object} item The item to add.
 */
function addItemToCart(item) {
  const existingItem = cart.find(cartItem => cartItem.id === item.id);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  renderCart();
}

/**
 * Renders the contents of the cart array to the UI.
 */
function renderCart() {
  cartItemsContainer.innerHTML = ''; // Clear cart
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-shopping-cart"></i>
        <p>Your cart is empty</p>
        <button onclick="window.toggleCart()">Browse Food</button>
      </div>
    `;
  } else {
    cart.forEach(item => {
      const cartItemElement = document.createElement('div');
      cartItemElement.classList.add('cart-item');
      cartItemElement.dataset.itemId = item.id;
      cartItemElement.innerHTML = `
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p>MK ${item.price}</p>
          <div class="cart-item-quantity">
            <button class="quantity-btn" data-action="decrease">-</button>
            <span>${item.quantity}</span>
            <button class="quantity-btn" data-action="increase">+</button>
          </div>
        </div>
        <span class="cart-item-price">MK ${item.price * item.quantity}</span>
        <button class="remove-item"><i class="fas fa-times"></i></button>
      `;
      cartItemsContainer.appendChild(cartItemElement);
    });
  }
  updateCartTotal();
  updateCartCount();
}

/**
 * Updates the quantity of an item in the cart.
 * @param {string} itemId The ID of the item.
 * @param {string} action 'increase' or 'decrease'.
 */
function updateItemQuantity(itemId, action) {
  const item = cart.find(cartItem => cartItem.id === itemId);
  if (item) {
    if (action === 'increase') {
      item.quantity++;
    } else if (action === 'decrease' && item.quantity > 1) {
      item.quantity--;
    } else if (action === 'decrease' && item.quantity === 1) {
      removeItemFromCart(itemId);
      return;
    }
    renderCart();
  }
}

/**
 * Removes an item from the cart.
 * @param {string} itemId The ID of the item to remove.
 */
function removeItemFromCart(itemId) {
  cart = cart.filter(item => item.id !== itemId);
  renderCart();
}

/**
 * Calculates and updates the total price in the cart.
 */
function updateCartTotal() {
  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const deliveryFee = subtotal > 0 ? 500 : 0;
  const total = subtotal + deliveryFee;

  cartSubtotal.textContent = subtotal.toLocaleString();
  cartTotal.textContent = total.toLocaleString();
  document.getElementById('delivery-fee').textContent = deliveryFee.toLocaleString();
}

/**
 * Updates the cart icon's item count.
 */
function updateCartCount() {
  const totalCount = cart.reduce((total, item) => total + item.quantity, 0);
  cartCount.textContent = totalCount;
}

/**
 * Updates the UI based on user's authentication state.
 * @param {object} user The Firebase user object, or null if logged out.
 */
function updateAuthUI(user) {
  if (user) {
    loginBtn.style.display = 'none';
    signupBtn.style.display = 'none';
    userProfile.style.display = 'flex';
    document.getElementById('orders-link').style.display = 'inline';
    userProfile.querySelector('span').textContent = `Welcome, ${user.email.split('@')[0]}!`;
  } else {
    loginBtn.style.display = 'inline-block';
    signupBtn.style.display = 'inline-block';
    userProfile.style.display = 'none';
    document.getElementById('orders-link').style.display = 'none';
  }
}

// ===================================================================
// INITIALIZATION
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
  // This will run when the page is fully loaded
  switchUniversity('must'); // Load the default university on page load
  renderCart(); // Render the empty cart initially
  
  // Listen for changes in the user's authentication state
  // This is how the UI knows whether to show "Login" or the user's name
  onAuthStateChanged(auth, (user) => {
    updateAuthUI(user);
  });
});
