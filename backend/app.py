from flask import Flask
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
from flasgger import Swagger

from db import db
from apis import blueprint

# ============================================= #
# Config
# ============================================= #
# class / instance /
app = Flask("hangman-app")  # app은 어떤 변순가요? -> Flask라는 class의 instance
Swagger = Swagger(app)
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql://root@127.0.0.1:3306/hangman"
CORS(app)

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["5 per seconds"],
    storage_uri="memory://",
)


def create_app():
    db.init_app(app)
    app.register_blueprint(blueprint)
    return app


if __name__ == "__main__":
    app = create_app()
    # 아래 명령어는 위에서 만든 model object의 정보가 dbms에 존재하지 않으면
    # migrate (code level에서 DBMS에 table 및 데이터를 만드는 작업) 을 하겠다는 의미입니다.
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5555)
