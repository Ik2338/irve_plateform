-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- recherche texte floue

-- ─────────────────────────────────────────
-- ENUM types
-- ─────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('CLIENT', 'INSTALLER', 'ADMIN');
CREATE TYPE demande_status AS ENUM (
  'DRAFT', 'SUBMITTED', 'MATCHED', 'QUOTE_SENT',
  'QUOTE_ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
);
CREATE TYPE installation_type AS ENUM (
  'PARTICULIER', 'ENTREPRISE', 'COPROPRIETE', 'PARKING_PUBLIC'
);
CREATE TYPE certification_type AS ENUM (
  'IRVE_P1', 'IRVE_P2', 'CONSUEL', 'QUALIFELEC'
);

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role NOT NULL DEFAULT 'CLIENT',
  first_name    VARCHAR(100),
  last_name     VARCHAR(100),
  phone         VARCHAR(20),
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INSTALLER PROFILES
-- ─────────────────────────────────────────
CREATE TABLE installer_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name    VARCHAR(255) NOT NULL,
  siret           VARCHAR(14) UNIQUE,
  description     TEXT,
  logo_url        VARCHAR(500),
  website         VARCHAR(255),
  intervention_radius_km INTEGER DEFAULT 50,
  location        GEOGRAPHY(POINT, 4326), -- PostGIS : coordonnées GPS
  address_text    VARCHAR(500),
  city            VARCHAR(100),
  postal_code     VARCHAR(10),
  is_active       BOOLEAN DEFAULT TRUE,
  is_verified     BOOLEAN DEFAULT FALSE, -- vérifié par admin
  rating_avg      DECIMAL(3,2) DEFAULT 0,
  rating_count    INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index géographique (recherche par proximité)
CREATE INDEX idx_installer_location ON installer_profiles USING GIST(location);

-- ─────────────────────────────────────────
-- CERTIFICATIONS IRVE
-- ─────────────────────────────────────────
CREATE TABLE installer_certifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  installer_id    UUID NOT NULL REFERENCES installer_profiles(id) ON DELETE CASCADE,
  type            certification_type NOT NULL,
  certificate_url VARCHAR(500),
  issued_at       DATE,
  expires_at      DATE,
  verified_by_admin BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- TYPES D'INTERVENTION par installateur
-- ─────────────────────────────────────────
CREATE TABLE installer_intervention_types (
  installer_id      UUID REFERENCES installer_profiles(id) ON DELETE CASCADE,
  installation_type installation_type,
  PRIMARY KEY (installer_id, installation_type)
);

-- ─────────────────────────────────────────
-- DEMANDES D'INSTALLATION
-- ─────────────────────────────────────────
CREATE TABLE demandes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id         UUID NOT NULL REFERENCES users(id),
  installation_type installation_type NOT NULL,
  status            demande_status DEFAULT 'DRAFT',
  -- Infos projet
  project_name      VARCHAR(255),
  description       TEXT,
  nb_points_charge  INTEGER DEFAULT 1,
  puissance_kw      DECIMAL(6,2),
  -- Localisation du chantier
  address           VARCHAR(500) NOT NULL,
  city              VARCHAR(100) NOT NULL,
  postal_code       VARCHAR(10) NOT NULL,
  location          GEOGRAPHY(POINT, 4326),
  -- Infos complémentaires
  has_existing_elec BOOLEAN DEFAULT FALSE,
  needs_trench      BOOLEAN DEFAULT FALSE,
  notes             TEXT,
  -- Dates
  desired_start_date DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_demande_location ON demandes USING GIST(location);
CREATE INDEX idx_demande_status ON demandes(status);
CREATE INDEX idx_demande_client ON demandes(client_id);

-- ─────────────────────────────────────────
-- MATCHING : demande <-> installateurs proposés
-- ─────────────────────────────────────────
CREATE TABLE demande_matches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  demande_id      UUID NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
  installer_id    UUID NOT NULL REFERENCES installer_profiles(id),
  distance_km     DECIMAL(8,2),
  score           DECIMAL(5,2), -- score de pertinence
  status          VARCHAR(50) DEFAULT 'PROPOSED', -- PROPOSED | ACCEPTED | REJECTED
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(demande_id, installer_id)
);

-- ─────────────────────────────────────────
-- DEVIS
-- ─────────────────────────────────────────
CREATE TABLE devis (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  demande_id      UUID NOT NULL REFERENCES demandes(id),
  installer_id    UUID NOT NULL REFERENCES installer_profiles(id),
  montant         DECIMAL(10,2) NOT NULL,
  description     TEXT,
  pdf_url         VARCHAR(500),
  valid_until     DATE,
  accepted_at     TIMESTAMPTZ,
  rejected_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- MESSAGES (fil de discussion par demande)
-- ─────────────────────────────────────────
CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  demande_id  UUID NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id),
  content     TEXT NOT NULL,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- AVIS CLIENTS
-- ─────────────────────────────────────────
CREATE TABLE reviews (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  installer_id UUID NOT NULL REFERENCES installer_profiles(id),
  client_id    UUID NOT NULL REFERENCES users(id),
  demande_id   UUID REFERENCES demandes(id),
  rating       INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(installer_id, demande_id)
);

-- ─────────────────────────────────────────
-- Trigger : mise à jour rating installateur
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_installer_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE installer_profiles
  SET
    rating_avg   = (SELECT AVG(rating) FROM reviews WHERE installer_id = NEW.installer_id),
    rating_count = (SELECT COUNT(*) FROM reviews WHERE installer_id = NEW.installer_id),
    updated_at   = NOW()
  WHERE id = NEW.installer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_installer_rating();

-- ─────────────────────────────────────────
-- Trigger : updated_at auto
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_installer_updated_at BEFORE UPDATE ON installer_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_demande_updated_at BEFORE UPDATE ON demandes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
