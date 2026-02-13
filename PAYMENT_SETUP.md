# AgriEase - Payment Integration Guide

## 🛒 Complete Checkout Flow Implementation

This implementation includes:
- **Checkout Page**: Complete form with shipping details
- **Payment Gateway**: Razorpay integration for online payments
- **UPI QR Code**: Real-time QR code generation for UPI payments
- **Cash on Delivery**: COD option available
- **Order History**: Farmers can view their order history
- **Supplier Dashboard**: Suppliers receive order notifications and can manage orders

---

## 🚀 Quick Start

### 1. Frontend Routes Added

**Farmer Routes:**
- `/farmer/checkout` - Checkout page with shipping form
- `/farmer/payment` - UPI QR code payment page
- `/farmer/orders` - Order history for farmers

**Supplier Routes:**
- `/supplier/orders` - View and manage incoming orders

### 2. Payment Methods Supported

#### a) **Online Payment** (Razorpay)
- Credit/Debit Cards
- UPI
- Net Banking
- Wallets (Paytm, PhonePe, etc.)

#### b) **UPI QR Code**
- Generates dynamic QR code
- Real-time payment tracking
- Transaction ID verification

#### c) **Cash on Delivery**
- Direct order placement
- Payment on delivery

---

## 🔧 Setup Instructions

### Step 1: Get Razorpay API Keys

1. Sign up at [https://razorpay.com/](https://razorpay.com/)
2. **For Local Development (Testing):**
   - Website: Enter `http://localhost:5173` or `http://localhost:3000`
   - Android: Leave as `https://play.google.com/store/apps/details?id=` (not required for web testing)
   - iOS: Leave as `https://apps.apple.com/` (not required for web testing)
   - **Note**: Razorpay test mode works with localhost URLs
3. Go to Settings → API Keys
4. Generate **Test Mode** keys (NOT Live keys)
5. Copy your Test Key ID (starts with `rzp_test_`)
6. **Important**: Never share your Key Secret publicly

### Step 2: Update Razorpay Key

Edit [Checkout.jsx](c:\\College+Study\\BE\\BE Projects\\NEWPROJCT\\Agriease\\frontend\\src\\pages\\farmer\\Checkout.jsx):

```javascript
const options = {
  key: "rzp_test_YOUR_KEY_HERE", // Replace with your test key (starts with rzp_test_)
  amount: getCartTotal() * 100,
  currency: "INR",
  // ... rest of config
};
```

**Example Test Key**: `rzp_test_1DP5mmOlF5G5ag`

### Step 3: Update UPI ID

Edit [Payment.jsx](c:\\College+Study\\BE\\BE Projects\\NEWPROJCT\\Agriease\\frontend\\src\\pages\\farmer\\Payment.jsx):

```javascript
const [upiId, setUpiId] = useState("YOUR-UPI-ID@provider"); // Replace with your UPI ID
```

**Your UPI ID format:** `yourname@paytm`, `yourname@googlepay`, etc.

---

## 📱 How It Works

### For Farmers:

1. **Add to Cart**: Browse products/equipment and add to cart
2. **Checkout**: Click "Checkout" → Fill shipping details
3. **Choose Payment**:
   - **Online**: Opens Razorpay widget → Complete payment
   - **UPI QR**: Shows QR code → Scan and pay → Enter transaction ID
   - **COD**: Order placed immediately

4. **Track Orders**: View order history in Orders page

### For Suppliers:

1. **Receive Notifications**: Orders appear in Supplier Orders page
2. **View Details**: Customer info, items, payment method
3. **Update Status**:
   - **Confirm**: Accept the order
   - **Delivered**: Mark as delivered
   - **Cancel**: Cancel the order

---

## 🎨 Features Implemented

### Frontend Components

✅ **Checkout.jsx**
- Shipping address form
- Payment method selection
- Order summary
- Cart validation

✅ **Payment.jsx**
- Dynamic UPI QR code generation
- Transaction ID confirmation
- Payment instructions
- Real-time order processing

✅ **Orders.jsx** (Farmer)
- Order history with status badges
- Item details and pricing
- Shipping information
- Payment method display

✅ **SupplierOrders.jsx**
- Incoming order list
- Customer details
- Status management buttons
- Order confirmation/cancellation

### Backend Endpoints

✅ **POST `/farmer/orders`**
- Creates new order
- Stores shipping details
- Links to supplier

✅ **GET `/farmer/orders`**
- Returns farmer's order history

✅ **POST `/farmer/payment/confirm`**
- Confirms UPI payment with transaction ID

✅ **POST `/farmer/payment/verify`**
- Verifies Razorpay payment signature

✅ **GET `/supplier/orders`**
- Returns orders for supplier's products

✅ **PUT `/supplier/orders/{id}/status`**
- Updates order status (PENDING → CONFIRMED → DELIVERED)

---

## 🗄️ Database Schema

### Orders Table
```sql
- id (PK)
- user_id (FK to User)
- shipping_address (Embedded)
- payment_method (online/upi/cod)
- payment_status (PENDING/PAID/FAILED)
- status (PENDING/CONFIRMED/DELIVERED/CANCELLED)
- total_amount
- created_at
- updated_at
```

### Order Items Table
```sql
- id (PK)
- order_id (FK)
- supplier_id (FK to User)
- product_id
- product_type (product/equipment/crop)
- name
- price
- quantity
- image_url
- start_date, end_date (for equipment)
- days, daily_rate (for equipment)
```

---

## 🔒 Security Notes
**Test Mode**: Use test keys (rzp_test_xxx) for development
- **Website URL**: Use `http://localhost:5173` for local testing
- Never expose Razorpay Key Secret in frontend (only use Key ID)
- All payment verifications happen on backend
- Transaction IDs are validated before order confirmation
- **Production**: Switch to live keys and add your actual domain (https required)pen on backend
- Transaction IDs are validated before order confirmation
- HTTPS required for production

---

## Razorpay Account Setup for Testing:
1. **Sign up** on Razorpay
2. **Stay in Test Mode** (toggle in top right)
3. **Website URL**: Enter `http://localhost:5173` (your frontend port)
4. **App Links**: Not needed for web testing - leave defaults
5. Get your **Test API Key** (rzp_test_...)

### Test Cards (Razorpay Test Mode):
- **Card Number**: `4111 1111 1111 1111`
- **CVV**: Any 3 digits (e.g., `123`)
- **Expiry**: Any future date (e.g., `12/25`)
- **Cardholder Name**: Any name

### Test UPI:
- **UPI ID**: Use any format like `success@razorpay`
- All test payments are **automatically successful**
- No real money is charged in test mode

### Test Wallets:
- **Paytm**: Use test credentials provided by Razorpay
- **PhonePe, GPay**: Simulated in test mode
- Use any UPI ID in test mode
- Payments are simulated

---

## 📊 Order Status Flow

```
1. PENDING (Initial state)
   ↓
2. CONFIRMED (Supplier accepts)
   ↓
3. DELIVERED (Supplier marks delivered)
   
   OR
   
   CANCELLED (Supplier cancels)
```

---

## 🎯 Next Steps

1. **Razorpay Webhooks**: Add webhook handler for automatic payment status updates
2. **Email Notifications**: Send order confirmations via email
3. **SMS Alerts**: Notify suppliers of new orders
4. **Refund System**: Handle cancellations and refunds
5. **Invoice Generation**: PDF invoices for completed orders

---

## 📞 Support

For payment integration issues:
- Razorpay Docs: https://razorpay.com/docs/
- QR Code API: https://goqr.me/api/

---

## ✨ Demo Flow

### Complete Order Journey:

1. **Farmer**: Adds Fertilizer (INR 500) to cart
2. **Farmer**: Proceeds to checkout
3. **Farmer**: Enters:
   ```
   Name: Rahul Kumar
   Phone: +91 9876543210
   Address: Village Rampur, Near Post Office
   City: Meerut
   State: Uttar Pradesh
   Pincode: 250002
   ```
4. **Farmer**: Selects "UPI QR Code"
5. ** System**: Generates QR code for INR 500
6. **Farmer**: Scans QR → Pays via PhonePe
7. **Farmer**: Enters Transaction ID: 123456789012
8. **System**: Confirms payment → Order #123 created

9. **Supplier**: Sees Order #123 in dashboard
10. **Supplier**: Clicks "Confirm" → Status: CONFIRMED
11. **Supplier**: Ships product
12. **Supplier**: Clicks "Mark Delivered" → Status: DELIVERED

13. **Farmer**: Checks Orders page → Sees status: DELIVERED ✓

---

**Happy Farming! 🌾**
