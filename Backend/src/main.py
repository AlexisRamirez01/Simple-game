from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from src.models.db import engine, Base, get_db
from src.api import api_router
from src.websocket import websocket_router
from src.constants import WS_TEST_HTML
from fastapi.staticfiles import StaticFiles

from src.settings import settings

app = FastAPI()

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)
app.include_router(websocket_router)

app.mount("/static", StaticFiles(directory="src/statics"), name="static")

Base.metadata.create_all(bind=engine)

@app.get("/ws_test")
async def websocket_test():
    return HTMLResponse(WS_TEST_HTML)

