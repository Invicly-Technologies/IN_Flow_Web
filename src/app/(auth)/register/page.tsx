"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/validations/auth.validations";
import { apiRequest, ApiClientError } from "@/lib/api-client";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useAppStore } from "@/features/app/store/app-store";
import type { AuthResultDTO } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";

interface InvitePreview {
  workspaceName: string;
  inviterName: string;
  email: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const setSession = useAuthStore((s) => s.setSession);
  const setCurrentWorkspaceId = useAuthStore((s) => s.setCurrentWorkspaceId);
  const pushToast = useAppStore((s) => s.pushToast);
  const [formError, setFormError] = useState<string | null>(null);
  const [invitePreview, setInvitePreview] = useState<InvitePreview | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  useEffect(() => {
    if (!inviteToken) return;
    apiRequest<InvitePreview>(`/auth/invite/${inviteToken}`)
      .then((preview) => {
        setInvitePreview(preview);
        setValue("email", preview.email);
      })
      .catch(() => setInvitePreview(null));
  }, [inviteToken, setValue]);

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    try {
      const result = await apiRequest<AuthResultDTO>("/auth/register", { method: "POST", body: values });
      setSession(result.user, result.tokens);
      if (result.joinedWorkspaces?.length) {
        setCurrentWorkspaceId(result.joinedWorkspaces[0]!.id);
        pushToast({ message: `You've joined ${result.joinedWorkspaces[0]!.name}` });
      }
      router.push("/");
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-7 shadow-xs">
      <h1 className="mb-1 text-lg font-bold">Create your account</h1>
      <p className="mb-5 text-[13px] text-text-secondary">Start planning with Invicly Flow.</p>

      {invitePreview && (
        <div className="mb-4 rounded-lg bg-brand-flow-soft px-3.5 py-2.5 text-[13px] text-text">
          <strong>{invitePreview.inviterName}</strong> invited you to join{" "}
          <strong>{invitePreview.workspaceName}</strong>. Create your account to accept.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
        <div>
          <label className="mb-1 block text-xs font-semibold text-text-secondary">Full name</label>
          <input
            autoComplete="name"
            {...register("fullName")}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand-blue"
          />
          {errors.fullName && <p className="mt-1 text-xs text-state-danger">{errors.fullName.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-text-secondary">Email</label>
          <input
            type="email"
            autoComplete="email"
            readOnly={!!invitePreview}
            {...register("email")}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand-blue read-only:bg-bg read-only:text-text-secondary"
          />
          {errors.email && <p className="mt-1 text-xs text-state-danger">{errors.email.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-text-secondary">Password</label>
          <PasswordInput autoComplete="new-password" {...register("password")} />
          {errors.password && <p className="mt-1 text-xs text-state-danger">{errors.password.message}</p>}
          <p className="mt-1 text-xs text-text-faint">At least 8 characters.</p>
        </div>
        {!invitePreview && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-secondary">Workspace name (optional)</label>
            <input
              {...register("workspaceName")}
              placeholder="e.g. Acme Inc."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand-blue"
            />
          </div>
        )}

        {formError && <p className="text-xs text-state-danger">{formError}</p>}
        {!formError && Object.keys(errors).length > 0 && (
          <p className="text-xs text-state-danger">Please fix the highlighted fields above.</p>
        )}

        <Button type="submit" disabled={isSubmitting} className="mt-1 w-full justify-center">
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-5 text-center text-[13px] text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-blue">
          Log in
        </Link>
      </p>
    </div>
  );
}
