# EduEarn - Learn & Earn Platform

A complete earning website where users answer quiz questions and earn money, with referral system and admin dashboard.

## Features

### User Features
- Register with admin approval
- Login with unique user ID
- Answer Science/Math/History questions (₱0.0001-₱0.001 per correct answer)
- 5-second cooldown between answers
- Referral system with ₱50 per referral
- Milestone bonuses: 5 invites +₱30, 10 +₱50, 20 +₱100
- Withdrawal requests (GCash/Maya)
- Monthly contest with prize pool
- User dashboard with balance and referral stats

### Admin Features
- User approval/ban management
- Withdrawal request approval (auto-deducts balance)
- Question publishing (create/edit/delete)
- Contest management (set prize pool)
- Monthly referral reset
- View all user information

## Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key

### 2. Database Schema
Run these SQL commands in the Supabase SQL editor:

```sql
-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    referral_code TEXT UNIQUE NOT NULL,
    referred_by TEXT,
    balance DECIMAL DEFAULT 0,
    approved BOOLEAN DEFAULT false,
    banned BOOLEAN DEFAULT false,
    referrals_count INT DEFAULT 0,
    monthly_referrals INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    subject TEXT NOT NULL,
    question_text TEXT NOT NULL,
    options TEXT[] NOT NULL,
    correct_answer TEXT NOT NULL,
    points_reward DECIMAL NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Withdrawals table
CREATE TABLE withdrawals (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    method TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Contest settings table
CREATE TABLE contest_settings (
    id INT PRIMARY KEY DEFAULT 1,
    prize_pool DECIMAL DEFAULT 500
);

-- Insert default admin user
INSERT INTO users (id, username, password, full_name, email, referral_code, approved) 
VALUES ('ADMIN1', 'admin', 'admin123', 'Administrator', 'admin@eduearn.com', 'ADMIN001', true);

-- Insert sample questions
INSERT INTO questions (subject, question_text, options, correct_answer, points_reward) VALUES
('Science', 'What is the powerhouse of the cell?', ARRAY['Nucleus', 'Mitochondria', 'Ribosome', 'Chloroplast'], 'Mitochondria', 0.0005),
('Math', 'What is the square root of 144?', ARRAY['10', '11', '12', '13'], '12', 0.0003),
('History', 'Who painted the Mona Lisa?', ARRAY['Van Gogh', 'Picasso', 'Da Vinci', 'Rembrandt'], 'Da Vinci', 0.0004);

-- Insert default contest settings
INSERT INTO contest_settings (prize_pool) VALUES (500);