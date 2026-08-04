-- ==========================
-- Seed Users (Demo Data for local only)
-- Password: Admin@123
-- ==========================

INSERT INTO users (
    id,
    phone_number,
    password_hash,
    role_id,
    is_active
)
VALUES

(
'11111111-1111-1111-1111-111111111111',
'0900000001',
'$2a$10$xifXzV02pYd3v6qAT8dMFuXj/yibdP8awDKSHbzdbWRDfjShw.eSC',
1,
true
),

(
'22222222-2222-2222-2222-222222222222',
'0900000002',
'$2a$10$xifXzV02pYd3v6qAT8dMFuXj/yibdP8awDKSHbzdbWRDfjShw.eSC',
2,
true
),

(
'33333333-3333-3333-3333-333333333333',
'0900000003',
'$2a$10$xifXzV02pYd3v6qAT8dMFuXj/yibdP8awDKSHbzdbWRDfjShw.eSC',
2,
true
);
