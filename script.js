// 配置
const wordListUrl = "CET4luan_2.json";

// DOM 元素
const wordCard = document.querySelector(".word-card");
const sentencesList = document.querySelector(".sentences-list");
const prevBtn = document.querySelector(".prev-btn");
const nextBtn = document.querySelector(".next-btn");
const progressText = document.querySelector(".progress-text");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

// 状态
let words = [];
let currentIndex = 0;

// 渲染单词卡片
function renderWord(index) {
    if (!words.length) return;
    const word = words[index];
    // 兼容你的数据结构，需根据实际字段调整
    const headWord = word.headWord || word.word || "";
    const level = word.level || "4级";
    const phonetic =
        word.content?.word?.content?.usphone || word.phonetic || "";
    const pos =
        word.content?.word?.content?.syno?.synos?.[0]?.pos || word.pos || "";
    const def =
        word.content?.word?.content?.trans?.[0]?.tranCn || word.def || "";

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
      <div class="word-phonetic">${phonetic ? "/" + phonetic + "/" : ""
        }</div>
      <div class="word-pos">${pos}</div>
      <div class="word-def">${def}</div>
      <div class="word-example">
          ${phrasesHtml
            ? '<div class="phrases-title">相关短语</div>' + phrasesHtml
            : ""
        }
      </div>
  `;

    // 更新例句区域
    sentencesList.innerHTML = sentencesHtml || "<p>暂无相关例句</p>";

    progressText.textContent = `${index + 1}/${words.length}`;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === words.length - 1;
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
        renderWord(currentIndex);
        searchInput.value = "";
    } else {
        alert(`单词库中未找到 "${searchTerm}"`);
    }
}

// 切换事件
prevBtn.onclick = () => {
    if (currentIndex > 0) {
        currentIndex--;
        renderWord(currentIndex);
    }
};
nextBtn.onclick = () => {
    if (currentIndex < words.length - 1) {
        currentIndex++;
        renderWord(currentIndex);
    }
};

// 搜索事件
searchBtn.addEventListener("click", handleSearch);
searchInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        handleSearch();
    }
});

// 异步加载 JSON
async function loadWords() {
    try {
        const res = await fetch(wordListUrl);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const text = await res.text();

        const objMatches = text.match(/{[\s\S]*?}(?=\s*{|\s*$)/g);

        if (!objMatches)
            throw new Error("在文件中未找到任何有效的单词对象。");

        words = objMatches.map((objStr) => JSON.parse(objStr.trim()));

        renderWord(currentIndex);
    } catch (e) {
        console.error("加载或解析单词失败:", e);
        wordCard.innerHTML = `<div style="color:red">单词加载失败: ${e.message}</div>`;
    }
}

// 初始化
loadWords();