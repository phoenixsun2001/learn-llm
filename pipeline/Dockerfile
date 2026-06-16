# ============================================
# Python Pipeline + Admin Dashboard
# ============================================
FROM python:3.11-slim

WORKDIR /app

# Install lightweight Python deps only (curl not needed: pure-Python app)
COPY requirements-docker.txt ./
RUN pip install --no-cache-dir -r requirements-docker.txt

# Optional: Uncomment to add ML features (adds ~3GB to image)
# RUN pip install --no-cache-dir sentence-transformers chromadb anthropic

# Copy pipeline code
COPY . .
RUN mkdir -p /app/data

EXPOSE 8400

CMD ["python", "-m", "uvicorn", "admin_dashboard.main:app", "--host", "0.0.0.0", "--port", "8400"]
