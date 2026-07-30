# 匿名投票評分系統

一個使用 HTML、CSS、JavaScript、Supabase 與 GitHub Pages 建立的匿名排序投票系統。投票者會獲得本機匿名代號，依序排列五個目的地，系統將排名轉成分數並儲存到 Supabase。

## 技術架構

- 前端：`index.html`、`results.html`、`script.js`、`style.css`
- 資料庫：Supabase PostgreSQL + Data API + Row Level Security
- 圖表：Chart.js
- 部署：GitHub Pages，從 `main` 分支根目錄發布

## Supabase 設定

1. 開啟 Supabase project 的 SQL Editor。
2. 貼上並執行 [`supabase-setup.sql`](./supabase-setup.sql)。
3. 到 Project Settings → API Keys 取得 Project URL 與 publishable key（舊版名稱為 anon key）。
4. 在 `script.js` 的 Supabase configuration 填入：

```js
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_PUBLISHABLE_OR_ANON_KEY';
```

瀏覽器端只能使用 publishable／anon key。不要把 `service_role` 或 secret key 放進前端，也不要提交到公開 repository。

## GitHub Pages 部署

在 repository 的 Settings → Pages 設定：

- Source：Deploy from a branch
- Branch：`main`
- Folder：`/ (root)`

儲存後等待 GitHub Pages 建置完成，再開啟網站網址。

## 投票資料格式

每位匿名投票者會以一筆資料儲存在 `voting_system_votes`，其中 `votes` 是 JSONB 陣列，包含目的地、排名與分數。`user_id` 有唯一限制，避免同一個瀏覽器匿名代號重複寫入。

## 安全提醒

- 這是匿名、未登入的投票系統；任何取得網站的人都可以讀取結果並嘗試提交資料。
- RLS policy 只開放必要的公開讀取與新增操作。
- 若需要真正的使用者驗證、每人只能投一次或管理員後台，應再加入 Supabase Auth 與更嚴格的 policy。
- 舊的 Google Apps Script 目錄不再被前端引用；Supabase 是目前唯一的資料後端。

## 本機測試

可使用任意靜態伺服器預覽，例如：

```bash
python3 -m http.server 8000
```

然後開啟 `http://localhost:8000/`。
