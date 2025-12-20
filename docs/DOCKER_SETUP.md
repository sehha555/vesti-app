# Docker 開發環境設定指南 (Monorepo)

本文件旨在引導開發者如何在本機設定與使用 Docker 來啟動此 Next.js Monorepo 專案的開發環境。

## 檔案結構說明

-   **主要設定檔**：`Dockerfile` 和 `docker-compose.yml` 位於 `docker-config/` 資料夾中。
-   **忽略清單**：`.dockerignore` 檔案位於**專案根目錄**。這對於確保 Docker 在建置映像檔時能正確忽略不必要的檔案至關重要。

**注意：** 所有 Docker 設定檔都已移至 `docker-config/` 資料夾中。因此，所有 `docker-compose` 指令都需要使用 `-f` 旗標來指定設定檔的路徑。

## 舊電腦測試步驟

在將設定轉移到新電腦之前，強烈建議在您目前的開發環境中測試 Docker 設定是否能正常運作。

1.  **安裝 Docker**：確保您的電腦已安裝 [Docker Desktop](https://www.docker.com/products/docker-desktop/)。
2.  **檢查 `.env.local`**：確認 `apps/web/.env.local` 檔案存在且包含所有必要的環境變數。
3.  **執行 Docker Compose**：在專案**根目錄**下，開啟終端機並執行以下指令：
    ```bash
    docker-compose -f docker-config/docker-compose.yml up --build
    ```
4.  **驗證**：等待指令執行完成。當您看到 Next.js 伺服器成功啟動的日誌後，打開瀏覽器並前往 `http://localhost:3000`。確認網站可以正常瀏覽，且熱更新 (Hot Reload) 也能正常運作。

## 備份清單

在遷移到新電腦之前，請務必備份以下重要檔案：

-   **環境變數檔案**：`apps/web/.env.local`
    -   這個檔案包含所有與後端服務（如 Supabase）連接所需的金鑰，**絕對不要**將其提交到 Git 版本控制中。

## 新電腦安裝步驟 (Windows / Mac)

1.  **安裝 Git**：確保您的新電腦已安裝 Git。
2.  **Clone 專案**：從版本庫中複製專案到您的本機。
    ```bash
    git clone <your-repository-url>
    cd <project-directory>
    ```
3.  **安裝 Docker**：下載並安裝適用於您作業系統的 [Docker Desktop](https://www.docker.com/products/docker-desktop/)。
4.  **還原環境變數**：將您先前備份的 `.env.local` 檔案，放置到 `apps/web/` 目錄下。

## 一鍵啟動指令

完成上述步驟後，您只需要一個指令即可啟動整個開發環境。

在專案**根目錄**下，開啟終端機並執行：
```bash
docker-compose -f docker-config/docker-compose.yml up --build
```
-   `--build` 參數會在第一次啟動時，或在您修改了 `Dockerfile` 後，重新建置 Docker 映像檔。後續啟動可以只用 `docker-compose -f docker-config/docker-compose.yml up`。

## 常見問題排解 (FAQ)

-   **Q: 啟動時出現錯誤，顯示 Port 3000 已被佔用 (`address already in use`)**
    -   **A:** 這表示您本機的 3000 埠口正在被另一個應用程式使用。您可以停止該應用程式，或修改 `docker-config/docker-compose.yml` 中的 `ports` 設定，例如改成 `"3001:3000"`，然後透過 `http://localhost:3001` 訪問。

-   **Q: 找不到 `docker-compose` 指令 (`command not found`)**
    -   **A:** 請確認 Docker Desktop 已正確安裝並正在執行。新版本的 Docker Desktop 已內建 `docker-compose`。

-   **Q: 應用程式似乎沒有載入到環境變數 (`.env.local`)**
    -   **A:** 請確認您的 `.env.local` 檔案確實位於 `apps/web/` 目錄下，且 `docker-config/docker-compose.yml` 中的 `env_file` 路徑設定為 `apps/web/.env.local`。

-   **Q: 程式碼修改後，網頁沒有自動更新 (Hot Reload 失效)**
    -   **A:** 目前的 Docker 配置設計為將程式碼完全打包在 Docker image 中，以確保環境遷移的穩定性。這表示：
        *   **程式碼在 Image 內部**：您本機的程式碼變動不會自動同步到容器內。
        *   **無 Hot Reload**：此配置下不支援熱更新。
        *   **修改需重新 Build**：若您修改了程式碼，需要執行 `docker-compose -f docker-config/docker-compose.yml up --build` 來重建 Image 並啟動新的容器。
        *   **開發建議**：如果您需要頻繁修改程式碼並使用熱更新進行開發，建議在本機環境直接安裝 Node.js 並執行專案，而不是透過 Docker 容器。

## 停止與清理指令

**重要提示：** 所有 `down` 指令也都需要 `-f` 旗標。

-   **停止開發環境** (保留容器與 Volume):
    -   如果您是在終端機前景執行 `up` 指令，請直接按 `Ctrl + C`。
    -   如果您是在背景 (`-d`) 執行，請使用以下指令：
        ```bash
        docker-compose -f docker-config/docker-compose.yml down
        ```

-   **停止並清理 Volume** (將刪除 `node_modules` 的 Docker Volume，下次啟動會重新安裝):
    ```bash
    docker-compose -f docker-config/docker-compose.yml down -v
    ```
