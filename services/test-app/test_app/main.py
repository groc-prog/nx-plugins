"""
Entry point for FastAPI application.
"""
import uvicorn
from fastapi import FastAPI
from lib_1.utils import log, prefix

app = FastAPI()


@app.get("/")
def app_root():
    """
    Root endpoint for FastAPI application.
    """
    return {"Hello": prefix("World")}


def start():
    """
    Starts the FastAPI application.
    """
    log("APP STARTING")
    uvicorn.run("test_app.main:app", host="0.0.0.0", port=8080, reload=True)
