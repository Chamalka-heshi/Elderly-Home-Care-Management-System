/**
 * src/features/dashboards/common/DangerZoneTab.tsx
 * ─────────────────────────────────────────────────
 * "Danger Zone" tab shared between AdminProfile and DoctorProfile.
 * The layout, colours, and structure are identical for both roles;
 * only the copy (warning text, confirmation notes) differs slightly,
 * so we accept that via props.
 *
 * Props:
 *  deactivateNote    — body text under the deactivation heading
 *  deleteNote        — body text under the delete heading
 *  footerNote        — small note at the bottom of the card
 *  footerIcon        — icon rendered beside the footer note
 *  onDeactivate      — called when "Request Deactivation" is clicked
 *  onDelete          — called when "Delete Account" confirm dialog proceeds
 */

import React from "react";
import { SectionCard, PrimaryBtn } from "./ui";
import { IconLock, IconAlert } from "./icons";

interface Props {
  deactivateNote: string;
  deleteNote:     string;
  footerNote:     string;
  footerIcon:     React.FC<{ className?: string }>;
  onDeactivate:   () => void;
  onDelete:       () => void;
}

const DangerZoneTab: React.FC<Props> = ({
  deactivateNote,
  deleteNote,
  footerNote,
  footerIcon: FooterIcon,
  onDeactivate,
  onDelete,
}) => (
  <div className="space-y-6">
    <SectionCard title="Danger Zone" subtitle="These actions are permanent and cannot be undone.">

      {/* ── Deactivate account ── */}
      <div className="mb-4 rounded-2xl border border-amber-200/60 bg-amber-50/60 p-5 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-amber-100 p-2 text-amber-700">
              <IconLock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">Deactivate Account</p>
              <p className="mt-1 text-xs text-amber-700">{deactivateNote}</p>
            </div>
          </div>
          <PrimaryBtn tone="blue" type="button" onClick={onDeactivate}>
            Request Deactivation
          </PrimaryBtn>
        </div>
      </div>

      {/* ── Delete account ── */}
      <div className="rounded-2xl border border-red-200/60 bg-red-50/60 p-5 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-red-100 p-2 text-red-700">
              <IconAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-800">Delete Account</p>
              <p className="mt-1 text-xs text-red-700">{deleteNote}</p>
            </div>
          </div>
          <PrimaryBtn
            tone="red"
            type="button"
            onClick={() => {
              if (window.confirm("Are you absolutely sure? This action cannot be undone.")) {
                onDelete();
              }
            }}
          >
            Delete Account
          </PrimaryBtn>
        </div>
      </div>

      {/* ── Warning footnote ── */}
      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur">
        <FooterIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
        <p className="text-xs text-slate-500">{footerNote}</p>
      </div>
    </SectionCard>
  </div>
);

export default DangerZoneTab;
