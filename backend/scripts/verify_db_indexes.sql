-- Verify database indexes for Campus Eats performance optimization
-- Run with: psql -U shiva -d campuseats -f scripts/verify_db_indexes.sql

\echo '📊 Campus Eats Database Index Report'
\echo ''

\echo '1. Users Table Indexes:'
\d users

\echo ''
\echo '2. Orders Table Indexes:'
\d orders

\echo ''
\echo '3. Menu Items Table Indexes:'
\d menu_items

\echo ''
\echo '4. Order Items Table Indexes:'
\d order_items

\echo ''
\echo '✅ Index Verification Complete'
\echo ''
\echo 'Expected indexes:'
\echo '  - users: id (PK), username (unique), email (unique)'
\echo '  - orders: id (PK), user_id, status'
\echo '  - menu_items: id (PK), name'
\echo '  - order_items: id (PK), order_id, menu_item_id'
