"use client";

import { useActionState, useState } from "react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  updateTeamAction,
  resetTeamPasswordAction,
  setTeamActiveAction,
  type TeamFormState,
} from "@/app/admin/teams/actions";

export interface TeamRowData {
  id: string;
  name: string;
  code: string;
  active: boolean;
  lastLoginAt: string | null;
  locked: boolean;
}

const initialState: TeamFormState = {};

export function TeamRow({ team }: { team: TeamRowData }) {
  const [mode, setMode] = useState<"view" | "edit" | "password">("view");
  const [editState, editAction, editPending] = useActionState(updateTeamAction, initialState);
  const [pwState, pwAction, pwPending] = useActionState(resetTeamPasswordAction, initialState);

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
        {team.locked ? (
          <div className="mt-1">
            <StatusBadge label="Temporarily locked (failed logins)" tone="closed" />
          </div>
        ) : null}
      </td>
      <td className="py-3 pr-4 text-sm text-brand-700">
        {team.lastLoginAt ? new Date(team.lastLoginAt).toLocaleString() : "Never"}
      </td>
      <td className="py-3">
        {mode === "password" ? (
          <form action={pwAction} className="flex flex-col gap-2">
            <input type="hidden" name="teamId" value={team.id} />
            <Field label="New password" name="password" placeholder="At least 12 characters, letters and numbers" error={pwState.fieldErrors?.password} />
            {pwState.formError ? (
              <p className="text-sm text-status-danger" role="alert">{pwState.formError}</p>
            ) : null}
            {pwState.success ? (
              <p className="text-sm text-status-open" role="status">{pwState.success}</p>
            ) : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={pwPending} className="px-3 py-1.5 text-sm">
                {pwPending ? "Resetting…" : "Reset password"}
              </Button>
              <Button type="button" variant="secondary" className="px-3 py-1.5 text-sm" onClick={() => setMode("view")}>
                Close
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" className="px-3 py-1.5 text-sm" onClick={() => setMode("edit")}>
              Edit
            </Button>
            <Button type="button" variant="secondary" className="px-3 py-1.5 text-sm" onClick={() => setMode("password")}>
              Reset password
            </Button>
            <form action={setTeamActiveAction}>
              <input type="hidden" name="teamId" value={team.id} />
              <input type="hidden" name="active" value={(!team.active).toString()} />
              <Button type="submit" variant={team.active ? "danger" : "primary"} className="px-3 py-1.5 text-sm">
                {team.active ? "Deactivate" : "Activate"}
              </Button>
            </form>
          </div>
        )}
      </td>
    </tr>
  );
}
