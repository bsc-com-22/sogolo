-- List all triggers on the transactions table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'transactions';

-- Find functions that might be referencing NEW.transaction_id
SELECT 
    routine_name, 
    routine_definition
FROM information_schema.routines
WHERE routine_definition LIKE '%NEW.transaction_id%';
