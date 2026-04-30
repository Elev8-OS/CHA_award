// ============================================================================
// GET  /api/webhooks/whatsapp — Meta verification handshake
// POST /api/webhooks/whatsapp — incoming messages + delivery status updates
//
// Meta sends:
//   - messages: inbound user messages
//   - statuses: delivery/read receipts for outbound messages
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyWebhookSignature } from '@/lib/whatsapp/client';

// ---------- GET: Webhook verification ----------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === expectedToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

// ---------- POST: Incoming events ----------
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    // Verify Meta signature
    const isValid = await verifyWebhookSignature(rawBody, signature);
    if (!isValid && process.env.NODE_ENV === 'production') {
      console.warn('Invalid WA signature');
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = JSON.parse(rawBody);

    // Process each entry
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;
        if (!value) continue;

        // Handle inbound messages
        if (value.messages) {
          for (const msg of value.messages) {
            await handleInboundMessage(msg, value.metadata, value.contacts);
          }
        }

        // Handle status updates
        if (value.statuses) {
          for (const status of value.statuses) {
            await handleStatusUpdate(status);
          }
        }
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('WA webhook error:', error);
    // Return 200 anyway — Meta will retry on non-2xx and we don't want loops
    return new NextResponse('OK', { status: 200 });
  }
}

// ---------- Handlers ----------

async function handleInboundMessage(
  message: any,
  metadata: any,
  contacts: any[]
) {
  const phone = `+${message.from}`;
  const messageId = message.id;
  const timestamp = new Date(parseInt(message.timestamp) * 1000).toISOString();

  let body = '';
  let messageType = 'text';

  if (message.type === 'text') {
    body = message.text?.body || '';
  } else if (message.type === 'image') {
    body = message.image?.caption || '[image]';
    messageType = 'image';
  } else if (message.type === 'video') {
    body = message.video?.caption || '[video]';
    messageType = 'video';
  } else if (message.type === 'button') {
    body = message.button?.text || '[button]';
  } else if (message.type === 'interactive') {
    body =
      message.interactive?.button_reply?.title ||
      message.interactive?.list_reply?.title ||
      '[interactive]';
  } else {
    body = `[${message.type}]`;
  }

  // Try to link to existing application by WhatsApp number
  const { data: app } = await supabaseAdmin
    .from('applications')
    .select('id')
    .eq('whatsapp', phone)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabaseAdmin.from('whatsapp_messages').insert({
    wa_message_id: messageId,
    phone_number: phone,
    direction: 'inbound',
    status: 'delivered',
    message_type: messageType,
    body,
    application_id: app?.id || null,
    raw_payload: { message, metadata, contacts },
    sent_at: timestamp,
    delivered_at: timestamp,
  });
}

async function handleStatusUpdate(status: any) {
  const messageId = status.id;
  const newStatus = status.status; // sent | delivered | read | failed
  const timestamp = new Date(parseInt(status.timestamp) * 1000).toISOString();

  const update: Record<string, unknown> = { status: newStatus };
  if (newStatus === 'delivered') update.delivered_at = timestamp;
  if (newStatus === 'read') update.read_at = timestamp;
  if (newStatus === 'failed') {
    update.error_message = JSON.stringify(status.errors || []);
  }

  await supabaseAdmin
    .from('whatsapp_messages')
    .update(update)
    .eq('wa_message_id', messageId);
}
