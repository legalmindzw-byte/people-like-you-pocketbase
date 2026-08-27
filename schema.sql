-- Taura Africa (People Like You) backend schema

CREATE TYPE user_role AS ENUM ('reader', 'writer', 'admin');
CREATE TYPE story_status AS ENUM ('draft', 'pending_review', 'published', 'rejected');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'failed', 'cancelled');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'reader',
    points INTEGER NOT NULL DEFAULT 0,
    eligible_for_writer BOOLEAN NOT NULL DEFAULT false,
    bio TEXT,
    portfolio_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- The corporate figure / "person behind the story" being humanized
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    company VARCHAR(150),
    title VARCHAR(150),
    photo_url TEXT,
    short_bio TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE stories (
    id SERIAL PRIMARY KEY,
    title VARCHAR(250) NOT NULL,
    body TEXT NOT NULL,
    author_id INTEGER NOT NULL REFERENCES users(id),
    profile_id INTEGER REFERENCES profiles(id), -- the exec/person the story humanizes
    status story_status NOT NULL DEFAULT 'draft',
    is_paid BOOLEAN NOT NULL DEFAULT false,
    price_usd NUMERIC(10,2) DEFAULT 0,
    featured_on_blog BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    published_at TIMESTAMP
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    body TEXT NOT NULL,
    points_awarded INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Book Space: users selling/publishing books
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(250) NOT NULL,
    author_id INTEGER NOT NULL REFERENCES users(id),
    description TEXT,
    cover_url TEXT,
    file_url TEXT, -- manuscript / ebook file
    price_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
    approved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Stationery Hub: physical products
CREATE TABLE stationery_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price_usd NUMERIC(10,2) NOT NULL,
    stock_qty INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    item_type VARCHAR(20) NOT NULL, -- 'story', 'book', 'stationery'
    item_id INTEGER NOT NULL,
    amount_usd NUMERIC(10,2) NOT NULL,
    status order_status NOT NULL DEFAULT 'pending',
    paynow_reference VARCHAR(150),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Writer's Desk: portfolio pieces (distinct from paid/published stories)
CREATE TABLE portfolio_pieces (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(250) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_author ON stories(author_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_story ON comments(story_id);
CREATE INDEX idx_orders_user ON orders(user_id);
