import { AppShell } from '@/components/app-shell';
import { demoData } from '@/lib/demo';
import { EMPTY_DATA } from '@/lib/domain/types';
import { actionFromQuery } from '@/lib/domain/notifications';
export const dynamic = 'force-dynamic';
export default async function Demo({
  searchParams,
}: {
  searchParams: Promise<{ nyr?: string; skra?: string; sida?: string }>;
}) {
  const query = await searchParams;
  const initialData = query.nyr === '1' ? EMPTY_DATA : demoData();
  return (
    <AppShell
      initialData={initialData}
      owner="demo"
      initialNow={new Date().toISOString()}
      initialAction={actionFromQuery(query)}
      demo
    />
  );
}
