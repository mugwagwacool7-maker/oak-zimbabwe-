'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import OakLogo from '@/components/OakLogo'

type FormState = { first_name: string; last_name: string; organization: string; sub_partner: string; role: string; email: string; phone: string; dietary: string; accessibility: string; travel_needs: string; consent: boolean }
const initialState: FormState = { first_name: '', last_name: '', organization: '', sub_partner: '', role: '', email: '', phone: '', dietary: '', accessibility: '', travel_needs: '', consent: false }
const roles = ['Partner', 'Staff', 'Speaker', 'Coordination Team', 'Guest']

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>(initialState)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: undefined })) }
  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.first_name.trim()) next.first_name = 'Required.'
    if (!form.last_name.trim()) next.last_name = 'Required.'
    if (!form.organization.trim()) next.organization = 'Required.'
    if (!form.role) next.role = 'Please select a role.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address.'
    if (form.phone && !/^[+\d][\d\s-]{6,}$/.test(form.phone)) next.phone = 'Enter a valid phone number.'
    if (!form.consent) next.consent = 'You must agree to continue.'
    setErrors(next); return Object.keys(next).length === 0
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); if (!validate()) return; setSubmitting(true)
    try {
      const response = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, first_name: form.first_name.trim(), last_name: form.last_name.trim(), organization: form.organization.trim(), email: form.email.trim() }) })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.qr_token) { setError(data?.message || 'Something went wrong. Please try again.'); return }
      router.push(`/pass/${data.qr_token}`)
    } catch { setError('We could not connect to the registration service. Please try again.') } finally { setSubmitting(false) }
  }
  return <div className="app-shell">
    <aside className="sidebar">
      <div><OakLogo size="lg" /><p className="event-label">PARTNER CONVENING 2026</p><nav className="side-nav"><Link className="nav-active" href="/"><UserPlusIcon />Register</Link><span className="nav-locked"><CalendarIcon />Programme</span><span className="nav-locked"><UsersIcon />Partners</span></nav></div>
      <div className="location"><GlobeIcon /><div><strong>Harare, Zimbabwe</strong><span>9–11 March 2026</span></div></div>
    </aside>
    <header className="mobile-header"><OakLogo size="sm" /><button aria-label="Open navigation" className="menu-button">☰</button></header>
    <main className="main-panel"><div className="form-card">
      <div className="hero"><div><span className="eyebrow">OAK FOUNDATION</span><h1>Partner<br />Convening 2026</h1><p>Harare, Zimbabwe · 9–11 March 2026</p></div><div className="hero-mark">OAK<br /><small>FOUNDATION</small></div></div>
      <div className="stats"><Stat icon={<UsersIcon />} value="110+" label="Attendees" /><Stat icon={<CalendarIcon />} value="24" label="Sessions" /><Stat icon={<LayersIcon />} value="38" label="Partners" /></div>
      <form onSubmit={submit} className="registration-form"><div className="section-heading"><span className="step">01</span><div><p className="eyebrow">WELCOME</p><h2>Registration form</h2><p>Reserve your place at the OAK Foundation Partner Convening.</p></div></div>
        <div className="field-grid"><Field label="First name" required error={errors.first_name}><input value={form.first_name} onChange={(e) => update('first_name', e.target.value)} placeholder="Maria" /></Field><Field label="Last name" required error={errors.last_name}><input value={form.last_name} onChange={(e) => update('last_name', e.target.value)} placeholder="Schmidt" /></Field></div>
        <Field label="Organisation" required error={errors.organization}><input value={form.organization} onChange={(e) => update('organization', e.target.value)} placeholder="Your organisation name" /></Field>
        <Field label="Sub-partner / programme area"><input value={form.sub_partner} onChange={(e) => update('sub_partner', e.target.value)} placeholder="Optional" /></Field>
        <Field label="Role / capacity" required error={errors.role}><select value={form.role} onChange={(e) => update('role', e.target.value)}><option value="" disabled>Select your role</option>{roles.map((role) => <option key={role}>{role}</option>)}</select></Field>
        <div className="field-grid"><Field label="Email address" required error={errors.email}><input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@organisation.org" /></Field><Field label="Phone number" error={errors.phone}><input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+263 xx xxx xx xx" /></Field></div>
        <fieldset className="requirements"><legend>REQUIREMENTS</legend><Field label="Dietary requirements"><input value={form.dietary} onChange={(e) => update('dietary', e.target.value)} placeholder="e.g. Vegetarian, Halal, Gluten-free" /></Field><Field label="Accessibility requirements"><input value={form.accessibility} onChange={(e) => update('accessibility', e.target.value)} placeholder="e.g. Wheelchair access, hearing loop" /></Field><Field label="Travel & accommodation"><input value={form.travel_needs} onChange={(e) => update('travel_needs', e.target.value)} placeholder="e.g. Flight from London, hotel needed" /></Field></fieldset>
        <label className="consent"><input type="checkbox" checked={form.consent} onChange={(e) => update('consent', e.target.checked)} /><span>I agree to OAK Foundation&apos;s <Link href="/privacy-policy">privacy policy</Link> and consent to my registration data being used for event coordination.</span></label>{errors.consent && <p className="field-error">{errors.consent}</p>}{error && <p className="form-error" role="alert">{error}</p>}
        <button className="submit-button" disabled={submitting}>{submitting ? 'Registering…' : 'Register & generate QR code'}<span>→</span></button><p className="secure-note">Your data is secured and handled by OAK Foundation in accordance with GDPR.</p>
      </form>
    </div></main>
  </div>
}
function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) { return <div className="field"><label>{label}{required && <b>*</b>}</label>{children}{error && <p className="field-error">{error}</p>}</div> }
function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { return <div className="stat"><span>{icon}</span><strong>{value}</strong><small>{label}</small></div> }
function UserPlusIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6M18 8h5M20.5 5.5v5" /></svg> }
function UsersIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="7" r="3.5" /><path d="M2.5 20v-1a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v1M16.5 3.5a3.5 3.5 0 0 1 0 7M20 20v-1a5 5 0 0 0-3.2-4.66" /></svg> }
function CalendarIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg> }
function LayersIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 10 6-10 6L2 8l10-6ZM2 13l10 6 10-6M2 18l10 6 10-6" /></svg> }
function GlobeIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18" /></svg> }
