"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { validateSlug, type ClusterPublicMeta } from "@/lib/admin-cluster";

interface AnchorCandidate {
  id: string;
  excerpt: string;
  created_at: string;
}

interface InitialState {
  is_public_listed: boolean;
  public_slug: string;
  meta: ClusterPublicMeta;
}

interface Props {
  clusterId: string;
  slug: string;
  initial: InitialState;
  anchorCandidates: AnchorCandidate[];
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function ClusterIdentityForm({
  clusterId,
  slug,
  initial,
  anchorCandidates,
}: Props) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(initial.is_public_listed);
  const [publicSlug, setPublicSlug] = useState(initial.public_slug);
  const [meta, setMeta] = useState<ClusterPublicMeta>(initial.meta);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const slugValidation = useMemo(() => {
    if (!isPublic) return { ok: true as const };
    return validateSlug(publicSlug);
  }, [isPublic, publicSlug]);

  function update<K extends keyof ClusterPublicMeta>(key: K, value: ClusterPublicMeta[K]) {
    setMeta((prev) => ({ ...prev, [key]: value }));
  }

  function updateChip(idx: number, key: "icon" | "label", value: string) {
    setMeta((prev) => {
      const chips = [...prev.demographic_chips];
      chips[idx] = { ...chips[idx], [key]: value };
      return { ...prev, demographic_chips: chips };
    });
  }
  function addChip() {
    setMeta((prev) => ({
      ...prev,
      demographic_chips: [...prev.demographic_chips, { icon: "", label: "" }],
    }));
  }
  function removeChip(idx: number) {
    setMeta((prev) => ({
      ...prev,
      demographic_chips: prev.demographic_chips.filter((_, i) => i !== idx),
    }));
  }

  function updateCapability(idx: number, value: string) {
    setMeta((prev) => {
      const caps = [...prev.capabilities_copy];
      caps[idx] = value;
      return { ...prev, capabilities_copy: caps };
    });
  }
  function addCapability() {
    setMeta((prev) => ({ ...prev, capabilities_copy: [...prev.capabilities_copy, ""] }));
  }
  function removeCapability(idx: number) {
    setMeta((prev) => ({
      ...prev,
      capabilities_copy: prev.capabilities_copy.filter((_, i) => i !== idx),
    }));
  }

  async function handleSave() {
    if (!slugValidation.ok && isPublic) {
      setSaveState("error");
      setErrorMsg(slugValidation.reason ?? "Invalid slug");
      return;
    }
    setSaveState("saving");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/clusters/${slug}/identity`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_public_listed: isPublic,
          public_slug: publicSlug || null,
          public_meta: {
            ...meta,
            // Strip empty rows so we don't store noise
            demographic_chips: meta.demographic_chips.filter(
              (c) => (c.icon || "").trim() && (c.label || "").trim()
            ),
            capabilities_copy: meta.capabilities_copy
              .map((c) => c.trim())
              .filter((c) => c.length > 0),
          },
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveState("error");
        setErrorMsg(body.error ?? `Save failed (${res.status})`);
        return;
      }
      setSaveState("saved");
      // Reload server data so the badge / public-link reflect the new state
      router.refresh();
      // After 2s, drop back to idle
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      setSaveState("error");
      setErrorMsg(err instanceof Error ? err.message : "Network error");
    }
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Public identity</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            What strangers see at <code className="px-1 rounded bg-gray-100">/c/{publicSlug || "<slug>"}</code>. Member content stays sealed.
          </p>
        </div>
        <SaveButton state={saveState} onClick={handleSave} />
      </div>

      {/* ── Public listing toggle ─────────────────────────────────── */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
        <div>
          <p className="text-sm font-medium text-gray-900">Publicly listed</p>
          <p className="text-xs text-gray-500">
            When on, the cluster appears in the sitemap and is indexable. When off, the page returns 404.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          onClick={() => setIsPublic((v) => !v)}
          className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
            isPublic ? "bg-emerald-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
              isPublic ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* ── Slug ──────────────────────────────────────────────────── */}
      <Field
        label="Public slug"
        hint="Lowercase, kebab-case. Required when publicly listed. Must be unique."
        error={isPublic && !slugValidation.ok ? slugValidation.reason : undefined}
      >
        <input
          type="text"
          value={publicSlug}
          onChange={(e) => setPublicSlug(e.target.value.trim().toLowerCase())}
          placeholder="sisters-in-dua"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-aggilo-deep focus:border-transparent"
        />
      </Field>

      {/* ── Display name ──────────────────────────────────────────── */}
      <Field label="Display name">
        <input
          type="text"
          value={meta.display_name}
          onChange={(e) => update("display_name", e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-aggilo-deep focus:border-transparent"
        />
      </Field>

      {/* ── Tagline ───────────────────────────────────────────────── */}
      <Field label="Tagline" hint="One short line, ≤80 chars typical.">
        <input
          type="text"
          value={meta.tagline}
          onChange={(e) => update("tagline", e.target.value)}
          maxLength={140}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-aggilo-deep focus:border-transparent"
        />
      </Field>

      {/* ── Description ───────────────────────────────────────────── */}
      <Field label="Description" hint="Plain text. Renders preserving line breaks.">
        <textarea
          value={meta.description}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => update("description", e.target.value)}
          rows={5}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-aggilo-deep focus:border-transparent"
        />
      </Field>

      {/* ── Demographic chips ─────────────────────────────────────── */}
      <Field
        label="Demographic chips"
        hint="Up to 5. Icon + label. Sets expectations about who the room is for."
      >
        <div className="space-y-2">
          {meta.demographic_chips.map((chip, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={chip.icon}
                onChange={(e) => updateChip(idx, "icon", e.target.value)}
                placeholder="�"
                className="w-16 px-2 py-1.5 rounded border border-gray-300 text-sm text-center"
              />
              <input
                type="text"
                value={chip.label}
                onChange={(e) => updateChip(idx, "label", e.target.value)}
                placeholder="Global"
                className="flex-1 px-2 py-1.5 rounded border border-gray-300 text-sm"
              />
              <button
                type="button"
                onClick={() => removeChip(idx)}
                className="text-xs text-gray-500 hover:text-rose-600 px-2"
              >
                Remove
              </button>
            </div>
          ))}
          {meta.demographic_chips.length < 5 && (
            <button
              type="button"
              onClick={addChip}
              className="text-xs text-aggilo-deep hover:underline"
            >
              + Add chip
            </button>
          )}
        </div>
      </Field>

      {/* ── Accent gradient ───────────────────────────────────────── */}
      <Field label="Accent gradient" hint="Hero background and OG image.">
        <div className="flex items-center gap-3">
          <ColorInput
            label="From"
            value={meta.accent_from}
            onChange={(v) => update("accent_from", v)}
          />
          <ColorInput
            label="To"
            value={meta.accent_to}
            onChange={(v) => update("accent_to", v)}
          />
          <div
            className="h-10 flex-1 rounded border border-gray-200"
            style={{
              backgroundImage: `linear-gradient(135deg, ${meta.accent_from}, ${meta.accent_to})`,
            }}
          />
        </div>
      </Field>

      {/* ── Capabilities ──────────────────────────────────────────── */}
      <Field
        label="Capabilities copy"
        hint="What runs here. One bullet per line. Members and the public read these as the agent's commitments."
      >
        <div className="space-y-2">
          {meta.capabilities_copy.map((cap, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-emerald-500 mt-2">·</span>
              <textarea
                value={cap}
                onChange={(e) => updateCapability(idx, e.target.value)}
                rows={2}
                className="flex-1 px-2 py-1.5 rounded border border-gray-300 text-sm"
              />
              <button
                type="button"
                onClick={() => removeCapability(idx)}
                className="text-xs text-gray-500 hover:text-rose-600 px-2 mt-2"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addCapability}
            className="text-xs text-aggilo-deep hover:underline"
          >
            + Add capability line
          </button>
        </div>
      </Field>

      {/* ── Anchor seed picker ────────────────────────────────────── */}
      <Field
        label="Anchor seed (the room's founding statement)"
        hint="Pick the Sage seed post that should appear on the public preview as a quote."
      >
        <select
          value={meta.anchor_seed_post_id ?? ""}
          onChange={(e) =>
            update("anchor_seed_post_id", e.target.value === "" ? null : e.target.value)
          }
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-aggilo-deep focus:border-transparent"
        >
          <option value="">— None (skip anchor section on public page) —</option>
          {anchorCandidates.map((p) => (
            <option key={p.id} value={p.id}>
              {p.excerpt.slice(0, 90)}
              {p.excerpt.length > 90 ? "…" : ""}
            </option>
          ))}
        </select>
      </Field>

      {/* ── Vault opt-in ──────────────────────────────────────────── */}
      <div className="flex items-start gap-2">
        <input
          id="vault-public-opt-in"
          type="checkbox"
          checked={meta.vault_public_opt_in}
          onChange={(e) => update("vault_public_opt_in", e.target.checked)}
          className="mt-0.5"
        />
        <label htmlFor="vault-public-opt-in" className="text-xs text-gray-700">
          Make Sage&apos;s verified vault entries public on the preview page. Defaults off. Vault entries are public-domain references; this only changes whether the cluster surfaces them outside.
        </label>
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Audit trail at <code className="px-1 rounded bg-gray-100">cluster_admin_actions</code>. Cluster: <code className="px-1 rounded bg-gray-100">{clusterId}</code>.
        </p>
        {saveState === "error" && errorMsg && (
          <p className="text-xs text-rose-600">{errorMsg}</p>
        )}
        {saveState === "saved" && (
          <p className="text-xs text-emerald-600">Saved.</p>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && !error && <p className="text-[11px] text-gray-500 mt-1">{hint}</p>}
      {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
    </div>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-gray-600">
      <span>{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 px-2 py-1 rounded border border-gray-200 text-xs font-mono"
      />
    </label>
  );
}

function SaveButton({
  state,
  onClick,
}: {
  state: SaveState;
  onClick: () => void;
}) {
  const disabled = state === "saving";
  const labelMap: Record<SaveState, string> = {
    idle: "Save",
    saving: "Saving…",
    saved: "Saved",
    error: "Try again",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
        state === "error"
          ? "bg-rose-600 text-white hover:bg-rose-700"
          : state === "saved"
            ? "bg-emerald-600 text-white"
            : "bg-aggilo-deep text-white hover:bg-aggilo-mid"
      }`}
    >
      {labelMap[state]}
    </button>
  );
}
