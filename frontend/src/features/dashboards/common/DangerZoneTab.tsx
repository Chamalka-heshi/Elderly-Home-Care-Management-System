import React from "react";
import { SectionCard, PrimaryBtn } from "./ui";
import { IconAlert } from "./icons";

interface Props {
  deleteNote:     string;      
  deleteButton?:  React.ReactNode;
}

// Visual container for destructive or irreversible actions to prevent accidental data loss
const DangerZoneTab: React.FC<Props> = ({
  deleteNote,
  deleteButton,
}) => (
  <div className="space-y-6">
    <SectionCard title="Danger Zone" subtitle="These actions are permanent and cannot be undone.">

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

          {/* Trigger a secondary confirmation before performing the final account deletion */}
          {deleteButton ?? (
            <PrimaryBtn
              tone="red"
              type="button"
              onClick={() => {
                if (window.confirm("Are you absolutely sure? This action cannot be undone.")) {
                  // Final deletion logic to be handled by the parent component
                }
              }}
            >
              Delete Account
            </PrimaryBtn>
          )}
        </div>
      </div>

    </SectionCard>
  </div>
);

export default DangerZoneTab;