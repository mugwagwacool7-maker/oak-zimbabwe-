'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type FormState = {
  first_name: string;
  last_name: string;
  organization: string;
  sub_partner: string;
  role: string;
  email: string;
  phone: string;
  dietary: string;
  accessibility: string;
  travel_needs: string;
  consent: boolean;
};

const initialState: FormState = {
  first_name: '', last_name: '', organization: '', sub_partner: '', role: '',
  email: '', phone: '', dietary: '', accessibility: '', travel_needs: '', consent: false,
};

const ROLE_OPTIONS = ['Partner', 'Staff', 'Speaker', 'Coordination Team', 'Guest'];

export default function RegisterFormPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const router = useRouter();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.first_name.trim()) next.first_name = 'Required.';
    if (!form.last_name.trim()) next.last_name = 'Required.';
    if (!form.organization.trim()) next.organization = 'Required.';
    if (!form.role) next.role = 'Please select a role.';
    if (!form.email.trim()) {
      next.email = 'Required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Enter a valid email address.';
    }
    if (form.phone && !/^[+\d][\d\s-]{6,}$/.test(form.phone)) {
      next.phone = 'Enter a valid phone number.';
    }
    if (!form.consent) next.consent = 'You must agree to continue.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        organization: form.organization.trim(),
        sub_partner: form.sub_partner.trim(),
        role: form.role,
        email: form.email.trim(),
        phone: form.phone.trim(),
        dietary: form.dietary.trim(),
        accessibility: form.accessibility.trim(),
        travel_needs: form.travel_needs.trim(),
      }),
    });

    let data: Record<string, unknown> | null = null;
    const text = await response.text();
    if (text) {
      try { data = JSON.parse(text); } catch { /* non-JSON response */ }
    }

    setSubmitting(false);

    if (!response.ok || !data?.qr_token) {
      console.error('Registration submission failed:', {
        status: response.status,
        message: data?.message,
      });
      setServerError((data?.message as string) || 'Something went wrong submitting your registration. Please try again.');
      return;
    }

    router.push(`/pass/${data.qr_token}`);
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:grid lg:grid-cols-[420px_1fr]">
        <aside className="lg:min-h-screen border-r border-gray-100 bg-[#F0F0F6] flex flex-col px-12 py-16">
          <div className="text-left">
            <Image
              src="/oak-logo.webp"
              alt="OAK Foundation"
              width={210}
              height={120}
              priority
            />
            <h1
              className="text-base mt-3 font-medium tracking-[0.25em] text-[#1B3A6B]"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              PARTNER CONVENING 2026
            </h1>
            <div className="mt-14">
              <Link
                href="/register"
                className="flex items-center gap-3 w-full bg-navy text-white rounded-full py-3.5 pl-7 pr-14 text-base font-medium hover:bg-navy/90 transition"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="8" r="3.5" />
                  <path d="M2.5 19c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" strokeLinecap="round" />
                  <path d="M18.5 8h4M20.5 6v4" strokeLinecap="round" />
                </svg>
                Register
              </Link>
            </div>
          </div>

          <div className="mt-auto pt-10">
            <div className="flex items-start gap-2.5">
              <GlobeIcon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
              <div>
                <p className="text-sm font-medium text-neutral-900">Harare, Zimbabwe</p>
                <p className="mt-0.5 text-xs text-blue-600">9-11 March 2026</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="bg-gray-100 flex flex-col items-center py-12 px-6">
      <div className="w-full max-w-lg rounded-3xl overflow-hidden bg-white">

        <div className="bg-navy text-white px-6 pt-8 pb-8 rounded-t-3xl">
          <h1 className="text-3xl font-bold leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Partner<br />Convening 2026
          </h1>
          <p className="text-sm text-white/70 mt-2">Harare, Zimbabwe · 9–11 November 2026</p>
        </div>

        <div className="grid grid-cols-3 py-6 px-4">
          <Stat icon={<UsersIcon />} value="110+" label="Attendees" />
          <Stat icon={<CalendarIcon />} value="24" label="Sessions" />
          <Stat icon={<LayersIcon />} value="38" label="Partners" />
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
            Registration Form
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" required error={errors.first_name}>
              <input value={form.first_name} onChange={e => update('first_name', e.target.value)}
                placeholder="Maria" className={inputClass} />
            </Field>
            <Field label="Last Name" required error={errors.last_name}>
              <input value={form.last_name} onChange={e => update('last_name', e.target.value)}
                placeholder="Schmidt" className={inputClass} />
            </Field>
          </div>

          <Field label="Organisation" required error={errors.organization}>
            <input value={form.organization} onChange={e => update('organization', e.target.value)}
              placeholder="Your organisation name" className={inputClass} />
          </Field>

          <Field label="Sub-Partner / Programme Area">
            <input value={form.sub_partner} onChange={e => update('sub_partner', e.target.value)}
              placeholder="Optional" className={inputClass} />
          </Field>

          <Field label="Role / Capacity" required error={errors.role}>
            <select value={form.role} onChange={e => update('role', e.target.value)} className={inputClass}>
              <option value="" disabled>Select your role</option>
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>

          <Field label="Email Address" required error={errors.email}>
            <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
              placeholder="you@organisation.org" className={inputClass} />
          </Field>

          <Field label="Phone Number" error={errors.phone}>
            <input value={form.phone} onChange={e => update('phone', e.target.value)}
              placeholder="+263 xx xxx xx xx" className={inputClass} />
          </Field>

          <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Requirements</p>

            <Field label="Dietary Requirements">
              <input value={form.dietary} onChange={e => update('dietary', e.target.value)}
                placeholder="e.g. Vegetarian, Halal, Gluten-free" className={inputClass} />
            </Field>

            <Field label="Accessibility Requirements">
              <input value={form.accessibility} onChange={e => update('accessibility', e.target.value)}
                placeholder="e.g. Wheelchair access, hearing loop" className={inputClass} />
            </Field>

            <Field label="Travel & Accommodation">
              <input value={form.travel_needs} onChange={e => update('travel_needs', e.target.value)}
                placeholder="e.g. Flight from London, hotel needed" className={inputClass} />
            </Field>
          </div>

          <div>
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.consent}
                onChange={e => update('consent', e.target.checked)}
                className="mt-1 w-4 h-4 accent-navy" />
              <span>
                I agree to OAK Foundation&apos;s{' '}
                <Link href="/privacy-policy" className="underline text-navy" target="_blank">
                  privacy policy
                </Link>{' '}
                and consent to my registration data being used for event coordination.
              </span>
            </label>
            {errors.consent && <p className="text-red-600 text-xs mt-1">{errors.consent}</p>}
          </div>

          {serverError && <p className="text-red-600 text-sm">{serverError}</p>}

          <button type="submit" disabled={submitting}
            className="w-full bg-navy text-white rounded-lg py-3.5 text-base font-semibold disabled:opacity-50">
            {submitting ? 'Registering...' : 'Register & Generate QR Code'}
          </button>

          <p className="text-xs text-navy text-center">
            Your data is secured and handled by OAK Foundation in accordance with GDPR.
          </p>
        </form>
        </div>
        </main>
      </div>
    </div>
  );
}

const inputClass = "w-full border border-gray-200 rounded-lg p-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy";

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="flex justify-center text-navy/70 mb-1">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-navy/70">{label}</p>
    </div>
  );
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wide text-navy mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="7" r="3.5" /><path d="M2.5 20v-1a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v1" />
      <path d="M16.5 3.5a3.5 3.5 0 0 1 0 7" /><path d="M20 20v-1a5 5 0 0 0-3.2-4.66" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" /><line x1="16" y1="3" x2="16" y2="7" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polygon points="12,2 22,8 12,14 2,8" /><polyline points="2,13 12,19 22,13" />
      <polyline points="2,18 12,24 22,18" />
    </svg>
  );
}

function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18" />
    </svg>
  );
}

