-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store your documents
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  content text,
  metadata jsonb,
  embedding vector(1536) -- 1536 dimensions for OpenAI text-embedding-3-small
);

-- Create a function to search for documents
-- Updated to support metadata filtering (required by LangChain)

-- DROP existing functions to avoid "function overloading" ambiguity
DROP FUNCTION IF EXISTS match_documents(vector, float, int, jsonb);
DROP FUNCTION IF EXISTS match_documents(vector, int, jsonb, float);

create or replace function match_documents (
  query_embedding vector(1536),
  match_count int default null,
  filter jsonb default '{}',
  match_threshold float default 0.1
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  and documents.metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Create an index for faster queries (optional but recommended for large datasets)
create index on documents using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
