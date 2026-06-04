-- Fix existing listings table so id is auto-generated correctly.
-- Run this against the database if the listings table already exists without a serial/default id.

CREATE SEQUENCE IF NOT EXISTS listings_id_seq;

SELECT setval('listings_id_seq', COALESCE((SELECT MAX(id) FROM listings), 0), true);

ALTER SEQUENCE listings_id_seq OWNED BY listings.id;
ALTER TABLE listings ALTER COLUMN id SET DEFAULT nextval('listings_id_seq');
