// --- 新增：主题切换逻辑 ---
const themeToggleBtn = document.getElementById("theme-toggle");
const currentTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

// 初始化主题
function initializeTheme() {
    if (currentTheme) {
        document.documentElement.setAttribute("data-theme", currentTheme);
        if (currentTheme === "dark") {
            themeToggleBtn.innerHTML = '<i class="fa fa-sun-o"></i>';
        }
    } else if (prefersDark) {
        // 如果用户系统设置为暗色，则默认使用暗色主题
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
        themeToggleBtn.innerHTML = '<i class="fa fa-sun-o"></i>';
    }
}

// 切换主题事件
themeToggleBtn.addEventListener("click", () => {
    let theme = document.documentElement.getAttribute("data-theme");
    if (theme === "dark") {
        document.documentElement.removeAttribute("data-theme");
        localStorage.removeItem("theme");
        themeToggleBtn.innerHTML = '<i class="fa fa-moon-o"></i>';
    } else {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
        themeToggleBtn.innerHTML = '<i class="fa fa-sun-o"></i>';
    }
});

// --- 现有代码 ---
// 配置
const wordListUrl = "CET4luan_2.json";

// DOM 元素
const settingsBtn = document.getElementById("settingsBtn"); // 新增
const settingsModal = document.getElementById("settingsModal"); // 新增
const closeModalBtn = document.getElementById("closeModalBtn"); // 新增
const wordCard = document.querySelector(".word-card");
const sentencesList = document.querySelector(".sentences-list");
const prevBtn = document.querySelector(".prev-btn");
const nextBtn = document.querySelector(".next-btn");
const randomBtn = document.getElementById("randomBtn"); // 新增
const progressText = document.querySelector(".progress-text");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

// 状态
let words = [];
let currentIndex = 0;

// --- 新增：播放音频函数 ---
function playAudio(word, type) {
    if (!word) return;
    const audioUrl = `https://dict.youdao.com/dictvoice?audio=${word}&type=${type}`;
    // type: 0-2美音, 1-英音
    const audio = new Audio(audioUrl);
    audio.play().catch((e) => console.error("音频播放失败:", e));
}

// 渲染单词卡片
function renderWord(index, shouldAutoplay = false) {
    // 添加 shouldAutoplay 参数
    if (!words.length) return;
    const word = words[index];
    // 兼容你的数据结构，需根据实际字段调整
    const headWord = word.headWord || word.word || "";
    const level = word.level || "4级";
    const phonetic = word.content?.word?.content?.usphone || word.phonetic || "";
    const pos =
        word.content?.word?.content?.syno?.synos?.[0]?.pos || word.pos || "";
    const def = word.content?.word?.content?.trans?.[0]?.tranCn || word.def || "";

    // --- 分别处理短语和例句 ---
    const phrases = word.content?.word?.content?.phrase?.phrases;
    const sentences = word.content?.word?.content?.sentence?.sentences;
    let phrasesHtml = "";
    let sentencesHtml = "";

    // 1. 处理短语
    if (phrases && phrases.length > 0) {
        phrasesHtml = phrases
            .map(
                (p) =>
                    `<div class="word-example-item"><strong>${p.pContent}</strong>: ${p.pCn}</div>`
            )
            .join("");
    }

    // 2. 处理例句
    if (sentences && sentences.length > 0) {
        sentencesHtml = sentences
            .map((sentence) => {
                const sContent = sentence.sContent || "";
                const sCn = sentence.sCn || "";
                return `<div class="sentence-item">
                  <p class="sentence-en">${sContent}</p>
                  <p class="sentence-cn">${sCn}</p>
                </div>`;
            })
            .join("");
    }

    wordCard.innerHTML = `
      <div class="word-header">
          <span class="word-text">${headWord}</span>
          <span class="word-level">${level}</span>
      </div>
      
      <!-- 新的发音和音标容器 -->
      <div class="phonetic-container">
        <span class="word-phonetic">${phonetic ? "/" + phonetic + "/" : ""
        }</span>
        <div class="pronounce-group">
            <div class="pronounce-item" data-word="${headWord}" data-type="1" title="英式发音">
                <span class="label">英</span>
                <i class="fa fa-volume-up"></i>
            </div>
            <div class="pronounce-item" data-word="${headWord}" data-type="0" title="美式发音">
                <span class="label">美</span>
                <i class="fa fa-volume-up"></i>
            </div>
            <div class="pronounce-item">默认发音</div>
        </div>
      </div>

      <div class="word-pos">${pos}</div>
      <div class="word-def">${def}</div>
      <div class="word-example">
          ${phrasesHtml
            ? '<div class="phrases-title">相关短语</div>' + phrasesHtml
            : ""
        }
      </div>
  `;

    // --- 修改：为新的发音项目绑定点击事件 ---
    wordCard.querySelectorAll(".pronounce-item").forEach((item) => {
        item.addEventListener("click", (e) => {
            // 事件可能在父元素或子元素上触发，我们从父元素获取数据
            const currentItem = e.currentTarget;
            const wordToPlay = currentItem.getAttribute("data-word");
            const type = currentItem.getAttribute("data-type");
            playAudio(wordToPlay, type);
        });
    });

    // 更新例句区域
    sentencesList.innerHTML = sentencesHtml || "<p>暂无相关例句</p>";

    progressText.textContent = `${index + 1}/${words.length}`;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === words.length - 1;

    // --- 新增：如果需要，则自动播放 ---
    if (shouldAutoplay) {
        playAudio(headWord, 2); // 默认自动播放美音
    }
}

// 执行搜索的函数
function handleSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (!searchTerm) return;

    const foundIndex = words.findIndex(
        (word) => word.headWord.toLowerCase() === searchTerm
    );

    if (foundIndex !== -1) {
        currentIndex = foundIndex;
        renderWord(currentIndex, true); // 搜索后自动播放
        searchInput.value = "";
    } else {
        alert(`单词库中未找到 "${searchTerm}"`);
    }
}

// --- 随机跳转函数 ---
function handleRandom() {
    if (words.length <= 1) return; // 如果只有一个或没有单词，则不执行

    let newIndex;
    // 循环直到找到一个与当前不同的新索引
    do {
        newIndex = Math.floor(Math.random() * words.length);
    } while (newIndex === currentIndex);

    currentIndex = newIndex;
    renderWord(currentIndex, true); // 随机后自动播放
}

// 切换事件
prevBtn.onclick = () => {
    if (currentIndex > 0) {
        currentIndex--;
        renderWord(currentIndex, true); // 点击后自动播放
    }
};
nextBtn.onclick = () => {
    if (currentIndex < words.length - 1) {
        currentIndex++;
        renderWord(currentIndex, true); // 点击后自动播放
    }
};

// 搜索与随机事件
searchBtn.addEventListener("click", handleSearch);
searchInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        handleSearch();
    }
});
randomBtn.addEventListener("click", handleRandom); // 新增

// --- 模态框控制逻辑 ---
settingsBtn.addEventListener("click", () => {
    settingsModal.classList.add("open");
    document.body.classList.add("modal-open"); // 新增：禁止背景滚动
});

closeModalBtn.addEventListener("click", () => {
    settingsModal.classList.remove("open");
    document.body.classList.remove("modal-open"); // 新增：恢复背景滚动
});

// 点击遮罩区域关闭模态框
settingsModal.addEventListener("click", (event) => {
    if (event.target === settingsModal) {
        settingsModal.classList.remove("open");
        document.body.classList.remove("modal-open"); // 新增：恢复背景滚动
    }
});

// 异步加载 JSON
async function loadWords() {
    try {
        const res = await fetch(wordListUrl);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const text = await res.text();

        const objMatches = text.match(/{[\s\S]*?}(?=\s*{|\s*$)/g);

        if (!objMatches) throw new Error("在文件中未找到任何有效的单词对象。");

        words = objMatches.map((objStr) => JSON.parse(objStr.trim()));

        renderWord(currentIndex, false); // 首次加载不自动播放
    } catch (e) {
        console.error("加载或解析单词失败:", e);
        wordCard.innerHTML = `<div style="color:red">单词加载失败: ${e.message}</div>`;
    }
}

// 初始化
initializeTheme(); // 在加载单词前先初始化主题
loadWords();
