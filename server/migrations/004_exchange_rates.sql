CREATE TABLE exchange_rates (
    base_currency CHAR(3) NOT NULL,
    target_currency CHAR(3) NOT NULL,
    rate NUMERIC(20,8) NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (base_currency, target_currency)
);