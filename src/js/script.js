// --- 主题切换逻辑 ---
const themeToggleBtn = document.getElementById("theme-toggle");
const currentTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const themeIcon = themeToggleBtn.querySelector('i');

// 初始化主题
function initializeTheme() {
    if (currentTheme) {
        document.documentElement.setAttribute("data-theme", currentTheme);
        if (currentTheme === "dark") {
            if (themeIcon) themeIcon.className = 'fa fa-sun-o';
        }
    } else if (prefersDark) {
        // 如果用户系统设置为暗色，则默认使用暗色主题
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
        if (themeIcon) themeIcon.className = 'fa fa-sun-o';
    }
}

// 切换主题事件
themeToggleBtn.addEventListener("click", () => {
    let theme = document.documentElement.getAttribute("data-theme");
    if (theme === "dark") {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("theme", "light");
        if (themeIcon) themeIcon.className = 'fa fa-moon-o';
    } else {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
        if (themeIcon) themeIcon.className = 'fa fa-sun-o';
    }
});

// 配置
const wordListUrl = "data/CET4luan_2.json";

// DOM 元素
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const modalCard = document.querySelector(".modal-card");
const closeModalBtn = document.getElementById("closeModalBtn");
const wordCard = document.querySelector(".word-card");
const definitionContainer = document.querySelector(".definition-container");
const wordPronounce = wordCard.querySelector(".pronounce-group");
const sentencesList = document.querySelector(".sentences-list");
const prevBtn = document.querySelector(".prev-btn");
const nextBtn = document.querySelector(".next-btn");
const randomBtn = document.getElementById("randomBtn");
const progressText = document.querySelector(".progress-text");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

// 状态
let words = [];
let currentIndex = 0;
let indexMap = [0];

// --- 播放音频函数 ---
function playAudio(word, type) {
    if (!word) return;
    const audioUrl = `https://dict.youdao.com/dictvoice?audio=${word}&type=${type}`;
    // type: 0-2美音, 1-英音
    const audio = new Audio(audioUrl);
    audio.volume = 1;
    audio.play().catch((e) => console.error("音频播放失败:", e));
}

function smartExtractLevel(wordId) {
    if (!wordId) return "unknow";

    const str = wordId.toString().toUpperCase();

    // 定义匹配规则和优先级
    const rules = [
        { keywords: ['CET4', 'CET-4', '四级'], level: 'CET4' },
        { keywords: ['CET6', 'CET-6', '六级'], level: 'CET6' },
        { keywords: ['TOEFL', '托福'], level: 'TOEFL' },
        { keywords: ['IELTS', '雅思'], level: 'IELTS' },
        { keywords: ['GRE'], level: 'GRE' },
        { keywords: ['SAT'], level: 'SAT' },
        { keywords: ['GMAT'], level: 'GMAT' },
        { keywords: ['TEM4', 'TEM-4'], level: 'TEM4' },
        { keywords: ['TEM8', 'TEM-8'], level: 'TEM8' }
    ];

    for (const rule of rules) {
        for (const keyword of rule.keywords) {
            if (str.includes(keyword.toUpperCase())) {
                return rule.level;
            }
        }
    }

    // 如果都没匹配到，使用默认值
    return "unknow";
}

// 渲染单词卡片
function renderWord(index, shouldAutoplay = false) {
    // 添加 shouldAutoplay 参数
    if (!words.length) return;
    const word = words[index];

    // 兼容你的数据结构，需根据实际字段调整
    const headWord = word.headWord || word.content.word.wordHead || "hiner";
    const level = smartExtractLevel(word.content.word.wordId) || "unknow";
    const phonetic = word.content?.word?.content?.usphone || "";
    const definition = word.content?.word?.content?.syno?.synos || "";
    const phrases = word.content?.word?.content?.phrase?.phrases;
    const sentences = word.content?.word?.content?.sentence?.sentences;

    // --- 分别处理释义，短语和例句 ---
    let definitionHtml = "";
    let phrasesHtml = "";
    let sentencesHtml = "";

    const wordHeader = document.querySelector(".word-header");
    const Phonetic = document.querySelector(".word-phonetic");
    const phraseList = document.querySelector(".phrase-list");

    wordHeader.children[0].textContent = headWord;
    wordPronounce.setAttribute("data-word", headWord);
    wordHeader.children[1].textContent = level;
    Phonetic.textContent = phonetic;
    phraseList.innerHTML = phrasesHtml;

    // 释义
    if (definition && definition.length > 0) {
        definitionHtml = definition
            .map((item) => {
                if (!item) return '';
                return `<div class="list-item">
                  <span class="sentence-en">${item.pos}.</span>
                  <span class="sentence-cn">${item.tran}</span>
                </div>`;
            }).join("");
    }
    definitionContainer.innerHTML = definitionHtml || "<p>暂无相关翻译</p>";

    // 处理短语
    if (phrases && phrases.length > 0) {
        phrasesHtml = phrases.map((p) =>
            `<div class="list-item"><strong>${p.pContent}</strong>: ${p.pCn}</div>`
        ).join("");
    }
    phraseList.innerHTML = phrasesHtml || "<p>暂无相关短语</p>";

    // 处理例句
    if (sentences && sentences.length > 0) {
        sentencesHtml = sentences
            .map((sentence) => {
                const sContent = sentence.sContent || "";
                const sCn = sentence.sCn || "";
                return `<div class="list-item">
                  <p class="sentence-en">${sContent}</p>
                  <p class="sentence-cn">${sCn}</p>
                </div>`;
            }).join("");
    }
    // 更新例句区域
    sentencesList.innerHTML = sentencesHtml || "<p>暂无相关例句</p>";

    // 更新进度条文本
    progressText.textContent = `${index + 1} / ${words.length}`;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === words.length - 1;

    // --- 如果需要，则自动播放 ---
    if (shouldAutoplay) {
        playAudio(headWord, 2); // 默认自动播放美音
    }
}

// --- 为新的发音项目绑定点击事件 ---
wordPronounce.addEventListener("click", (e) => {
    // 事件可能在父元素或子元素上触发，我们从父元素获取数据
    const currentItem = e.currentTarget;
    const wordToPlay = currentItem.getAttribute("data-word")
    const type = currentItem.getAttribute("data-type");
    playAudio(wordToPlay, type);
});

// 执行搜索的函数
function handleSearch(wordOrIndex) {
    if (!wordOrIndex) return;

    const targetIndex = getValidatedIndex(wordOrIndex);

    if (targetIndex === -1) return;

    indexMap.push(targetIndex);
    currentIndex = targetIndex;
    renderWord(currentIndex, true);
    searchInput.value = "";
}

function getValidatedIndex(input) {
    // 处理数字索引
    if (!isNaN(input) && input !== '') {
        const index = parseInt(input) - 1;
        if (index < 0 || index >= words.length) {
            alert(`索引 ${input} 超出范围，有效范围：1-${words.length}`);
            return -1;
        }
        return index;
    }

    // 处理单词搜索
    const index = words.findIndex(item =>
        item.headWord.toLowerCase() === input.toLowerCase()
    );
    if (index === -1) {
        alert(`单词库中未找到 "${input}"`);
        return -1;
    }
    return index;
}

// --- 随机跳转函数 ---
function handleRandom() {
    if (words.length <= 1) return; // 如果只有一个或没有单词，则不执行

    let newIndex;
    // 循环直到找到一个与当前不同的新索引
    do {
        newIndex = Math.floor(Math.random() * words.length);
    } while (newIndex === currentIndex);

    indexMap.push(newIndex);
    currentIndex = newIndex;
    renderWord(newIndex, true); // 随机后自动播放
}

// 搜索与随机事件
function performSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    handleSearch(searchTerm);
}
searchBtn.addEventListener("click", () => {
    performSearch()
});
searchInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter" && !event.isComposing) {
        performSearch()
    }
});

// 切换事件
prevBtn.onclick = () => {
    if (indexMap.length > 0) {
        currentIndex = indexMap.at(-2);
        indexMap.pop();
        renderWord(currentIndex, true); // 点击后自动播放
    }
};
nextBtn.onclick = () => {
    if (currentIndex < words.length - 1) {
        currentIndex++;
        indexMap.push(currentIndex);
        renderWord(currentIndex, true); // 点击后自动播放
    }
};
randomBtn.addEventListener("click", handleRandom);

settingsBtn.addEventListener("click", () => {
    settingsModal.classList.add("open");
    modalCard.classList.add("in");
    document.body.classList.add("modal-open");
});

closeModalBtn.addEventListener("click", () => {
    modalCard.classList.remove("in");
    setTimeout(() => {
        settingsModal.classList.remove("open");
    }, 300);
    document.body.classList.remove("modal-open");
});

settingsModal.addEventListener("click", (event) => {
    if (event.target === settingsModal) {
        modalCard.classList.remove("in");
        setTimeout(() => {
            settingsModal.classList.remove("open");
        }, 300);
        document.body.classList.remove("modal-open");
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

const modalLi = modalCard.querySelectorAll("li");
for (let i = 0; i < modalLi.length; i++) {
    const aTag = modalLi[i].querySelector('a');
    modalLi[i].addEventListener("click", () => {
        aTag.click();
    })

}

