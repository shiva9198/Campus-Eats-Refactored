-- Day 9: Database Integrity & Constraints Migration
-- Purpose: Add foreign key constraints and check constraints to existing database
-- Safe to run multiple times (uses IF NOT EXISTS where possible)
-- Database: PostgreSQL (Campus Eats)

-- ============================================
-- Part 1: Add Foreign Key Constraints
-- ============================================

-- OrderItem.order_id: CASCADE delete (if order deleted, delete order_items)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_items_order_id_fkey_cascade'
    ) THEN
        -- Drop old constraint if exists
        ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
        -- Add new cascade constraint
        ALTER TABLE order_items 
        ADD CONSTRAINT order_items_order_id_fkey_cascade 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
    END IF;
END $$;

-- OrderItem.menu_item_id: RESTRICT delete (prevent deletion of menu_item if used in orders)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_items_menu_item_id_fkey_restrict'
    ) THEN
        -- Drop old constraint if exists
        ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_menu_item_id_fkey;
        -- Add new restrict constraint
        ALTER TABLE order_items 
        ADD CONSTRAINT order_items_menu_item_id_fkey_restrict 
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- ============================================
-- Part 2: Add CHECK Constraints
-- ============================================

-- MenuItem: price must be >= 1 (INR)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'menu_item_price_positive'
    ) THEN
        ALTER TABLE menu_items 
        ADD CONSTRAINT menu_item_price_positive 
        CHECK (price >= 1);
    END IF;
END $$;

-- Order: total_amount must be >= 0
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_total_non_negative'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT order_total_non_negative 
        CHECK (total_amount >= 0);
    END IF;
END $$;

-- OrderItem: quantity must be >= 1
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_item_quantity_positive'
    ) THEN
        ALTER TABLE order_items 
        ADD CONSTRAINT order_item_quantity_positive 
        CHECK (quantity >= 1);
    END IF;
END $$;

-- OrderItem: price must be >= 0 (snapshot, could be discounted)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_item_price_non_negative'
    ) THEN
        ALTER TABLE order_items 
        ADD CONSTRAINT order_item_price_non_negative 
        CHECK (price >= 0);
    END IF;
END $$;

-- ============================================
-- Verification Queries
-- ============================================

-- List all constraints added
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.constraint_name IN (
      'order_items_order_id_fkey_cascade',
      'order_items_menu_item_id_fkey_restrict',
      'menu_item_price_positive',
      'order_total_non_negative',
      'order_item_quantity_positive',
      'order_item_price_non_negative'
  )
ORDER BY tc.table_name, tc.constraint_name;
