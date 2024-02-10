const setLocalItem = (key, item) => {
    localStorage.setItem(key, item);
};

const initLogin = async () => {
    const userName = document.getElementById("user-name").value;
    const userNumber = document.getElementById("user-number").value;
    if (userName === "") {
        document.getElementById("notice").innerHTML = "유저네임을 입력하세요";
        document.getElementById("user-name").value = "";
    } else if (userNumber === "") {
        document.getElementById("notice").innerHTML = "핸드폰 번호 뒷자리를 입력하세요";
        document.getElementById("user-number").value = "";
    } else if (userNumber.length != 4) {
        document.getElementById("notice").innerHTML = "핸드폰 번호는 네 자리여야 합니다";
    } else {
        const response = await fetch("http://3.38.7.91:8000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_name: userName,
                user_number: userNumber,
            }),
        });
        const data = await response.json();

        if (data["message"] === "error") {
            document.getElementById("notice").innerHTML = `
            입력이 올바르지 않습니다`
        } else if (data["message"] === "wrong_number") {
            document.getElementById("notice").innerHTML = `
            핸드폰 번호가 일치하지 않습니다`
            return;
        }
        setLocalItem("user_name", data.user_name);
        setLocalItem("opportunity", 7);
        location.href = "main/main.html";
    }
};

const init = () => {
    document.getElementById("user-name").addEventListener("keyup", (event) => {
        if (event.key === "Enter") initLogin();
    });
    document.getElementById("user-number").addEventListener("keyup", (event) => {
        if (event.key === "Enter") initLogin();
    });
};

init();