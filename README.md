# Bộ test Vận động trị liệu

Trang chính chạy tĩnh bằng `HTML/CSS/JS`, phù hợp đẩy lên GitHub Pages hoặc host static.

## File chính

- `index.html`: giao diện làm bài.
- `assets/styles.css`: giao diện.
- `assets/app.js`: logic tạo đề, trộn đáp án, chấm điểm.
- `data/question-bank.js`: dữ liệu câu hỏi dùng trực tiếp trên web.
- `data/question_bank.php`: file nguồn để tiện chỉnh sửa ngân hàng câu hỏi.

## Tính năng

- Chọn từng bài hoặc toàn bộ 15 bài.
- Tạo đề với số lượng câu hỏi khác nhau.
- Trộn thứ tự câu hỏi.
- Trộn thứ tự đáp án.
- Chấm điểm tự động.
- Hiện đáp án đúng và giải thích sau khi nộp.
- Có sẵn ngân hàng câu hỏi để ôn tập.

## Nếu muốn sửa hoặc thêm câu hỏi

1. Chỉnh trong `data/question_bank.php`.
2. Xuất lại file tĩnh `data/question-bank.js` bằng lệnh:

```powershell
@'
<?php
$data = require 'data/question_bank.php';
$output = 'window.questionBank = ' . json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . ';';
file_put_contents('data/question-bank.js', $output);
'@ | php
```
