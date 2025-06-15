-- Create tweet history table
CREATE TABLE IF NOT EXISTS tweet_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  tone TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  type TEXT NOT NULL DEFAULT 'tweet',
  CONSTRAINT valid_type CHECK (type = 'tweet')
);

-- Create thread history table
CREATE TABLE IF NOT EXISTS thread_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  tone TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  type TEXT NOT NULL DEFAULT 'thread',
  CONSTRAINT valid_type CHECK (type = 'thread')
);

-- Create reply history table
CREATE TABLE IF NOT EXISTS reply_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  tone TEXT NOT NULL,
  content TEXT NOT NULL,
  original_tweet TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  type TEXT NOT NULL DEFAULT 'reply',
  CONSTRAINT valid_type CHECK (type = 'reply')
);

-- Create RLS policies for tweet history
ALTER TABLE tweet_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own tweet history"
  ON tweet_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tweet history"
  ON tweet_history FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policies for thread history
ALTER TABLE thread_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own thread history"
  ON thread_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own thread history"
  ON thread_history FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policies for reply history
ALTER TABLE reply_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own reply history"
  ON reply_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reply history"
  ON reply_history FOR SELECT
  USING (auth.uid() = user_id); 