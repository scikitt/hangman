const leaderboard = async (page = 1, per_page = 10) => {
    const response = await fetch(`http://localhost:5000/leaderboard?page=${page}&per_page=${per_page}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    });
    const data = await response.json();
    const users = data["user_info"];
    const totalPages = data["total_pages"];

    let leaderBoardInnerHtml = `
        <tr>
            <th>순위</th>
            <th>유저 네임</th>
            <th>점수</th>
        </tr>
    `;

    const startRank = (page === 1) ? 0 : (page - 1) * per_page;
    for (let i = 0; i < users.length; i++) {
        leaderBoardInnerHtml += `
            <tr>
                <td>${i + 1 + startRank}</td>
                <td>${users[i]["user_name"]}</td>
                <td>${users[i]["user_score"]}</td>
            </tr>
            `;
    };
    document.getElementById("leaderboard").innerHTML = leaderBoardInnerHtml;
    loadPageNav(page, totalPages);
    userRanking();
};

const userRanking = async () => {
    const currentUser = localStorage.getItem("user_name");
    const response = await fetch(`http://localhost:5000/user-ranking/${currentUser}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();

    let userRank = `
        <tr>
            <th>${currentUser}님의 랭킹</th>
            <th></th>
        </tr>
        <tr>
            <td>${data["user_info"]["id"]}위</td>
            <td>${data["user_info"]["user_score"]}점</td>
        </tr>
    `;

    document.getElementById("user-rank").innerHTML = userRank;
};

const loadPageNav = (currentPage, totalPages) => {
    let tempNavInnerHtml = "";
    let startPage = currentPage - 2;
    let endPage = currentPage + 2;
    if (startPage <= 0) {
        startPage = 1;
        endPage = 5;
    }
    if (endPage > totalPages) {
        endPage = totalPages;
    }
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            tempNavInnerHtml += `
            <span onclick="leaderboard(${i})">${i}</span>
        `;
        } else {
            tempNavInnerHtml += `
            <span onclick="leaderboard(${i})">${i}</span>
        `;
        }
    }
    document.getElementById("nav").innerHTML = tempNavInnerHtml;
};

const setLocalItem = (key, item) => {
    localStorage.setItem(key, item);
};

const restart = async (user_name) => {
    await initWord();
    setLocalItem("opportunity", 7);
    setLocalItem("user_name", user_name);
    location.href = "../main/main.html";
};

const initWord = async () => {
    const response = await fetch("http://localhost:5000/word", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    setLocalItem("encoded_word", data["encoded_word"]);
    setLocalItem("target_word_length", data["target_word_length"]);
};

const init = () => {
    document.getElementById("buttons").innerHTML = `
        <button onclick="restart('${localStorage.getItem("user_name")}')">행맨 다시 하기</button>
        <button onclick="location.href='../index/index.html'">처음으로</button>
    `;
    leaderboard();
};

init();