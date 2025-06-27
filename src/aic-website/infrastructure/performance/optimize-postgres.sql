-- PostgreSQL Performance Optimization Script for AIC Website

-- Set optimal PostgreSQL configuration
ALTER SYSTEM SET shared_buffers = '2GB';                  -- 25% of system memory
ALTER SYSTEM SET effective_cache_size = '6GB';            -- 75% of system memory
ALTER SYSTEM SET maintenance_work_mem = '256MB';          -- For maintenance operations
ALTER SYSTEM SET work_mem = '20MB';                       -- Per operation memory
ALTER SYSTEM SET random_page_cost = 1.1;                  -- For SSD storage
ALTER SYSTEM SET effective_io_concurrency = 200;          -- For SSD storage
ALTER SYSTEM SET max_worker_processes = 8;                -- Based on CPU cores
ALTER SYSTEM SET max_parallel_workers_per_gather = 4;     -- Parallel query workers
ALTER SYSTEM SET max_parallel_workers = 8;                -- Max parallel workers
ALTER SYSTEM SET max_parallel_maintenance_workers = 4;    -- Parallel maintenance workers
ALTER SYSTEM SET checkpoint_completion_target = 0.9;      -- Spread checkpoints
ALTER SYSTEM SET wal_buffers = '16MB';                    -- WAL buffer size
ALTER SYSTEM SET default_statistics_target = 100;         -- Statistics detail level
ALTER SYSTEM SET autovacuum = on;                         -- Enable autovacuum
ALTER SYSTEM SET autovacuum_max_workers = 4;              -- Autovacuum workers
ALTER SYSTEM SET autovacuum_naptime = '1min';             -- Autovacuum frequency
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.05;   -- Vacuum threshold
ALTER SYSTEM SET autovacuum_analyze_scale_factor = 0.025; -- Analyze threshold

-- Create indexes for common queries

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Content table indexes
CREATE INDEX IF NOT EXISTS idx_content_slug ON content(slug);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
CREATE INDEX IF NOT EXISTS idx_content_author_id ON content(author_id);
CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at);
CREATE INDEX IF NOT EXISTS idx_content_published_at ON content(published_at);
CREATE INDEX IF NOT EXISTS idx_content_status_type ON content(status, type);
CREATE INDEX IF NOT EXISTS idx_content_full_text ON content USING gin(to_tsvector('english', title || ' ' || content));

-- Tags table indexes
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);

-- Content_tags table indexes
CREATE INDEX IF NOT EXISTS idx_content_tags_content_id ON content_tags(content_id);
CREATE INDEX IF NOT EXISTS idx_content_tags_tag_id ON content_tags(tag_id);

-- Sessions table indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Optimize tables
VACUUM ANALYZE users;
VACUUM ANALYZE content;
VACUUM ANALYZE tags;
VACUUM ANALYZE content_tags;
VACUUM ANALYZE sessions;

-- Create partitions for large tables (if applicable)
-- Example: Partition content table by created_at month

-- First, create a function to manage partitions
CREATE OR REPLACE FUNCTION create_content_partition_for_month(date_month DATE)
RETURNS VOID AS $$
DECLARE
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    partition_name := 'content_p' || to_char(date_month, 'YYYY_MM');
    start_date := date_trunc('month', date_month);
    end_date := date_trunc('month', date_month + interval '1 month');
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF content 
                   FOR VALUES FROM (%L) TO (%L)',
                   partition_name, start_date, end_date);
                   
    RAISE NOTICE 'Created partition % for month %', partition_name, to_char(date_month, 'YYYY-MM');
END;
$$ LANGUAGE plpgsql;

-- Create a function to manage partitions automatically
CREATE OR REPLACE FUNCTION create_content_partitions_for_range(start_date DATE, end_date DATE)
RETURNS VOID AS $$
DECLARE
    current_date DATE := start_date;
BEGIN
    WHILE current_date <= end_date LOOP
        PERFORM create_content_partition_for_month(current_date);
        current_date := current_date + interval '1 month';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create partitioned table (comment out if already implemented)
/*
BEGIN;
-- Create new partitioned table
CREATE TABLE content_partitioned (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    -- Add other columns as needed
) PARTITION BY RANGE (created_at);

-- Create partitions for the past year and next 3 months
SELECT create_content_partitions_for_range(
    date_trunc('month', CURRENT_DATE - interval '12 months'),
    date_trunc('month', CURRENT_DATE + interval '3 months')
);

-- Copy data from old table to new partitioned table
INSERT INTO content_partitioned SELECT * FROM content;

-- Rename tables to switch to partitioned version
ALTER TABLE content RENAME TO content_old;
ALTER TABLE content_partitioned RENAME TO content;

-- Create indexes on the partitioned table
CREATE INDEX idx_content_slug ON content(slug);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_content_author_id ON content(author_id);
CREATE INDEX idx_content_created_at ON content(created_at);
CREATE INDEX idx_content_published_at ON content(published_at);
CREATE INDEX idx_content_status_type ON content(status, type);
CREATE INDEX idx_content_full_text ON content USING gin(to_tsvector('english', title || ' ' || content));

COMMIT;
*/

-- Create a maintenance function to run regularly
CREATE OR REPLACE FUNCTION perform_db_maintenance()
RETURNS VOID AS $$
BEGIN
    -- Create partition for next month if it doesn't exist
    PERFORM create_content_partition_for_month(date_trunc('month', CURRENT_DATE + interval '1 month'));
    
    -- Analyze tables with stale statistics
    ANALYZE VERBOSE users;
    ANALYZE VERBOSE content;
    ANALYZE VERBOSE tags;
    ANALYZE VERBOSE content_tags;
    ANALYZE VERBOSE sessions;
    
    -- Log maintenance completion
    RAISE NOTICE 'Database maintenance completed at %', now();
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to run maintenance (requires pg_cron extension)
-- UNCOMMENT IF pg_cron is available
/*
SELECT cron.schedule('0 2 * * 0', 'SELECT perform_db_maintenance()');
*/
