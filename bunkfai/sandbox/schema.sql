-- แจ้งก่อนจุด — โครงสร้างฐานข้อมูลต้นแบบ (PostgreSQL 15+ / PostGIS 3)
-- สถานะ: ร่างเพื่อใช้พูดคุยกับกรมการปกครอง ยังไม่เคยรันกับข้อมูลจริง
-- หลักการ: (1) ประวัติสถานะและ audit เขียนอย่างเดียว (2) พิกัดเก็บเป็น geography
--          (3) ข้อมูลส่วนบุคคลแยกตารางเพื่อเข้ารหัส/ลบตามระยะเวลาเก็บได้

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- พื้นที่ปกครอง ----------
CREATE TABLE provinces (
  code        char(2) PRIMARY KEY,           -- รหัสจังหวัด กปค.
  name_th     text NOT NULL,
  name_en     text
);
CREATE TABLE amphoes (
  code        char(4) PRIMARY KEY,           -- รหัสอำเภอ 4 หลัก
  province    char(2) NOT NULL REFERENCES provinces(code),
  name_th     text NOT NULL
);

-- ---------- ผู้ใช้และสิทธิ์ ----------
CREATE TYPE user_role AS ENUM ('citizen','amphoe_chief','province_deputy','governor','atc','dopa_admin');
CREATE TYPE auth_method AS ENUM ('thaid','password','temp_by_amphoe');

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role          user_role NOT NULL,
  auth_method   auth_method NOT NULL,
  thaid_sub     text UNIQUE,                 -- subject id จาก ThaID (ไม่เก็บเลขบัตรประชาชนดิบ)
  username      text UNIQUE,                 -- สำหรับบัญชีรหัสผ่าน
  password_hash text,                        -- argon2id เท่านั้น
  display_name  text NOT NULL,
  scope_province char(2) REFERENCES provinces(code),   -- ขอบเขตงานของเจ้าหน้าที่
  scope_amphoe   char(4) REFERENCES amphoes(code),
  created_by    uuid REFERENCES users(id),   -- ใครสร้างบัญชี (ตามลำดับ กปค. → ผู้ว่าฯ → นายอำเภอ → ประชาชน)
  expires_at    timestamptz,                 -- บัญชีชั่วคราวต้องมีวันหมดอายุ
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (auth_method <> 'temp_by_amphoe' OR expires_at IS NOT NULL)
);
-- ข้อมูลติดต่อแยกตาราง เพื่อเข้ารหัสระดับคอลัมน์และลบตามนโยบาย PDPA
CREATE TABLE user_pii (
  user_id     uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  phone_enc   bytea,                         -- pgp_sym_encrypt(...)
  national_id_hash bytea                     -- แฮชแบบ salted สำหรับจับคู่ ไม่เก็บค่าจริง
);

-- ---------- ท่าอากาศยานและชั้นข้อมูลห้วงอากาศ ----------
CREATE TABLE airspace_dataset (
  id          serial PRIMARY KEY,
  source      text NOT NULL,                 -- เช่น 'AIP Thailand'
  effective   date NOT NULL,                 -- วันที่ข้อมูลมีผล (AIRAC)
  loaded_at   timestamptz NOT NULL DEFAULT now(),
  checked_by  text,                          -- ผู้ตรวจรับข้อมูล
  UNIQUE (source, effective)
);
CREATE TABLE airports (
  icao        char(4) PRIMARY KEY CHECK (icao ~ '^[A-Z]{4}$'),
  dataset_id  int NOT NULL REFERENCES airspace_dataset(id),
  name_th     text NOT NULL,
  name_en     text,
  arp         geography(Point,4326) NOT NULL,
  runway_bearing_deg numeric(6,2),
  province    char(2) REFERENCES provinces(code)
);
CREATE TABLE restricted_zones (
  id          serial PRIMARY KEY,
  airport     char(4) NOT NULL REFERENCES airports(icao),
  kind        text NOT NULL CHECK (kind IN ('LHZ','PHZ')),
  geom        geography(Polygon,4326) NOT NULL,
  rule_th     text
);
CREATE INDEX ON restricted_zones USING gist (geom);

-- ---------- คำขอและใบอนุญาต ----------
CREATE TYPE item_type AS ENUM ('bangfai','talai','komloy','plu','lamp','smoke_lantern','other');
CREATE TYPE request_status AS ENUM ('draft','submitted','review','info_requested','approved','rejected','cancelled','expired');

CREATE TABLE requests (
  id          bigserial PRIMARY KEY,
  request_no  text NOT NULL UNIQUE,          -- BF-2569-0001
  applicant   uuid NOT NULL REFERENCES users(id),
  item        item_type NOT NULL,
  quantity    int NOT NULL CHECK (quantity > 0),
  amphoe      char(4) NOT NULL REFERENCES amphoes(code),
  location    geography(Point,4326) NOT NULL,
  window_start timestamptz NOT NULL,
  window_end   timestamptz NOT NULL,
  status      request_status NOT NULL DEFAULT 'draft',
  submitted_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (window_end > window_start)
);
CREATE INDEX ON requests USING gist (location);
CREATE INDEX ON requests (amphoe, status);
CREATE INDEX ON requests (window_start);

CREATE TABLE request_contacts (               -- ผู้ประสานงาน 2 ท่าน
  request_id  bigint NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  seq         smallint NOT NULL CHECK (seq IN (1,2)),
  name        text NOT NULL,
  phone_enc   bytea NOT NULL,
  PRIMARY KEY (request_id, seq)
);

-- ผลตรวจอัตโนมัติ เก็บเป็นภาพถ่าย ณ เวลาที่พิจารณา (ชั้นข้อมูลอาจเปลี่ยนภายหลัง)
CREATE TABLE auto_checks (
  id          bigserial PRIMARY KEY,
  request_id  bigint NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  dataset_id  int NOT NULL REFERENCES airspace_dataset(id),
  check_code  text NOT NULL,                 -- 'LHZ','PHZ','TIME_CONFLICT','LEAD_TIME'
  result      text NOT NULL CHECK (result IN ('pass','warn','fail')),
  detail      jsonb NOT NULL,
  checked_at  timestamptz NOT NULL DEFAULT now()
);

-- ประวัติสถานะ: เพิ่มได้อย่างเดียว
CREATE TABLE request_status_history (
  id          bigserial PRIMARY KEY,
  request_id  bigint NOT NULL REFERENCES requests(id),
  from_status request_status,
  to_status   request_status NOT NULL,
  actor       uuid NOT NULL REFERENCES users(id),
  reason      text,
  at          timestamptz NOT NULL DEFAULT now(),
  CHECK (to_status NOT IN ('rejected','info_requested') OR coalesce(length(trim(reason)),0) > 0)  -- ต้องมีเหตุผล
);

CREATE TABLE permits (
  id          bigserial PRIMARY KEY,
  permit_no   text NOT NULL UNIQUE,
  request_id  bigint NOT NULL UNIQUE REFERENCES requests(id),
  issued_by   uuid NOT NULL REFERENCES users(id),
  issued_at   timestamptz NOT NULL DEFAULT now(),
  conditions  text,
  verify_token text NOT NULL UNIQUE,         -- ใช้ใน QR; ตรวจสถานะสดผ่าน URL
  signature   bytea                          -- ลายเซ็นดิจิทัล (ระยะถัดไป)
);

-- ---------- วันจุดจริงและไฟเขียว ATC ----------
CREATE TYPE launch_state AS ENUM ('asked','green','denied','burning','paused','ended');
CREATE TABLE launch_events (
  id          bigserial PRIMARY KEY,
  permit_id   bigint NOT NULL REFERENCES permits(id),
  state       launch_state NOT NULL,
  actor       uuid NOT NULL REFERENCES users(id),   -- ผู้ขอ หรือ เจ้าหน้าที่ ATC
  reason      text,
  at          timestamptz NOT NULL DEFAULT now(),
  CHECK (state <> 'denied' OR coalesce(length(trim(reason)),0) > 0)
);

-- ---------- แจ้งเตือน / ไฟล์แนบ ----------
CREATE TABLE notifications (
  id bigserial PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id),
  request_id bigint REFERENCES requests(id), channel text NOT NULL, body text NOT NULL,
  sent_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE attachments (
  id bigserial PRIMARY KEY, request_id bigint NOT NULL REFERENCES requests(id),
  filename text NOT NULL, mime text NOT NULL, bytes bigint NOT NULL, storage_key text NOT NULL,
  sha256 bytea NOT NULL, uploaded_by uuid NOT NULL REFERENCES users(id), uploaded_at timestamptz NOT NULL DEFAULT now());

-- ---------- Audit log (hash chain) ----------
CREATE TABLE audit_log (
  id          bigserial PRIMARY KEY,
  at          timestamptz NOT NULL DEFAULT now(),
  actor       uuid REFERENCES users(id),
  action      text NOT NULL,                 -- 'login','view_request','approve','export_report',...
  object_type text,
  object_id   text,
  ip          inet,
  detail      jsonb,
  prev_hash   bytea,
  row_hash    bytea                          -- sha256(prev_hash || row) ; ตรวจย้อนหลังว่าถูกแก้ไหม
);

-- ห้ามแก้/ลบตารางประวัติและ audit
CREATE FUNCTION forbid_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'table % is append-only', TG_TABLE_NAME; END $$;
CREATE TRIGGER no_upd_hist BEFORE UPDATE OR DELETE ON request_status_history FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
CREATE TRIGGER no_upd_launch BEFORE UPDATE OR DELETE ON launch_events FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
CREATE TRIGGER no_upd_audit BEFORE UPDATE OR DELETE ON audit_log FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

-- ตัวอย่างคำถามหลัก: จุดนี้อยู่ใน LHZ ของสนามบินใดหรือไม่
-- SELECT a.icao, ST_Distance(a.arp, :pt::geography)/1000 AS km
--   FROM airports a WHERE ST_DWithin(a.arp, :pt::geography, 10000) ORDER BY km;
