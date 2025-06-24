# 匿名投票评分系统

一个现代化的匿名投票评分网页系统，用于对旅游目的地进行排序投票和结果统计。

## 🌟 功能特性

### 核心功能
- **匿名身份系统**：自动为每个用户分配独特的动物代号（熊猫、老虎、狮子等）
- **拖拽排序投票**：支持桌面端和移动端的直观拖拽排序操作
- **积分计算**：第1名5分，第2名4分，第3名3分，第4名2分，第5名1分
- **实时统计**：动态显示各目的地的累计积分和排名
- **数据持久化**：支持Google Apps Script API和本地存储双重保障

### 投票目的地
- 🇻🇳 越南胡志明市
- 🇯🇵 日本冲绳
- 🇰🇷 韩国济州岛
- 🇰🇷 韩国首尔
- 🇭🇰 香港

### 技术特性
- 📱 完全响应式设计，完美支持移动端
- 🎨 现代化UI设计，优雅的视觉效果
- 🚀 快速加载，流畅的用户体验
- 🔒 数据安全，防止重复投票
- 📊 丰富的数据可视化图表

## 🎯 目标用户

- 旅游爱好者群体
- 团队决策场景
- 活动投票需求
- 意见收集场景

## 🛠️ 技术栈

- **前端**：HTML5 + CSS3 + Vanilla JavaScript
- **样式**：现代CSS Grid/Flexbox布局
- **图表**：Chart.js
- **图标**：Font Awesome
- **字体**：Inter (Google Fonts)
- **后端**：Google Apps Script（可选）
- **存储**：LocalStorage + Google Sheets

## 📁 项目结构

```
voting-system/
├── index.html          # 主投票页面
├── results.html        # 结果查看页面
├── style.css           # 样式文件
├── script.js           # JavaScript逻辑
├── README.md           # 项目说明
└── images/             # 图片资源目录
    ├── vietnam-hcmc.jpg
    ├── japan-okinawa.jpg
    ├── korea-jeju.jpg
    ├── korea-seoul.jpg
    └── hong-kong.jpg
```

## 🚀 快速开始

### 本地运行

1. **克隆项目**
   ```bash
   git clone [your-repo-url]
   cd voting-system
   ```

2. **启动本地服务器**
   ```bash
   # 使用Python 3
   python -m http.server 8000
   
   # 或使用Python 2
   python -m SimpleHTTPServer 8000
   
   # 或使用Node.js
   npx serve .
   ```

3. **访问应用**
   在浏览器中打开 `http://localhost:8000`

### GitHub Pages 部署

1. **上传代码**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **启用GitHub Pages**
   - 进入仓库的 Settings 页面
   - 滚动到 Pages 部分
   - Source 选择 "Deploy from a branch"
   - Branch 选择 "main"
   - 点击 Save

3. **访问网站**
   在 `https://[username].github.io/[repository-name]` 访问

## ⚙️ Google Apps Script 集成

### 1. 创建Google Apps Script项目

1. 访问 [Google Apps Script](https://script.google.com/)
2. 创建新项目
3. 替换默认代码：

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'submitVote') {
      return submitVote(data.data);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: '未知操作'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'getResults') {
      return getResults();
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: '未知操作'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function submitVote(voteData) {
  const sheet = getOrCreateSheet();
  
  // 检查是否已经投票
  const existingRow = findExistingVote(sheet, voteData.userId);
  
  if (existingRow > 0) {
    // 更新现有投票
    updateVoteRow(sheet, existingRow, voteData);
  } else {
    // 添加新投票
    addVoteRow(sheet, voteData);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({success: true, message: '投票提交成功'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function getResults() {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return ContentService
      .createTextOutput(JSON.stringify({success: true, votes: []}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const votes = data.slice(1).map(row => ({
    userId: row[0],
    userAnimal: row[1],
    timestamp: row[2],
    votes: JSON.parse(row[3])
  }));
  
  return ContentService
    .createTextOutput(JSON.stringify({success: true, votes: votes}))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet() {
  const spreadsheetId = 'YOUR_SPREADSHEET_ID'; // 替换为你的Google Sheets ID
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  
  let sheet = spreadsheet.getSheetByName('Votes');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Votes');
    // 添加标题行
    sheet.getRange(1, 1, 1, 4).setValues([['用户ID', '动物代号', '时间戳', '投票数据']]);
  }
  
  return sheet;
}

function findExistingVote(sheet, userId) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      return i + 1; // 返回行号（1-based）
    }
  }
  return 0;
}

function updateVoteRow(sheet, row, voteData) {
  sheet.getRange(row, 1, 1, 4).setValues([[
    voteData.userId,
    voteData.userAnimal,
    voteData.timestamp,
    JSON.stringify(voteData.votes)
  ]]);
}

function addVoteRow(sheet, voteData) {
  sheet.appendRow([
    voteData.userId,
    voteData.userAnimal,
    voteData.timestamp,
    JSON.stringify(voteData.votes)
  ]);
}
```

### 2. 配置Google Sheets

1. 创建新的Google Sheets文档
2. 复制Spreadsheet ID（URL中的长字符串）
3. 在Apps Script代码中替换 `YOUR_SPREADSHEET_ID`

### 3. 部署Web应用

1. 在Apps Script编辑器中点击"部署" → "新部署"
2. 类型选择"Web应用"
3. 执行身份选择"我"
4. 访问权限选择"任何人"
5. 点击"部署"
6. 复制Web应用URL

### 4. 更新前端配置

在 `script.js` 文件中更新API配置：

```javascript
const API_CONFIG = {
    SUBMIT_URL: 'YOUR_WEB_APP_URL',
    RESULTS_URL: 'YOUR_WEB_APP_URL?action=getResults'
};
```

## 🎨 自定义配置

### 修改投票选项

在 `script.js` 中修改 `DESTINATIONS` 对象：

```javascript
const DESTINATIONS = {
    'your-destination-1': { name: '目的地1', nameEn: 'Destination 1' },
    'your-destination-2': { name: '目的地2', nameEn: 'Destination 2' },
    // ... 更多目的地
};
```

### 添加动物代号

在 `script.js` 中修改 `ANIMALS` 数组：

```javascript
const ANIMALS = [
    { name: '新动物', icon: '🦊' },
    // ... 更多动物
];
```

### 自定义样式

在 `style.css` 中修改CSS变量：

```css
:root {
    --primary-color: #your-color;
    --secondary-color: #your-color;
    // ... 更多颜色
}
```

## 📱 移动端适配

系统完全支持移动端设备：

- 响应式布局自动适配不同屏幕尺寸
- 触摸友好的拖拽排序操作
- 优化的触摸目标尺寸
- 移动端专用的交互反馈

## 🔒 安全特性

- 每个用户只能投票一次
- 投票数据本地存储防丢失
- 用户身份匿名化处理
- 防止重复提交机制

## 📊 数据统计

结果页面提供丰富的数据展示：

- 实时投票统计
- 目的地排名榜
- 可视化图表展示
- 投票者列表
- 详细分析数据

## 🐛 故障排除

### 常见问题

1. **图片不显示**
   - 确保图片文件存在于 `images/` 目录
   - 检查图片文件名是否匹配

2. **拖拽不工作**
   - 确保浏览器支持HTML5拖拽API
   - 在移动端使用触摸操作

3. **数据提交失败**
   - 检查Google Apps Script配置
   - 验证API URL是否正确
   - 查看浏览器控制台错误信息

4. **样式显示异常**
   - 确保CSS文件正确加载
   - 检查字体和图标库加载情况

### 调试建议

1. 打开浏览器开发者工具
2. 查看Console面板的错误信息
3. 检查Network面板的网络请求
4. 验证LocalStorage数据存储

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进项目：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 📧 Email: [your-email@example.com]
- 💬 GitHub Issues: [repository-issues-url]

## 🎉 致谢

感谢以下开源项目和服务：

- [Chart.js](https://www.chartjs.org/) - 图表库
- [Font Awesome](https://fontawesome.com/) - 图标库
- [Google Fonts](https://fonts.google.com/) - 字体服务
- [Google Apps Script](https://script.google.com/) - 后端服务

---

**享受投票的乐趣！** 🎯✨