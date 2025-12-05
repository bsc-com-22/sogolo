CREATE OR REPLACE FUNCTION broadcast_transaction_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'transactions:' || COALESCE(NEW.id::text, OLD.id::text, TG_ARGV[0]::text) || ':events',
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;
