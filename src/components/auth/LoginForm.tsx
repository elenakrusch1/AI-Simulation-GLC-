"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { loginTeamAction, loginAdminAction, type LoginFormState } from "@/app/login/actions";

const initialState: LoginFormState = {};

type Tab = "team" | "admin";

export function LoginForm() {
  const [tab, setTab] = useState<Tab>("team");
  const [teamState, teamFormAction, teamPending] = useActionState(
    loginTeamAction,
    initialState,
  );
  const [adminState, adminFormAction, adminPending] = useActionState(
    loginAdminAction,
    initialState,
  );

  return (
    <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <div
        role="tablist"
        aria-label="Sign-in type"
        className="mb-6 grid grid-cols-2 gap-2 rounded-md bg-brand-50 p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "team"}
          onClick={() => setTab("team")}
          className={`rounded px-3 py-2 text-sm font-semibold transition-colors ${
            tab === "team" ? "bg-white text-brand-900 shadow-sm" : "text-brand-700"
          }`}
        >
          Team
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "admin"}
          onClick={() => setTab("admin")}
          className={`rounded px-3 py-2 text-sm font-semibold transition-colors ${
            tab === "admin" ? "bg-white text-brand-900 shadow-sm" : "text-brand-700"
          }`}
        >
          Administrator
        </button>
      </div>

      {tab === "team" ? (
        <form action={teamFormAction} className="flex flex-col gap-4" noValidate>
          <Field
            label="Team code"
            name="teamCode"
            type="text"
            autoComplete="username"
            required
            error={teamState.fieldErrors?.teamCode}
          />
          {teamState.formError ? (
            <p className="rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger" role="alert">
              {teamState.formError}
            </p>
          ) : null}
          <Button type="submit" disabled={teamPending} className="mt-2 w-full">
            {teamPending ? "Signing in…" : "Sign in as team"}
          </Button>
          <p className="text-center text-sm text-brand-700">
            New team?{" "}
            <Link href="/register" className="font-semibold text-brand-800 hover:underline">
              Register now
            </Link>
          </p>
        </form>
      ) : (
        <form action={adminFormAction} className="flex flex-col gap-4" noValidate>
          <Field
            label="Email or admin username"
            name="identifier"
            type="text"
            autoComplete="username"
            required
            error={adminState.fieldErrors?.identifier}
          />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            error={adminState.fieldErrors?.password}
          />
          {adminState.formError ? (
            <p className="rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger" role="alert">
              {adminState.formError}
            </p>
          ) : null}
          <Button type="submit" disabled={adminPending} className="mt-2 w-full">
            {adminPending ? "Signing in…" : "Sign in as administrator"}
          </Button>
        </form>
      )}
    </div>
  );
}
