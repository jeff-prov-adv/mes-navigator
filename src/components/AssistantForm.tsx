'use client';

import { useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { modules } from '@/lib/data';

export default function AssistantForm() {
  const [moduleSlug, setModuleSlug] = useState(modules[0].slug);
  const [goal, setGoal] = useState('');
  const [description, setDescription] = useState('');
  const [existingDraft, setExistingDraft] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [needsCode, setNeedsCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultHtml, setResultHtml] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResultHtml('');
    try {
      const resp = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ moduleSlug, goal, description, existingDraft, accessCode }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        if (data.needsCode) setNeedsCode(true);
        throw new Error(data.error || 'Request failed');
      }
      const raw = await marked.parse(data.result || '');
      setResultHtml(DOMPurify.sanitize(raw));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={submit} className="space-y-4 rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-semibold">Module</span>
            <select
              value={moduleSlug}
              onChange={(e) => setModuleSlug(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5"
            >
              {modules.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Medicaid program goal</span>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
              placeholder="e.g. Reduce provider enrollment fraud"
              className="mt-1 w-full rounded-lg border border-line px-3 py-2.5"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="font-semibold">What are you building or enhancing?</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="Plain language. What the system/enhancement does, who uses it, what should improve for the program or its members."
            className="mt-1 w-full rounded-lg border border-line px-3 py-2.5"
          />
        </label>
        <label className="block text-sm">
          <span className="font-semibold">Existing draft outcome statement (optional — I&apos;ll critique it)</span>
          <textarea
            value={existingDraft}
            onChange={(e) => setExistingDraft(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2.5"
          />
        </label>
        {needsCode && (
          <label className="block text-sm">
            <span className="font-semibold">Access code</span>
            <input
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              type="password"
              autoComplete="off"
              className="mt-1 w-full max-w-xs rounded-lg border border-line px-3 py-2.5"
            />
          </label>
        )}
        <button
          disabled={loading}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
        >
          {loading ? 'Drafting…' : 'Draft outcomes'}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}
      {resultHtml && (
        <div className="mt-6 rounded-lg border border-line bg-white p-6 shadow-sm">
          <div className="prose-md" dangerouslySetInnerHTML={{ __html: resultHtml }} />
          <p className="mt-4 border-t border-line pt-3 text-xs text-ink-2">
            AI-drafted starting point. Validate against your APD scope and the official repository, and finalize
            with your CMS State Officer.
          </p>
        </div>
      )}
    </div>
  );
}
