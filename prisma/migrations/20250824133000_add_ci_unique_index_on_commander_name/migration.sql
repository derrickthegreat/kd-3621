-- Ensure case-insensitive uniqueness on commander name
CREATE UNIQUE INDEX IF NOT EXISTS commanders_name_ci_unique ON "commanders" (LOWER(name));
