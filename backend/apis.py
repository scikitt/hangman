import uuid
from typing import Union, Tuple
from datetime import datetime, timezone, timedelta

from flask import request, jsonify, Blueprint
from faker import Faker

from models import User, EncodedWord
from db import db


blueprint = Blueprint("hangman_api", __name__, url_prefix="/api")

# ============================================= #
# Custom Functions
# ============================================= #


def _get_user(nickname: str, password: str) -> Union[None, User]:
    """
    - `user_info` table에서 해당하는 user 찾기 (nickname, password)
    """
    target_user = None
    target_user = User.query.filter_by(user_name=nickname, user_pwd=password).first()
    return target_user


def _get_user_by_nickname(nickname: str) -> Union[None, User]:
    """
    - `user_info` table에서 해당하는 user 찾기 (nickname)
    """
    target_user = None
    target_user = User.query.filter_by(user_name=nickname).first()
    return target_user


def _add_user_to_data(user_name: str, password: str) -> Union[None, User]:
    """
    - `user_info` table에 신규 user 추가하기
    """
    new_user = User(user_name=user_name, user_pwd=password, user_score=0)
    db.session.add(new_user)
    db.session.commit()
    return _get_user(user_name, password)


def _update_user_by_nickname(user_name: str, score: int):
    user = User.query.filter_by(user_name=user_name).first()
    user.user_score = max(score, user.user_score)
    db.session.commit()


def generate_target_word() -> Tuple[uuid.UUID, int]:
    """
    - `encoded_word` table에 단어 생성해서 암호화된 값 (uuid) 가져오기
    """
    target_word = ""
    while True:
        target_word = Faker().word().lower()
        if len(target_word) < 5:
            continue
        break

    new_target_word = EncodedWord(word=target_word, uuid_id=uuid.uuid4())
    db.session.add(new_target_word)
    db.session.commit()
    return new_target_word.uuid_id, len(target_word)


def word_decoding(target_uuid: uuid.UUID) -> str:
    """
    - `encoded_word` table에서 `uuid` 값으로 target word 찾기
    """
    target_word: EncodedWord = EncodedWord.query.filter_by(uuid_id=target_uuid).first()
    return target_word.word


def _calculate_score(data, correctAlphabet, wrong_word):
    # 남은 목숨 점수
    life_score = data["left_life"] * 10

    # 시간 보너스 (10분을 기준으로 계산, 경과 시간은 분 단위로 가정)
    start_time = datetime.fromisoformat(data["start_time"])  # local 시간대
    start_time = start_time - timedelta(hours=9)
    start_time = start_time.replace(tzinfo=timezone.utc)
    current_time = datetime.utcnow().replace(tzinfo=timezone.utc)
    elapsed_time = (
        current_time - start_time
    ).seconds  # 몇 초 만에 풀었는가! -> 작을 수 록 점수가 높아야 한다!

    # 승리 보너스
    win_bonus = 100 if data["is_win"] else 0

    # 맞춤 보너스
    # (틀린게 없으면) 맞춘 개수 * 5
    # (틀린게 있으면) (맞춘 개수 - 틀린 개수) * 5 최소 0점
    word_bonus = (
        max(0, len(correctAlphabet) - len(wrong_word)) * 5
        if len(wrong_word) != 0
        else len(correctAlphabet) * 5
    )

    # 시간 보너스
    # (패배시) 0점
    # (승리시) 6000 - (맞추는데 걸린 시간초 * 틀린 단어 개수)
    time_bonus = (
        max(0, 6000 - int(elapsed_time * len(wrong_word))) if data["is_win"] else 0
    )

    # 최종 점수 계산
    score = round(
        life_score + win_bonus + time_bonus + word_bonus + (len(correctAlphabet) * 14)
    )
    return score


@blueprint.route("/login", methods=["POST"])
def user_login():
    data = request.json  # json => dict

    # api 호출할때 넘겨야할 데이터
    nickname = data.get("nickname")
    password = data.get("password")

    # 둘 중 하나라도 넘어오지 않는다면
    if not nickname or not password:
        return {"message": "error"}, 400  # 400 = API를 너가 잘 못 호출했어!

    target_user: Union[None, User] = _get_user(nickname, password)
    # user를 못 찾은 경우
    if not target_user:
        target_user = _get_user_by_nickname(nickname)
        # 진짜 nick도 없고 pwd 도 안맞는 경우
        if not target_user:
            target_user = _add_user_to_data(nickname, password)
        # pwd 만 안맞는 경우
        else:
            return {"message": "error"}, 422

    return {
        "message": nickname,
        "user_info": {
            "nickname": target_user.user_name,
            "score": target_user.user_score,
        },
    }


@blueprint.route("/word", methods=["GET"])
def get_target_word():
    # 넘겨줄 데이터 생성
    target_word_uuid, target_word_length = generate_target_word()
    # return을 하는 이유? 없어도 될 것 같은데
    return {
        "target_word": target_word_uuid,
        "target_word_length": target_word_length,
    }


@blueprint.route("/guessing", methods=["POST"])
def guessing_text():
    data = request.json  # json => dict
    target_word = word_decoding(uuid.UUID(data["target_word"]))
    input_word = data["word"]

    target_idx = list()
    # 추측한 알파벳이 정답에 포함되어 있는지 체크하기
    if input_word in target_word:
        for idx, s in enumerate(target_word):
            if s == input_word:
                target_idx.append(idx)

    return {"word": input_word, "target_idx": target_idx}


@blueprint.route("/scoring", methods=["POST"])
def scoring():
    data = request.json  # json => dict
    target_word = word_decoding(uuid.UUID(data["target_word"]))
    tempTextString = data["tempTextString"]
    wrong_word = data["wrong_word"]
    tempTextList = list(tempTextString)
    correctAlphabet = set(tempTextList)

    # 점수 계산하기!
    if tempTextString.count("＿") == len(target_word):
        score = 0
    else:
        score = _calculate_score(data, correctAlphabet, wrong_word)

    _update_user_by_nickname(data["user_name"], score)
    return {
        "start_time": data["start_time"],
        "left_life": data["left_life"],
        "target_word": data["target_word"],
        "is_win": data["is_win"],
        "score": score,
    }


@blueprint.route("/leaderboard", methods=["GET"])
def get_leaderboard():
    ordered_data = User.query.order_by(User.user_score.desc())
    page = request.args.get("page", type=int, default=1)
    per_page = request.args.get("per_page", 10, type=int)
    paginated_data = ordered_data.paginate(page=page, per_page=per_page)
    response = {
        "results": [
            {
                "id": user.id,
                "user_name": user.user_name,
                "user_pwd": user.user_pwd,
                "user_score": user.user_score,
            }
            for user in paginated_data.items
        ],
        "current_page": paginated_data.page,
        "per_page": paginated_data.per_page,
        "total_pages": paginated_data.pages,
    }
    return jsonify(response), 200


@blueprint.route("/user-ranking/<nickname>", methods=["GET"])
def get_user_ranking(nickname: str):
    # find target user's ranking
    target_user = _get_user_by_nickname(nickname)
    response = {
        "id": target_user.id,
        "nickname": target_user.user_name,
        "score": target_user.user_score,
    }

    return jsonify(response), 200


@blueprint.route("/ping", methods=["GET"])
def ping():
    """
    해당 API는 단순히 서버가 살아있는지 체크하기 위한 API 입니다.
    ---
    responses:
        200:
            description: 서버가 살아있으면 응답을 OK 로 줍니다.
    """
    return {"message": "ok"}
