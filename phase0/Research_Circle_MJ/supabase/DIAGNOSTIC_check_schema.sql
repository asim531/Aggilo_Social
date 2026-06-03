-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  SCHEMA DIAGNOSTIC v2 — Safe version (handles missing tables)     ║
-- ║  Run each section separately in Supabase SQL Editor               ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  SECTION 1: List ALL tables in public schema                     │
-- └──────────────────────────────────────────────────────────────────┘

select 
  table_name as "Existing Table"
from information_schema.tables
where table_schema = 'public'
  and table_type = 'BASE TABLE'
order by table_name;

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  SECTION 2: Check expected tables (safe — won't crash)            │
-- └──────────────────────────────────────────────────────────────────┘

with expected_tables(table_name) as (
  values
    ('post_attachments'),
    ('paper_tags'),
    ('paper_comments'),
    ('paper_diagrams'),
    ('paper_decompositions'),
    ('paper_citations'),
    ('paper_versions'),
    ('paper_embeddings'),
    ('paper_annotations'),
    ('paper_reading_status'),
    ('paper_status_log'),
    ('post_reactions'),
    ('posts'),
    ('profiles'),
    ('topics'),
    ('notifications'),
    ('agent_chatbox_exchanges'),
    ('welfare_flags'),
    ('welfare_notifications')
)
select 
  e.table_name as "Expected Table",
  case when i.table_name is not null then 'EXISTS' else 'MISSING' end as status
from expected_tables e
left join information_schema.tables i 
  on i.table_schema = 'public' 
  and i.table_name = e.table_name
  and i.table_type = 'BASE TABLE'
order by status desc, e.table_name;

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  SECTION 3: Check post_attachments columns                        │
-- └──────────────────────────────────────────────────────────────────┘

with expected_columns(column_name) as (
  values
    ('extracted_text'),
    ('doc_type'),
    ('doc_title'),
    ('doc_summary'),
    ('white_paper_tools_enabled'),
    ('extracted_at'),
    ('authors'),
    ('venue'),
    ('year'),
    ('doi'),
    ('abstract'),
    ('keywords'),
    ('paper_status'),
    ('notes')
)
select 
  e.column_name as "Expected Column",
  case when i.column_name is not null then 'EXISTS' else 'MISSING' end as status
from expected_columns e
left join information_schema.columns i
  on i.table_schema = 'public'
  and i.table_name = 'post_attachments'
  and i.column_name = e.column_name
order by status desc, e.column_name;

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  SECTION 4: Check paper_diagrams columns                         │
-- └──────────────────────────────────────────────────────────────────┘

select 
  column_name as "Column",
  data_type as "Type"
from information_schema.columns
where table_schema = 'public'
  and table_name = 'paper_diagrams'
order by ordinal_position;

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  SECTION 5: Check if pgvector extension is enabled                  │
-- └──────────────────────────────────────────────────────────────────┘

select 
  extname as "Extension",
  extversion as "Version",
  case when extname is not null then 'ENABLED' else 'MISSING' end as status
from pg_extension
where extname = 'vector';

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  SECTION 6: Check if search functions exist                        │
-- └──────────────────────────────────────────────────────────────────┘

select 
  routine_name as "Function",
  routine_type as "Type"
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('search_papers', 'search_papers_semantic')
order by routine_name;

-- ┌──────────────────────────────────────────────────────────────────┐
-- │  SECTION 7: Safe row count for EACH table (run separately)         │
-- └──────────────────────────────────────────────────────────────────┘
-- Run each of these one at a time:

-- post_attachments
select count(*) as "post_attachments rows" from public.post_attachments;

-- paper_tags
select count(*) as "paper_tags rows" from public.paper_tags;

-- paper_comments
select count(*) as "paper_comments rows" from public.paper_comments;

-- paper_diagrams
select count(*) as "paper_diagrams rows" from public.paper_diagrams;

-- paper_decompositions
select count(*) as "paper_decompositions rows" from public.paper_decompositions;

-- paper_citations (this one might not exist yet)
select count(*) as "paper_citations rows" from public.paper_citations;

-- paper_embeddings
select count(*) as "paper_embeddings rows" from public.paper_embeddings;

-- paper_annotations
select count(*) as "paper_annotations rows" from public.paper_annotations;

-- paper_reading_status
select count(*) as "paper_reading_status rows" from public.paper_reading_status;

-- paper_versions
select count(*) as "paper_versions rows" from public.paper_versions;
