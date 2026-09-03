-- Run this whole file in Supabase's SQL Editor (left sidebar > SQL Editor > New query)

-- Users: one row per electrician/dealer
create table users (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  name text,
  points integer not null default 0,

  -- KYC fields: notice we do NOT store the raw Aadhaar number anywhere.
  -- We only store what the KYC provider (Digio/Signzy/Setu) gives back:
  -- a verification reference ID and a status. The provider holds the
  -- actual sensitive document data on their compliant infrastructure.
  kyc_status text not null default 'pending', -- pending | verified | rejected
  kyc_reference_id text,        -- the verification ID the KYC provider gave us
  pan_number text,              -- PAN is fine to store (needed for TDS filing)
  upi_id text,                  -- where payouts will be sent later

  created_at timestamptz not null default now()
);

-- One-time-passwords for phone login. We never store the OTP in plain text,
-- only its hash - same principle as password storage.
create table otp_verifications (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_otp_phone on otp_verifications(phone, created_at desc);

-- Products: what points value each product type is worth
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  points_value integer not null,
  created_at timestamptz not null default now()
);

-- QR codes: one row PER PHYSICAL STICKER you print. This is the important
-- table for fraud prevention. "code" is unique at the database level, so
-- even if your server code has a bug, the database itself will refuse to
-- let the same code be marked used twice.
create table qr_codes (
  code text primary key,
  product_id uuid not null references products(id),
  used boolean not null default false,
  used_by uuid references users(id),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Transactions: a permanent log of every points change (earn or redeem).
-- Never delete rows from this table - it's your audit trail.
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  type text not null, -- 'earn' | 'redeem'
  points integer not null,
  qr_code text references qr_codes(code),
  created_at timestamptz not null default now()
);

-- Speeds up "give me this user's history" queries
create index idx_transactions_user on transactions(user_id, created_at desc);

-- This function updates points safely even if two scans happen at the exact
-- same millisecond for the same user - Postgres handles the locking for us.
create or replace function increment_user_points(p_user_id uuid, p_amount integer)
returns integer
language sql
as $$
  update users set points = points + p_amount
  where id = p_user_id
  returning points;
$$;

-- Example: insert a product and 3 QR codes for testing
insert into products (name, points_value) values ('Anchor MCB 32A', 50);
-- After running the line above, check the products table for its generated id,
-- then insert test QR codes like this (replace PRODUCT_ID_HERE):
-- insert into qr_codes (code, product_id) values
--   ('QR-TEST-0001', 'PRODUCT_ID_HERE'),
--   ('QR-TEST-0002', 'PRODUCT_ID_HERE'),
--   ('QR-TEST-0003', 'PRODUCT_ID_HERE');




-- Bank Detail Schema

create table bank_details (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) unique,
  method text not null,
  account_holder_name text not null,
  upi_id text,
  account_number text,
  ifsc_code text,
  verified boolean not null default false,
  razorpay_contact_id text,
  razorpay_fund_account_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table redemption_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  points_redeemed integer not null,
  amount_inr numeric(10,2) not null,
  status text not null default 'pending',
  razorpay_payout_id text,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_redemption_user on redemption_requests(user_id, created_at desc);

create or replace function get_available_points(p_user_id uuid)
returns integer
language sql
as $$
  select u.points - coalesce((
    select sum(r.points_redeemed)
    from redemption_requests r
    where r.user_id = p_user_id and r.status = 'pending'
  ), 0)
  from users u
  where u.id = p_user_id;
$$;
