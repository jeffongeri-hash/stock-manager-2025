-- Drop existing public trade ideas policy
DROP POLICY IF EXISTS "Users can view all trade ideas" ON public.trade_ideas;

-- Create new policy that only shows trade ideas marked as public or owned by user
-- First add a column to track public visibility if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trade_ideas' 
    AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.trade_ideas ADD COLUMN is_public boolean DEFAULT false;
  END IF;
END $$;

-- Create policy for viewing trade ideas (own or public)
CREATE POLICY "Users can view own or public trade ideas"
ON public.trade_ideas
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR is_public = true);