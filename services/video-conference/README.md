# Video Conference Service

Create meetings with attendees.

## Setup

1. **Copy environment file:**
```bash
cp .env.example .env
```

2. **Edit `.env` file with your configuration:**
```bash
DATABASE_URL=postgresql://user:password@localhost/dbname
HOST=0.0.0.0
PORT=8000
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Run service:**
```bash
python app.py
```

## Environment Variables

All configuration is in `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `sqlite:///./sessions.db` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `API_PREFIX` | API prefix | `/api/v1` |
| `APP_NAME` | Application name | `Video Conference Service` |
| `APP_VERSION` | Application version | `1.0.0` |
| `DEBUG` | Debug mode | `false` |
| `LOG_LEVEL` | Logging level | `INFO` |

## API

```bash
POST /api/v1/meetings
{
  "host_id": "doctor123",
  "attendee_id": "patient456"
}
```

## Structure

```
services/video-conference/
├── src/
│   ├── api/
│   │   └── meetings.py          # HTTP endpoints
│   ├── use_cases/
│   │   └── create_meeting.py    # Business logic
│   ├── models.py                 # Entities + DTOs + DB models
│   ├── database.py               # DB connection
│   └── config.py                 # Environment configuration
├── app.py                        # FastAPI entrypoint
├── .env.example                  # Environment template
└── requirements.txt
```
