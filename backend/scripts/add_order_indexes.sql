-- Order Performance Indexes
-- These are frequently queried fields during load tests
-- Run with: psql -U shiva -d campuseats -f scripts/add_order_indexes.sql

\echo '📊 Adding Order Performance Indexes'
\echo ''

-- Index for "get my orders" queries (user_id is frequently filtered)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
\echo '✅ Created idx_orders_user_id'

-- Index for filtering by order status (admin dashboard, status checks)
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
\echo '✅ Created idx_orders_status'

-- Composite index for common query pattern: user's orders by status
-- This optimizes queries like: WHERE user_id = X AND status = 'Pending'
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
\echo '✅ Created idx_orders_user_status'

\echo ''
\echo '📋 Verifying Indexes on Orders Table'
\echo ''

-- Verify indexes were created
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'orders'
ORDER BY indexname;

\echo ''
\echo '✅ Order indexes created successfully!'
