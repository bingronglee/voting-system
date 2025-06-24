# GitHub Pages 部署指南

## 概述
本指南将帮助您将投票系统部署到GitHub Pages，使其能够通过互联网访问。

## 前置条件
- GitHub账户
- 已完成Google Apps Script和Google Sheets配置
- 投票系统文件准备就绪

## 第一步：创建GitHub仓库

1. **登录GitHub**
   - 访问 [GitHub](https://github.com)
   - 登录您的账户

2. **创建新仓库**
   - 点击右上角的"+" → "New repository"
   - 仓库名称：`voting-system` 或您喜欢的名称
   - 设置为Public（免费用户需要Public才能使用GitHub Pages）
   - 勾选"Add a README file"
   - 点击"Create repository"

## 第二步：上传文件

### 方法1：通过GitHub网页界面

1. **上传文件**
   - 在仓库页面点击"uploading an existing file"
   - 将以下文件拖拽到上传区域：
     - `index.html`
     - `results.html`
     - `style.css`
     - `script.js`
     - `README.md`
     - `images/` 文件夹及其所有图片

2. **提交更改**
   - 在页面底部添加提交信息："Initial commit - voting system"
   - 点击"Commit changes"

### 方法2：通过Git命令行

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/voting-system.git
cd voting-system

# 复制文件到仓库目录
# 将voting-system文件夹中的所有文件复制到这里

# 添加文件
git add .

# 提交更改
git commit -m "Initial commit - voting system"

# 推送到GitHub
git push origin main
```

## 第三步：启用GitHub Pages

1. **打开仓库设置**
   - 在仓库页面点击"Settings"标签

2. **配置Pages**
   - 在左侧菜单中找到"Pages"
   - Source选择"Deploy from a branch"
   - Branch选择"main"
   - Folder选择"/ (root)"
   - 点击"Save"

3. **获取网站URL**
   - 页面会显示您的网站URL，格式为：
     `https://YOUR_USERNAME.github.io/voting-system`
   - 网站部署可能需要几分钟时间

## 第四步：配置API连接

1. **更新API配置**
   - 如果还没有配置，编辑`script.js`文件
   - 更新API_CONFIG中的URL为您的Google Apps Script部署URL

2. **测试连接**
   - 访问您的GitHub Pages网站
   - 进行测试投票确保功能正常

## 第五步：自定义域名（可选）

如果您有自己的域名：

1. **添加CNAME文件**
   - 在仓库根目录创建名为`CNAME`的文件
   - 内容为您的域名，如：`voting.yourdomain.com`

2. **配置DNS**
   - 在域名提供商处添加CNAME记录
   - 指向：`YOUR_USERNAME.github.io`

## 项目文件结构

部署后的文件结构应该如下：

```
voting-system/
├── index.html              # 主投票页面
├── results.html            # 结果展示页面
├── style.css               # 样式文件
├── script.js               # JavaScript逻辑
├── README.md               # 项目说明
├── images/                 # 图片文件夹
│   ├── vietnam-hcmc.jpg
│   ├── japan-okinawa.jpg
│   ├── korea-jeju.png
│   ├── korea-seoul.jpg
│   └── hong-kong.jpeg
├── google-apps-script/     # Google Apps Script代码
│   ├── Code.gs
│   └── 部署指南.md
└── GitHub部署指南.md       # 本文件
```

## 更新和维护

### 更新网站内容

1. **直接在GitHub编辑**
   - 点击要编辑的文件
   - 点击铅笔图标进行编辑
   - 提交更改

2. **通过Git更新**
   ```bash
   # 编辑文件后
   git add .
   git commit -m "Update: description of changes"
   git push origin main
   ```

### 监控和分析

1. **GitHub Pages状态**
   - 在仓库Settings → Pages页面查看部署状态
   - 查看访问统计（如果开启）

2. **Google Apps Script监控**
   - 检查执行情况和配额使用
   - 监控错误日志

## 故障排除

### 常见问题

1. **页面404错误**
   - 检查GitHub Pages是否正确配置
   - 确保`index.html`在根目录
   - 等待几分钟让部署完成

2. **样式或脚本不加载**
   - 检查文件路径是否正确
   - 确保所有文件都已上传
   - 检查文件名大小写是否匹配

3. **API调用失败**
   - 检查Google Apps Script URL是否正确
   - 确保API已正确部署
   - 检查CORS设置

4. **图片不显示**
   - 确保images文件夹已上传
   - 检查图片文件路径
   - 验证图片文件格式

### 调试步骤

1. **检查浏览器控制台**
   - 按F12打开开发者工具
   - 查看Console标签的错误信息
   - 检查Network标签的请求状态

2. **验证文件完整性**
   - 确保所有必需文件都已上传
   - 检查文件内容是否完整

3. **测试API连接**
   - 直接在浏览器访问Google Apps Script URL
   - 检查返回的JSON数据格式

## 安全和隐私

1. **数据保护**
   - 投票数据存储在您的Google Sheets中
   - 用户仅通过动物代号匿名标识
   - 不收集个人身份信息

2. **访问控制**
   - 可以通过GitHub仓库设置控制访问
   - 可以设置密码保护（需要额外配置）

3. **备份策略**
   - 定期备份GitHub仓库
   - 备份Google Sheets数据
   - 保存Google Apps Script代码副本

## 性能优化

1. **图片优化**
   - 压缩图片文件大小
   - 使用适当的图片格式
   - 考虑使用CDN

2. **代码优化**
   - 最小化CSS和JavaScript文件
   - 启用浏览器缓存
   - 优化加载顺序

## 扩展功能

考虑添加的功能：
- 投票截止时间设置
- 结果导出功能
- 更多统计图表
- 投票分类或标签
- 邮件通知功能

## 联系和支持

如需技术支持：
1. 检查GitHub Issues页面
2. 查看Google Apps Script文档
3. 参考GitHub Pages官方文档

建议在生产环境使用前进行全面测试，确保所有功能正常工作。
