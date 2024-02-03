from flask import Flask
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
from flasgger import Swagger

from db import db
from apis import blueprint


def create_app():
    app = Flask("hangman-app")  # app은 어떤 변순가요? -> Flask라는 class의 instance
    Swagger(app)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqlconnector://scikit:9799dnPh7*@scikit.mysql.pythonanywhere-services.com/hangman-data'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    CORS(app)

    limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=["5 per second"],
        storage_uri="memory://",
    )
    db.init_app(app)
    app.register_blueprint(blueprint)

    with app.app_context():
        db.create_all()

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0",  port=5000)