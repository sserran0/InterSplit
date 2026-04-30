CREATE_TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL ,
    name TEXT NOT NULL,
    preferred_currency CHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW()
);