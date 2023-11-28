const onlyEnglish = (input) => { // parameter
    const englishOnly = input.value.replace(/[^a-z]/g, "");
    input.value = englishOnly;
};

const setLocalItem = (key, item) => {
    localStorage.setItem(key, item);
};

const initDisplay = async () => { // 맞춰야할 단어 만큼 언더바 랜더링하기
    document.getElementById("hangman").src = "../imgs/gallows.png";
    const underscoredWord = "＿ ".repeat(Number(localStorage.getItem("target_word_length")));

    // LOGIN 이후 게임 화면 로딩
    document.getElementById("title").innerHTML = `
        <h1>${localStorage.getItem("user_name")}님 행맨 플레이 중...</h1>
    `;
    document.getElementById("guessing-underscore").innerHTML = `
        <h1>${underscoredWord}</h1>
    `;
};


// ===================================================================== 
// 기타 함수 
// =====================================================================

const changeImg = (leftLife) => {
    const imgArr = [
        "../imgs/gallows.png",
        "../imgs/hanging_rope.gif",
        "../imgs/head.gif",
        "../imgs/body.gif",
        "../imgs/left_hand.gif",
        "../imgs/right_hand.gif",
        "../imgs/left_leg.gif",
        "../imgs/complete.png"
    ];
    document.getElementById("hangman").src = imgArr[7 - leftLife];
};

// =====================================================================
// 핵심 비즈니스 로직
// =====================================================================

const initGuessingEvent = async () => {
    document.getElementById("previous-score").innerHTML = `
        ${localStorage.getItem("user_name")}님의 최고 점수: ${localStorage.getItem("previous_score")}점
    `;
    document.getElementById("guessing-text").addEventListener("keyup", async (event) => {
        if (event.key === "Enter") {
            guessingEvent(event);
        }
    });
};

const guessingEvent = async (event) => {
    const guessingInput = document.getElementById("guessing-text");
    const inputText = guessingInput.value;
    if (inputText === "") {
        document.getElementById("notice").innerHTML = "공백은 입력할 수 없습니다.";
        document.getElementById("guessing-text").value = null;
        return;
    }
    else if (guessedAlphabets.includes(inputText)) {
        document.getElementById("notice").innerHTML = "이미 입력한 알파벳입니다.";
        document.getElementById("guessing-text").value = null;
        return;
    }
    guessedAlphabets.push(inputText);
    document.getElementById("guessed-alphabets").innerHTML = guessedAlphabets.join(",&nbsp;&nbsp; ");
    document.getElementById("notice").innerHTML = `입력한 글자: ${inputText}`;
    const response = await fetch(`${API_URL}/guessing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            word: inputText,
            target_word: localStorage.getItem("target_word"),
        }),
    });
    const data = await response.json();

    // 단어 맞는지 틀렸는지 확인
    if (data["target_idx"].length != 0) {
        guessingWordSuccess(data["target_idx"], inputText);
    } else {
        guessingWordFail(data["word"]);
    }
    checkWin();
    // 입력한 값 비워주기
    guessingInput.value = "";
}

// 게임 화면에서 알파벳 맞추었을 때 event
const guessingWordSuccess = (targetIdxArr, guessingText) => {
    const targetUnderScoreTag = document.querySelector("#guessing-underscore > h1");
    const tempText = targetUnderScoreTag.innerText.split(" ");

    // 전체 자리를 한 번에 바꾸기 위해 반복문으로 변경
    for (let i = 0; i < targetIdxArr.length; i++) {
        const targetIdx = targetIdxArr[i];
        tempText[targetIdx] = guessingText;
    }
    targetUnderScoreTag.innerText = tempText.join(" ");
};

// 게임 화면에서 알파벳 틀렸을 때 event
const guessingWordFail = (wrongWord) => {
    const leftLife = Number(localStorage.getItem("leftLife")) - 1
    localStorage.setItem("leftLife", leftLife);

    const wrongWords = JSON.parse(localStorage.getItem("inputWrong") || "[]");
    wrongWords.push(wrongWord);
    localStorage.setItem("inputWrong", JSON.stringify(wrongWords));

    // 이미지 랜더링!
    changeImg(leftLife);
};

const removeDom = () => {
    document.getElementById("guessing-box").remove();
    document.getElementById("guessed-alphabets").remove();
    document.getElementById("notice").remove();
}

const afterFinish = () => {
    const leftLife = Number(localStorage.getItem("leftLife"));
    const finishHangman = leftLife === 0 ? "단어를 맞히지 못했습니다.<br>게임에서 졌습니다.<br>" : "단어를 맞혔습니다.<br>게임에서 이겼습니다.<br>"
    document.getElementById("final").innerHTML = `
        ${finishHangman}
        최종점수: ${localStorage.getItem("score")}점<br><br>
        <button onclick="restart('${localStorage.getItem("user_name")}')">다시 하기</button>
        <button onclick="location.href='../leaderboard/leaderboard.html'">랭킹 보기</button>
    `;
    document.getElementById("title").innerHTML = `
        <h1>${window.localStorage.getItem("user_name")}님 행맨 플레이 종료</h1>
    `;
}


// 게임이 어떻게 끝났는지 체크하는 함수
const checkWin = async () => {
    const leftLife = Number(localStorage.getItem("leftLife"));
    const targetUnderScoreTag = document.querySelector("#guessing-underscore > h1");
    const tempText = targetUnderScoreTag.innerText.split("");
    const tempTextString = tempText.toString();
    const target_word = localStorage.getItem("target_word");
    if (leftLife === 0) {
        await scoring(false, leftLife, tempTextString, target_word);
        removeDom();
        afterFinish();
    };
    const temp = document.getElementById("guessing-underscore");
    if (!temp.innerText.includes("＿")) {
        await scoring(true, leftLife, tempTextString, target_word);
        removeDom();
        afterFinish();
    }
};


const toLocalISOString = (date) => {
    const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = new Date(date - offset).toISOString().slice(0, -1);
    return (
        localISOTime +
        (offset > 0 ? "-" : "+") +
        Math.abs(offset / 3600000)
            .toString()
            .padStart(2, "0") +
        ":" +
        (Math.abs(offset / 60000) % 60).toString().padStart(2, "0")
    );
};

const restart = async (user_name) => {
    await initWord();
    setLocalItem("leftLife", 7);
    setLocalItem("startTime", toLocalISOString(new Date()));
    setLocalItem("user_name", user_name);
    setLocalItem("previous_score", localStorage.getItem("score"));
    location.href = "../main/main.html";
};

const scoring = async (isWin, leftLife, tempTextString) => {
    const response = await fetch(`${API_URL}/scoring`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_name: localStorage.getItem("user_name"),
            left_life: leftLife,
            is_win: isWin,
            start_time: localStorage.getItem("startTime"),
            target_word: localStorage.getItem("target_word"),
            tempTextString: tempTextString,
            wrong_word: localStorage.getItem("inputWrong"),
        }),
    });
    const data = await response.json();
    console.log(data);
    setLocalItem("score", data["score"]);
};

const initWord = async () => {
    // 게임 진행에 필요한 단어를 localstorage에 저장하기
    const response = await fetch(`${API_URL}/word`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    setLocalItem("target_word", data["target_word"]);
    setLocalItem("target_word_length", data["target_word_length"]);
};

// =====================================================================
// 메인 함수 -> "진입점" (코드의 최초 실행 함수 명시)
// =====================================================================

const guessedAlphabets = [];
const init = async () => {
    await initWord();
    await initDisplay();
    await initGuessingEvent();
}

init();