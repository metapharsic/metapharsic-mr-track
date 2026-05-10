-- GPS Data Seeding for Hyderabad Field Operations
-- Providing realistic coordinates for the 4 territories to enable AI Navigation

BEGIN;

-- 1. Seed Doctors
UPDATE doctors SET lat = 17.4483 + (random() * 0.01), lng = 78.3915 + (random() * 0.01) WHERE territory ILIKE '%Nacharam%';
UPDATE doctors SET lat = 17.4065 + (random() * 0.01), lng = 78.4691 + (random() * 0.01) WHERE territory ILIKE '%Habsiguda%';
UPDATE doctors SET lat = 17.3995 + (random() * 0.01), lng = 78.5600 + (random() * 0.01) WHERE territory ILIKE '%Uppal%';
UPDATE doctors SET lat = 17.4402 + (random() * 0.01), lng = 78.5639 + (random() * 0.01) WHERE territory ILIKE '%Mallapur%';
UPDATE doctors SET lat = 17.3850 + (random() * 0.05), lng = 78.4867 + (random() * 0.05) WHERE lat IS NULL; -- Fallback for other Hyderabad areas

-- 2. Seed Pharmacies
UPDATE pharmacies SET lat = 17.4483 + (random() * 0.01), lng = 78.3915 + (random() * 0.01) WHERE territory ILIKE '%Nacharam%';
UPDATE pharmacies SET lat = 17.4065 + (random() * 0.01), lng = 78.4691 + (random() * 0.01) WHERE territory ILIKE '%Habsiguda%';
UPDATE pharmacies SET lat = 17.3995 + (random() * 0.01), lng = 78.5600 + (random() * 0.01) WHERE territory ILIKE '%Uppal%';
UPDATE pharmacies SET lat = 17.4402 + (random() * 0.01), lng = 78.5639 + (random() * 0.01) WHERE territory ILIKE '%Mallapur%';
UPDATE pharmacies SET lat = 17.3850 + (random() * 0.05), lng = 78.4867 + (random() * 0.05) WHERE lat IS NULL;

-- 3. Seed Hospitals
UPDATE hospitals SET lat = 17.4483 + (random() * 0.01), lng = 78.3915 + (random() * 0.01) WHERE territory ILIKE '%Nacharam%';
UPDATE hospitals SET lat = 17.4065 + (random() * 0.01), lng = 78.4691 + (random() * 0.01) WHERE territory ILIKE '%Habsiguda%';
UPDATE hospitals SET lat = 17.3995 + (random() * 0.01), lng = 78.5600 + (random() * 0.01) WHERE territory ILIKE '%Uppal%';
UPDATE hospitals SET lat = 17.4402 + (random() * 0.01), lng = 78.5639 + (random() * 0.01) WHERE territory ILIKE '%Mallapur%';
UPDATE hospitals SET lat = 17.3850 + (random() * 0.05), lng = 78.4867 + (random() * 0.05) WHERE lat IS NULL;

COMMIT;
