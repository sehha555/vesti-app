# Git & GitHub 使用指南

本指南旨在提供一個全面的 Git 和 GitHub 工作流程教學，從基礎概念到進階應用，幫助開發團隊更有效率地進行版本控制與協作。

## 1. Git 基礎概念

Git 的核心是由四個主要區域組成的：

| 區域 | 描述 |
| --- | --- |
| **工作區 (Workspace)** | 您在本機實際修改檔案的目錄。 |
| **暫存區 (Staging Area / Index)** | 一個快照區，用來暫存您想要在下一次 commit 中提交的變更。 |
| **本地倉庫 (Local Repository)** | 儲存您專案所有版本歷史的 .git 目錄。 |
| **遠端倉庫 (Remote Repository)** | 託管在伺服器（如 GitHub）上的專案副本，用於團隊協作與備份。 |

![Git Workflow](https://i.imgur.com/sI5dY4s.png)

## 2. 初次設定

### `git init`
在一個新的或現有的專案目錄中，初始化一個新的 Git 倉庫。

```bash
git init
```

### `git config`
設定您的使用者名稱和電子郵件，這會被包含在您的 commit 紀錄中。

```bash
# 設定全域名稱與信箱
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 僅為目前專案設定
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### `.gitignore`
建立一個 `.gitignore` 檔案，來排除不需要被 Git 追蹤的檔案或目錄（例如：`node_modules`, `dist`, `.env`）。

```gitignore
# 忽略 node_modules 目錄
node_modules/

# 忽略所有 .log 檔案
*.log

# 忽略環境變數檔案
.env
```

## 3. 日常開發流程

### `git add`
將工作區的變更加入到暫存區。

```bash
# 將特定檔案加入暫存區
git add <file_name>

# 將目前目錄所有變更加到暫存區
git add .
```

### `git commit`
將暫存區的內容建立一個新的 commit，並儲存到本地倉庫。

```bash
git commit -m "feat: 新增使用者登入功能"
```

### `git push`
將本地倉庫的 commit 推送到遠端倉庫。

```bash
# 將目前分支推送到名為 origin 的遠端
git push origin <branch_name>
```

## 4. Commit 訊息規範

我們遵循 **Conventional Commits** 規範，格式如下：

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

常用的 `type`：

| 類型 | 描述 |
| --- | --- |
| `feat` | 新增功能 |
| `fix` | 修復 Bug |
| `refactor` | 重構程式碼，未新增功能或修復 Bug |
| `docs` | 文件變更 |
| `style` | 格式變更（不影響程式碼邏輯） |
| `test` | 新增或修改測試 |
| `chore` | 建構流程、輔助工具的變動 |

**範例：**

```
feat(auth): 實作 OAuth 2.0 登入流程

新增 Google 和 GitHub 的第三方登入選項，提升使用者體驗。

Closes #123
```

## 5. 版本回退與修復

### `git checkout`
切換分支或恢復工作區的檔案。

```bash
# 切換到指定分支
git checkout <branch_name>

# 恢復特定檔案到最近一次 commit 的狀態
git checkout -- <file_name>
```

### `git reset`
重設目前的 `HEAD` 到指定的狀態，常用於取消 commit。

```bash
# --soft: 僅移動 HEAD，保留暫存區和工作區的變更
git reset --soft HEAD~1

# --mixed (預設): 移動 HEAD 並重設暫存區，保留工作區變更
git reset HEAD~1

# --hard: 移動 HEAD 並重設暫存區與工作區（危險！會遺失工作區變更）
git reset --hard HEAD~1
```

### `git revert`
建立一個新的 commit 來「撤銷」某個既有 commit 的變更。這是一種安全的回退方式，因为它不會改變專案歷史。

```bash
# 撤銷指定的 commit
git revert <commit_hash>
```

## 6. 標籤管理 (`git tag`)

當專案達到一個重要階段（如版本發布）時，可以使用標籤來標記。

```bash
# 建立一個輕量標籤
git tag v1.0.0

# 建立一個帶有附註的標籤
git tag -a v1.0.0 -m "版本 1.0.0 發布"

# 將標籤推送到遠端
git push origin --tags
```

## 7. GitHub 遠端操作

### `git remote`
管理遠端倉庫的設定。

```bash
# 新增一個名為 origin 的遠端倉庫
git remote add origin <repository_url>

# 查看遠端倉庫列表
git remote -v
```

### `git push`
將本地分支的 commit 推送到遠端倉庫。

```bash
# 推送 main 分支到 origin
git push origin main

# 強制推送（謹慎使用！）
git push -f origin main
```

### `git pull`
從遠端倉庫拉取最新的變更並合併到目前分支。`git pull` 相當於 `git fetch` + `git merge`。

```bash
git pull origin main
```

## 8. 視覺化工具

### Git Graph (VS Code 擴充功能)
一個強大的 VS Code 擴充功能，可以視覺化地呈現 Git 分支圖、歷史紀錄，並直接在圖上執行各種 Git 操作。

### GitHub Desktop
GitHub 官方推出的桌面用戶端，提供簡單易用的圖形介面，適合初學者或偏好 GUI 的使用者。

## 9. 常見問題解答

**Q: 我 commit 了一些不該 commit 的檔案，怎麼辦？**
A: 使用 `git reset` 來取消 commit，然後使用 `.gitignore` 排除檔案，再重新 commit。

**Q: `git fetch` 和 `git pull` 有什麼不同？**
A: `git fetch` 只會下載遠端的最新變更，但不會自動合併。`git pull` 則會下載並立即嘗試合併。建議先用 `fetch` 查看變更，再手動 `merge`。

**Q: 如何修改最後一次的 commit 訊息？**
A: 使用 `git commit --amend`。

## 10. 最佳實踐

1.  **Commit Early, Commit Often**: 頻繁地進行小單位的 commit。
2.  **Write Good Commit Messages**: 撰寫清晰、有意義的 commit 訊息。
3.  **Use Branches**: 為每個新功能或修復建立獨立的分支。
4.  **Keep in Sync**: 定期 `pull` 遠端主分支的變更，避免巨大的合併衝突。
5.  **Code Review**: 在合併到主分支前，透過 Pull Request (PR) 進行程式碼審查。

## 11. 快速參考表

| 命令 | 描述 |
| --- | --- |
| `git init` | 初始化倉庫 |
| `git clone [url]` | 複製遠端倉庫 |
| `git status` | 查看工作區與暫存區狀態 |
| `git add [file]` | 將檔案加入暫存區 |
| `git commit -m "[msg]"` | 建立 commit |
| `git push [remote] [branch]` | 推送到遠端 |
| `git pull [remote] [branch]` | 從遠端拉取並合併 |
| `git branch` | 列出、建立或刪除分支 |
| `git checkout [branch]` | 切換分支 |
| `git merge [branch]` | 合併分支 |
| `git log` | 查看 commit 歷史 |
| `git reset --hard [commit]` | 強制重設到某個 commit |
| `git revert [commit]` | 撤銷某個 commit |
