-- Add favorites column to tweet history
ALTER TABLE tweet_history ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Add favorites column to thread history
ALTER TABLE thread_history ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Add favorites column to reply history
ALTER TABLE reply_history ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Add RLS policies for updating favorites
CREATE POLICY "Users can update their own tweet favorites"
  ON tweet_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own thread favorites"
  ON thread_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reply favorites"
  ON reply_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for deleting entries
CREATE POLICY "Users can delete their own tweets"
  ON tweet_history FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own threads"
  ON thread_history FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies"
  ON reply_history FOR DELETE
  USING (auth.uid() = user_id); 