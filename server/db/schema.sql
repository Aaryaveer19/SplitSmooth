-- SplitSmooth Database Schema
-- Run: psql -U postgres -f schema.sql

-- Create database (run separately if needed)
-- CREATE DATABASE splitsmooth;

-- Connect to database
\c splitsmooth;

-- Clean slate
DROP TABLE IF EXISTS event_participants CASCADE;
DROP TABLE IF EXISTS event_payers CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS trips CASCADE;

-- ============================================================
-- TRIPS
-- ============================================================
CREATE TABLE trips (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    start_date  DATE,
    end_date    DATE,
    cover_gradient VARCHAR(255) DEFAULT 'from-emerald-500 to-cyan-500',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- MEMBERS (belong to a trip)
-- ============================================================
CREATE TABLE members (
    id         SERIAL PRIMARY KEY,
    trip_id    INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(trip_id, name)
);

-- ============================================================
-- EVENTS (belong to a trip)
-- ============================================================
CREATE TABLE events (
    id           SERIAL PRIMARY KEY,
    trip_id      INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    description  TEXT,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount > 0),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- EVENT_PAYERS (who paid how much for an event)
-- ============================================================
CREATE TABLE event_payers (
    id        SERIAL PRIMARY KEY,
    event_id  INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    amount    NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    UNIQUE(event_id, member_id)
);

-- ============================================================
-- EVENT_PARTICIPANTS (who shares the cost of an event)
-- ============================================================
CREATE TABLE event_participants (
    id        SERIAL PRIMARY KEY,
    event_id  INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    UNIQUE(event_id, member_id)
);

-- Indexes for performance
CREATE INDEX idx_members_trip ON members(trip_id);
CREATE INDEX idx_events_trip ON events(trip_id);
CREATE INDEX idx_event_payers_event ON event_payers(event_id);
CREATE INDEX idx_event_participants_event ON event_participants(event_id);
