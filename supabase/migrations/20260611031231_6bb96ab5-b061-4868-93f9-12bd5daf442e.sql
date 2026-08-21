-- Add fields used by notification UI (type/body/link) and ensure realtime works
ALTER TABLE public.student_notifications
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'message',
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS link TEXT;

-- Backfill body from message for legacy rows
UPDATE public.student_notifications SET body = message WHERE body IS NULL;

-- Ensure realtime broadcasts full rows + publication includes the table
ALTER TABLE public.student_notifications REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='student_notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.student_notifications';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='meetings'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings';
  END IF;
END $$;