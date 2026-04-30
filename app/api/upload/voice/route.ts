// ============================================================================
// POST /api/upload/voice
// Body: multipart/form-data with `file` (audio) and `continue_token`
// Returns: { url: string }
//
// Used for the 30-second personal voice plea on public applicant pages
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const MAX_SIZE = 3 * 1024 * 1024; // 3MB (~30s)
const ALLOWED_TYPES = [
  'audio/webm',
  'audio/ogg',
  'audio/mp3',
  'audio/mpeg',
  'audio/mp4',
  'audio/m4a',
  'audio/aac',
  'audio/wav',
];

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const token = formData.get('continue_token') as string | null;

    if (!file || !token) {
      return NextResponse.json({ error: 'Missing file or token' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Audio too large (max 3MB)' }, { status: 413 });
    }

    // Some browsers send 'audio/webm;codecs=opus' — normalize
    const baseType = file.type.split(';')[0].trim();
    if (!ALLOWED_TYPES.includes(baseType)) {
      return NextResponse.json(
        { error: `Audio type not allowed: ${baseType}` },
        { status: 415 }
      );
    }

    const { data: app } = await supabaseAdmin
      .from('applications')
      .select('id, status, share_voice_path')
      .eq('continue_token', token)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (app.status !== 'draft') {
      return NextResponse.json({ error: 'Application already submitted' }, { status: 409 });
    }

    // Determine extension
    const extMap: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/ogg': 'ogg',
      'audio/mp3': 'mp3',
      'audio/mpeg': 'mp3',
      'audio/mp4': 'm4a',
      'audio/m4a': 'm4a',
      'audio/aac': 'aac',
      'audio/wav': 'wav',
    };
    const ext = extMap[baseType] || 'webm';
    const filePath = `${app.id}/voice-${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('applicant-voice')
      .upload(filePath, buffer, {
        contentType: baseType,
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      console.error('Voice upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Clean up old voice
    if (app.share_voice_path) {
      await supabaseAdmin.storage.from('applicant-voice').remove([app.share_voice_path]);
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('applicant-voice')
      .getPublicUrl(filePath);

    await supabaseAdmin
      .from('applications')
      .update({
        share_voice_message_url: urlData.publicUrl,
        share_voice_path: filePath,
      })
      .eq('id', app.id);

    return NextResponse.json({ url: urlData.publicUrl, path: filePath });
  } catch (error: any) {
    console.error('Voice upload exception:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

    const { data: app } = await supabaseAdmin
      .from('applications')
      .select('id, status, share_voice_path')
      .eq('continue_token', token)
      .single();

    if (!app || app.status !== 'draft') {
      return NextResponse.json({ error: 'Invalid' }, { status: 401 });
    }

    if (app.share_voice_path) {
      await supabaseAdmin.storage.from('applicant-voice').remove([app.share_voice_path]);
      await supabaseAdmin
        .from('applications')
        .update({ share_voice_message_url: null, share_voice_path: null })
        .eq('id', app.id);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
