-- =====================================================
-- TheoAgent Database Schema Setup
-- =====================================================
-- Copy and paste this entire script into Supabase SQL Editor
-- and run it to set up all necessary tables and functions.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS (Row Level Security)
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    institution_name TEXT,
    role TEXT,
    experience_level TEXT,
    interests TEXT[] DEFAULT '{}',
    preferred_language TEXT DEFAULT 'en',
    onboarding_completed BOOLEAN DEFAULT false,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'plus', 'expert')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due')),
    usage_count_today INTEGER DEFAULT 0,
    usage_reset_date DATE DEFAULT CURRENT_DATE,
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create theological sources table
CREATE TABLE IF NOT EXISTS public.theological_sources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('catechism', 'papal', 'biblical', 'patristic', 'conciliar')),
    content TEXT NOT NULL,
    language TEXT DEFAULT 'en',
    citations TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily gospel readings table
CREATE TABLE IF NOT EXISTS public.daily_gospel_readings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    reading_text TEXT NOT NULL,
    gospel_reference TEXT NOT NULL,
    liturgical_season TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations tracking table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mode_used TEXT NOT NULL,
    message_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theological_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_gospel_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view theological sources" ON public.theological_sources;
DROP POLICY IF EXISTS "Authenticated users can view daily readings" ON public.daily_gospel_readings;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create policies for theological sources (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view theological sources" ON public.theological_sources
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policies for daily gospel readings (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view daily readings" ON public.daily_gospel_readings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policies for conversations
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger to avoid duplicates
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers to avoid duplicates
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_theological_sources_updated_at ON public.theological_sources;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_theological_sources_updated_at 
    BEFORE UPDATE ON public.theological_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to reset daily usage
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS void AS $$
BEGIN
    UPDATE public.profiles 
    SET usage_count_today = 0, 
        usage_reset_date = CURRENT_DATE 
    WHERE usage_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment usage count
CREATE OR REPLACE FUNCTION increment_usage(user_id UUID)
RETURNS void AS $$
BEGIN
    -- First reset daily usage if needed
    PERFORM reset_daily_usage();
    
    -- Then increment usage
    UPDATE public.profiles 
    SET usage_count_today = usage_count_today + 1 
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_theological_sources_source_type ON public.theological_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_theological_sources_language ON public.theological_sources(language);
CREATE INDEX IF NOT EXISTS idx_daily_gospel_date ON public.daily_gospel_readings(date);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at);

-- Insert sample theological sources data
INSERT INTO public.theological_sources (title, source_type, content, language, citations, tags) VALUES
(
    'The Nature of Faith - Catechism 153-165',
    'catechism',
    'Faith is man''s response to God, who reveals himself and gives himself to man, at the same time bringing man a superabundant light as he searches for the ultimate meaning of his life. By faith, man completely submits his intellect and his will to God. With his whole being man gives his assent to God the revealer. Sacred Scripture calls this human response to God, the author of revelation, "the obedience of faith".',
    'en',
    ARRAY['CCC 153', 'CCC 154', 'CCC 155', 'CCC 143'],
    ARRAY['faith', 'revelation', 'response to God', 'obedience']
),
(
    'La Naturaleza de la Fe - Catecismo 153-165',
    'catechism',
    'La fe es la respuesta del hombre a Dios que se revela y se entrega al hombre, proporcionándole al mismo tiempo una luz superabundante cuando busca el sentido último de su vida. Por la fe, el hombre somete completamente su inteligencia y su voluntad a Dios. Con todo su ser, el hombre da su asentimiento a Dios revelador. La Sagrada Escritura llama "obediencia de la fe" a esta respuesta del hombre a Dios que revela.',
    'es',
    ARRAY['CCC 153', 'CCC 154', 'CCC 155', 'CCC 143'],
    ARRAY['fe', 'revelación', 'respuesta a Dios', 'obediencia']
),
(
    'The Holy Trinity - Catechism 232-267',
    'catechism',
    'The mystery of the Most Holy Trinity is the central mystery of Christian faith and life. It is the mystery of God in himself. It is therefore the source of all the other mysteries of faith, the light that enlightens them. Christians are baptized in the name of the Father and of the Son and of the Holy Spirit.',
    'en',
    ARRAY['CCC 232', 'CCC 233', 'CCC 234'],
    ARRAY['trinity', 'mystery', 'baptism', 'father', 'son', 'holy spirit']
)
ON CONFLICT DO NOTHING;

-- Insert sample daily gospel reading
INSERT INTO public.daily_gospel_readings (date, reading_text, gospel_reference, liturgical_season) VALUES
(
    CURRENT_DATE,
    'Jesus said to his disciples: "I am the way and the truth and the life. No one comes to the Father except through me. If you know me, then you will also know my Father. From now on you do know him and have seen him."',
    'John 14:6-7',
    'Christmas Season'
)
ON CONFLICT (date) DO NOTHING;

-- Success message
SELECT 'Database schema setup completed successfully! ✅' as message;