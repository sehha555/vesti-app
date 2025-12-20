FROM node:20-alpine
WORKDIR /app

# 複製 package.json（支援 workspaces）
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

# 安裝依賴
RUN npm install

# 複製程式碼
COPY . .

# 切換到 Next.js 目錄
WORKDIR /app/apps/web

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
