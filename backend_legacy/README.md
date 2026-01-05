# Campus Eats - FastAPI Backend

A Python FastAPI backend for the Campus Eats mobile application, integrated with Appwrite.

## Features

- Authentication (login/register with email OTP)
- Order management
- Admin analytics
- Payment verification (manual + future webhook support)
- Email notifications

## Setup

```bash
cd backend_python
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Environment Variables

Create a `.env` file:
```env
APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_DATABASE_ID=your_database_id

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Encryption
ENCRYPTION_KEY=your_fernet_key
```

## Running

```bash
uvicorn app.main:app --reload --port 8000
```

## API Docs

Once running, visit: http://localhost:8000/docs
