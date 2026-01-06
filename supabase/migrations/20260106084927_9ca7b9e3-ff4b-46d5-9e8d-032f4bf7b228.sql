-- Create enums for user type and verification level
CREATE TYPE public.user_type AS ENUM ('seeking_room', 'offering_room', 'seeking_roommate');
CREATE TYPE public.verification_level AS ENUM ('none', 'email', 'phone', 'document');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  bio TEXT,
  user_type public.user_type,
  
  -- Location
  autonomous_community TEXT,
  province TEXT,
  city TEXT,
  neighborhoods TEXT[],
  
  -- Budget and dates
  budget_min INTEGER,
  budget_max INTEGER,
  move_in_date DATE,
  min_stay_months INTEGER,
  
  -- Other data
  languages TEXT[],
  occupation TEXT,
  lifestyle_tags TEXT[],
  photos TEXT[],
  
  -- Verification and status
  verification_level public.verification_level DEFAULT 'none',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  test_completed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'name');
  RETURN NEW;
END;
$$;

-- Trigger to create profile automatically
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();