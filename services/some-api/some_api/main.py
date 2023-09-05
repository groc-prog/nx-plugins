"""
Entry point for FastAPI application.
"""
from better_logger.main import log_better
from fastapi import FastAPI
from random_number.main import random_number

app = FastAPI()


@app.get("/")
def app_root():
    """
    Root endpoint for FastAPI application.
    """
    log_better("Hello from FastAPI!")
    return {"number": random_number()}
