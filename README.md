# CallMe Reminder

A modern, full-stack reminder application that calls you with voice reminders at scheduled times using Vapi AI. Built with Next.js, FastAPI, and premium UI/UX design.

![CallMe Reminder](https://img.shields.io/badge/Status-Production%20Ready-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6)

## ✨ Features

- **📞 Voice Call Reminders**: Automatically calls your phone and speaks your reminder message
- **🎨 Premium UI/UX**: Beautiful, responsive design with smooth animations
- **📊 Dashboard**: View all reminders with filtering, search, and status badges
- **⏰ Real-time Countdown**: See time remaining for scheduled reminders
- **🔄 Auto-refresh**: Dashboard updates automatically every 10 seconds
- **📱 Fully Responsive**: Works perfectly on mobile, tablet, and desktop

## 🏗️ Architecture

```
callMeReminder/
├── frontend/          # Next.js 14 (App Router)
│   ├── src/
│   │   ├── app/       # Pages and layouts
│   │   ├── components/
│   │   │   ├── ui/    # Reusable UI primitives
│   │   │   ├── reminder/  # Reminder-specific components
│   │   │   ├── dashboard/ # Dashboard components
│   │   │   └── layout/    # Layout components
│   │   ├── lib/       # Utilities and API client
│   │   └── types/     # TypeScript types
│   └── ...
├── backend/           # FastAPI Python
│   ├── main.py        # API endpoints
│   ├── models.py      # SQLAlchemy models
│   ├── schemas.py     # Pydantic schemas
│   ├── database.py    # Database configuration
│   ├── scheduler.py   # Background job scheduler
│   ├── vapi_service.py # Vapi integration
│   └── config.py      # Settings management
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **Vapi Account**: Sign up at [vapi.ai](https://vapi.ai) (free tier available)
- **Twilio Account** (optional): For your own phone number

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd callMeReminder
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
# Copy env.example.txt to .env and fill in your values:
```

Create `backend/.env` with your configuration:

```env
# Vapi Configuration
VAPI_API_KEY=your_vapi_api_key_here
VAPI_PHONE_NUMBER_ID=your_vapi_phone_number_id_here

# Database
DATABASE_URL=sqlite:///./reminders.db

# Server
HOST=0.0.0.0
PORT=8000
```

**How to get Vapi credentials:**

1. Go to [Vapi Dashboard](https://dashboard.vapi.ai)
2. Navigate to **Settings** → **API Keys** to get your `VAPI_API_KEY`
3. Navigate to **Phone Numbers** → Import/Buy a number → Copy the Phone Number ID

```bash
# Run the backend server
python main.py
# or
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### 3. Frontend Setup

```bash
# Navigate to frontend (from project root)
cd frontend

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Run development server
npm run dev
```

The app will be available at `http://localhost:3000`

## 🔄 How Scheduling Works

The backend uses **APScheduler** to process due reminders:

1. A background job runs every **15 seconds**
2. It queries for reminders where:
   - `status` = `SCHEDULED`
   - `scheduled_at` <= current time
3. For each due reminder:
   - Status is updated to `IN_PROGRESS`
   - Vapi API is called to initiate a phone call
   - On success: Status → `COMPLETED`, call ID is saved
   - On failure: Status → `FAILED`, error message is saved

## 📱 Testing the Call Workflow

1. **Start both servers** (backend on :8000, frontend on :3000)

2. **Create a test reminder**:
   - Click "New Reminder"
   - Enter your phone number in E.164 format (e.g., `+14155551234`)
   - Set the time to **2-3 minutes in the future**
   - Enter a title and message
   - Click "Create Reminder"

3. **Watch the dashboard**:
   - Status will show "Scheduled" with countdown
   - When time hits, status changes to "In Progress"
   - After call completes, status shows "Completed" or "Failed"

4. **Check your phone**:
   - You'll receive a call from Vapi
   - An AI assistant will speak your reminder message

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reminders` | List all reminders (with filters) |
| `POST` | `/api/reminders` | Create a new reminder |
| `GET` | `/api/reminders/{id}` | Get a specific reminder |
| `PUT` | `/api/reminders/{id}` | Update a reminder |
| `DELETE` | `/api/reminders/{id}` | Delete a reminder |
| `GET` | `/api/stats` | Get reminder statistics |

### Query Parameters for List

- `status`: Filter by status (`scheduled`, `completed`, `failed`, `in_progress`)
- `search`: Search by title or message
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

## 🎨 Design System

### Colors

- **Primary**: Deep blue gradient (`#3294ff` → `#1a73f5`)
- **Surface**: Slate gray scale for backgrounds and text
- **Success**: Emerald green for completed states
- **Danger**: Red for failures and destructive actions
- **Warning**: Amber for in-progress states

### Components

- **Button**: Multiple variants (primary, secondary, ghost, danger, outline)
- **Input/Textarea**: With labels, hints, and error states
- **Select**: Custom styled dropdown
- **Card**: Elevated, bordered, and glass variants
- **Badge**: Status indicators with pulse animations
- **Modal**: Animated dialog with backdrop blur
- **EmptyState**: Decorative empty state with CTA
- **Skeleton**: Loading placeholders

### Typography

- **Sans**: Outfit (body text)
- **Display**: Space Grotesk (headings)
- **Mono**: JetBrains Mono (phone numbers)

## 🐳 Docker Support (Optional)

Create a `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - VAPI_API_KEY=${VAPI_API_KEY}
      - VAPI_PHONE_NUMBER_ID=${VAPI_PHONE_NUMBER_ID}
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on:
      - backend
```

## 🔧 Troubleshooting

### Call not triggering?

1. Check backend logs for scheduler activity
2. Verify Vapi credentials in `.env`
3. Ensure phone number is in E.164 format
4. Check if reminder time is in the future (UTC)

### Frontend not connecting to backend?

1. Verify backend is running on port 8000
2. Check CORS settings in `main.py`
3. Ensure `NEXT_PUBLIC_API_URL` is set correctly

### Vapi call failing?

1. Check Vapi dashboard for error logs
2. Verify phone number ID is correct
3. Ensure you have credits in your Vapi account

## 📄 License

MIT

---

Built with ❤️ using Next.js, FastAPI, and Vapi AI
