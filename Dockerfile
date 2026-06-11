# ==========================================
# STAGE 1: The Builder (The Workshop)
# ==========================================
FROM python:3.11-slim as builder

# Set the working directory
WORKDIR /app

# Install system-level compilers needed for bcrypt and psycopg2
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Copy only the requirements file first to cache the dependency layer
COPY services/video-conference/requirements.txt .

# Install dependencies into an isolated prefix folder
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ==========================================
# STAGE 2: The Runner (Production Baseline)
# ==========================================
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Install only the runtime library for postgres (no compilers)
RUN apt-get update && apt-get install -y libpq5 && rm -rf /var/lib/apt/lists/*

# Create a non-root system user for strict security compliance
RUN groupadd -r qarevo && useradd -r -g qarevo qarevo_user

# Create a logging directory and give our restricted user ownership
RUN mkdir logs && chown qarevo_user:qarevo logs

# Copy the pre-compiled dependencies from Stage 1
COPY --from=builder /install /usr/local

# Copy the actual application code
COPY main.py .

# Lock down the container to execute ONLY as the restricted user
USER qarevo_user

# Document the port Uvicorn will broadcast on
EXPOSE 8000

# The startup command for the async event loop
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]