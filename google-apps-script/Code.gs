/**
 * 匿名投票系統 - Google Apps Script 後端
 * 功能：處理投票資料提交和結果查詢
 */

// Google Sheets 配置
const SHEET_CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID', // 需要替換為實際的表格ID
  VOTES_SHEET: '投票記錄',
  RESULTS_SHEET: '統計結果'
};

// 目的地配置
const DESTINATIONS = {
  'vietnam-hcmc': { name: '越南胡志明市', nameEn: 'Ho Chi Minh City, Vietnam' },
  'japan-okinawa': { name: '日本沖繩', nameEn: 'Okinawa, Japan' },
  'korea-jeju': { name: '韓國濟州島', nameEn: 'Jeju Island, Korea' },
  'korea-seoul': { name: '韓國首爾', nameEn: 'Seoul, Korea' },
  'hong-kong': { name: '香港', nameEn: 'Hong Kong' }
};

/**
 * 主要的HTTP處理函數
 * 處理GET和POST請求
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'getResults') {
      return getVotingResults();
    }
    
    return createResponse({
      success: false,
      message: '未知的操作'
    });
    
  } catch (error) {
    console.error('doGet錯誤:', error);
    return createResponse({
      success: false,
      message: '伺服器錯誤: ' + error.toString()
    });
  }
}

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    
    if (action === 'submitVote') {
      return submitVote(requestData.data);
    }
    
    return createResponse({
      success: false,
      message: '未知的操作'
    });
    
  } catch (error) {
    console.error('doPost錯誤:', error);
    return createResponse({
      success: false,
      message: '伺服器錯誤: ' + error.toString()
    });
  }
}

/**
 * 提交投票資料
 */
function submitVote(voteData) {
  try {
    // 驗證資料格式
    if (!validateVoteData(voteData)) {
      return createResponse({
        success: false,
        message: '投票資料格式無效'
      });
    }
    
    // 檢查是否重複投票
    if (hasUserVoted(voteData.userId)) {
      return createResponse({
        success: false,
        message: '您已經投過票了'
      });
    }
    
    // 保存到投票記錄表
    saveVoteToSheet(voteData);
    
    // 更新統計結果
    updateResultsSheet();
    
    return createResponse({
      success: true,
      message: '投票提交成功',
      data: {
        userId: voteData.userId,
        timestamp: voteData.timestamp
      }
    });
    
  } catch (error) {
    console.error('提交投票錯誤:', error);
    return createResponse({
      success: false,
      message: '投票提交失敗: ' + error.toString()
    });
  }
}

/**
 * 獲取投票結果
 */
function getVotingResults() {
  try {
    const votes = getAllVotes();
    const statistics = calculateStatistics(votes);
    
    return createResponse({
      success: true,
      data: {
        votes: votes,
        statistics: statistics,
        totalVotes: votes.length,
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('獲取結果錯誤:', error);
    return createResponse({
      success: false,
      message: '獲取結果失敗: ' + error.toString()
    });
  }
}

/**
 * 驗證投票資料格式
 */
function validateVoteData(voteData) {
  if (!voteData || !voteData.userId || !voteData.userAnimal || !voteData.votes) {
    return false;
  }
  
  if (!Array.isArray(voteData.votes) || voteData.votes.length !== 5) {
    return false;
  }
  
  // 檢查所有目的地是否都有投票
  const votedDestinations = voteData.votes.map(v => v.destination);
  const requiredDestinations = Object.keys(DESTINATIONS);
  
  for (let dest of requiredDestinations) {
    if (!votedDestinations.includes(dest)) {
      return false;
    }
  }
  
  return true;
}

/**
 * 檢查用戶是否已投票
 */
function hasUserVoted(userId) {
  try {
    const sheet = getOrCreateSheet(SHEET_CONFIG.VOTES_SHEET);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('檢查重複投票錯誤:', error);
    return false;
  }
}

/**
 * 保存投票到表格
 */
function saveVoteToSheet(voteData) {
  const sheet = getOrCreateSheet(SHEET_CONFIG.VOTES_SHEET);
  
  // 確保表頭存在
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 8).setValues([[
      '用戶ID', '動物代號', '投票時間', '使用者代理', '螢幕解析度', 
      '目的地', '排名', '得分'
    ]]);
  }
  
  // 為每個投票項添加一行
  voteData.votes.forEach(vote => {
    sheet.appendRow([
      voteData.userId,
      voteData.userAnimal,
      voteData.timestamp,
      voteData.userAgent,
      voteData.screenResolution,
      vote.destinationName,
      vote.rank,
      vote.score
    ]);
  });
}

/**
 * 更新統計結果表
 */
function updateResultsSheet() {
  const sheet = getOrCreateSheet(SHEET_CONFIG.RESULTS_SHEET);
  
  // 清空現有資料
  sheet.clear();
  
  // 添加表頭
  sheet.getRange(1, 1, 1, 6).setValues([[
    '目的地', '總得分', '投票次數', '平均得分', '排名', '最後更新'
  ]]);
  
  // 計算統計資料
  const votes = getAllVotes();
  const stats = calculateStatistics(votes);
  
  // 按總得分排序
  const sortedDestinations = Object.keys(DESTINATIONS).sort((a, b) => {
    return (stats[b]?.totalScore || 0) - (stats[a]?.totalScore || 0);
  });
  
  // 添加數據行
  sortedDestinations.forEach((destKey, index) => {
    const destStats = stats[destKey] || { totalScore: 0, voteCount: 0, averageScore: 0 };
    const destInfo = DESTINATIONS[destKey];
    
    sheet.appendRow([
      destInfo.name,
      destStats.totalScore,
      destStats.voteCount,
      destStats.averageScore.toFixed(2),
      index + 1,
      new Date().toISOString()
    ]);
  });
}

/**
 * 獲取所有投票記錄
 */
function getAllVotes() {
  try {
    const sheet = getOrCreateSheet(SHEET_CONFIG.VOTES_SHEET);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return [];
    }
    
    // 按用戶ID分組投票
    const votesByUser = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const userId = row[0];
      const userAnimal = row[1];
      const timestamp = row[2];
      const userAgent = row[3];
      const screenResolution = row[4];
      const destinationName = row[5];
      const rank = row[6];
      const score = row[7];
      
      if (!votesByUser[userId]) {
        votesByUser[userId] = {
          userId: userId,
          userAnimal: userAnimal,
          timestamp: timestamp,
          userAgent: userAgent,
          screenResolution: screenResolution,
          votes: []
        };
      }
      
      // 找到對應的目的地代碼
      const destinationKey = Object.keys(DESTINATIONS).find(key => 
        DESTINATIONS[key].name === destinationName
      );
      
      if (destinationKey) {
        votesByUser[userId].votes.push({
          destination: destinationKey,
          destinationName: destinationName,
          destinationNameEn: DESTINATIONS[destinationKey].nameEn,
          rank: rank,
          score: score
        });
      }
    }
    
    return Object.values(votesByUser);
    
  } catch (error) {
    console.error('獲取投票記錄錯誤:', error);
    return [];
  }
}

/**
 * 計算統計資料
 */
function calculateStatistics(votes) {
  const stats = {};
  
  // 初始化統計資料
  Object.keys(DESTINATIONS).forEach(key => {
    stats[key] = {
      totalScore: 0,
      voteCount: 0,
      averageScore: 0,
      ranks: [0, 0, 0, 0, 0] // 各排名的次數
    };
  });
  
  // 計算統計
  votes.forEach(vote => {
    vote.votes.forEach(voteItem => {
      const destKey = voteItem.destination;
      if (stats[destKey]) {
        stats[destKey].totalScore += voteItem.score;
        stats[destKey].voteCount += 1;
        stats[destKey].ranks[voteItem.rank - 1] += 1;
      }
    });
  });
  
  // 計算平均分
  Object.keys(stats).forEach(key => {
    if (stats[key].voteCount > 0) {
      stats[key].averageScore = stats[key].totalScore / stats[key].voteCount;
    }
  });
  
  return stats;
}

/**
 * 獲取或創建工作表
 */
function getOrCreateSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.openById(SHEET_CONFIG.SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  
  return sheet;
}

/**
 * 創建HTTP回應
 */
function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

/**
 * 初始化函數 - 創建必要的工作表和結構
 */
function initializeSheets() {
  try {
    // 創建投票記錄表
    const votesSheet = getOrCreateSheet(SHEET_CONFIG.VOTES_SHEET);
    if (votesSheet.getLastRow() === 0) {
      votesSheet.getRange(1, 1, 1, 8).setValues([[
        '用戶ID', '動物代號', '投票時間', '使用者代理', '螢幕解析度', 
        '目的地', '排名', '得分'
      ]]);
    }
    
    // 創建統計結果表
    const resultsSheet = getOrCreateSheet(SHEET_CONFIG.RESULTS_SHEET);
    if (resultsSheet.getLastRow() === 0) {
      resultsSheet.getRange(1, 1, 1, 6).setValues([[
        '目的地', '總得分', '投票次數', '平均得分', '排名', '最後更新'
      ]]);
    }
    
    console.log('工作表初始化完成');
    
  } catch (error) {
    console.error('初始化錯誤:', error);
    throw error;
  }
}
