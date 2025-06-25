// 動物代號陣列
const ANIMALS = [
    { name: '熊貓', icon: '🐼' },
    { name: '老虎', icon: '🐅' },
    { name: '獅子', icon: '🦁' },
    { name: '大象', icon: '🐘' },
    { name: '長頸鹿', icon: '🦒' },
    { name: '猩猩', icon: '🦍' },
    { name: '袋鼠', icon: '🦘' },
    { name: '企鵝', icon: '🐧' },
    { name: '海豚', icon: '🐬' },
    { name: '無尾熊', icon: '🐨' }
];

// 目的地信息
const DESTINATIONS = {
    'vietnam-hcmc': { name: '越南胡志明市', nameEn: 'Ho Chi Minh City, Vietnam' },
    'japan-okinawa': { name: '日本沖繩', nameEn: 'Okinawa, Japan' },
    'korea-jeju': { name: '韓國濟州島', nameEn: 'Jeju Island, Korea' },
    'korea-seoul': { name: '韓國首爾', nameEn: 'Seoul, Korea' },
    'hong-kong': { name: '香港', nameEn: 'Hong Kong' }
};

// Google Apps Script API配置（需要使用者提供）
const API_CONFIG = {
    SUBMIT_URL: 'https://script.google.com/macros/s/AKfycbzySuVfM19yvK0QcJ_fP8mAMq9EVJ3ctFYicAAEI3GkqChYooOiJLTGNmraiX50Ivh5YQ/exec',
    RESULTS_URL: 'https://script.google.com/macros/s/AKfycbzySuVfM19yvK0QcJ_fP8mAMq9EVJ3ctFYicAAEI3GkqChYooOiJLTGNmraiX50Ivh5YQ/exec?action=getResults'
};

// 全域變數
let currentUser = null;
let isSubmitting = false;
let draggedElement = null;
let draggedIndex = -1;

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    // 通用初始化
    initializeUser();
    loadImages();

    // 僅在投票頁面 (index.html) 執行
    if (document.getElementById('votingContainer')) {
        initializeDragAndDrop();
        initializeEventListeners();
        checkVoteStatus();
    }

    // 僅在結果頁面 (results.html) 執行
    if (document.getElementById('resultsChart')) {
        initializeResults();
    }
});

// 初始化用戶身份
function initializeUser() {
    // 檢查是否已有用戶身份
    let storedUser = localStorage.getItem('votingUser');
    
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
    } else {
        // 隨機分配動物代號
        const randomAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 1000);
        
        currentUser = {
            id: `${randomAnimal.name}_${timestamp}_${randomSuffix}`,
            animal: randomAnimal,
            createdAt: new Date().toISOString()
        };
        
        // 保存到本機存放區
        localStorage.setItem('votingUser', JSON.stringify(currentUser));
    }
    
    // 更新UI顯示
    updateUserDisplay();
}

// 更新使用者顯示
function updateUserDisplay() {
    const animalAvatar = document.getElementById('animalAvatar');
    const animalName = document.getElementById('animalName');
    
    if (animalAvatar && animalName && currentUser) {
        animalAvatar.innerHTML = currentUser.animal.icon;
        animalName.textContent = currentUser.animal.name;
    }
}

// 初始化拖拽排序功能
function initializeDragAndDrop() {
    const container = document.getElementById('votingContainer');
    const cards = container.querySelectorAll('.destination-card');
    
    cards.forEach((card, index) => {
        // 桌面端拖拽事件
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('dragenter', handleDragEnter);
        card.addEventListener('dragleave', handleDragLeave);
        card.addEventListener('drop', handleDrop);
        
        // 移動端觸摸事件
        card.addEventListener('touchstart', handleTouchStart, { passive: false });
        card.addEventListener('touchmove', handleTouchMove, { passive: false });
        card.addEventListener('touchend', handleTouchEnd, { passive: false });
    });
    
    // 初始化排名
    updateRankings();
}

// 拖拽開始
function handleDragStart(e) {
    draggedElement = this;
    draggedIndex = Array.from(this.parentNode.children).indexOf(this);
    
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
    
    // 添加拖拽狀態到容器
    document.getElementById('votingContainer').classList.add('drag-active');
}

// 拖拽結束
function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.getElementById('votingContainer').classList.remove('drag-active');
    
    // 清理所有拖拽狀態
    document.querySelectorAll('.destination-card').forEach(card => {
        card.classList.remove('drag-over');
    });
    
    draggedElement = null;
    draggedIndex = -1;
}

// 拖拽懸停
function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    e.dataTransfer.dropEffect = 'move';
    return false;
}

// 拖拽進入
function handleDragEnter(e) {
    if (this !== draggedElement) {
        this.classList.add('drag-over');
    }
}

// 拖拽離開
function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

// 拖拽放置
function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedElement !== this) {
        const container = document.getElementById('votingContainer');
        const allCards = Array.from(container.children);
        const draggedIdx = allCards.indexOf(draggedElement);
        const targetIdx = allCards.indexOf(this);
        
        if (draggedIdx < targetIdx) {
            container.insertBefore(draggedElement, this.nextSibling);
        } else {
            container.insertBefore(draggedElement, this);
        }
        
        updateRankings();
    }
    
    this.classList.remove('drag-over');
    return false;
}

// 移動端觸摸事件處理
let touchStartY = 0;
let touchCard = null;

function handleTouchStart(e) {
    touchStartY = e.touches[0].clientY;
    touchCard = this;
    this.style.zIndex = '1000';
}

function handleTouchMove(e) {
    e.preventDefault();
    
    if (!touchCard) return;
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    const deltaY = currentY - touchStartY;
    
    // 移動卡片
    touchCard.style.transform = `translateY(${deltaY}px)`;
    touchCard.classList.add('dragging');
    
    // 查找目標位置
    const container = document.getElementById('votingContainer');
    const cards = Array.from(container.children);
    const cardHeight = touchCard.offsetHeight + 16; // 包括gap
    
    const targetIndex = Math.floor((currentY - container.offsetTop + window.scrollY) / cardHeight);
    const clampedIndex = Math.max(0, Math.min(targetIndex, cards.length - 1));
    
    // 清理之前的高亮
    cards.forEach(card => card.classList.remove('drag-over'));
    
    // 高亮目標位置
    if (cards[clampedIndex] && cards[clampedIndex] !== touchCard) {
        cards[clampedIndex].classList.add('drag-over');
    }
}

function handleTouchEnd(e) {
    if (!touchCard) return;
    
    const container = document.getElementById('votingContainer');
    const cards = Array.from(container.children);
    const targetCard = cards.find(card => card.classList.contains('drag-over'));
    
    if (targetCard && targetCard !== touchCard) {
        const touchIndex = cards.indexOf(touchCard);
        const targetIndex = cards.indexOf(targetCard);
        
        if (touchIndex < targetIndex) {
            container.insertBefore(touchCard, targetCard.nextSibling);
        } else {
            container.insertBefore(touchCard, targetCard);
        }
        
        updateRankings();
    }
    
    // 重置樣式
    touchCard.style.transform = '';
    touchCard.style.zIndex = '';
    touchCard.classList.remove('dragging');
    
    // 清理高亮
    cards.forEach(card => card.classList.remove('drag-over'));
    
    touchCard = null;
}

// 更新排名顯示
function updateRankings() {
    const container = document.getElementById('votingContainer');
    const cards = Array.from(container.children);
    
    cards.forEach((card, index) => {
        const rank = index + 1;
        const rankBadge = card.querySelector('.rank-badge');
        if (rankBadge) {
            rankBadge.textContent = rank;
        }
    });
}

// 初始化事件監聽器
function initializeEventListeners() {
    // 提交投票按鈕
    document.getElementById('submitBtn').addEventListener('click', showConfirmModal);
    
    // 查看結果按鈕
    document.getElementById('resultsBtn').addEventListener('click', () => {
        window.location.href = 'results.html';
    });
    
    // 模態框事件
    document.getElementById('modalClose').addEventListener('click', hideConfirmModal);
    document.getElementById('cancelBtn').addEventListener('click', hideConfirmModal);
    document.getElementById('confirmBtn').addEventListener('click', submitVote);
    
    // 點擊模態框背景關閉
    document.getElementById('confirmModal').addEventListener('click', (e) => {
        if (e.target.id === 'confirmModal') {
            hideConfirmModal();
        }
    });
}

// 顯示確認模態框
function showConfirmModal() {
    const voteSummary = generateVoteSummary();
    document.getElementById('voteSummary').innerHTML = voteSummary;
    document.getElementById('confirmModal').classList.add('show');
}

// 隱藏確認模態框
function hideConfirmModal() {
    document.getElementById('confirmModal').classList.remove('show');
}

// 生成投票摘要
function generateVoteSummary() {
    const container = document.getElementById('votingContainer');
    const cards = Array.from(container.children);
    
    let summary = '';
    cards.forEach((card, index) => {
        const destination = card.dataset.destination;
        const destinationInfo = DESTINATIONS[destination];
        const rank = index + 1;
        const score = 6 - rank; // 第1名5分，第2名4分，以此類推
        
        summary += `
            <div class="vote-item">
                <span class="vote-rank">第${rank}名</span>
                <span class="vote-destination">${destinationInfo.name}</span>
                <span class="vote-score">${score}分</span>
            </div>
        `;
    });
    
    return summary;
}

// 提交投票
async function submitVote() {
    if (isSubmitting) return;
    
    isSubmitting = true;
    
    // 顯示載入動畫
    document.getElementById('loadingOverlay').classList.add('show');
    
    try {
        // 收集投票資料
        const voteData = collectVoteData();
        
        // 提交到Google Apps Script
        const response = await submitToGoogleSheets(voteData);
        
        if (response.success) {
            showSuccessToast('投票提交成功！');
            hideConfirmModal();
            
            // 禁用提交按鈕，防止重複提交
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> 已投票';
            
            // 保存投票狀態
            localStorage.setItem('hasVoted', 'true');
            localStorage.setItem('voteData', JSON.stringify(voteData));
            
        } else {
            throw new Error(response.message || '提交失敗');
        }
        
    } catch (error) {
        console.error('投票提交失敗:', error);
        showErrorToast(error.message || '提交失敗，請重試');
    } finally {
        isSubmitting = false;
        document.getElementById('loadingOverlay').classList.remove('show');
    }
}

// 收集投票資料
function collectVoteData() {
    const container = document.getElementById('votingContainer');
    const cards = Array.from(container.children);
    
    const votes = cards.map((card, index) => {
        const destination = card.dataset.destination;
        const destinationInfo = DESTINATIONS[destination];
        const rank = index + 1;
        const score = 6 - rank;
        
        return {
            destination: destination,
            destinationName: destinationInfo.name,
            destinationNameEn: destinationInfo.nameEn,
            rank: rank,
            score: score
        };
    });
    
    return {
        userId: currentUser.id,
        userAnimal: currentUser.animal.name,
        votes: votes,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`
    };
}

// 提交資料到Google Sheets
async function submitToGoogleSheets(voteData) {
    try {
        const response = await fetch(API_CONFIG.SUBMIT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'submitVote',
                data: voteData
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
        
    } catch (error) {
        console.error('提交到Google Sheets失敗:', error);
        
        // 如果是網路錯誤或API配置問題，使用本機存放區作為備選
        return await submitToLocalStorage(voteData);
    }
}

// 本機存放區備選方案
async function submitToLocalStorage(voteData) {
    try {
        // 獲取現有投票資料
        let allVotes = JSON.parse(localStorage.getItem('allVotes') || '[]');
        
        // 檢查是否已經投票過
        const existingVoteIndex = allVotes.findIndex(vote => vote.userId === voteData.userId);
        
        if (existingVoteIndex !== -1) {
            // 更新現有投票
            allVotes[existingVoteIndex] = voteData;
        } else {
            // 添加新投票
            allVotes.push(voteData);
        }
        
        // 保存到本機存放區
        localStorage.setItem('allVotes', JSON.stringify(allVotes));
        
        return { success: true, message: '投票已保存到本地' };
        
    } catch (error) {
        console.error('保存到本機存放區失敗:', error);
        throw new Error('保存失敗');
    }
}

// 顯示成功提示
function showSuccessToast(message) {
    const toast = document.getElementById('successToast');
    const messageSpan = toast.querySelector('span');
    messageSpan.textContent = message;
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 顯示錯誤提示
function showErrorToast(message) {
    const toast = document.getElementById('errorToast');
    const messageSpan = document.getElementById('errorMessage');
    messageSpan.textContent = message;
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

// 檢查投票狀態
function checkVoteStatus() {
    const hasVoted = localStorage.getItem('hasVoted');
    if (hasVoted === 'true') {
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> 已投票';
    }
}

// 載入圖片
function loadImages() {
    // 這裡可以添加圖片載入邏輯
    // 如果圖片不存在，可以使用預留位置或預設圖片
    const images = document.querySelectorAll('.destination-image');
    
    images.forEach(img => {
        img.addEventListener('error', function() {
            // 如果圖片載入失敗，使用預留位置
            this.src = 'https://via.placeholder.com/400x120/667eea/ffffff?text=' + encodeURIComponent(this.alt);
        });
    });
}



// 結果頁面初始化
async function initializeResults() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.add('show');

    try {
        const results = await loadResultsData();
        if (results && results.statistics) {
            renderResults(results);
        } else {
            showErrorToast('無法載入結果，請稍後再試。');
        }
    } catch (error) {
        console.error('初始化結果頁面失敗:', error);
        showErrorToast(error.message || '載入結果時發生錯誤');
    } finally {
        loadingOverlay.classList.remove('show');
    }
}

// 從API或本地存儲加載結果數據
async function loadResultsData() {
    try {
        const response = await fetch(API_CONFIG.RESULTS_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success) {
            return result.data;
        }
        throw new Error(result.message || '從伺服器獲取資料失敗');
    } catch (error) {
        console.warn('從伺服器獲取資料失敗，使用本地資料:', error);
        // 如果API失敗，嘗試從本地存儲加載
        const localVotes = JSON.parse(localStorage.getItem('allVotes') || '[]');
        if (localVotes.length > 0) {
            return { statistics: calculateLocalStatistics(localVotes) };
        }
        return null;
    }
}

// 渲染結果
function renderResults(data) {
    renderSummary(data.statistics);
    renderChart(data.statistics);
}

// 渲染摘要信息
function renderSummary(stats) {
    const summaryContainer = document.getElementById('summaryContainer');
    summaryContainer.innerHTML = ''; // 清空舊內容

    const sortedDests = Object.keys(stats).sort((a, b) => stats[b].totalScore - stats[a].totalScore);

    sortedDests.forEach((key, index) => {
        const stat = stats[key];
        const destInfo = DESTINATIONS[key];
        const card = `
            <div class="summary-card rank-${index + 1}">
                <div class="summary-rank">${index + 1}</div>
                <div class="summary-dest">${destInfo.name}</div>
                <div class="summary-score">${stat.totalScore}分</div>
                <div class="summary-votes">(${stat.voteCount} 次投票)</div>
            </div>
        `;
        summaryContainer.innerHTML += card;
    });
}

// 渲染圖表
function renderChart(stats) {
    const ctx = document.getElementById('resultsChart').getContext('2d');
    const labels = Object.keys(stats).map(key => DESTINATIONS[key].name);
    const scores = Object.keys(stats).map(key => stats[key].totalScore);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '總得分',
                data: scores,
                backgroundColor: [
                    'rgba(139, 92, 246, 0.7)',
                    'rgba(99, 102, 241, 0.7)',
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(34, 197, 94, 0.7)',
                    'rgba(234, 179, 8, 0.7)'
                ],
                borderColor: [
                    'rgba(139, 92, 246, 1)',
                    'rgba(99, 102, 241, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(34, 197, 94, 1)',
                    'rgba(234, 179, 8, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// 在本地計算統計信息（備用）
function calculateLocalStatistics(votes) {
    const stats = {};
    Object.keys(DESTINATIONS).forEach(key => {
        stats[key] = { totalScore: 0, voteCount: 0 };
    });

    votes.forEach(vote => {
        vote.votes.forEach(item => {
            if (stats[item.destination]) {
                stats[item.destination].totalScore += item.score;
                stats[item.destination].voteCount++;
            }
        });
    });
    return stats;
}

// 匯出函數供其他頁面使用
window.VotingSystem = {
    currentUser: () => currentUser,
    getVoteData: () => JSON.parse(localStorage.getItem('voteData') || 'null'),
    getAllVotes: () => JSON.parse(localStorage.getItem('allVotes') || '[]'),
    DESTINATIONS: DESTINATIONS,
    API_CONFIG: API_CONFIG
};
