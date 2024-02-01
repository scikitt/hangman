from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

db = SQLAlchemy()

def init_db(app):
    # Google Cloud SQL 연결 정보
    db_user = 'database'
    db_password = 'K19712492Sj'
    db_name = 'hangman-data'
    cloud_sql_connection_name = 'hangman-id'

    # SQLAlchemy 연결 URI 생성
    uri = f"mysql+mysqldb://database:K19712492Sj@localhost/hangman-data?unix_socket=/cloudsql/hangman-id"

    # Flask 애플리케이션에 데이터베이스 연결 설정
    app.config['SQLALCHEMY_DATABASE_URI'] = uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # 데이터베이스 초기화
    db.init_app(app)

    # 데이터베이스 생성 및 초기화
    with app.app_context():
        engine = create_engine(uri)
        db.metadata.create_all(engine)
