// ============================================================================
// Meta WhatsApp Cloud API — Client Wrapper
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
// ============================================================================

import { supabaseAdmin } from '@/lib/supabase/admin';
import { normalizePhoneNumber } from '@/lib/utils';

const WA_API_VERSION = 'v21.0';
const WA_API_BASE = `https://graph.facebook.com/${WA_API_VERSION}`;

interface SendTextOptions {
  to: string;
  body: string;
  applicationId?: string;
  sentByAdminId?: string;
}

interface SendTemplateOptions {
  to: string;
  templateName: string;
  languageCode?: 'en' | 'id' | 'en_US' | 'id_ID';
  components?: TemplateComponent[];
  applicationId?: string;
  sentByAdminId?: string;
}

interface TemplateComponent {
  type: 'header' | 'body' | 'footer' | 'button';
  parameters?: Array<{
    type: 'text' | 'currency' | 'date_time' | 'image';
    text?: string;
    image?: { link: string };
  }>;
  sub_type?: 'quick_reply' | 'url';
  index?: string;
}

function getAuthHeaders() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) throw new Error('WHATSAPP_ACCESS_TOKEN not configured');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function getPhoneNumberId() {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!id) throw new Error('WHATSAPP_PHONE_NUMBER_ID not configured');
  return id;
}

/**
 * Send a free-form text message (only valid within 24h customer service window)
 * For unsolicited messages, use sendTemplate
 */
export async function sendText(opts: SendTextOptions) {
  const phoneNumberId = getPhoneNumberId();
  const to = normalizePhoneNumber(opts.to).replace('+', '');

  const url = `${WA_API_BASE}/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { body: opts.body, preview_url: true },
  };

  const dbRecord = await logOutbound({
    phone_number: `+${to}`,
    body: opts.body,
    message_type: 'text',
    application_id: opts.applicationId,
    sent_by_admin_id: opts.sentByAdminId,
  });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      await updateMessageStatus(dbRecord.id, 'failed', null, JSON.stringify(data));
      throw new Error(data.error?.message || 'WhatsApp send failed');
    }

    const waMessageId = data.messages?.[0]?.id;
    await updateMessageStatus(dbRecord.id, 'sent', waMessageId, null, data);
    return { success: true, waMessageId, dbId: dbRecord.id };
  } catch (error: any) {
    await updateMessageStatus(dbRecord.id, 'failed', null, error.message);
    throw error;
  }
}

/**
 * Send a pre-approved template message (works outside 24h window)
 * Templates must be approved in Meta Business Manager first
 */
export async function sendTemplate(opts: SendTemplateOptions) {
  const phoneNumberId = getPhoneNumberId();
  const to = normalizePhoneNumber(opts.to).replace('+', '');
  const lang = (opts.languageCode || 'en').replace('-', '_');

  const url = `${WA_API_BASE}/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: opts.templateName,
      language: { code: lang.includes('_') ? lang : `${lang}_${lang.toUpperCase()}` },
      components: opts.components || [],
    },
  };

  const dbRecord = await logOutbound({
    phone_number: `+${to}`,
    body: `[Template: ${opts.templateName}]`,
    message_type: 'template',
    template_name: opts.templateName,
    template_variables: opts.components ? { components: opts.components } : null,
    application_id: opts.applicationId,
    sent_by_admin_id: opts.sentByAdminId,
  });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      await updateMessageStatus(dbRecord.id, 'failed', null, JSON.stringify(data));
      throw new Error(data.error?.message || 'WhatsApp template send failed');
    }

    const waMessageId = data.messages?.[0]?.id;
    await updateMessageStatus(dbRecord.id, 'sent', waMessageId, null, data);
    return { success: true, waMessageId, dbId: dbRecord.id };
  } catch (error: any) {
    await updateMessageStatus(dbRecord.id, 'failed', null, error.message);
    throw error;
  }
}

/**
 * Verify webhook signature from Meta
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string | null
): Promise<boolean> {
  if (!signature) return false;
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return false;

  const expectedSig = signature.replace('sha256=', '');
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const computedSig = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return computedSig === expectedSig;
}

// ---------- Internal DB helpers ----------

async function logOutbound(data: {
  phone_number: string;
  body: string;
  message_type: 'text' | 'template' | 'image' | 'video';
  template_name?: string;
  template_variables?: Record<string, unknown> | null;
  application_id?: string;
  sent_by_admin_id?: string;
}) {
  const { data: record, error } = await supabaseAdmin
    .from('whatsapp_messages')
    .insert({
      direction: 'outbound',
      status: 'queued',
      phone_number: data.phone_number,
      body: data.body,
      message_type: data.message_type,
      template_name: data.template_name || null,
      template_variables: data.template_variables || null,
      application_id: data.application_id || null,
      sent_by_admin_id: data.sent_by_admin_id || null,
    })
    .select()
    .single();

  if (error || !record) {
    throw new Error(`Failed to log outbound: ${error?.message}`);
  }
  return record;
}

async function updateMessageStatus(
  id: string,
  status: 'sent' | 'delivered' | 'read' | 'failed',
  waMessageId?: string | null,
  errorMessage?: string | null,
  rawPayload?: unknown
) {
  const update: Record<string, unknown> = { status };
  if (waMessageId) update.wa_message_id = waMessageId;
  if (errorMessage) update.error_message = errorMessage;
  if (rawPayload) update.raw_payload = rawPayload;
  if (status === 'sent') update.sent_at = new Date().toISOString();
  if (status === 'delivered') update.delivered_at = new Date().toISOString();
  if (status === 'read') update.read_at = new Date().toISOString();

  await supabaseAdmin.from('whatsapp_messages').update(update).eq('id', id);
}
