const setLocalItem = (key, item) => {
    localStorage.setItem(key, item);
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

const login = async () => {
    const nickname = document.getElementById("login-nickname").value;
    const password = document.getElementById("login-password").value;
    if (nickname === "") {
        document.getElementById("notice").innerHTML = "닉네임을 입력해 주세요.";
        document.getElementById("login-nickname").value = null;
    }
    else if (password === "") {
        document.getElementById("notice").innerHTML = "비밀번호를 입력해 주세요.";
        document.getElementById("login-password").value = null;
    }
    else {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nickname: nickname,
                password: password,
            }),
        });
        const data = await response.json();
        if (data["message"] == "error") {
            document.getElementById("notice").innerHTML = `
                비밀번호가 일치하지 않습니다.
            `;
        } else {
            setLocalItem("leftLife", 7);
            setLocalItem("startTime", toLocalISOString(new Date()));
            setLocalItem("user_name", data["user_info"]["nickname"]);
            setLocalItem("previous_score", data["user_info"]["score"]);
            location.href = "../main/main.html";
        }
    }
};

const init = () => {
    document.getElementById("login-password").addEventListener("keyup", (event) => {
        if (event.key === "Enter") login();
    });
};

init();