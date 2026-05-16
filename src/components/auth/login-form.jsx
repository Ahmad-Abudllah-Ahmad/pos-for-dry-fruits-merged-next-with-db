"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { login } from "@/api/auth";
import { getMyWorkspaces } from "@/api/workspaces";
import { isAdminUser } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Button } from "@/components/common/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/common/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/api/client";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await login({ phone_number: phone.trim(), password });
      const token = res.access_token;
      const user = res.user;
      if (!token || !user) {
        toast.error("Invalid response from server");
        return;
      }
      setSession(token, user);
      try {
        const w = await getMyWorkspaces();
        if (w?.length) {
          setWorkspaces(w);
        } else {
          setWorkspaces([]);
        }
      } catch {
        setWorkspaces([]);
      }
      const next = search.get("next");
      const defaultDest = isAdminUser(user) ? "/admin" : "/app";
      const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : defaultDest;
      router.push(dest);
      router.refresh();
      toast.success("Welcome back");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Login failed";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Use the phone number registered with your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="username"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
