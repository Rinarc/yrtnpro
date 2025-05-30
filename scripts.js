// 配置文件
const CONFIG = {
    newsPerPage: 6,          // 主页每页显示数量
    archivePerPage: 12,       // 存档页每页显示数量
    disqusShortname: 'yrtn-news'  // 替换为你的Disqus短名
};

// 数据接口
const DATA_URLS = {
    news: 'news.json',
    videos: 'videos.json'
};

// ================= 通用工具函数 =================
function formatDate(isoString) {
    const date = new Date(isoString);
    return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`;
}

// ================= 主页功能 =================
async function initHomePage() {
    await loadBreakingNews();
    await loadLatestNews();
    await loadVideos();
    initSearch();
}

// 加载突发新闻
async function loadBreakingNews() {
    try {
        const response = await fetch(DATA_URLS.news);
        const data = await response.json();
        const breakingNews = data.articles.find(article => article.isBreaking);
        
        if (breakingNews) {
            document.getElementById('breaking-content').innerHTML = `
                <a href="news-detail.html?id=${breakingNews.id}">${breakingNews.title}</a>
            `;
        }
    } catch (error) {
        console.error('加载突发新闻失败:', error);
    }
}

// 加载最新新闻（按时间倒序）
async function loadLatestNews() {
    try {
        const response = await fetch(DATA_URLS.news);
        const data = await response.json();
        const container = document.getElementById('news-container');
        container.innerHTML = '';

        // 排序并截取最新内容
        const sortedNews = data.articles.sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        ).slice(0, CONFIG.newsPerPage);

        sortedNews.forEach(article => {
            const cardHTML = `
                <div class="news-card">
                    <a href="news-detail.html?id=${article.id}">
                        <img src="${article.image}" alt="${article.title}">
                        <div class="news-content">
                            <h3>${article.title}</h3>
                            <div class="news-meta">
                                <time>${formatDate(article.date)}</time>
                                <span class="category-tag">${article.category}</span>
                            </div>
                            <p>${article.summary}</p>
                        </div>
                    </a>
                </div>
            `;
            container.innerHTML += cardHTML;
        });

        // 添加"查看更多"按钮
        if (data.articles.length > CONFIG.newsPerPage) {
            container.innerHTML += `
                <div class="see-more-box">
                    <a href="archive.html" class="see-more">浏览全部新闻 →</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('加载新闻失败:', error);
    }
}

// ================= 新闻详情页 =================
async function loadNewsDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('id');

    if (!newsId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(DATA_URLS.news);
        const data = await response.json();
        const article = data.articles.find(a => a.id == newsId);

        if (article) {
            document.title = `${article.title} | YRTN+`;
            document.getElementById('news-title').textContent = article.title;
            document.getElementById('news-date').textContent = formatDate(article.date);
            document.getElementById('news-category').textContent = article.category;
            document.getElementById('news-image').src = article.image;
            document.getElementById('news-content').innerHTML = article.content;
        } else {
            window.location.href = '404.html';
        }
    } catch (error) {
        console.error('加载详情失败:', error);
    }
}

// ================= 搜索功能 =================
async function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    let allNews = [];

    try {
        const response = await fetch(DATA_URLS.news);
        const data = await response.json();
        allNews = data.articles;
    } catch (error) {
        console.error('加载搜索数据失败:', error);
    }

    function performSearch(keyword) {
        const container = document.getElementById('news-container');
        container.innerHTML = '';

        const filtered = allNews.filter(article => 
            article.title.toLowerCase().includes(keyword.toLowerCase()) || 
            article.content.toLowerCase().includes(keyword.toLowerCase())
        );

        filtered.forEach(article => {
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

        // 更新URL参数
        window.history.replaceState({}, '', `?search=${encodeURIComponent(keyword)}`);
    }

    searchButton.addEventListener('click', () => performSearch(searchInput.value));
    searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') performSearch(searchInput.value);
    });

    // 初始化搜索参数
    const urlParams = new URLSearchParams(window.location.search);
    const initialSearch = urlParams.get('search');
    if (initialSearch) {
        searchInput.value = initialSearch;
        performSearch(initialSearch);
    }
}

// ================= 存档页功能 =================
class ArchiveManager {
    constructor() {
        this.perPage = CONFIG.archivePerPage;
        this.currentPage = 1;
        this.allNews = [];
        this.filteredNews = [];
        this.activeTags = new Set();
        this.searchKeyword = '';
    }

    async init() {
        try {
            const response = await fetch(DATA_URLS.news);
            const data = await response.json();
            this.allNews = data.articles.sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            );
            
            this.initTags();
            this.bindEvents();
            this.applyFilters();
        } catch (error) {
            console.error('加载存档数据失败:', error);
        }
    }

    initTags() {
        const tags = [...new Set(this.allNews.map(article => article.category))];
        const container = document.getElementById('tag-container');
        
        tags.forEach(tag => {
            const btn = document.createElement('div');
            btn.className = 'tag-filter';
            btn.textContent = tag;
            btn.dataset.tag = tag;
            container.appendChild(btn);
        });
    }

    bindEvents() {
        document.querySelectorAll('.tag-filter').forEach(btn => {
            btn.addEventListener('click', () => this.toggleTag(btn.dataset.tag));
        });

        document.getElementById('archive-search-btn').addEventListener('click', () => this.triggerSearch());
        document.getElementById('archive-search').addEventListener('keypress', e => {
            if (e.key === 'Enter') this.triggerSearch();
        });

        document.getElementById('load-more').addEventListener('click', () => this.loadMore());
    }

    toggleTag(tag) {
        const btn = document.querySelector(`[data-tag="${tag}"]`);
        this.activeTags.has(tag) ? 
            this.activeTags.delete(tag) : 
            this.activeTags.add(tag);
        
        btn.classList.toggle('active');
        this.applyFilters();
    }

    triggerSearch() {
        this.searchKeyword = document.getElementById('archive-search').value.trim();
        this.applyFilters();
    }

    applyFilters() {
        this.currentPage = 1;
        this.filteredNews = this.allNews.filter(article => {
            const matchSearch = article.title.includes(this.searchKeyword) || 
                              article.content.includes(this.searchKeyword);
            const matchTags = this.activeTags.size === 0 || 
                            this.activeTags.has(article.category);
            return matchSearch && matchTags;
        });
        this.renderNews();
        this.updatePageInfo();
    }

    renderNews() {
        const container = document.getElementById('archive-container');
        container.innerHTML = '';
        
        const paginatedData = this.filteredNews.slice(0, this.currentPage * this.perPage);
        
        paginatedData.forEach(article => {
            const cardHTML = `
                <div class="news-card">
                    <a href="news-detail.html?id=${article.id}">
                        <img src="${article.image}" alt="${article.title}">
                        <div class="news-content">
                            <h3>${article.title}</h3>
                            <div class="news-meta">
                                <time>${formatDate(article.date)}</time>
                                <span class="category-tag">${article.category}</span>
                            </div>
                            <p>${article.summary}</p>
                        </div>
                    </a>
                </div>
            `;
            container.innerHTML += cardHTML;
        });
    }

    loadMore() {
        if (this.currentPage * this.perPage < this.filteredNews.length) {
            this.currentPage++;
            this.renderNews();
            this.updatePageInfo();
        }
    }

    updatePageInfo() {
        const showing = Math.min(
            this.currentPage * this.perPage, 
            this.filteredNews.length
        );
        document.getElementById('page-info').textContent = 
            `显示 ${showing} / ${this.filteredNews.length} 条`;
    }
}
// 音乐播放器模块
class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audio-player');
        this.playlist = [];
        this.currentTrack = 0;
        this.subtitles = [];
        this.init();
    }

    // 初始化
    async init() {
        // 加载播放列表
        const response = await fetch('music/playlist.json');
        this.playlist = await response.json();
        
        // 初始化事件监听
        this.initEvents();
        // 渲染播放列表
        this.renderPlaylist();
        // 加载第一首
        this.loadTrack(0);
    }

    // 事件绑定
    initEvents() {
        const playButton = document.getElementById('play-pause');
        const progress = document.getElementById('progress');
        const volume = document.getElementById('volume');

        playButton.addEventListener('click', () => this.togglePlay());
        progress.addEventListener('input', (e) => this.seek(e.target.value));
        volume.addEventListener('input', (e) => this.setVolume(e.target.value));

        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.nextTrack());
    }

    // 加载曲目
    async loadTrack(index) {
        this.currentTrack = index;
        const track = this.playlist[index];
        
        // 加载音频
        this.audio.src = track.audioUrl;
        this.audio.load();
        
        // 加载字幕
        if (track.subtitleUrl) {
            await this.loadSubtitles(track.subtitleUrl);
        }
        
        // 更新播放列表样式
        document.querySelectorAll('.playlist-item').forEach(item => 
            item.classList.remove('playing')
        );
        document.querySelector(`[data-index="${index}"]`).classList.add('playing');
    }

    // 加载字幕文件
    async loadSubtitles(url) {
        const response = await fetch(url);
        const text = await response.text();
        this.parseSubtitles(text);
    }

    // 解析VTT字幕
    parseSubtitles(vttText) {
        this.subtitles = [];
        const lines = vttText.split('\n');
        
        lines.forEach(line => {
            if (line.includes(' --> ')) {
                const [timecode, text] = line.split(') ');
                const [start, end] = timecode.split(' --> ').map(t => 
                    this.vttTimeToSeconds(t)
                );
                this.subtitles.push({ start, end, text });
            }
        });
    }

    // VTT时间转秒数
    vttTimeToSeconds(time) {
        const parts = time.split(/[:,]/);
        return (+parts[0]) * 3600 + 
               (+parts[1]) * 60 + 
               (+parts[2]) + 
               (+parts[3]) / 1000;
    }

    // 更新字幕显示
    updateLyrics() {
        const currentTime = this.audio.currentTime;
        const currentSub = this.subtitles.find(sub => 
            currentTime >= sub.start && currentTime <= sub.end
        );
        
        const lyricsEl = document.getElementById('lyrics-text');
        lyricsEl.textContent = currentSub ? currentSub.text : '';
    }

    // 播放控制方法
    togglePlay() {
        this.audio.paused ? this.audio.play() : this.audio.pause();
        document.getElementById('play-pause').classList.toggle('playing');
    }

    nextTrack() {
        this.loadTrack((this.currentTrack + 1) % this.playlist.length);
        this.audio.play();
    }

    seek(value) {
        this.audio.currentTime = (value / 100) * this.audio.duration;
    }

    setVolume(value) {
        this.audio.volume = value;
    }

    // 渲染播放列表
    renderPlaylist() {
        const container = document.getElementById('playlist');
        container.innerHTML = this.playlist.map((track, index) => `
            <div class="playlist-item" data-index="${index}" 
                 onclick="musicPlayer.loadTrack(${index})">
                <span class="title">${track.title}</span>
                <span class="duration">${track.duration}</span>
            </div>
        `).join('');
    }

    // 更新进度条
    updateProgress() {
        const progress = (this.audio.currentTime / this.audio.duration) * 100 || 0;
        document.getElementById('progress').value = progress;
        document.getElementById('current-time').textContent = 
            this.formatTime(this.audio.currentTime);
        this.updateLyrics();
    }

    updateDuration() {
        document.getElementById('duration').textContent = 
            this.formatTime(this.audio.duration);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// 初始化播放器
const musicPlayer = new MusicPlayer();
// ================= Disqus评论系统 =================
function initDisqus() {
    window.disqus_config = function () {
        this.page.url = window.location.href;
        this.page.identifier = `news-${new URLSearchParams(window.location.search).get('id')}`;
    };
    
    (function() {
        const d = document, s = d.createElement('script');
        s.src = `https://${CONFIG.disqusShortname}.disqus.com/embed.js`;
        s.setAttribute('data-timestamp', +new Date());
        (d.head || d.body).appendChild(s);
    })();
}

// ================= 页面路由 =================
window.onload = function() {
    // Disqus初始化
    if (document.getElementById('disqus_thread')) {
        initDisqus();
    }

    // 存档页初始化
    if (window.location.pathname.includes('archive.html')) {
        const archiveManager = new ArchiveManager();
        archiveManager.init();
    }
    // 新闻详情页
    else if (window.location.pathname.includes('news-detail.html')) {
        loadNewsDetail();
    }
    // 主页
    else {
        initHomePage();
    }
};
