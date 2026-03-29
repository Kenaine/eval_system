FROM python:3.13.7-slim
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app
RUN apt-get update && apt-get install -y build-essential \
    && rm -rf /var/lib/apt/lists/*
# Copy only requirements first
COPY backend/requirements.txt .
# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt
# Copy the backend source code
COPY backend/ .
# Start FastAPI
CMD ["sh", "-c", "uvicorn api:app --host 0.0.0.0 --port ${PORT:-8000}"]
