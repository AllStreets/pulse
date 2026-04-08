alter table venues
  add column if not exists phone text,
  add column if not exists hours jsonb;

update venues set hours = '{
  "mon": "closed",
  "tue": "closed",
  "wed": "20:00-02:00",
  "thu": "20:00-03:00",
  "fri": "20:00-04:00",
  "sat": "20:00-04:00",
  "sun": "18:00-00:00"
}'::jsonb where hours is null;
