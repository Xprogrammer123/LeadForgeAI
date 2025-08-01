-- Location: supabase/migrations/20250716120000_auth_and_dashboard.sql

-- 1. Types and Core Tables
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'member');
CREATE TYPE public.campaign_status AS ENUM ('active', 'paused', 'draft');
CREATE TYPE public.contact_status AS ENUM ('new', 'contacted', 'replied', 'booked', 'closed');

-- Critical intermediary table for auth
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    company_name TEXT,
    role public.user_role DEFAULT 'member'::public.user_role,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns table
CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status public.campaign_status DEFAULT 'draft'::public.campaign_status,
    leads_generated INTEGER DEFAULT 0,
    meetings_booked INTEGER DEFAULT 0,
    reply_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Contacts table
CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    title TEXT,
    status public.contact_status DEFAULT 'new'::public.contact_status,
    last_activity TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- 2. Essential Indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_status ON public.contacts(status);


-- 3. RLS Setup
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 4. Helper Functions
CREATE OR REPLACE FUNCTION public.is_owner(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = user_uuid AND up.id = auth.uid()
)
$$;

CREATE OR REPLACE FUNCTION public.owns_campaign(campaign_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_uuid AND c.user_id = auth.uid()
)
$$;

CREATE OR REPLACE FUNCTION public.owns_contact(contact_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.contacts c
    WHERE c.id = contact_uuid AND c.user_id = auth.uid()
)
$$;

-- Function for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, company_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'company_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')::public.user_role
  );
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists before creating new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. RLS Policies
CREATE POLICY "users_own_profile" ON public.user_profiles FOR ALL
TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "users_own_campaigns" ON public.campaigns FOR ALL
TO authenticated
USING (public.owns_campaign(id)) WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_own_contacts" ON public.contacts FOR ALL
TO authenticated
USING (public.owns_contact(id)) WITH CHECK (user_id = auth.uid());

  

END $$;