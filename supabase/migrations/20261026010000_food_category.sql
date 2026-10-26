-- Prompt v4 replaces meal_plan with the broader food category (recipes, snacks,
-- restaurants as well as meal plans). Safe to run twice.
update public.cards
set
  category = 'food',
  data = jsonb_set(data, '{category}', '"food"')
where category = 'meal_plan';

update public.cards
set data = jsonb_set(
  data,
  '{secondary_categories}',
  (
    select coalesce(jsonb_agg(distinct case when c = 'meal_plan' then 'food' else c end), '[]'::jsonb)
    from jsonb_array_elements_text(data -> 'secondary_categories') as c
  )
)
where data -> 'secondary_categories' ? 'meal_plan';
