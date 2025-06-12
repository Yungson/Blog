'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // ---- Page Elements ----
    const entryScreen = document.getElementById('entry-screen');
    const collectionPage = document.getElementById('collection-page');
    const postPage = document.getElementById('post-page');
    const aboutPage = document.getElementById('about-page');
    const allPageElements = [entryScreen, collectionPage, postPage, aboutPage].filter(Boolean);

    // ---- Interactive Elements ----
    const entryBackground = document.querySelector('.entry-clickable-bg');
    const entryLinks = document.querySelectorAll('.entry-link');
    const escapeButtons = document.querySelectorAll('.escape-button');
    const tabButtons = document.querySelectorAll('.collection-sidebar .tab-button');
    const tabContents = document.querySelectorAll('.collection-content .tab-content');
    const postListContainer = document.querySelector('#post-page .post-list');

    // ---- Modal Elements ----
    const modalOverlay = document.getElementById('post-modal');
    const modalContent = modalOverlay ? modalOverlay.querySelector('.modal-content') : null;
    const closeModalBtn = modalOverlay ? modalOverlay.querySelector('.close-modal-btn') : null;
    const modalPostContent = modalOverlay ? modalOverlay.querySelector('#modal-post-content') : null;

    // ---- State Variables ----
    const collectionDataCache = {};
    let isModalAnimating = false;
    let isModalVisible = false;
    let isPageAnimating = false;
    let currentPageElement = null;

    // ---- Animation Parameters ----
    const FADE_DURATION = 400;
    const SLIDE_DURATION = 500;
    const EASE_IN_OUT_QUAD = 'easeInOutQuad';
    const EASE_OUT_CUBIC = 'easeOutCubic';
    const EASE_IN_CUBIC = 'easeInCubic';

    // ---- Helper: Set Page Style ----
    function setPageStyle(element, { opacity, visibility, pointerEvents, transform = 'translateX(0)' }) {
        if (!element) return;
        element.style.opacity = opacity;
        element.style.visibility = visibility;
        element.style.pointerEvents = pointerEvents;
        element.style.transform = transform;
    }

    // ---- Core Function: Page Transition ----
    function switchPage(targetPageElement) {
        targetPageElement = targetPageElement || entryScreen;
        if (!targetPageElement || isPageAnimating || targetPageElement === currentPageElement) { return; }
        isPageAnimating = true;
        const outgoingPage = currentPageElement;
        const incomingPage = targetPageElement;

        // Abruptly hide modal if open
        if (isModalVisible && modalOverlay) {
            anime.remove([modalOverlay, modalContent]);
            modalOverlay.classList.add('is-hidden');
            setPageStyle(modalOverlay, { opacity: 0, visibility: 'hidden', pointerEvents: 'none' });
            if(modalContent) setPageStyle(modalContent, { opacity: 0, visibility: 'hidden', pointerEvents: 'none', transform: 'scale(0.95) translateY(10px)' });
            isModalVisible = false;
            isModalAnimating = false;
        }

        const isAboutTransition = (outgoingPage === entryScreen && incomingPage === aboutPage) || (outgoingPage === aboutPage && incomingPage === entryScreen);
        const isEntryToSlide = (outgoingPage === entryScreen && (incomingPage === postPage || incomingPage === collectionPage));
        const isSlideToEntry = ((outgoingPage === postPage || outgoingPage === collectionPage) && incomingPage === entryScreen);

        // Prepare incoming page visually (invisible, correct starting transform)
        setPageStyle(incomingPage, { opacity: 0, visibility: 'visible', pointerEvents: 'none' });
        let incomingInitialTransform = 'translateX(0)';
        if (isEntryToSlide) { incomingInitialTransform = 'translateX(100%)'; }
        incomingPage.style.transform = incomingInitialTransform;

        // Use rAF to ensure styles are applied before animation starts
        requestAnimationFrame(() => {
             const tl = anime.timeline({
                 duration: (isEntryToSlide || isSlideToEntry) ? SLIDE_DURATION : FADE_DURATION,
                 easing: EASE_IN_OUT_QUAD,
                 complete: () => {
                     if (outgoingPage) { setPageStyle(outgoingPage, { opacity: 0, visibility: 'hidden', pointerEvents: 'none', transform: 'translateX(0)' }); }
                     setPageStyle(incomingPage, { opacity: 1, visibility: 'visible', pointerEvents: 'auto', transform: 'translateX(0)' });
                     currentPageElement = incomingPage;
                     isPageAnimating = false;
                 }
             });

             // Outgoing Animation Config
             if (outgoingPage) {
                 let outgoingAnimConfig = { targets: outgoingPage, opacity: 0, duration: FADE_DURATION, easing: EASE_IN_OUT_QUAD };
                 if (isSlideToEntry) {
                     outgoingAnimConfig.translateX = '100%'; outgoingAnimConfig.easing = EASE_IN_CUBIC; outgoingAnimConfig.duration = SLIDE_DURATION;
                 } else if (isEntryToSlide) { outgoingAnimConfig.duration = SLIDE_DURATION; }
                 tl.add(outgoingAnimConfig, 0);
             }

             // Incoming Animation Config
             let incomingAnimConfig = { targets: incomingPage, opacity: 1, translateX: '0%', duration: FADE_DURATION, easing: EASE_IN_OUT_QUAD };
             if (isEntryToSlide) {
                 incomingAnimConfig.easing = EASE_OUT_CUBIC; incomingAnimConfig.duration = SLIDE_DURATION;
             } else if (isSlideToEntry) { incomingAnimConfig.duration = SLIDE_DURATION; }
             tl.add(incomingAnimConfig, 0);
        }); // End of requestAnimationFrame
    }

    // ---- Modal Functions (Using requestAnimationFrame) ----
    function showModal() {
        console.log("showModal 函數被調用。");
        if (!modalOverlay || !modalContent) { console.error("Modal 元素未找到！"); return; }
        if (typeof anime === 'undefined') { console.error("Anime.js 未載入！"); return; }
        if (isModalAnimating) { console.warn("Modal 正在動畫中，忽略。"); return; }
        // 暫時移除 isModalVisible 檢查以允許強制顯示/刷新
        // if (isModalVisible) { console.warn("Modal 已可見，忽略。"); return; }

        isModalAnimating = true; // 開始動畫過程

        // 1. 準備 DOM 狀態
        modalOverlay.classList.remove('is-hidden');
        modalOverlay.style.display = 'flex';
        modalOverlay.style.pointerEvents = 'auto';
        modalOverlay.style.opacity = '0'; // 確保動畫起始點
        modalOverlay.style.visibility = 'visible';
        if(modalContent) {
            modalContent.style.opacity = '0';
            modalContent.style.transform = 'scale(0.95) translateY(10px)';
            modalContent.style.visibility = 'visible';
        }

        // 2. 使用 requestAnimationFrame 推遲動畫調用
        requestAnimationFrame(() => {
            console.log("requestAnimationFrame 回調觸發，開始 Anime.js 動畫...");

            // 背景遮罩動畫
            anime({
                targets: modalOverlay,
                opacity: 1,
                duration: 250,
                easing: 'easeOutQuad',
                begin: () => console.log("Modal overlay 動畫開始 (rAF)"),
                complete: () => console.log("Modal overlay 動畫完成 (rAF)")
            });

            // 內容框動畫
            anime({
                targets: modalContent,
                opacity: 1,
                scale: 1,
                translateY: '0px',
                duration: 350,
                delay: 50,
                easing: 'easeInOutSine',
                begin: () => console.log("Modal content 動畫開始 (rAF)"),
                complete: () => {
                    console.log("Modal content 動畫完成 (rAF)");
                    isModalAnimating = false;
                    isModalVisible = true; // 動畫結束，標記為可見
                    console.log("Modal 顯示完成 (rAF)，狀態設為 isModalAnimating=false, isModalVisible=true");
                }
            });
        });
    }

    function hideModal() {
        console.log("hideModal 函數被調用。");
        if (!modalOverlay || !modalContent || typeof anime === 'undefined') { return; }
        if (isModalAnimating || !isModalVisible) {
             console.warn(`忽略 hideModal: isAnimating=${isModalAnimating}, isVisible=${isModalVisible}`);
             return;
        }

        isModalAnimating = true;
        isModalVisible = false; // 立即標記為不可見

        modalOverlay.style.pointerEvents = 'none';

        // 使用 requestAnimationFrame 推遲動畫調用
        requestAnimationFrame(() => {
             console.log("requestAnimationFrame 回調觸發，開始隱藏動畫...");

             // 內容框動畫 (先執行)
             anime({
                 targets: modalContent,
                 opacity: 0,
                 scale: 0.95,
                 translateY: '10px',
                 duration: 300,
                 easing: 'easeInSine',
                 begin: () => console.log("Modal content 隱藏動畫開始 (rAF)"),
                 complete: () => {
                     console.log("Modal content 隱藏動畫完成 (rAF)");
                      if(modalContent) modalContent.style.visibility = 'hidden';
                 }
             });

             // 背景遮罩動畫
             anime({
                 targets: modalOverlay,
                 opacity: 0,
                 duration: 250,
                 delay: 50,
                 easing: 'easeOutQuad',
                 begin: () => console.log("Modal overlay 隱藏動畫開始 (rAF)"),
                 complete: () => {
                     console.log("Modal overlay 隱藏動畫完成 (rAF)");
                     modalOverlay.classList.add('is-hidden'); // 添加 is-hidden
                     modalOverlay.style.visibility = 'hidden';
                     modalOverlay.style.display = ''; // 清除內聯 display

                     isModalAnimating = false;
                     console.log("Modal 隱藏完成 (rAF)，狀態設為 isModalAnimating=false, isModalVisible=false");
                 }
             });
        });
    }

    // ---- Collection Data Loading ----
    async function loadCollectionData(tabButton) {
        const targetTabId = tabButton.dataset.tab;
        const jsonFileName = tabButton.dataset.jsonSource;
        const targetContentElement = document.getElementById(`content-${targetTabId}`);
        const targetGridElement = targetContentElement?.querySelector('.item-grid');
        const loadingMessageElement = targetContentElement?.querySelector('.loading-message');

        if (!targetContentElement || !targetGridElement || !jsonFileName) {
             console.error(`Collection Load Error: Missing elements or source for tab ${targetTabId}`);
             if(targetContentElement) targetContentElement.innerHTML = '<p style="color: red;">載入錯誤。</p>';
             return;
        }
        if (loadingMessageElement) loadingMessageElement.style.display = 'block';
        targetGridElement.innerHTML = ''; targetGridElement.style.display = 'none';

        if (collectionDataCache[targetTabId]) {
             renderCollectionItems(collectionDataCache[targetTabId], targetGridElement);
             if (loadingMessageElement) loadingMessageElement.style.display = 'none';
             targetGridElement.style.display = 'grid'; return;
        }
        try {
             const response = await fetch(`./data/${jsonFileName}`);
             if (!response.ok) throw new Error(`HTTP ${response.status} - ${jsonFileName}`);
             const data = await response.json();
             collectionDataCache[targetTabId] = data;
             renderCollectionItems(data, targetGridElement);
        } catch (error) {
             console.error(`Fetch Error: ${error}`);
             targetGridElement.innerHTML = `<p style="color: red;">無法載入內容: ${error.message}</p>`;
        } finally {
             if (loadingMessageElement) loadingMessageElement.style.display = 'none';
             targetGridElement.style.display = 'grid';
        }
    }

    function renderCollectionItems(items, gridElement) {
        gridElement.innerHTML = '';
        if (!items || !Array.isArray(items) || items.length === 0) {
             gridElement.innerHTML = '<p>沒有項目可顯示。</p>'; return;
        }
        items.forEach(item => {
             const linkElement = document.createElement('a');
             linkElement.href = item.hyperlink || '#';
             linkElement.classList.add('grid-item');
             linkElement.dataset.id = item.id || '';
             if (item.hyperlink && (item.hyperlink.startsWith('http://') || item.hyperlink.startsWith('https://'))) {
                  linkElement.target = '_blank'; linkElement.rel = 'noopener noreferrer';
             }
             const imgElement = document.createElement('img');
             imgElement.src = item.illustrationPath ? item.illustrationPath : 'https://via.placeholder.com/150/cccccc?text=No+Image';
             imgElement.alt = item.title || '項目圖片';
             imgElement.loading = 'lazy';
             imgElement.onerror = function() { this.onerror=null; this.src='https://via.placeholder.com/150/cccccc?text=Load+Error'; };
             const titleElement = document.createElement('p');
             titleElement.textContent = item.title || '無標題';
             linkElement.appendChild(imgElement);
             linkElement.appendChild(titleElement);
             gridElement.appendChild(linkElement);
        });
    }

    // ---- Post List Initialization ----
    async function initializePostList() {
        if (!postListContainer) { console.error("Post list container not found."); return; }
        const loadingMessage = postListContainer.querySelector('.loading-message');

        try {
            const response = await fetch('./data/postlist.json');
            if (!response.ok) { throw new Error(`HTTP error! Status: ${response.status} - Could not load postlist.json`); }
            const posts = await response.json();
            if (loadingMessage) loadingMessage.remove();
            postListContainer.innerHTML = '';

            if (!Array.isArray(posts) || posts.length === 0) { postListContainer.innerHTML = '<p>目前沒有文章。</p>'; return; }

            posts.forEach(post => {
                const postItemDiv = document.createElement('div');
                postItemDiv.classList.add('post-item');
                postItemDiv.dataset.postId = post.id || '';
                postItemDiv.dataset.markdownFile = post.markdownFile || ''; // Store path here

                const mainDiv = document.createElement('div'); mainDiv.classList.add('post-item-main');
                const titleH2 = document.createElement('h2'); titleH2.classList.add('post-title'); titleH2.textContent = post.title || '無標題';
                const subtitleP = document.createElement('p'); subtitleP.classList.add('post-subtitle'); subtitleP.textContent = post.subtitle || '';
                const dateSpan = document.createElement('span'); dateSpan.classList.add('post-date'); dateSpan.textContent = post.date || '';

                mainDiv.appendChild(titleH2); mainDiv.appendChild(subtitleP);
                postItemDiv.appendChild(mainDiv); postItemDiv.appendChild(dateSpan);

                // Add click listener for this specific item
                postItemDiv.addEventListener('click', handlePostItemClick);

                postListContainer.appendChild(postItemDiv);
            });

        } catch (error) {
            console.error("Failed to initialize post list:", error);
            if (loadingMessage) loadingMessage.remove();
            postListContainer.innerHTML = `<p style="color: red;">無法載入文章列表: ${error.message}</p>`;
        }
    }

    // ---- Post Item Click Handler ----
    async function handlePostItemClick(event) {
        const clickedItem = event.currentTarget;
        const markdownFilePath = clickedItem.dataset.markdownFile;
        console.log(`Post item clicked. Attempting to load: ${markdownFilePath}`);

        if (isPageAnimating || isModalAnimating) { console.log("Animation in progress, click ignored."); return; }
        if (!markdownFilePath) {
            console.error("Markdown file path not found for this post item.", clickedItem);
            if (modalPostContent) modalPostContent.innerHTML = '<p style="color: red;">錯誤：找不到文章檔案路徑。</p>';
            showModal(); return;
        }

        try {
            console.log(`Fetching ${markdownFilePath}...`);
            const response = await fetch(markdownFilePath);
            if (!response.ok) { throw new Error(`HTTP error! Status: ${response.status} - Could not load ${markdownFilePath}`); }
            const markdownText = await response.text();
            console.log("Markdown file fetched successfully.");

            if (typeof marked === 'undefined') { throw new Error("Marked.js library not loaded."); }

            console.log("Parsing Markdown...");
            const htmlContent = marked.parse(markdownText);
            console.log("Markdown parsed successfully.");

            if (modalPostContent) {
                 modalPostContent.innerHTML = htmlContent;
                 console.log("Modal content updated.");
                 showModal(); // Call showModal AFTER content is ready
            } else {
                 console.error("Cannot set modal content because modalPostContent element is missing!");
            }

        } catch (error) {
            console.error("Failed to load or parse markdown:", error);
            if (modalPostContent) {
                 modalPostContent.innerHTML = `<div style="padding: 20px; color: red;"><h2>載入錯誤</h2><p>無法載入或解析文章內容。</p><p><small>${escapeHTML(error.message)}</small></p></div>`;
                 console.log("Error message set in modal.");
                 showModal(); // Show modal even if there's an error
            } else {
                console.error("Cannot display error because modalPostContent element is missing!");
            }
        }
    }

    // ---- Event Listeners ----
    if (entryLinks.length > 0) { entryLinks.forEach(link => { link.addEventListener('click', (event) => { event.stopPropagation(); const targetPageId = link.dataset.target; const targetPage = document.getElementById(targetPageId); if (targetPage) { switchPage(targetPage); } }); }); }
    if (entryBackground) { entryBackground.addEventListener('click', () => { if (aboutPage) switchPage(aboutPage); }); }
    if (escapeButtons.length > 0) { escapeButtons.forEach(button => { button.addEventListener('click', () => { switchPage(null); }); }); }
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { if (isModalVisible) { hideModal(); } else if (currentPageElement !== entryScreen) { switchPage(null); } } });
    if (tabButtons.length > 0) { tabButtons.forEach(button => { button.addEventListener('click', () => { const targetTabId = button.dataset.tab; const targetContentElement = document.getElementById(`content-${targetTabId}`); if (button.classList.contains('active-tab')) return; tabButtons.forEach(btn => btn.classList.remove('active-tab')); button.classList.add('active-tab'); tabContents.forEach(content => { content.classList.remove('active-content'); content.style.display = 'none'; }); if (targetContentElement) { targetContentElement.classList.add('active-content'); targetContentElement.style.display = 'block'; loadCollectionData(button); } }); }); }
    if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);
    if (modalOverlay) { modalOverlay.addEventListener('click', (event) => { if (event.target === modalOverlay && isModalVisible) hideModal(); }); }

    // ---- Initialization ----
    function initializeApp() {
        allPageElements.forEach(page => { setPageStyle(page, { opacity: 0, visibility: 'hidden', pointerEvents: 'none' }); });
        if (entryScreen) { setPageStyle(entryScreen, { opacity: 1, visibility: 'visible', pointerEvents: 'auto' }); currentPageElement = entryScreen; }
        else { console.error("Entry screen not found!"); if (allPageElements.length > 0) { setPageStyle(allPageElements[0], { opacity: 1, visibility: 'visible', pointerEvents: 'auto' }); currentPageElement = allPageElements[0]; } }
        if (modalOverlay) { modalOverlay.classList.add('is-hidden'); setPageStyle(modalOverlay, { opacity: 0, visibility: 'hidden', pointerEvents: 'none' }); if (modalContent) setPageStyle(modalContent, { opacity: 0, visibility: 'hidden', pointerEvents: 'none', transform: 'scale(0.95) translateY(10px)' }); }
        const initialActiveTabButton = document.querySelector('.collection-sidebar .tab-button.active-tab');
        if (initialActiveTabButton) { const initialTabId = initialActiveTabButton.dataset.tab; const initialContentElement = document.getElementById(`content-${initialTabId}`); tabContents.forEach(content => content.style.display = 'none'); if (initialContentElement) { initialContentElement.style.display = 'block'; initialContentElement.classList.add('active-content'); loadCollectionData(initialActiveTabButton); } }
        else if (tabButtons.length > 0 && tabContents.length > 0) { tabButtons[0].classList.add('active-tab'); tabContents.forEach(content => content.style.display = 'none'); tabContents[0].style.display = 'block'; tabContents[0].classList.add('active-content'); loadCollectionData(tabButtons[0]); }
        initializePostList(); // Initialize the dynamic post list
    }

    // ---- Helper function for escaping HTML ----
    function escapeHTML(str) {
        if (!str) return '';
        const p = document.createElement("p");
        p.textContent = str;
        return p.innerHTML;
    }

    // --- Run Initialization ---
    initializeApp();

}); // DOMContentLoaded 結束