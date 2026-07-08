# Ghi chú bản sửa lỗi

Đã kiểm tra và sửa các lỗi chính có thể làm app hỏng khi chạy/deploy:

1. Server đọc được cả `.env.local` và `.env`, đúng với hướng dẫn trong README.
2. `PORT` lấy từ biến môi trường để deploy lên hosting không bị cố định ở cổng 3000.
3. Model Gemini không hard-code trong nhiều nơi nữa; có thể đổi bằng biến `GEMINI_MODEL`. Mặc định: `gemini-2.5-flash`.
4. API tạo câu hỏi không còn trả lỗi 400 khi chưa có `GEMINI_API_KEY`; app sẽ dùng câu hỏi mẫu dự phòng để giao diện không bị vỡ.
5. Thêm kiểm tra định dạng câu hỏi AI trả về để tránh lỗi chia cho 0 hoặc đề trống.
6. Thêm hỗ trợ route API cho Vercel bằng `api/[...path].ts` và `vercel.json`.

## Chạy local

```bash
npm install
cp .env.example .env.local
# sửa GEMINI_API_KEY trong .env.local nếu muốn dùng AI thật
npm run dev
```

## Kiểm tra trước khi deploy

```bash
npm run lint
npm run build
npm run start
```

## Deploy Vercel

Trên Vercel, thêm biến môi trường:

- `GEMINI_API_KEY`
- `GEMINI_MODEL` nếu muốn đổi model, không bắt buộc

Build command: `npm run build`
Output directory: `dist`

## Fix 405 on Vercel API

- Replaced the catch-all function `api/[...path].ts` with explicit Vercel serverless functions:
  - `api/chat-ai.ts`
  - `api/generate-questions.ts`
  - `api/ai-status.ts`
- Added shared API utilities in `api/_shared.ts`.
- API endpoints now return a safe fallback response instead of breaking the UI when Gemini is unavailable.
- Keep Vercel Environment Variable name as `GEMINI_API_KEY`, not `VITE_GEMINI_API_KEY`.
