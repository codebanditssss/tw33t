-- Create replies table
CREATE TABLE IF NOT EXISTS replies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_tweet TEXT NOT NULL,
  prompt TEXT NOT NULL,
  tone TEXT NOT NULL,
  content JSONB NOT NULL,
  type TEXT DEFAULT 'reply',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Add indexes
CREATE INDEX IF NOT EXISTS replies_user_id_idx ON replies(user_id);
CREATE INDEX IF NOT EXISTS replies_created_at_idx ON replies(created_at);

-- Add RLS policies
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own replies
CREATE POLICY "Users can read their own replies"
  ON replies FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own replies
CREATE POLICY "Users can insert their own replies"
  ON replies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own replies
CREATE POLICY "Users can update their own replies"
  ON replies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own replies
CREATE POLICY "Users can delete their own replies"
  ON replies FOR DELETE
  USING (auth.uid() = user_id); 