# TikTok Bar Backend

Node.js backend nhận sự kiện comment/gift từ TikTok LIVE và đẩy realtime cho frontend qua Socket.IO.

## Cài đặt

```bash
npm install
copy .env.example .env
npm run dev
```

Sửa `.env`:

```env
PORT=3001
HOST=0.0.0.0
FRONTEND_ORIGIN=*
TIKTOK_USERNAME=ten_tiktok_dang_live
```

`TIKTOK_USERNAME` có thể bỏ trống nếu frontend sẽ gọi connect thủ công.

## Truy cap tu thiet bi khac

Backend da listen tren `HOST=0.0.0.0`, vi vay may khac trong cung Wi-Fi co the goi:

```text
http://<IP-LAN-cua-may-chay-backend>:3001
```

Vi du:

```text
http://192.168.100.54:3001
```

Khi test LAN, de `.env`:

```env
FRONTEND_ORIGIN=*
```

Khi dua len public that, nen doi `FRONTEND_ORIGIN=*` thanh URL frontend cu the, vi du:

```env
FRONTEND_ORIGIN=https://your-frontend-domain.com
```

## API

```http
GET /health
GET /tiktok/status
POST /tiktok/connect
POST /tiktok/disconnect
```

Body cho `/tiktok/connect`:

```json
{
  "username": "ten_tiktok_dang_live"
}
```

## Socket Events Cho Frontend

Backend phát các event:

- `tiktok:status`: trạng thái kết nối TikTok LIVE.
- `tiktok:comment`: comment mới.
- `tiktok:gift:update`: mọi update gift, bao gồm streak đang chạy.
- `tiktok:gift:received`: mọi lần TikTok gửi gift event về, dùng khi muốn hiển thị ngay cả lúc streak chưa chốt.
- `tiktok:gift`: gift đã chốt, phù hợp để trigger hiệu ứng/game/action.
- `tiktok:error`: lỗi từ TikTok connection.

Frontend có thể gửi:

- `tiktok:connect` với `{ username }`.
- `tiktok:disconnect`.

Ví dụ frontend:

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('tiktok:status', console.log);
socket.on('tiktok:comment', (event) => {
  console.log(`${event.user.nickname}: ${event.comment}`);
});
socket.on('tiktok:gift', (event) => {
  console.log(`${event.user.nickname} sent ${event.giftName} x${event.repeatCount}`);
});

socket.emit('tiktok:connect', { username: 'ten_tiktok_dang_live' }, (result) => {
  console.log(result);
});
```

## Lưu Ý

`tiktok-live-connector` là thư viện reverse-engineering TikTok LIVE, không phải API chính thức của TikTok. Dự án đang dùng bản `2.3.0-beta1` vì dependency tree hiện sạch hơn khi chạy `npm audit`; nên kiểm tra lại audit khi nâng package và không expose server này trực tiếp ra Internet nếu chưa đặt auth/rate limit/reverse proxy phù hợp.
