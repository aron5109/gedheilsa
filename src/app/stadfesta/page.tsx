import { ContactConfirmation } from '@/components/contact-confirmation';
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; action?: string }>;
}) {
  const params = await searchParams;
  return (
    <ContactConfirmation
      token={params.token ?? ''}
      action={params.action === 'revoke' ? 'revoke' : 'verify'}
    />
  );
}
