create extension if not exists pg_trgm;

create table if not exists interest_taxonomy (
  id       uuid primary key default gen_random_uuid(),
  name     text unique not null,
  category text not null
);

create index if not exists interest_taxonomy_name_trgm_idx on interest_taxonomy using gin (name gin_trgm_ops);

-- Seed with common interests across categories
insert into interest_taxonomy (name, category) values
  -- Technology
  ('javascript', 'Technology'), ('typescript', 'Technology'), ('python', 'Technology'),
  ('rust', 'Technology'), ('go', 'Technology'), ('java', 'Technology'), ('c++', 'Technology'),
  ('react', 'Technology'), ('nextjs', 'Technology'), ('vue', 'Technology'),
  ('machine learning', 'Technology'), ('artificial intelligence', 'Technology'),
  ('data science', 'Technology'), ('blockchain', 'Technology'), ('cybersecurity', 'Technology'),
  ('devops', 'Technology'), ('kubernetes', 'Technology'), ('docker', 'Technology'),
  ('open source', 'Technology'), ('web development', 'Technology'),
  ('mobile development', 'Technology'), ('game development', 'Technology'),
  ('linux', 'Technology'), ('databases', 'Technology'), ('cloud computing', 'Technology'),
  -- Sports & Fitness
  ('running', 'Sports'), ('cycling', 'Sports'), ('swimming', 'Sports'),
  ('yoga', 'Sports'), ('weightlifting', 'Sports'), ('climbing', 'Sports'),
  ('football', 'Sports'), ('basketball', 'Sports'), ('tennis', 'Sports'),
  ('soccer', 'Sports'), ('hiking', 'Sports'), ('skiing', 'Sports'),
  ('surfing', 'Sports'), ('martial arts', 'Sports'), ('crossfit', 'Sports'),
  ('golf', 'Sports'), ('volleyball', 'Sports'), ('boxing', 'Sports'),
  -- Arts & Creativity
  ('photography', 'Arts'), ('painting', 'Arts'), ('drawing', 'Arts'),
  ('music production', 'Arts'), ('guitar', 'Arts'), ('piano', 'Arts'),
  ('singing', 'Arts'), ('writing', 'Arts'), ('poetry', 'Arts'),
  ('filmmaking', 'Arts'), ('animation', 'Arts'), ('graphic design', 'Arts'),
  ('sculpture', 'Arts'), ('knitting', 'Arts'), ('ceramics', 'Arts'),
  -- Science
  ('astronomy', 'Science'), ('physics', 'Science'), ('biology', 'Science'),
  ('chemistry', 'Science'), ('neuroscience', 'Science'), ('mathematics', 'Science'),
  ('environmental science', 'Science'), ('genetics', 'Science'),
  -- Lifestyle & Hobbies
  ('cooking', 'Lifestyle'), ('baking', 'Lifestyle'), ('travel', 'Lifestyle'),
  ('reading', 'Lifestyle'), ('board games', 'Lifestyle'), ('chess', 'Lifestyle'),
  ('gardening', 'Lifestyle'), ('meditation', 'Lifestyle'), ('coffee', 'Lifestyle'),
  ('wine', 'Lifestyle'), ('vegetarianism', 'Lifestyle'), ('minimalism', 'Lifestyle'),
  ('sustainability', 'Lifestyle'), ('personal finance', 'Lifestyle'),
  -- Entertainment
  ('anime', 'Entertainment'), ('manga', 'Entertainment'), ('gaming', 'Entertainment'),
  ('movies', 'Entertainment'), ('tv shows', 'Entertainment'), ('podcasts', 'Entertainment'),
  ('stand-up comedy', 'Entertainment'), ('esports', 'Entertainment'),
  ('tabletop rpgs', 'Entertainment'), ('cosplay', 'Entertainment'),
  -- Learning
  ('history', 'Learning'), ('philosophy', 'Learning'), ('economics', 'Learning'),
  ('psychology', 'Learning'), ('languages', 'Learning'), ('public speaking', 'Learning'),
  ('entrepreneurship', 'Learning'), ('investing', 'Learning')
on conflict (name) do nothing;

-- Materialised view for trending interests
create materialized view if not exists trending_interests as
select i.name, count(distinct i.user_id) as user_count
from interests i
group by i.name
order by user_count desc
limit 20;

create unique index if not exists trending_interests_name_idx on trending_interests (name);
