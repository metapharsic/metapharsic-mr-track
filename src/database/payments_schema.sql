-- Payment Ledger Schema
-- Tracks individual payment collections from entities

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    entity_credit_id INTEGER REFERENCES entity_credits(id),
    entity_name VARCHAR(255) NOT NULL,
    mr_id INTEGER REFERENCES mrs(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50), -- 'cash', 'upi', 'check', 'bank_transfer'
    reference_number VARCHAR(100), -- Check number, UPI Trans ID, etc.
    payment_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'confirmed', -- 'pending', 'confirmed', 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for history lookups
CREATE INDEX IF NOT EXISTS idx_payments_entity_credit ON payments(entity_credit_id);
CREATE INDEX IF NOT EXISTS idx_payments_mr_id ON payments(mr_id);

-- Trigger to automatically update outstanding balance in entity_credits when a payment is confirmed
CREATE OR REPLACE FUNCTION update_outstanding_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed') THEN
        UPDATE entity_credits 
        SET outstanding = outstanding - NEW.amount,
            last_payment_date = NEW.payment_date,
            updated_at = NOW()
        WHERE id = NEW.entity_credit_id;
    ELSIF (TG_OP = 'UPDATE' AND OLD.status != 'confirmed' AND NEW.status = 'confirmed') THEN
        UPDATE entity_credits 
        SET outstanding = outstanding - NEW.amount,
            last_payment_date = NEW.payment_date,
            updated_at = NOW()
        WHERE id = NEW.entity_credit_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_outstanding_on_payment
AFTER INSERT OR UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_outstanding_balance();
