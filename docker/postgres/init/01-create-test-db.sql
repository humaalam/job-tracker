-- Runs once, when the Postgres volume is first created.
-- Creates a separate database for automated tests (see TEST_DATABASE_URL in .env).
CREATE DATABASE jobtracker_test;
