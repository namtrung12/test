# Bộ câu hỏi trắc nghiệm Nghiên cứu khoa học

Web app tĩnh `HTML/CSS/JS` để deploy trực tiếp lên GitHub Pages.

## Hiện trạng

- Chỉ có `1` bộ câu hỏi tổng hợp duy nhất.
- Dữ liệu câu hỏi chạy từ `data/question-bank.json`.
- Toàn bộ giao diện làm bài là `trắc nghiệm chọn đáp án`.
- Các câu `ghép ý` được quy đổi thành nhiều câu trắc nghiệm để vẫn giữ được tối đa nội dung.
- Reload trang không tự đổi đề:
  Chỉ khi bấm `Trộn bộ mới` hoặc `Làm lại đề` thì app mới sinh một bộ khác.
- Nộp bài xong web chấm ngay và tự cuộn xuống phần kết quả kèm giải thích chi tiết.

## File chính

- `index.html`: khung giao diện chính.
- `assets/styles.css`: CSS mobile-first.
- `assets/app.js`: logic tải JSON, lưu tiến độ local, chấm điểm, giải thích.
- `data/question-bank.json`: dữ liệu tĩnh dùng trên web.
- `data/question_bank.php`: file nguồn để chỉnh sửa ngân hàng câu hỏi.

## Xuất lại JSON sau khi sửa câu hỏi

```powershell
@'
<?php
$data = require 'data/question_bank.php';
file_put_contents(
    'data/question-bank.json',
    json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
);
'@ | php
```

## Kiểm tra nhanh

```powershell
php -l data\question_bank.php
node --check assets\app.js
```
