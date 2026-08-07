-- ==========================================================
-- Schema สำหรับระบบหลังบ้านร้านเสื้อยืดมือสอง
-- วิธีใช้: เปิด Supabase Dashboard -> SQL Editor -> วางไฟล์นี้ทั้งหมด -> Run
-- ==========================================================

-- ตาราง lots: แต่ละล็อตที่รับเสื้อเข้ามา
create table if not exists lots (
  id uuid primary key default gen_random_uuid(),
  lot_name text not null,              -- ชื่อ/รหัสล็อต เช่น "ล็อต กระสอบเหมา ก.ค. 69"
  purchase_date date not null default current_date,
  source text,                          -- แหล่งที่มา เช่น ชื่อร้านขายส่ง
  total_cost numeric(10,2) not null default 0,   -- เงินทุนที่จ่ายไปทั้งล็อต
  total_items int not null default 0,   -- จำนวนชิ้นทั้งหมดในล็อต (ไว้คำนวณต้นทุนเฉลี่ย/ชิ้น)
  note text,
  created_at timestamptz not null default now()
);

-- ตาราง items: เสื้อแต่ละตัว/แต่ละ SKU
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid references lots(id) on delete set null,
  item_name text not null,              -- เช่น "เสื้อยืดลาย Nike สีดำ"
  size text,                            -- S, M, L, XL ...
  condition text,                       -- สภาพ เช่น "ดีมาก", "มีตำหนิเล็กน้อย"
  cost_price numeric(10,2) not null default 0,   -- ต้นทุนต่อชิ้น
  sell_price numeric(10,2) not null default 0,   -- ราคาตั้งขาย
  status text not null default 'in_stock' check (status in ('in_stock','sold')),
  image_url text,
  created_at timestamptz not null default now()
);

-- ตาราง sales: รายการขายแต่ละครั้ง (1 แถว = เสื้อ 1 ตัวที่ขายได้)
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items(id) on delete set null,
  sale_date timestamptz not null default now(),
  channel text not null default 'ถนนคนเดิน',   -- ช่องทางขาย
  sale_price numeric(10,2) not null,             -- ราคาที่ขายได้จริง (เผื่อต่อรอง)
  cost_price numeric(10,2) not null,             -- copy ต้นทุนตอนขาย ไว้กันข้อมูลเปลี่ยนย้อนหลัง
  payment_method text not null check (payment_method in ('cash','transfer','government')),
  note text,
  created_at timestamptz not null default now()
);

-- ตาราง expenses: ค่าใช้จ่ายอื่นๆ นอกเหนือจากต้นทุนเสื้อ
-- เช่น ค่าเช่าแผง ค่ารถ ค่าถุง/บรรจุภัณฑ์ ค่าโฆษณา ฯลฯ ไว้คำนวณกำไรสุทธิที่แท้จริง
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  category text not null,               -- เช่น "ค่าเช่าแผง", "ค่าเดินทาง", "บรรจุภัณฑ์"
  amount numeric(10,2) not null default 0,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_expenses_date on expenses(expense_date);

alter table expenses enable row level security;
drop policy if exists "allow all - expenses" on expenses;
create policy "allow all - expenses" on expenses for all using (true) with check (true);

-- ตาราง app_settings: เก็บค่าตั้งค่าทั่วไปแบบ key-value เช่น เปอร์เซ็นต์แบ่งถังเงิน
create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table app_settings enable row level security;
drop policy if exists "allow all - app_settings" on app_settings;
create policy "allow all - app_settings" on app_settings for all using (true) with check (true);

create index if not exists idx_items_status on items(status);
create index if not exists idx_items_lot on items(lot_id);
create index if not exists idx_sales_item on sales(item_id);

-- เปิด Row Level Security แล้วอนุญาตแบบเปิดกว้าง (ใช้คนเดียว ไม่มี login)
-- หมายเหตุ: วิธีนี้เหมาะกับการใช้งานส่วนตัวเท่านั้น ห้ามแชร์ anon key ให้คนอื่น
alter table lots enable row level security;
alter table items enable row level security;
alter table sales enable row level security;

drop policy if exists "allow all - lots" on lots;
drop policy if exists "allow all - items" on items;
drop policy if exists "allow all - sales" on sales;
create policy "allow all - lots" on lots for all using (true) with check (true);
create policy "allow all - items" on items for all using (true) with check (true);
create policy "allow all - sales" on sales for all using (true) with check (true);
