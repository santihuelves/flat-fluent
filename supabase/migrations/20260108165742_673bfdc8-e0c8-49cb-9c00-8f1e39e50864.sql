-- Add test_completed and dealbreakers fields to convinter_profiles
ALTER TABLE public.convinter_profiles 
ADD COLUMN IF NOT EXISTS test_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS dealbreakers text[] DEFAULT '{}'::text[];

-- Create index for filtering by test completion
CREATE INDEX IF NOT EXISTS idx_convinter_profiles_test_completed 
ON public.convinter_profiles(test_completed) WHERE test_completed = true;