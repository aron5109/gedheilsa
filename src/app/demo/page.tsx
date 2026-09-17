import { AppShell } from '@/components/app-shell';
import { demoData } from '@/lib/demo';
import { EMPTY_DATA } from '@/lib/domain/types';
export const dynamic = 'force-dynamic';
export default async function Demo({ searchParams }: { searchParams: Promise<{ nyr?: string }> }) {
  const initialData = (await searchParams).nyr === '1' ? EMPTY_DATA : demoData();
  return <AppShell initialData={initialData} owner="demo" demo />;
}
