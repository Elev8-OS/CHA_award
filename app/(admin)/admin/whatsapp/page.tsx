import { supabaseAdmin } from '@/lib/supabase/admin';
import { WhatsAppInbox } from '@/components/admin/WhatsAppInbox';

export const dynamic = 'force-dynamic';

export default async function AdminWhatsappPage() {
  // Fetch latest 100 messages, grouped by phone in client
  const { data: messages } = await supabaseAdmin
    .from('whatsapp_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="px-6 py-8 md:px-10">
      <h1 className="mb-2 font-serif text-3xl text-navy">WhatsApp</h1>
      <p className="mb-8 text-sm text-warm-gray">
        Live inbox & outbound for the CHA Hospitality Awards. All messages logged via Meta Cloud API.
      </p>
      <WhatsAppInbox initialMessages={messages || []} />
    </div>
  );
}
