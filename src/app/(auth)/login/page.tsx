"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/validations/auth.validations";
import { apiRequest, ApiClientError } from "@/lib/api-client";
import { useAuthStore } from "@/features/auth/store/auth-store";
import type { AuthResultDTO } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    try {
      const result = await apiRequest<AuthResultDTO>("/auth/login", { method: "POST", body: values });
      setSession(result.user, result.tokens);
      router.push("/");
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-7 shadow-xs">
      <h1 className="mb-1 text-lg font-bold">Welcome back</h1>
      <p className="mb-5 text-[13px] text-text-secondary">Log in to continue to Invicly Flow.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
        <div>
          <label className="mb-1 block text-xs font-semibold text-text-secondary">Email</label>
          <input
            type="email"
            autoComplete="email"
            {...register("email")}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand-blue"
          />
          {errors.email && <p className="mt-1 text-xs text-state-danger">{errors.email.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-text-secondary">Password</label>
          <PasswordInput autoComplete="current-password" {...register("password")} />
          {errors.password && <p className="mt-1 text-xs text-state-danger">{errors.password.message}</p>}
        </div>

        {formError && <p className="text-xs text-state-danger">{formError}</p>}

        <Button type="submit" disabled={isSubmitting} className="mt-1 w-full justify-center">
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-5 text-center text-[13px] text-text-secondary">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-brand-blue">
          Sign up
        </Link>
      </p>
      <p className="mt-2 text-center text-[12.5px] text-text-faint">
        Need help?{" "}
        <Link href="/contact" className="font-semibold text-brand-blue">
          Contact us
        </Link>
      </p>
    </div>
  );
}
