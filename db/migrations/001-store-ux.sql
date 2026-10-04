ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_status_check CHECK (status IN ('draft','published','hidden','retired'));
ALTER TABLE applications ADD COLUMN IF NOT EXISTS icon_managed boolean NOT NULL DEFAULT false;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS supported_platforms text[] NOT NULL DEFAULT '{}';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS minimum_versions_to_keep integer;
ALTER TABLE releases DROP CONSTRAINT IF EXISTS releases_architecture_check;
ALTER TABLE releases ADD CONSTRAINT releases_architecture_check CHECK (architecture IN ('x64','arm64','x86','universal','other'));
ALTER TABLE releases ADD COLUMN IF NOT EXISTS original_file_name text;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS detected_version_raw text;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS detected_architecture_raw text;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS detected_package_raw text;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS detected_distribution_raw text;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS distribution varchar(80);
ALTER TABLE releases ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
UPDATE releases SET original_file_name=file_name WHERE original_file_name IS NULL AND file_name IS NOT NULL;
CREATE TABLE IF NOT EXISTS application_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  kind varchar(20) NOT NULL CHECK (kind IN ('icon','screenshot')),
  storage_key text NOT NULL UNIQUE,
  mime_type varchar(40) NOT NULL CHECK (mime_type IN ('image/png','image/webp')),
  width integer NOT NULL CHECK (width > 0), height integer NOT NULL CHECK (height > 0),
  size_bytes bigint NOT NULL, sha256 char(64) NOT NULL,
  sort_order integer NOT NULL DEFAULT 0, caption varchar(300) NOT NULL DEFAULT '',
  platform varchar(24) CHECK (platform IN ('windows','macos','linux','android')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS application_media_icon ON application_media(application_id) WHERE kind='icon';
CREATE INDEX IF NOT EXISTS application_media_order ON application_media(application_id,sort_order);
