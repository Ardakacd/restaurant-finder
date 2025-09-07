# Cafe Finder App

A modern React Native mobile application for discovering and managing favorite cafes, built with Expo and TypeScript.

## 🚀 Features

### Frontend (React Native + Expo)
- **Modern UI**: Clean white background design with React Native Paper
- **Navigation**: Bottom tab navigation with stack navigation for details
- **Search**: Search for cafes with real-time results
- **Cafe Details**: Detailed view with ratings, reviews, contact info, and hours
- **Favorites**: Save and manage favorite cafes (requires authentication)
- **Authentication**: User registration and login with JWT tokens
- **Profile**: User profile management and statistics

### Backend (FastAPI)
- **REST API**: Complete RESTful API with OpenAPI documentation
- **Authentication**: JWT-based secure authentication
- **Database**: SQLAlchemy with SQLite (PostgreSQL ready)
- **Google Places Integration**: Placeholder for Google Places API
- **CORS Support**: Cross-origin resource sharing for mobile app

## 📱 Screenshots

The app features a clean, modern interface with:
- Home screen with featured cafes and popular searches
- Search functionality with cafe listings
- Detailed cafe information with reviews
- User favorites management
- Authentication screens

## 🛠 Tech Stack

### Frontend
- **React Native** with **Expo**
- **TypeScript** for type safety
- **React Navigation** for navigation
- **React Native Paper** for UI components
- **Expo Vector Icons** for iconography
- **Axios** for API requests
- **Expo Secure Store** for token storage

### Backend
- **FastAPI** for API framework
- **SQLAlchemy** for database ORM
- **Pydantic** for data validation
- **JWT** for authentication
- **Uvicorn** for ASGI server
- **SQLite/PostgreSQL** for database

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- Expo CLI (`npm install -g @expo/cli`)

### Frontend Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Run on device/simulator**:
   - iOS: `npm run ios`
   - Android: `npm run android`
   - Web: `npm run web`

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Start the server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## 📁 Project Structure

```
restaurant-finder/
├── src/
│   ├── components/          # Reusable UI components
│   ├── navigation/          # Navigation configuration
│   ├── screens/            # App screens
│   ├── services/           # API service layer
│   └── types/              # TypeScript type definitions
├── backend/
│   └── app/
│       ├── database/       # Database configuration
│       ├── models/         # Database models and schemas
│       ├── routers/        # API route handlers
│       └── services/       # Business logic services
└── assets/                 # Static assets
```

## 🔧 Configuration

### Frontend Configuration
- Update `API_BASE_URL` in `src/services/api.ts` to match your backend URL
- Modify theme colors in `App.tsx` if desired

### Backend Configuration
- Copy `backend/env.example` to `backend/.env`
- Set `SECRET_KEY` for JWT tokens
- Configure `DATABASE_URL` for your database
- Add `GOOGLE_PLACES_API_KEY` for real Google Places integration

## 🌐 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /cafes/search` - Search cafes
- `GET /cafes/{id}` - Get cafe details
- `GET /favorites/` - Get user favorites
- `POST /favorites/` - Add to favorites

## 🔐 Authentication

The app uses JWT tokens for authentication:
- Tokens are stored securely using Expo Secure Store
- Automatic token refresh and validation
- Protected routes require authentication

## 📊 Database Schema

### Users
- ID, email, name, hashed password
- Many-to-many relationship with cafes (favorites)

### Cafes
- ID, name, rating, address, contact info
- Google Places integration fields
- One-to-many relationship with reviews

### Reviews
- ID, author, rating, text, timestamp
- Linked to cafes

## 🚀 Deployment

### Frontend (Expo)
```bash
expo build:android
expo build:ios
```

### Backend (Production)
1. Use PostgreSQL database
2. Set environment variables
3. Configure reverse proxy (nginx)
4. Set up SSL/TLS
5. Use process manager (PM2, systemd)

## 🔄 Google Places API Integration

The current implementation uses placeholder data. To integrate real Google Places API:

1. Get API key from Google Cloud Console
2. Enable Places API and Geocoding API
3. Update `backend/app/services/google_places.py`
4. Add API key to backend environment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please check the documentation or create an issue on GitHub.

---

**Happy Cafe Hunting! ☕️**
