from sqlalchemy import Uuid

from db import db


class User(db.Model):
    __tablename__ = "user_info"
    id = db.Column(db.Integer, primary_key=True)
    user_name = db.Column(db.String(80), nullable=False)
    user_number = db.Column(db.String(120), nullable=False)
    user_score = db.Column(db.Integer)
    user_rank = db.Column(db.Integer)


class EncodedWord(db.Model):
    __tablename__ = "encoded_word"
    id = db.Column(db.Integer, primary_key=True)
    uuid_id = db.Column(Uuid, unique=True)
    word = db.Column(db.String(80), nullable=False)