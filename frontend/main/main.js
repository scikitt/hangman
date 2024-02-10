const API_SERVER = "http://3.38.7.91:8000";

const onlyEnglish = (input) => {
    const englishOnly = input.value.replace(/[^a-z]/g, "");
    input.value = englishOnly;
};

const setLocalItem = (key, item) => {
    localStorage.setItem(key, item);
};

const initDisplay = async () => {
    document.getElementById("hangman").src = "../imgs/gallows.png";
    const underscore = "＿ ".repeat(Number(localStorage.getItem("target_word_length")));
    document.getElementById("title").innerHTML = `
    ${localStorage.getItem("user_name")}님 행맨 하는 중...
    `;
    document.getElementById("underscore").innerHTML = `${underscore}`;
};

const changeImgs = (opportunity) => {
    const imgList = [
        "../imgs/gallows.png",
        "../imgs/hanging_rope.gif",
        "../imgs/head.gif",
        "../imgs/body.gif",
        "../imgs/left_hand.gif",
        "../imgs/right_hand.gif",
        "../imgs/left_leg.gif",
        "../imgs/complete.png"
    ];
    document.getElementById("hangman").src = imgList[7 - opportunity];
};

const initGuess = async () => {
    document.getElementById("guess-text").addEventListener("keyup", async (event) => {
        if (event.key === "Enter") {
            guessFunction();
        }
    });
    document.getElementById("guess-button").addEventListener("click", async () => {
        guessFunction();
    });
};

const guessFunction = async () => {
    const guessInput = document.getElementById("guess-text");
    const inputText = guessInput.value;
    if (inputText === "") {
        document.getElementById("notice").innerHTML = "공백은 입력할 수 없습니다";
        guessInput.value = "";
        return;
    }
    guessWord(inputText);
    updateButtonStyle(inputText);
    guessInput.value = "";
};

const initGuessButton = async () => {
    const opportunity = Number(localStorage.getItem("opportunity"));
    console.log("opportunity : " + opportunity);
        if (opportunity === 0) {
            return;
        }
    const alphabetButtons = document.querySelectorAll("#alphabet button");
        alphabetButtons.forEach(button => {
        button.addEventListener("click", function () {
            guessWord(button.id);
            updateButtonStyle(button.id);
        });
    });
};

const updateButtonStyle = (buttonId) => {
    console.log(buttonId)
    const button = document.getElementById(buttonId);
    console.log(button)
    button.style.backgroundColor = "black";
    button.style.color = "white";
};

const guessWord = async (inputText) => {
    const guessInput = document.getElementById("guess-text");
    if (guessWordList.includes(inputText)) {
        document.getElementById("notice").innerHTML = "이미 입력한 알파벳입니다";
        guessInput.value = "";
        return;
    }
    document.getElementById("notice").innerHTML = "";
    guessWordList.push(inputText);
    document.getElementById("guessed-word").innerHTML = guessWordList.join(", ");

    const response = await fetch(`${API_SERVER}/guess`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            word: inputText,
            encoded_word: localStorage.getItem("encoded_word"),
        }),
    });
    const data = await response.json();
    if (data["target_idx"].length !== 0) {
        guessWordSuccess(data["target_idx"], inputText);
    } else {
        guessWordFail();
    }

    checkWin();
    guessInput.value = "";
};

const guessWordSuccess = (targetIdxList, guessText) => {
    const targetUnderscoreTag = document.getElementById("underscore");
    const tempText = targetUnderscoreTag.innerText.split(" ");

    for (let i=0; i < targetIdxList.length; i++) {
        const targetIdx = targetIdxList[i];
        tempText[targetIdx] = guessText;
    }
    targetUnderscoreTag.innerText = tempText.join(" ");
};

const guessWordFail = () => {
    const opportunity = Number(localStorage.getItem("opportunity")) - 1
    localStorage.setItem("opportunity", opportunity);
    changeImgs(opportunity)
};

const checkWin = async () => {
    const opportunity= Number(localStorage.getItem("opportunity"));
    const targetUnderscoreTag = document.getElementById("underscore");
    const tempText = targetUnderscoreTag.innerText.split("");
    const tempTextString = tempText.toString();
    const textLength = tempTextString.length;
    if (opportunity === 0) {
        await initScore(false, opportunity, textLength);
        deleteDom();
        afterFinish();
    };
    const temp = document.getElementById("underscore");
    if (!temp.innerText.includes("＿")) {
        await initScore(true, opportunity, textLength);
        deleteDom();
        afterFinish();
    }
};

const initScore = async (isWin, opportunity, textLength) => {
    const response = await fetch(`${API_SERVER}/score`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            user_name: localStorage.getItem("user_name"),
            opportunity: opportunity,
            is_win: isWin,
            text_length: textLength,
        }),
    });
    const data = await response.json();
    console.log(data);
    const score = data["score"];
    setLocalItem("score", score);
};

const initWord = async () => {
    const response = await fetch(`${API_SERVER}/word`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    setLocalItem("encoded_word", data["encoded_word"]);
    setLocalItem("target_word_length", data["target_word_length"]);
};

const deleteDom = () => {
    document.getElementById("guess-div").remove();
    document.getElementById("guessed-word").remove();
    document.getElementById("notice").remove();
};

const restart = async (user_name) => {
    await initWord();
    setLocalItem("user_name", user_name);
    setLocalItem("opportunity", 7);
    location.href = "./main.html";
};

const afterFinish = () => {
    const user_name = localStorage.getItem("user_name");
    const opportunity = Number(localStorage.getItem("opportunity"));
    const result = opportunity === 0 ? "단어를 맞히지 못했습니다" : "단어를 맞혔습니다"
    document.getElementById("finish").innerHTML = `
        ${result}
    `;
    document.getElementById("end-score").innerHTML = `
        최종 점수: ${Number(localStorage.getItem("score"))}점
    `;
    document.getElementById("buttons").innerHTML = `
    <button onclick="restart('${user_name}')">다시 하기</button>
    <button onclick="location.href='../leaderboard/leaderboard.html'">랭킹 보기</button>`
};

const guessWordList = [];
const init = async () => {
    await initWord();
    await initDisplay();
    await initGuess();
    await initGuessButton();
};

init();