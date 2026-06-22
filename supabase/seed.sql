SET session_replication_role = replica;

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Data untuk tabel complaint
INSERT INTO "public"."complaint" ("id", "name") OVERRIDING SYSTEM VALUE VALUES
	(1, 'Kerusakan Jalan'),
	(2, 'Rambu Lalu Lintas'),
	(3, 'Penerangan Jalan Umum'),
	(4, 'Parkir Liar'),
	(5, 'Angkutan Umum'),
	(6, 'Trotoar dan Fasilitas Pejalan Kaki'),
	(7, 'Lainnya')
ON CONFLICT (id) DO NOTHING;

-- Data untuk tabel status
INSERT INTO "public"."status" ("id", "name") OVERRIDING SYSTEM VALUE VALUES
	(1, 'Menunggu'),
	(2, 'Diproses'),
	(3, 'Selesai'),
	(4, 'Ditolak')
ON CONFLICT (id) DO NOTHING;

-- Data untuk tabel requests
INSERT INTO "public"."requests" ("id", "nama", "alamat", "no_whatsapp", "no_hp", "permintaan", "detail_permintaan", "lokasi", "surat", "foto", "status", "date") VALUES
	('28ade403-e7a8-4499-a2d0-e03168229c0c', 'Budi Santoso', 'Jl. Diponegoro No. 10, Batu', 'https://wa.me/6281234567890', '081234567890', 1, 'Jalan di depan rumah berlubang cukup dalam', 'Jl. Diponegoro No. 10', NULL, NULL, 2, '00:43, 17-06-2026')
ON CONFLICT (id) DO NOTHING;

-- Data untuk tabel role
INSERT INTO "public"."role" ("id", "name") OVERRIDING SYSTEM VALUE VALUES
	(1, 'SuperAdmin'),
	(2, 'Admin')
ON CONFLICT (id) DO NOTHING;

-- Data untuk tabel users
INSERT INTO "public"."users" ("id", "username", "password", "role", "refresh_token") VALUES
	('c2b161aa-6d73-4571-a7ad-506bc3eca41f', 'admin', '$2b$10$zGVfrH5X.54pUIHn4rrS2us2odtq/igSGG15sdJfvLG0ILN5oKLoy', 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImMyYjE2MWFhLTZkNzMtNDU3MS1hN2FkLTUwNmJjM2VjYTQxZiIsInJvbGUiOjEsImlhdCI6MTc4MTY2NjYzMiwiZXhwIjoxNzgyMjcxNDMyfQ.JTjNT2tjGnvqRLK7ywk5Q_VtRhpz_9iO9UBsTz6wkTw')
ON CONFLICT (id) DO NOTHING;

-- Data untuk Storage Buckets (Ditambahkan ON CONFLICT)
INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('pdf', 'pdf', NULL, '2026-06-16 17:38:18.752638+00', '2026-06-16 17:38:18.752638+00', false, false, NULL, NULL, NULL, 'STANDARD'),
	('images', 'images', NULL, '2026-06-16 17:38:29.767802+00', '2026-06-16 17:38:29.767802+00', false, false, NULL, NULL, NULL, 'STANDARD')
ON CONFLICT (id) DO NOTHING;

-- Update sequence data lokal
SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);
SELECT pg_catalog.setval('"public"."complaint_id_seq"', 7, true);
SELECT pg_catalog.setval('"public"."role_id_seq"', 2, true);
SELECT pg_catalog.setval('"public"."status_id_seq"', 4, true);

RESET ALL;