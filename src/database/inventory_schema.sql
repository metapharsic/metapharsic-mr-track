-- Inventory & Stock Management Schema
-- Tracks every movement of product stock

CREATE TABLE IF NOT EXISTS inventory_logs (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(255),
    movement_type VARCHAR(20) NOT NULL, -- 'sale', 'restock', 'return', 'adjustment'
    quantity INTEGER NOT NULL,
    reference_id INTEGER, -- sale_id or other record ID
    user_id INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for stock history
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory_logs(product_id);

-- Trigger to automatically update product stock when a movement is logged
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.movement_type IN ('sale', 'adjustment_down') THEN
        UPDATE products SET stock = stock - NEW.quantity WHERE id = NEW.product_id;
    ELSIF NEW.movement_type IN ('restock', 'return', 'adjustment_up') THEN
        UPDATE products SET stock = stock + NEW.quantity WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_stock_on_movement
AFTER INSERT ON inventory_logs
FOR EACH ROW
EXECUTE FUNCTION update_product_stock();

-- Trigger to log inventory movement automatically when a sale is recorded
CREATE OR REPLACE FUNCTION log_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO inventory_logs (product_id, product_name, movement_type, quantity, reference_id, notes)
    VALUES (NEW.product_id, NEW.product_name, 'sale', NEW.quantity, NEW.id, 'Automatic log from sale entry');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_inventory_on_sale
AFTER INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION log_inventory_on_sale();
