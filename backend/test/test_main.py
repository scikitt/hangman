import pytest

from app import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_ping(client):
    res = client.get("/api/ping")
    assert res.status_code == 200
    assert res.json == {"message": "ok"}


# def test_not_found_api(client):
#     # res = client.get("/api/aspoas")
#     assert 404 == 404
