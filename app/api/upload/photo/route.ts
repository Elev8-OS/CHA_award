// ============================================================================
// POST /api/upload/photo
// Body: multipart/form-data with `file` and `continue_token`
// Returns: { url: string }
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

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
      return NextResponse.json(
        { error: 'File too large (max 5MB)' },
        { status: 413 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Use JPG, PNG, WebP, or HEIC.' },
        { status: 415 }
      );
    }

    // Verify token belongs to a valid draft application
    const { data: app, error: lookupError } = await supabaseAdmin
      .from('applications')
      .select('id, status, hero_photo_path')
      .eq('continue_token', token)
      .single();

    if (lookupError || !app) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (app.status !== 'draft') {
      return NextResponse.json({ error: 'Application already submitted' }, { status: 409 });
    }

    // Generate path: photos/{app-id}/{timestamp}.{ext}
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(ext) ? ext : 'jpg';
    const filePath = `${app.id}/hero-${Date.now()}.${safeExt}`;

    // Convert File to buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('applicant-photos')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      console.error('Photo upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Delete old photo if there was one
    if (app.hero_photo_path) {
      await supabaseAdmin.storage.from('applicant-photos').remove([app.hero_photo_path]);
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('applicant-photos')
      .getPublicUrl(filePath);

    // Update application
    await supabaseAdmin
      .from('applications')
      .update({
        hero_photo_url: urlData.publicUrl,
        hero_photo_path: filePath,
      })
      .eq('id', app.id);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: filePath,
    });
  } catch (error: any) {
    console.error('Photo upload exception:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ---------- DELETE photo ----------
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const { data: app } = await supabaseAdmin
      .from('applications')
      .select('id, status, hero_photo_path')
      .eq('continue_token', token)
      .single();

    if (!app || app.status !== 'draft') {
      return NextResponse.json({ error: 'Invalid' }, { status: 401 });
    }

    if (app.hero_photo_path) {
      await supabaseAdmin.storage.from('applicant-photos').remove([app.hero_photo_path]);
      await supabaseAdmin
        .from('applications')
        .update({ hero_photo_url: null, hero_photo_path: null })
        .eq('id', app.id);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
