# Gunicorn Configuration for Production Deployment
# Campus Eats Backend

import multiprocessing
import os

# Server socket
bind = "0.0.0.0:8000"
backlog = 2048  # Number of pending connections

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
max_requests = 1000  # Restart worker after this many requests
max_requests_jitter = 50  # Add randomness to prevent simultaneous restarts

# Timeouts
timeout = 120  # Worker timeout (important for slow bcrypt)
keepalive = 5  # Keep-alive connections

# Process naming
proc_name = "campuseats"

# Logging
accesslog = "logs/access.log"
errorlog = "logs/error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Server mechanics
daemon = False  # Run in foreground (use systemd/supervisor for background)
pidfile = "gunicorn.pid"
umask = 0
user = None  # Run as current user
group = None
tmp_upload_dir = None

# SSL (if needed)
# keyfile = "/path/to/key.pem"
# certfile = "/path/to/cert.pem"

# Server hooks
def on_starting(server):
    """Called just before the master process is initialized."""
    print("🚀 Campus Eats Backend starting...")
    print(f"Workers: {server.cfg.workers}")
    print(f"Worker class: {server.cfg.worker_class}")

def when_ready(server):
    """Called just after the server is started."""
    print("✅ Server is ready. Accepting connections.")

def on_reload(server):
    """Called to recycle workers during a reload via SIGHUP."""
    print("🔄 Reloading workers...")

def worker_int(worker):
    """Called when a worker receives the SIGINT or SIGQUIT signal."""
    print(f"⚠️ Worker {worker.pid} interrupted")

def pre_fork(server, worker):
    """Called just before a worker is forked."""
    pass

def post_fork(server, worker):
    """Called just after a worker has been forked."""
    print(f"✅ Worker {worker.pid} started")

def pre_exec(server):
    """Called just before a new master process is forked."""
    print("🔄 Master process forking...")

def worker_exit(server, worker):
    """Called just after a worker has been exited."""
    print(f"⚠️ Worker {worker.pid} exited")

# Performance tuning
preload_app = True  # Load app before forking workers (saves memory)

# Environment
raw_env = [
    f"DATABASE_URL={os.getenv('DATABASE_URL', 'postgresql://shiva@localhost/campuseats')}",
]
