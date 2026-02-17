from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api import hk, auth, util, blog
from app.api.v1 import gemini
from app.core.mongodb import connect_to_mongo, close_mongo_connection

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 시작 시
    connect_to_mongo()
    yield
    # 종료 시
    close_mongo_connection()

app = FastAPI(title="Jiobi API", version="1.0.0", lifespan=lifespan)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "https://jiobi.kr",
        "http://jiobi.kr",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# API 라우터 등록
app.include_router(hk.router, prefix="/api/v1/hk", tags=["hk"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(util.router, prefix="/api/v1", tags=["util"])
app.include_router(blog.router, prefix="/api/v1", tags=["blog"])
app.include_router(gemini.router, prefix="/api/v1/gemini", tags=["gemini"])

@app.get("/")
async def root():
    return {"message": "Jiobi API", "version": "1.0.0"}

