-- Extend template categories to support more types
-- Drop the existing CHECK constraint and add a new one with expanded categories

ALTER TABLE templates DROP CONSTRAINT IF EXISTS templates_category_check;

ALTER TABLE templates ADD CONSTRAINT templates_category_check
  CHECK (category IN ('resume', 'poster', 'general', 'ecommerce', 'education', 'corporate', 'portfolio', 'event'));
