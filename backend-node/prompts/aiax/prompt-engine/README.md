# AIAX Prompt Engine

Folder này chứa prompt/rule cho trang `Prompt Engine`.

Bạn có thể sửa các file `.md` trong folder này để tùy biến cách AI tạo kịch bản mà không cần sửa code JS.

Các biến có thể dùng:

- `{{raw_idea}}`: ý tưởng thô của project.
- `{{synopsis}}`: output của Prompt 01.
- `{{screenplay}}`: output của Prompt 02.
- `{{target_duration}}`: thời lượng mục tiêu, ví dụ `3 phút`.

Các file:

- `system.md`: vai trò và rule nền chạy ngầm cho cả 3 prompt.
- `01-synopsis.md`: Prompt 01, ý tưởng thô -> Pitch Deck/Synopsis.
- `02-screenplay.md`: Prompt 02, Pitch Deck/Synopsis -> Screenplay.
- `03-qaqc.md`: Prompt 03, Screenplay -> QAQC Report.

Lưu ý:

- Sau khi sửa prompt, restart backend để chắc chắn server đọc bản mới.
- Không xóa tên biến trong dấu `{{...}}` nếu prompt vẫn cần dữ liệu đó.
