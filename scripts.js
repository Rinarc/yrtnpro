// 数据加载配置
const DATA_URLS = {
    news: 'news.json',
    videos: 'videos.json'
};

// 初始化主页
async function initHomePage() {
    await loadBreakingNews();
    await loadNews();
    await loadVideos();
}

// 加载突发新闻
async function loadBreakingNews() {
    const response = await fetch(DATA_URLS.news);
    const data = await response.json();
    const breakingNews = data.articles.find(article => article.isBreaking);
    
    if (breakingNews) {
        document.getElementById('breaking-content').innerHTML = `
            <a href="news-detail.html?id=${breakingNews.id}">${breakingNews.title}</a>
        `;
    }
}

// 加载新闻列表
async function loadNews() {
    const response = await fetch(DATA_URLS.news);
    const data = await response.json();
    const container = document.getElementById('news-container');

    data.articles.forEach(article => {
        const cardHTML = `
            <div class="news-card">
                <a href="news-detail.html?id=${article.id}">
                    <img src="${article.image}" alt="${article.title}">
                    <div class="news-content">
                        <h3>${article.title}</h3>
                        <p>${article.summary}</p>
                        <span class="category-tag">${article.category}</span>
                    </div>
                </a>
            </div>
        `;
        container.innerHTML += cardHTML;
    });
}

// 加载视频
async function loadVideos() {
    const response = await fetch(DATA_URLS.videos);
    const data = await response.json();
    const container = document.getElementById('video-container');

    data.videos.forEach(video => {
        const videoHTML = `
            <div class="video-item">
                <div class="video-card">
                    <iframe src="${video.embedUrl}" 
                            allow="accelerometer; autoplay; encrypted-media; gyroscope" 
                            allowfullscreen>
                    </iframe>
                </div>
                <h4>${video.title}</h4>
                <small>${video.date}</small>
            </div>
        `;
        container.innerHTML += videoHTML;
    });
}

// 加载新闻详情
async function loadNewsDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('id');

    if (!newsId) return;

    const response = await fetch(DATA_URLS.news);
    const data = await response.json();
    const article = data.articles.find(a => a.id == newsId);

    if (article) {
        document.title = `${article.title} | YRTN+`;
        document.getElementById('news-title').textContent = article.title;
        document.getElementById('news-date').textContent = article.date;
        document.getElementById('news-category').textContent = article.category;
        document.getElementById('news-image').src = article.image;
        document.getElementById('news-content').innerHTML = article.content;
    }
}

// 自动路由
window.onload = () => {
    if (window.location.pathname.endsWith('news-detail.html')) {
        loadNewsDetail();
    } else {
        initHomePage();
    }
};