CREATE TABLE exchange_rates (
    base_curr CHAR(3) NOT NULL,
    target_curr CHAR(3) NOT NULL,
    rate NUMERIC(20,8) NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (base_curr, target_curr)
);