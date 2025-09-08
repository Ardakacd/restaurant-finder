# Cafe Finder Backend

FastAPI backend for the Cafe Finder mobile application.

## Features

- **Authentication**: JWT-based user authentication
- **Cafe Search**: Integration with Google Places API (placeholder implementation)
- **Cafe Details**: Detailed cafe information with reviews
- **Favorites**: User favorite cafe management
- **Database**: SQLAlchemy with SQLite (easily configurable for PostgreSQL)

## Setup

1. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment configuration**:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Run the application**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user info

### Cafes
- `GET /cafes/search?q={query}&location={location}` - Search cafes
- `GET /cafes/{cafe_id}` - Get cafe details

### Favorites
- `GET /favorites/` - Get user favorites
- `POST /favorites/` - Add cafe to favorites
- `DELETE /favorites/{cafe_id}` - Remove from favorites

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Google Places API

The current implementation uses placeholder data. To use real Google Places API:

1. Get API key from Google Cloud Console
2. Enable Places API
3. Add API key to `.env` file
4. Update `services/google_places.py` with real API calls

## Database

Default configuration uses SQLite. For PostgreSQL:

1. Install PostgreSQL
2. Update `DATABASE_URL` in `.env`
3. Install `psycopg2-binary` (already in requirements.txt)

## Production Deployment

1. Set strong `SECRET_KEY` in environment
2. Use PostgreSQL database
3. Configure CORS origins
4. Use reverse proxy (nginx)
5. Set up SSL/TLS
