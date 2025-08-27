// ===== FIREBASE SETUP =====
const firebaseConfig = {
  apiKey: "AIzaSyBecUBJKEAt6uGJHbR_z1lb1lLcIYuK0rc",
  authDomain: "pompopompo-delivery.firebaseapp.com",
  projectId: "pompopompo-delivery",
  storageBucket: "pompopompo-delivery.appspot.com",
  messagingSenderId: "488146196907",
  appId: "1:488146196907:web:dc1d7dc57f83c396a9daee"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// ===== SHOPPING CART FUNCTIONALITY =====
let cart = [];
let cartTotal = 0;

// Toggle cart visibility
function toggleCart() {
  const cartSidebar = document.getElementById('cart-sidebar');
  cartSidebar.classList.toggle('open');
}

// Add item to cart
function addToCart(itemName, itemPrice, restaurant) {
  // Extract price from string (e.g., "MK 3,500" -> 3500)
  const price = parseInt(itemPrice.replace('MK', '').replace(',', '').trim());
  
  // Check if item already in cart
  const existingItem = cart.find(item => item.name === itemName);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      name: itemName,
      price: price,
      quantity: 1,
      restaurant: restaurant
    });
  }
  
  updateCart();
  toggleCart(); // Open cart when item is added
}

// Update cart UI
function updateCart() {
  const cartItems = document.getElementById('cart-items');
  const cartCount = document.getElementById('cart-count');
  const cartTotalElement = document.getElementById('cart-total');
  
  // Clear cart items
  cartItems.innerHTML = '';
  cartTotal = 0;
  
  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <p>Your cart is empty</p>
        <button onclick="toggleCart()">Browse Food</button>
      </div>
    `;
  } else {
    // Add items to cart
    cart.forEach((item, index) => {
      cartTotal += item.price * item.quantity;
      
      const cartItem = document.createElement('div');
      cartItem.className = 'cart-item';
      cartItem.innerHTML = `
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p>${item.restaurant}</p>
          <div class="cart-item-quantity">
            <button class="quantity-btn" onclick="changeQuantity(${index}, -1)">-</button>
            <span>${item.quantity}</span>
            <button class="quantity-btn" onclick="changeQuantity(${index}, 1)">+</button>
          </div>
        </div>
        <div class="cart-item-right">
          <span class="cart-item-price">MK ${(item.price * item.quantity).toLocaleString()}</span>
          <button class="remove-item" onclick="removeFromCart(${index})">×</button>
        </div>
      `;
      
      cartItems.appendChild(cartItem);
    });
  }
  
  // Update cart count and total
  cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
  cartTotalElement.textContent = cartTotal.toLocaleString();
}

// Change item quantity
function changeQuantity(index, change) {
  cart[index].quantity += change;
  
  // Remove item if quantity is 0
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  
  updateCart();
}

// Remove item from cart
function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

// Checkout function
function checkout() {
  const user = auth.currentUser;
  
  if (!user) {
    alert('Please login to complete your order');
    document.getElementById('login-modal').style.display = 'block';
    return;
  }
  
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  
  // Save order to Firebase
  db.collection('orders').add({
    userId: user.uid,
    items: cart,
    total: cartTotal,
    status: 'pending',
    createdAt: new Date(),
    deliveryAddress: 'Campus Address (to be added)'
  })
  .then(() => {
    alert('Order placed successfully! Your food is being prepared.');
    cart = [];
    updateCart();
    toggleCart();
  })
  .catch(error => {
    alert('Error placing order: ' + error.message);
  });
}

// ===== ORDER TRACKING FUNCTIONALITY =====

// Show order tracking modal
function showOrderTracking() {
  const user = auth.currentUser;
  
  if (!user) {
    alert('Please login to view your orders');
    document.getElementById('login-modal').style.display = 'block';
    return;
  }
  
  loadUserOrders();
  document.getElementById('order-tracking-modal').style.display = 'block';
}

// Close modal
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// Load user's orders from Firebase
function loadUserOrders() {
  const user = auth.currentUser;
  const ordersContainer = document.getElementById('orders-container');
  
  if (!user) return;
  
  // Show loading state
  ordersContainer.innerHTML = '<p>Loading your orders...</p>';
  
  // Get orders from Firebase
  db.collection('orders')
    .where('userId', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        ordersContainer.innerHTML = `
          <div class="no-orders">
            <p>You haven't placed any orders yet.</p>
            <button onclick="closeModal('order-tracking-modal')">Browse Food</button>
          </div>
        `;
        return;
      }
      
      ordersContainer.innerHTML = '';
      
      querySnapshot.forEach((doc) => {
        const order = doc.data();
        const orderId = doc.id;
        const orderDate = order.createdAt.toDate().toLocaleDateString();
        const orderTime = order.createdAt.toDate().toLocaleTimeString();
        
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        orderCard.innerHTML = `
          <div class="order-header">
            <span class="order-id">Order #${orderId.substring(0, 8)}</span>
            <span class="order-date">${orderDate} ${orderTime}</span>
          </div>
          <div class="order-total">MK ${order.total.toLocaleString()}</div>
          <div class="order-status">${order.status}</div>
        `;
        
        ordersContainer.appendChild(orderCard);
      });
    })
    .catch((error) => {
      ordersContainer.innerHTML = '<p>Error loading orders. Please try again.</p>';
      console.error('Error getting orders:', error);
    });
}

// ===== AUTHENTICATION FUNCTIONS =====

// Set up authentication event listeners
function setupAuthListeners() {
  // Login button
  document.getElementById('login-button').addEventListener('click', function() {
    document.getElementById('login-modal').style.display = 'block';
  });
  
  // Signup button
  document.getElementById('signup-button').addEventListener('click', function() {
    document.getElementById('signup-modal').style.display = 'block';
  });
  
  // Switch between login and signup modals
  document.getElementById('show-signup').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('login-modal').style.display = 'none';
    document.getElementById('signup-modal').style.display = 'block';
  });

  document.getElementById('show-login').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('signup-modal').style.display = 'none';
    document.getElementById('login-modal').style.display = 'block';
  });

  // Signup Form
  document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = this.querySelector('input[type="email"]').value;
    const password = this.querySelector('input[type="password"]').value;
    const fullName = this.querySelector('input[type="text"]').value;

    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Save user profile
        return db.collection('users').doc(userCredential.user.uid).set({
          fullName: fullName,
          email: email,
          createdAt: new Date()
        });
      })
      .then(() => {
        alert('Account created successfully!');
        document.getElementById('signup-modal').style.display = 'none';
        updateUI();
      })
      .catch(error => {
        alert('Error: ' + error.message);
      });
  });

  // Login Form
  document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = this.querySelector('input[type="email"]').value;
    const password = this.querySelector('input[type="password"]').value;

    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        alert('Login successful!');
        document.getElementById('login-modal').style.display = 'none';
        updateUI();
      })
      .catch(error => {
        alert('Error: ' + error.message);
      });
  });
}

// Logout Function
function logout() {
  auth.signOut().then(() => {
    alert('Logged out successfully');
    updateUI();
  });
}

// Update UI based on auth state
function updateUI() {
  const user = auth.currentUser;
  const authButtons = document.querySelector('.auth-buttons');
  const userProfile = document.getElementById('user-profile');

  if (user) {
    authButtons.style.display = 'none';
    userProfile.style.display = 'flex';
    userProfile.querySelector('span').textContent = `Welcome, ${user.email}`;
  } else {
    authButtons.style.display = 'flex';
    userProfile.style.display = 'none';
  }
}

// ===== UNIVERSITY TABS =====
function switchUniversity(universityId) {
  // Remove active class from all tabs
  document.querySelectorAll('.uni-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Add active class to clicked tab
  event.target.classList.add('active');
  
  // Hide all content
  document.querySelectorAll('.uni-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // Show selected content
  document.getElementById(`${universityId}-content`).classList.add('active');
}

// ===== BUSINESS FORM =====
function setupBusinessForm() {
  document.getElementById('business-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const restaurantName = e.target.querySelector('input[type="text"]').value;
    const email = e.target.querySelector('input[type="email"]').value;
    
    alert(`Thank you, ${restaurantName}! We'll contact you at ${email} soon.`);
    e.target.reset();
  });
}

// ===== PROFILE MODAL =====
function showProfileModal() {
  alert('Profile feature coming soon!');
}

// ===== INITIALIZE EVERYTHING =====
document.addEventListener('DOMContentLoaded', function() {
  setupAuthListeners();
  setupBusinessForm();
  
  // Listen for auth state changes
  auth.onAuthStateChanged(user => {
    updateUI();
  });
  
  console.log('PompoPompo website loaded successfully!');
});