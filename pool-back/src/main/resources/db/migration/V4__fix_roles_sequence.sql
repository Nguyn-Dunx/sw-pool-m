-- ==========================
-- Fix roles sequence after manual ID inserts in V2
-- ==========================
-- Bảng roles dùng SERIAL (auto-increment), nhưng V2 insert thủ công id = 1, 2.
-- Sequence roles_id_seq vẫn đang ở giá trị cũ, gây lỗi duplicate key khi insert tiếp.

SELECT setval('roles_id_seq', (SELECT COALESCE(MAX(id), 0) FROM roles));
