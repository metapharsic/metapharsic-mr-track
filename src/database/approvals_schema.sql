-- Approval Workflow Schema
-- Tracks requests for credit extensions, expense approvals, and special discounts

CREATE TABLE IF NOT EXISTS approval_requests (
    id SERIAL PRIMARY KEY,
    mr_id INTEGER REFERENCES mrs(id),
    mr_name VARCHAR(255),
    type VARCHAR(50) NOT NULL, -- 'credit_extension', 'expense', 'discount', 'leave'
    entity_name VARCHAR(255), -- Pharmacy or Doctor name if applicable
    details TEXT,
    amount DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
    approver_id INTEGER REFERENCES users(id),
    approver_name VARCHAR(255),
    approver_comments TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for management filtering
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approvals_mr_id ON approval_requests(mr_id);
CREATE INDEX IF NOT EXISTS idx_approvals_type ON approval_requests(type);

-- Trigger to automatically notify Admin when a new high-priority approval is requested
CREATE OR REPLACE FUNCTION notify_admin_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.priority = 'high' THEN
        INSERT INTO notifications (user_role, type, title, message, action_url)
        VALUES (
            'admin', 
            'approval_needed', 
            '⚡ Urgent Approval: ' || NEW.type,
            'MR ' || NEW.mr_name || ' has requested an urgent ' || NEW.type || ' for ' || COALESCE(NEW.entity_name, 'N/A'),
            '/approvals'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_admin_on_approval
AFTER INSERT ON approval_requests
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_approval();
