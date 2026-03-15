FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY locustfile.py .

ENV LOCUST_HOST=http://frontend:8080
ENV LOCUST_USERS=5
ENV LOCUST_SPAWN_RATE=1
ENV LOCUST_WEB_PORT=8089
ENV LOCUST_AUTOSTART=true

EXPOSE 8089

# Locust reads config from environment variables natively
CMD ["locust"]
