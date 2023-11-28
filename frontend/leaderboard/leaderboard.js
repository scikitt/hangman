const leaderboard = async (page = 1, per_page = 10) => {
    const response = await fetch(`${API_URL}/leaderboard?page=${page}&per_page=${per_page}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    const users = data["results"];
    const totalPages = data["total_pages"];
    let leaderBoardInnerHtml = `
        <tr>
            <th>순위</th>
            <th>유저 네임</th>
            <th>점수</th>
        </tr>
    `;


    // 1 ~ 5 : page 1 / per_page 5 => 5 
    // 6 ~ 10 : page 2 / per_page 5 => 10
    // 11 ~ 15 : page 3 / per_page 5 => 15
    const startRank = (page === 1) ? 0 : (page - 1) * per_page;
    for (let i = 0; i < users.length; i++) {
        const className = users[i]["user_name"] === localStorage.getItem("user_name") ? "rank-myrank" : "rank-default";
        leaderBoardInnerHtml += `
            <tr class=${className}>
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
    const response = await fetch(`${API_URL}/user-ranking/${currentUser}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();

    let userRank = `
        <tr>
            <th>${currentUser}님의 랭킹</th>
            <th></th>
        </tr>
        <tr class= "rank-myrank">
            <td>${data["id"]}위</td>
            <td>${data["score"]}점</td>
        </tr>
    `;

    document.getElementById("user-rank").innerHTML = userRank;
};

const loadPageNav = (currentPage, totalPages) => {
    let tempNavInnerHtml = "";

    // 시작 : 1, 2 -> 1 ~ 5
    let startPage = currentPage - 2;
    let endPage = currentPage + 2;

    // 예외를 컨트롤
    if (startPage <= 0) {
        startPage = 1;
        endPage = 5;
    }

    // 끝
    if (endPage > totalPages) {
        endPage = totalPages;
    }

    // 페이지네이션 dom rendering
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            tempNavInnerHtml += `
            <span class="rank-page-nav-active" onclick="leaderboard(${i})">${i}</span>
        `;
        } else {
            tempNavInnerHtml += `
            <span class="rank-page-nav" onclick="leaderboard(${i})">${i}</span>
        `;
        }
    }
    document.getElementById("nav").innerHTML = tempNavInnerHtml;
    document.getElementById("first").innerHTML = `<span onclick="leaderboard(1)">처음</span>`;
    document.getElementById("last").innerHTML = `<span onclick="leaderboard(${totalPages})">마지막</span>`;
    if (currentPage > 1) {
        document.getElementById("prev").innerHTML = `<span onclick="leaderboard(${currentPage - 1})"><</span>`;
    } else {
        document.getElementById("prev").innerHTML = "<";
    };

    if (currentPage < totalPages) {
        document.getElementById("next").innerHTML = `<span onclick="leaderboard(${currentPage + 1})">></span>`
    } else {
        document.getElementById("next").innerHTML = ">";
    };
};

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

const restart = async (user_name) => {
    await initWord();
    setLocalItem("leftLife", 7);
    setLocalItem("startTime", toLocalISOString(new Date()));
    setLocalItem("user_name", user_name);
    setLocalItem("previous_score", localStorage.getItem("score"));
    location.href = "../main/main.html";
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

const init = () => {
    document.getElementById("restart").innerHTML = `
        <button onclick="restart('${localStorage.getItem("user_name")}')">행맨 다시 하기</button>
        <button onclick="location.href='../index/index.html'">처음으로</button>
    `;
    leaderboard();
};

init();