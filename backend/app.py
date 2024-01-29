from flask import Flask
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
from flasgger import Swagger

from db import db
from apis import blueprint


def create_app():
    app = Flask("hangman-app")
    Swagger(app)
    app.config["SQLALCHEMY_DATABASE_URI"] = "mysql://database:K19712492Sj*@34.64.32.1:3306/hangman-data"
    CORS(app)

    limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=["5 per seconds"],
        storage_uri="memory://",
    )
    db.init_app(app)
    app.register_blueprint(blueprint)

    with app.app_context():
        db.create_all()

    return app

# app = create_app()

# if __name__ == "__main__":
#     app = create_app()
#     with app.app_context():
#         db.create_all()
#     app.run(debug=True, port=5000)