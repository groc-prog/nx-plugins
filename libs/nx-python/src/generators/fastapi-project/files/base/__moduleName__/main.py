"""
Entry point for FastAPI application.
"""
from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def app_root():
    """
    Root endpoint for FastAPI application.
    """
    return {"Hello": "World"}
