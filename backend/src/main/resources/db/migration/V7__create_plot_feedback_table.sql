-- Migration V7: Create plot_feedback table for user feedback on plots
-- Tracks reports, outdated flags, and price suggestions

CREATE TABLE IF NOT EXISTS plot_feedback (
    id BIGSERIAL PRIMARY KEY,
    plot_id BIGINT NOT NULL,
    user_id BIGINT,
    feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('OUTDATED', 'REPORTED', 'PRICE_SUGGESTION')),
    suggested_price NUMERIC(19, 2),
    suggested_price_unit VARCHAR(50),
    comment VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_plot_feedback_plot FOREIGN KEY (plot_id) REFERENCES plots(id) ON DELETE CASCADE,
    CONSTRAINT fk_plot_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_plot_feedback_plot_id ON plot_feedback(plot_id);
CREATE INDEX IF NOT EXISTS idx_plot_feedback_user_id ON plot_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_plot_feedback_type ON plot_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_plot_feedback_created_at ON plot_feedback(created_at);

-- Add comment to table
COMMENT ON TABLE plot_feedback IS 'User feedback on plots: reports, outdated flags, and price suggestions';

