"use client";

import { useActionState, useState } from "react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { updateTeamAction, setTeamActiveAction, type TeamFormState } from "@/app/admin/teams/actions";

export interface TeamRowData {
  id: string;
  name: string;
  code: string;
  active: boolean;
  lastLoginAt: string | null;
}

const initialState: TeamFormState = {};

export function TeamRow({ team }: { team: TeamRowData }) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editState, editAction, editPending] = useActionState(updateTeamAction, initialState);

  return (
    <tr className="border-b border-slate-200 align-top">
      <td className="py-3 pr-4">
        {mode === "edit" ? (
          <form action={editAction} className="flex flex-col gap-2">
            <input type="hidden" name="teamId" value={team.id} />
            <Field label="Name" name="name" defaultValue={team.name} error={editState.fieldErrors?.name} />
            <Field label="Code" name="code" defaultValue={team.code} error={editState.fieldErrors?.code} />
            {editState.formError ? (
              <p className="text-sm text-status-danger" role="alert">{editState.formError}</p>
            ) : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={editPending} className="px-3 py-1.5 text-sm">
                {editPending ? "Saving…" : "Save"}
              </Button>
              <Button type="button" variant="secondary" className="px-3 py-1.5 text-sm" onClick={() => setMode("view")}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="font-semibold text-brand-950">{team.name}</div>
            <div className="text-sm text-brand-700">{team.code}</div>
          </>
        )}
      </td>
      <td className="py-3 pr-4">
        <StatusBadge label={team.active ? "Active" : "Deactivated"} tone={team.active ? "open" : "locked"} />
      </td>
      <td className="py-3 pr-4 text-sm text-brand-700">
        {team.lastLoginAt ? new Date(team.lastLoginAt).toLocaleString() : "Never"}
      </td>
      <td className="py-3">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" className="px-3 py-1.5 text-sm" onClick={() => setMode("edit")}>
            Edit
          </Button>
          <form action={setTeamActiveAction}>
            <input type="hidden" name="teamId" value={team.id} />
            <input type="hidden" name="active" value={(!team.active).toString()} />
            <Button type="submit" variant={team.active ? "danger" : "primary"} className="px-3 py-1.5 text-sm">
              {team.active ? "Deactivate" : "Activate"}
            </Button>
          </form>
        </div>
      </td>
    </tr>
  );
}
