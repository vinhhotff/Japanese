-- Check current vocabulary table schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'vocabulary'
ORDER BY ordinal_position;
