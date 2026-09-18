import { redirect } from 'next/navigation';
import { configured, userClient } from '@/lib/supabase/server';
import { loadData } from '@/lib/server/data';
import { emailReady } from '@/lib/server/mail';
import { AppShell } from '@/components/app-shell';
import { actionFromQuery } from '@/lib/domain/notifications';
export const dynamic = 'force-dynamic';
// AppShell owns the reactive screen title, including fragment navigation.
export const metadata = { title: null };
export default async function AppPage({
  searchParams,
}: {
  searchParams: Promise<{ skra?: string; sida?: string }>;
}) {
  if (!configured()) redirect('/?uppsetning=1');
  const db = await userClient();
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) redirect('/');
  const initialData = await loadData(db, data.user.id);
  return (
    <AppShell
      initialData={initialData}
      owner={data.user.id}
      initialNow={new Date().toISOString()}
      initialAction={actionFromQuery(await searchParams)}
      emailReady={emailReady()}
      pushReady={Boolean(
        process.env.VAPID_PRIVATE_KEY &&
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
        process.env.CRON_SECRET,
      )}
    />
  );
}
