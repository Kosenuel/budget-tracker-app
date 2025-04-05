-- PostgreSQL Setup Script

-- Enable UUID generation if needed (commented out for now)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to automatically update timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    preferred_currency VARCHAR(10) DEFAULT 'USD' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Apply timestamp trigger to users table
DROP TRIGGER IF EXISTS set_timestamp ON users;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Account Types Enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
        CREATE TYPE account_type AS ENUM ('checking', 'savings', 'credit_card', 'cash', 'investment', 'other');
    END IF;
END$$;

-- Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type account_type NOT NULL,
    currency VARCHAR(10) NOT NULL,
    initial_balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Apply timestamp trigger to accounts table
DROP TRIGGER IF EXISTS set_timestamp ON accounts;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON accounts
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Category Types Enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'category_type') THEN
        CREATE TYPE category_type AS ENUM ('income', 'expense');
    END IF;
END$$;

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type category_type NOT NULL,
    icon VARCHAR(50),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, name, type)
);

-- Apply timestamp trigger to categories table
DROP TRIGGER IF EXISTS set_timestamp ON categories;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    type category_type NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Apply timestamp trigger to transactions table
DROP TRIGGER IF EXISTS set_timestamp ON transactions;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);

-- Insert default categories (Only if they don't exist already)
INSERT INTO categories (name, type, is_default, icon)
SELECT 'Salary', 'income'::category_type, TRUE, 'fa-money-bill-wave'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Salary' AND type = 'income' AND is_default = TRUE);

INSERT INTO categories (name, type, is_default, icon)
SELECT 'Groceries', 'expense'::category_type, TRUE, 'fa-shopping-cart'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Groceries' AND type = 'expense' AND is_default = TRUE);

INSERT INTO categories (name, type, is_default, icon)
SELECT 'Rent', 'expense'::category_type, TRUE, 'fa-home'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Rent' AND type = 'expense' AND is_default = TRUE);

INSERT INTO categories (name, type, is_default, icon)
SELECT 'Utilities', 'expense'::category_type, TRUE, 'fa-bolt'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Utilities' AND type = 'expense' AND is_default = TRUE);

INSERT INTO categories (name, type, is_default, icon)
SELECT 'Transportation', 'expense'::category_type, TRUE, 'fa-car'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Transportation' AND type = 'expense' AND is_default = TRUE);

INSERT INTO categories (name, type, is_default, icon)
SELECT 'Dining Out', 'expense'::category_type, TRUE, 'fa-utensils'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Dining Out' AND type = 'expense' AND is_default = TRUE);

INSERT INTO categories (name, type, is_default, icon)
SELECT 'Entertainment', 'expense'::category_type, TRUE, 'fa-film'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Entertainment' AND type = 'expense' AND is_default = TRUE);

INSERT INTO categories (name, type, is_default, icon)
SELECT 'Other Income', 'income'::category_type, TRUE, 'fa-plus-circle'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Other Income' AND type = 'income' AND is_default = TRUE);

INSERT INTO categories (name, type, is_default, icon)
SELECT 'Other Expense', 'expense'::category_type, TRUE, 'fa-minus-circle'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Other Expense' AND type = 'expense' AND is_default = TRUE);

-- Output completion message
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully.';
END $$;