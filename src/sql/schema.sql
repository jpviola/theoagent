-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS (Row Level Security)
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    institution_name TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'plus', 'expert')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due')),
    usage_count_today INTEGER DEFAULT 0,
    usage_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create theological sources table
CREATE TABLE public.theological_sources (
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
CREATE TABLE public.daily_gospel_readings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    reading_text TEXT NOT NULL,
    gospel_reference TEXT NOT NULL,
    liturgical_season TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations tracking table
CREATE TABLE public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mode_used TEXT NOT NULL,
    message_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saints table
CREATE TABLE public.saints (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date_str TEXT NOT NULL, -- Format: MM-DD
    name TEXT NOT NULL,
    type TEXT,
    bio TEXT,
    region TEXT DEFAULT 'WORLD' CHECK (region IN ('ES', 'LATAM', 'WORLD')),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create books table
CREATE TABLE public.books (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    description TEXT,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create regional data table
CREATE TABLE public.regional_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    region TEXT NOT NULL,
    country TEXT, -- derived from region if specific (e.g. AR, PE)
    source_type TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theological_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_gospel_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_data ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create policies for theological sources (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view theological sources" ON public.theological_sources
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policies for public data (Saints, Books, Regional)
-- Allow public read access since these are general knowledge
CREATE POLICY "Public read access for saints" ON public.saints
    FOR SELECT USING (true);

CREATE POLICY "Public read access for books" ON public.books
    FOR SELECT USING (true);

CREATE POLICY "Public read access for regional_data" ON public.regional_data
    FOR SELECT USING (true);

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
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_theological_sources_updated_at 
    BEFORE UPDATE ON public.theological_sources
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

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
CREATE INDEX idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX idx_theological_sources_source_type ON public.theological_sources(source_type);
CREATE INDEX idx_theological_sources_language ON public.theological_sources(language);
CREATE INDEX idx_daily_gospel_date ON public.daily_gospel_readings(date);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at);

-- Insert sample theological sources data
INSERT INTO public.theological_sources (title, source_type, content, language, citations, tags) VALUES
(
    'The Nature of Faith - Catechism 153-165',
    'catechism',
    'Faith is man''s response to God, who reveals himself and gives himself to man, at the same time bringing man a superabundant light as he searches for the ultimate meaning of his life.',
    'en',
    ARRAY['CCC 153', 'CCC 154', 'CCC 155'],
    ARRAY['faith', 'revelation', 'response to God']
),
(
    'La Naturaleza de la Fe - Catecismo 153-165',
    'catechism',
    'La fe es la respuesta del hombre a Dios que se revela y se entrega al hombre, proporcionándole al mismo tiempo una luz superabundante cuando busca el sentido último de su vida.',
    'es',
    ARRAY['CCC 153', 'CCC 154', 'CCC 155'],
    ARRAY['fe', 'revelación', 'respuesta a Dios']
);

-- Insert sample daily gospel reading
INSERT INTO public.daily_gospel_readings (date, reading_text, gospel_reference, liturgical_season) VALUES
(
    CURRENT_DATE,
    'Jesus said to his disciples: "I am the way and the truth and the life. No one comes to the Father except through me."',
    'John 14:6',
    'Ordinary Time'
);