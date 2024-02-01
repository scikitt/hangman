from flask import Flask
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
from flasgger import Swagger

from db import db, init_db
from apis import blueprint


def create_app():

    app = Flask("hangman-app")  # app은 어떤 변순가요? -> Flask라는 class의 instance
    Swagger(app)

    db_user = 'database'
    db_password = 'K19712492Sj'
    db_name = 'hangman-data'
    cloud_sql_connection_name = 'hangman-id'

    # SQLAlchemy 연결 URI 생성
    uri = f"mysql+mysqldb://{db_user}:{db_password}@/{db_name}?unix_socket=/cloudsql/{cloud_sql_connection_name}"

    app.config["SQLALCHEMY_DATABASE_URI"] = uri
    CORS(app)

    limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=["5 per second"],
        storage_uri="memory://",
    )
    init_db(app)
    app.register_blueprint(blueprint)

    with app.app_context():
        db.create_all()

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0")