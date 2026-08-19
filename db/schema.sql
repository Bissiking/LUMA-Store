CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(80) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name varchar(120) NOT NULL,
  summary varchar(180) NOT NULL,
  description text NOT NULL DEFAULT '',
  publisher varchar(120) NOT NULL DEFAULT 'LUMA',
  icon_url text,
  category varchar(60) NOT NULL DEFAULT 'Outils',
  website_url text,
  repository_url text,
  is_featured boolean NOT NULL DEFAULT false,
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'retired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  version varchar(64) NOT NULL,
  channel varchar(24) NOT NULL DEFAULT 'stable' CHECK (channel IN ('stable', 'beta', 'nightly')),
  platform varchar(24) NOT NULL CHECK (platform IN ('windows', 'macos', 'linux', 'android')),
  architecture varchar(24) NOT NULL DEFAULT 'universal' CHECK (architecture IN ('x64', 'arm64', 'universal')),
  package_type varchar(24) NOT NULL CHECK (package_type IN ('apk', 'exe', 'msi', 'dmg', 'deb', 'rpm', 'appimage', 'tar.gz', 'zip')),
  minimum_os varchar(80),
  release_notes text NOT NULL DEFAULT '',
  file_name varchar(255),
  storage_key text UNIQUE,
  mime_type varchar(120),
  size_bytes bigint,
  sha256 char(64),
  is_protected boolean NOT NULL DEFAULT false,
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'withdrawn')),
  upload_token_hash char(64),
  upload_expires_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id, version, channel, platform, architecture, package_type)
);

CREATE INDEX IF NOT EXISTS releases_update_lookup ON releases (application_id, platform, architecture, channel, status, published_at DESC);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id_hash char(64) PRIMARY KEY,
  user_id varchar(160) NOT NULL,
  display_name varchar(160),
  email varchar(320),
  refresh_token_encrypted text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_sessions_expiry ON admin_sessions (expires_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id bigserial PRIMARY KEY,
  actor_id varchar(160) NOT NULL,
  action varchar(100) NOT NULL,
  entity_type varchar(50) NOT NULL,
  entity_id varchar(160) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_hash char(64),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_entity ON audit_logs (entity_type, entity_id, created_at DESC);
