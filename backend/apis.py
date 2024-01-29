import uuid
import os
from typing import Union, Tuple

from flask import request, jsonify, Blueprint
from faker import Faker

from models import User, EncodedWord
from db import db


blueprint = Blueprint("hangman_api", __name__)

def confirm_user_info(user_name: str, user_number: str):
    target_user = None
    target_user = User.query.filter_by(user_name=user_name, user_number=user_number).first()
    return target_user
        
def find_user_info(user_name: str):
    target_user = None
    target_user = User.query.filter_by(user_name=user_name).first()
    return target_user

def add_user_info(user_name: str, user_number: int):
    new_user = User(user_name=user_name, user_number=user_number, user_score=0)
    db.session.add(new_user)
    db.session.commit()
    return confirm_user_info(user_name, user_number)
    
def update_user_info(user_name: str, score: int):
    user = User.query.filter_by(user_name=user_name).first()
    user.user_score += score
    db.session.commit()

def generate_target_word() -> Tuple[uuid.UUID, int]:
    target_word = ""
    while True:
        target_word = Faker().word().lower()
        if len(target_word) < 5:
            continue
        break
    target_word_length = len(target_word)
    new_target_word = EncodedWord(word=target_word, uuid_id=uuid.uuid4())
    db.session.add(new_target_word)
    db.session.commit()
    return new_target_word.uuid_id, target_word_length

def find_decoded_word(target_uuid: uuid.UUID) -> str:
    target_word: EncodedWord = EncodedWord.query.filter_by(uuid_id=target_uuid).first()
    return target_word.word

@blueprint.route("/login", methods=["POST"])
def initLogin():
    data = request.json
    user_name = data.get("user_name")
    user_number = data.get("user_number")

    if not user_name or not user_number:
        return {"message": "error"}, 400

    target_user: Union[None, User] = confirm_user_info(user_name, user_number)
    if not target_user:
        target_user = find_user_info(user_name)
        if not target_user:
            target_user = add_user_info(user_name, user_number)
        else:
            return {"message": "wrong_number"}, 422

    return {
        "user_name": user_name,
    }

@blueprint.route("/word", methods=["GET"])
def get_target_word():
    target_word_uuid, target_word_length = generate_target_word()
    return {
        "encoded_word": str(target_word_uuid),
        "target_word_length": int(target_word_length),
    }

@blueprint.route("/guess", methods=["POST"])
def guess_word():
    data = request.json
    target_word = find_decoded_word(uuid.UUID(data["encoded_word"]))
    input_word = data["word"]
    target_idx = list()

    if input_word in target_word:
        for idx, s in enumerate(target_word):
            if s == input_word:
                target_idx.append(idx)

    return {
        "target_idx": target_idx,
    }

@blueprint.route("/score", methods=["POST"])
def carculate_score():
    data = request.json
    user_name = data["user_name"]
    opportunity = data["opportunity"]
    is_win = data["is_win"]
    text_length = data["text_length"]

    if is_win:
        score = int(opportunity * text_length)
    else:
        score = 0
    
    update_user_info(user_name, score)
    return {
        "score": int(score),
    }

@blueprint.route("/leaderboard", methods=["GET"])
def get_leaderboard():
    ordered_data = User.query.order_by(User.user_score.desc())
    page = request.args.get("page", type=int, default=1)
    per_page = request.args.get("per_page", 10, type=int)
    paginated_data = ordered_data.paginate(page=page, per_page=per_page)
    response = {
        "user_info": [
            {
                "id": user.id,
                "user_name": user.user_name,
                "user_number": user.user_number,
                "user_score": user.user_score,
            }
            for user in paginated_data.items
        ],
        "current_page": paginated_data.page,
        "per_page": paginated_data.per_page,
        "total_pages": paginated_data.pages,
    }
    return jsonify(response), 200

@blueprint.route("/user-ranking/<user_name>", methods=["GET"])
def get_user_ranking(user_name: str):
    target_user = find_user_info(user_name)
    response = {
        "user_info": {
            "id": target_user.id,
            "user_name": target_user.user_name,
            "user_score": target_user.user_score,
        }
    }
    return jsonify(response), 200