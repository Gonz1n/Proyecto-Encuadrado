import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db import Base, get_session
from app.main import app
from app.settings import settings

pytest_plugins = ["tests.factories"]


@pytest.fixture(scope="session")
def test_engine():
    if not settings.test_database_url:
        pytest.exit("TEST_DATABASE_URL no esta definida en api/.env", returncode=2)
    if settings.test_database_url == settings.database_url:
        pytest.exit("TEST_DATABASE_URL no puede ser igual a DATABASE_URL: se abortan las pruebas", returncode=2)
    engine = create_engine(settings.test_database_url, pool_pre_ping=True)
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def session(test_engine):
    connection = test_engine.connect()
    transaction = connection.begin()
    db = Session(
        bind=connection,
        join_transaction_mode="create_savepoint",
        autoflush=False,
        expire_on_commit=False,
    )
    yield db
    db.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(session):
    app.dependency_overrides[get_session] = lambda: session
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def auth_client(session, client):
    def make(user) -> TestClient:
        from app.accounts import repository

        token = repository.get_or_create_token(session, user)
        authed = TestClient(app)
        authed.headers["Authorization"] = f"Bearer {token.key}"
        return authed

    return make
