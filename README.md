# CELESVERSE - 身心靈課程網站

身心靈課程電商平台，提供課程瀏覽、線上購買、即時庫存顯示與管理後台。

## 功能

- 課程商品頁 — 瀏覽課程、查看詳情、即時庫存顯示
- 線上購買 — 填寫資料、下單購買、訂單確認
- 管理後台 — 課程上下架、編輯商品資訊、訂單管理

## 技術棧

- **前端框架**：Next.js (App Router) + TypeScript
- **樣式**：Tailwind CSS
- **資料庫**：PostgreSQL + Prisma ORM
- **部署**：Vercel（推薦）

## 安裝與啟動

```bash
# 1. 安裝依賴
npm install

# 2. 設定環境變數
cp .env.example .env
# 編輯 .env 填入你的資料庫連線資訊

# 3. 啟動本地 Prisma Postgres 並同步 schema
npx prisma dev

# 4. 啟動開發伺服器
npm run dev
```

開啟 http://localhost:3000 即可瀏覽。

## 專案結構

```
src/
├── app/                  # Next.js 路由與頁面
├── features/             # 按功能分的模組
│   ├── courses/          # 課程瀏覽與詳情
│   ├── orders/           # 購買流程與訂單
│   ├── inventory/        # 庫存管理邏輯
│   └── admin/            # 管理後台
├── components/           # 共用元件
│   ├── ui/               # 基礎 UI 元件
│   └── layout/           # 版面元件
├── lib/                  # 工具函式與第三方整合
├── config/               # 設定常數
└── types/                # 共用型別定義
```
