"""
Entry point for FastAPI application.
"""
import uvicorn
from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def app_root():
    """
    Root endpoint for FastAPI application.
    """
    return {"Hello": "World"}


def start():
    """
    Starts the FastAPI application.
    """
    uvicorn.run('<%= moduleName %>.main:app', host="0.0.0.0", port=<%= port %>, reload=True)
