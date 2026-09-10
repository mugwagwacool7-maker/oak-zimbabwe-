import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const fields = [
  'first_name',
  'last_name',
  'organization',
  'sub_partner',
  'role',
  'email',
  'phone',
  'dietary',
  'accessibility',
  'travel_needs',
] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const attendee = Object.fromEntries(
      fields.map((field) => [field, typeof body[field] === 'string' ? body[field].trim() || null : null]),
    );

    if (!attendee.first_name || !attendee.last_name || !attendee.organization || !attendee.role || !attendee.email) {
      return NextResponse.json({ message: 'Required registration fields are missing.' }, { status: 400 });
    }

    // Reject duplicate registrations for the same email
    const { data: existing, error: findError } = await getSupabaseAdmin()
      .from('attendees')
      .select('qr_token')
      .eq('email', attendee.email)
      .maybeSingle();

    if (findError) {
      console.error('Duplicate check failed:', findError);
      return NextResponse.json({ message: findError.message }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json(
        { message: `You are already registered. Your pass is at /pass/${existing.qr_token}` },
        { status: 409 },
      );
    }

    const { data, error } = await getSupabaseAdmin()
      .from('attendees')
      .insert(attendee)
      .select('qr_token')
      .single();

    if (error || !data) {
      console.error('Registration insert failed:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      // Race condition: duplicate insert hit the unique index
      if (error?.code === '23505') {
        return NextResponse.json(
          { message: 'You are already registered.' },
          { status: 409 },
        );
      }
      return NextResponse.json({ message: error?.message || 'Registration could not be saved.' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Registration request failed:', error);
    return NextResponse.json({ message: 'Invalid registration request.' }, { status: 400 });
  }
}