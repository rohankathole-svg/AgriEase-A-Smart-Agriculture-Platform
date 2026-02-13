# AgriEase Frontend

Modern React application for AgriEase - An agricultural platform helping farmers with crop management, disease detection, marketplace, and AI assistance.

## 🚀 Tech Stack

- **React 18** - UI Framework
- **Vite** - Build tool & dev server
- **React Router** - Navigation
- **Axios** - API calls
- **Framer Motion** - Animations
- **React Toastify** - Notifications
- **Grok AI** - Intelligent chatbot

## 📦 Installation

```bash
npm install
```

## ⚙️ Configuration

### 1. Environment Variables

Create a `.env` file in the frontend folder:

```bash
cp .env.example .env
```

Add your Grok API key:

```env
VITE_GROK_API_KEY=your_grok_api_key_here
```

**Get your API key:** [xAI Console](https://console.x.ai)

📖 **Full chatbot setup guide:** See [CHATBOT_SETUP.md](CHATBOT_SETUP.md)

### 2. Backend Connection

Ensure the Spring Boot backend is running on `http://localhost:8080`

## 🏃 Running the App

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will open at `http://localhost:5173`

## 🌟 Features

### For Farmers
- **AI Chatbot** - Get instant farming advice powered by Grok AI
- **Disease Detection** - Upload plant images for disease diagnosis
- **Shopping Cart** - Unified cart for products, crops, and equipment
- **Marketplace** - Browse and purchase farming supplies
- **Equipment Rental** - Rent tools with flexible dates
- **Weather Widget** - Real-time weather information
- **Crop Management** - Track and manage your crops

### For Suppliers
- **Product Management** - List products and equipment
- **Order Tracking** - View and manage bookings
- **Dashboard** - Overview of business metrics

## 📁 Project Structure

```
src/
├── api/              # Axios configuration
├── auth/             # Authentication context & protected routes
├── components/       # Reusable components (Header, Footer, etc.)
├── context/          # Global state (CartContext)
├── pages/            # Page components
│   ├── farmer/       # Farmer dashboard pages
│   └── supplier/     # Supplier dashboard pages
├── services/         # API services (Gemini, Weather, Disease)
├── styles/           # CSS files
└── App.jsx           # Main app component
```

## 🔑 Key Components

- **CartContext** - Global cart state management
- **Chatbot** - AI-powered assistant using Gemini API
- **DashboardLayout** - Shared layout with navigation
- **CropDiseaseDetector** - Image upload and analysis
- **WeatherWidget** - Location-based weather display
- **Chatbot** - AI-powered assistant using Grok API

## 🔐 Authentication

The app uses JWT-based authentication:
- Login/Register pages for role selection (Farmer/Supplier)
- Protected routes based on user role
- Token stored in localStorage
- Automatic token inclusion in API requests

## 🛠️ Development

### ESLint Configuration

```bash
npm run lint
```

### Build Optimization

- Tree-shaking enabled
- Code splitting by route
- Lazy loading for heavy components
- Optimized image loading

## 📱 Responsive Design

The app is fully responsive with breakpoints at:
- Mobile: < 960px
- Tablet: 960px - 1280px  
- Desktop: > 1280px

## 🤖 Chatbot Features

- Context-aware conversations
- Agriculture-specific knowledge
- Fallback responses when offline
- Loading indicators
- Enter key support
- Conversation history

## 🚨 Troubleshooting

### Chatbot not working?
1. Check API key in `.env`
2. Restart dev server after adding key
3. Check console for warnings
4. See [CHATBOT_SETUP.md](CHATBOT_SETUP.md)

### Backend connection issues?
1. Verify backend is running on port 8080
2. Check CORS configuration
3. Verify API endpoints in axios.js

### Cart not persisting?
- Cart uses localStorage
- Check browser privacy settings
- Clear cache if experiencing issues

## 📄 License

Part of the AgriEase project for agricultural management.

---

## Template Information

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

