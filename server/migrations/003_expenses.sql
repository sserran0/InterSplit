CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    paid_by UUID REFERENCES users(id),
    amount NUMERIC(15, 4) NOT NULL,
    currency CHAR(3) NOT NULL, --ISO 4217 code,
    description TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    split_type TEXT NOT NULL DEFAULT 'equal',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expense_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    share_amount NUMERIC(15,4) NOT NULL, --IN SOURCE CURRENCY
    is_settled BOOLEAN DEFAULT FALSE --SETTLEMENT STATUS
);
