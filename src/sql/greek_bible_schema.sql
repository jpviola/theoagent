-- Schema for Greek New Testament (SBLGNT)
-- Based on morphgnt/sblgnt structure

-- Enable extension for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table for storing books of the Bible
CREATE TABLE IF NOT EXISTS public.greek_bible_books (
  id TEXT PRIMARY KEY, -- e.g., 'Mt', 'Mk', 'Lk'
  name_eng TEXT NOT NULL,
  name_greek TEXT,
  order_index INTEGER NOT NULL
);

-- Table for storing verses
CREATE TABLE IF NOT EXISTS public.greek_bible_verses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id TEXT REFERENCES public.greek_bible_books(id) ON DELETE CASCADE,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text_content TEXT,
  UNIQUE(book_id, chapter, verse)
);

-- Table for storing individual words with morphological data
CREATE TABLE IF NOT EXISTS public.greek_bible_words (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  verse_id UUID REFERENCES public.greek_bible_verses(id) ON DELETE CASCADE,
  word_order INTEGER NOT NULL,
  text TEXT NOT NULL,
  lemma TEXT,
  normalized TEXT,
  part_of_speech TEXT,
  morphology TEXT,
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple', text || ' ' || coalesce(lemma,''))) STORED,
  UNIQUE (verse_id, word_order)
);

-- Table for storing word definitions
CREATE TABLE IF NOT EXISTS public.greek_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lemma TEXT UNIQUE NOT NULL,
  definition_short TEXT,
  definition_full TEXT,
  strong_code TEXT,
  source TEXT DEFAULT 'laparola',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_greek_bible_verses_book_chapter ON public.greek_bible_verses(book_id, chapter);
CREATE INDEX IF NOT EXISTS idx_greek_bible_words_verse_id ON public.greek_bible_words(verse_id);
CREATE INDEX IF NOT EXISTS idx_greek_bible_words_lemma ON public.greek_bible_words(lemma);
CREATE INDEX IF NOT EXISTS idx_greek_bible_words_text ON public.greek_bible_words(text);
CREATE INDEX IF NOT EXISTS idx_greek_bible_words_search_vector ON public.greek_bible_words USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_greek_definitions_lemma ON public.greek_definitions(lemma);

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger for definitions
DROP TRIGGER IF EXISTS trg_greek_definitions_updated_at ON public.greek_definitions;
CREATE TRIGGER trg_greek_definitions_updated_at
BEFORE UPDATE ON public.greek_definitions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS and create explicit SELECT policies for public read
ALTER TABLE public.greek_bible_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.greek_bible_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.greek_bible_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.greek_definitions ENABLE ROW LEVEL SECURITY;

-- Revoke any existing policies with same name to avoid conflicts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_public_read_books') THEN
    EXECUTE 'DROP POLICY allow_public_read_books ON public.greek_bible_books';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_public_read_verses') THEN
    EXECUTE 'DROP POLICY allow_public_read_verses ON public.greek_bible_verses';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_public_read_words') THEN
    EXECUTE 'DROP POLICY allow_public_read_words ON public.greek_bible_words';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_public_read_definitions') THEN
    EXECUTE 'DROP POLICY allow_public_read_definitions ON public.greek_definitions';
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- ignore in older Postgres without pg_policies view
  NULL;
END;
$$;

CREATE POLICY allow_public_read_books ON public.greek_bible_books FOR SELECT TO PUBLIC USING (true);
CREATE POLICY allow_public_read_verses ON public.greek_bible_verses FOR SELECT TO PUBLIC USING (true);
CREATE POLICY allow_public_read_words ON public.greek_bible_words FOR SELECT TO PUBLIC USING (true);
CREATE POLICY allow_public_read_definitions ON public.greek_definitions FOR SELECT TO PUBLIC USING (true);

-- Insert Books (Standard SBLGNT IDs)
INSERT INTO public.greek_bible_books (id, name_eng, order_index) VALUES
('Mt', 'Matthew', 1),
('Mk', 'Mark', 2),
('Lk', 'Luke', 3),
('Jn', 'John', 4),
('Ac', 'Acts', 5),
('Ro', 'Romans', 6),
('1Co', '1 Corinthians', 7),
('2Co', '2 Corinthians', 8),
('Ga', 'Galatians', 9),
('Eph', 'Ephesians', 10),
('Php', 'Philippians', 11),
('Col', 'Colossians', 12),
('1Th', '1 Thessalonians', 13),
('2Th', '2 Thessalonians', 14),
('1Ti', '1 Timothy', 15),
('2Ti', '2 Timothy', 16),
('Tit', 'Titus', 17),
('Phm', 'Philemon', 18),
('Heb', 'Hebrews', 19),
('Jas', 'James', 20),
('1Pe', '1 Peter', 21),
('2Pe', '2 Peter', 22),
('1Jn', '1 John', 23),
('2Jn', '2 John', 24),
('3Jn', '3 John', 25),
('Jud', 'Jude', 26),
('Re', 'Revelation', 27)
ON CONFLICT (id) DO NOTHING;