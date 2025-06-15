-- Create tweet history table
CREATE TABLE IF NOT EXISTS tweet_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  tone TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create thread history table
CREATE TABLE IF NOT EXISTS thread_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  tone TEXT NOT NULL,
  content JSONB NOT NULL,
  thread_length INTEGER NOT NULL,
  thread_style TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create reply history table
CREATE TABLE IF NOT EXISTS reply_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  tone TEXT NOT NULL,
  content JSONB NOT NULL,
  original_tweet TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create usage history table
CREATE TABLE IF NOT EXISTS usage_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS tweet_history_user_id_idx ON tweet_history(user_id);
CREATE INDEX IF NOT EXISTS thread_history_user_id_idx ON thread_history(user_id);
CREATE INDEX IF NOT EXISTS reply_history_user_id_idx ON reply_history(user_id);
CREATE INDEX IF NOT EXISTS usage_history_user_id_idx ON usage_history(user_id);

-- Add created_at indexes for sorting
CREATE INDEX IF NOT EXISTS tweet_history_created_at_idx ON tweet_history(created_at DESC);
CREATE INDEX IF NOT EXISTS thread_history_created_at_idx ON thread_history(created_at DESC);
CREATE INDEX IF NOT EXISTS reply_history_created_at_idx ON reply_history(created_at DESC);
CREATE INDEX IF NOT EXISTS usage_history_created_at_idx ON usage_history(created_at DESC);

-- Add RLS policies
ALTER TABLE tweet_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reply_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_history ENABLE ROW LEVEL SECURITY;

-- Policies for tweet_history
CREATE POLICY "Users can view their own tweet history"
  ON tweet_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tweet history"
  ON tweet_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for thread_history
CREATE POLICY "Users can view their own thread history"
  ON thread_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own thread history"
  ON thread_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for reply_history
CREATE POLICY "Users can view their own reply history"
  ON reply_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reply history"
  ON reply_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for usage_history
CREATE POLICY "Users can view their own usage history"
  ON usage_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage history"
  ON usage_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id); 