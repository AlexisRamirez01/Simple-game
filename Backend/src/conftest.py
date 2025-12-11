import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.models.db import Base, get_db
from src.main import app
import os

TEST_DB_FILE = "./test_cards.db"
TEST_DB_URL = f"sqlite:///{TEST_DB_FILE}"

engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Fixture que crea la DB al inicio del módulo y la destruye al final
@pytest.fixture(scope="module")
def test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    if os.path.exists(TEST_DB_FILE):
        os.remove(TEST_DB_FILE)

@pytest.fixture(scope="module")
def client(test_db):
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides[get_db] = get_db  # limpiar override al final

@pytest.fixture
def db_session(test_db):
    """Devuelve una sesión de base de datos limpia para cada test unitario."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()