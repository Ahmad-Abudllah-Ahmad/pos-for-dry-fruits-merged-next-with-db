"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { bootstrapAdmin } from "@/api/auth";
import { ApiError } from "@/api/client";
import { Button } from "@/components/common/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/common/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Create the first admin account (one-time, when the database has no users). */
export function BootstrapForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    cnic_number: "",
    phone_number: "",
    address: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  function onChange(/** @type {React.ChangeEvent<HTMLInputElement>} */ e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await bootstrapAdmin({
        name: form.name.trim(),
        cnic_number: form.cnic_number.trim(),
        phone_number: form.phone_number.trim(),
        address: form.address.trim() || null,
        password: form.password,
      });
      toast.success("Admin account created. Sign in with the same phone and password.");
      router.push("/auth?view=login");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
        if (err.status === 409) {
          router.push("/auth?view=login");
        }
      } else {
        toast.error("Could not create admin");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Initial admin setup</CardTitle>
        <CardDescription>Only available when the system has no users. Creates the first Admin account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          {["name", "cnic_number", "phone_number", "address", "password"].map((field) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>
                {field === "cnic_number"
                  ? "CNIC"
                  : field === "phone_number"
                    ? "Phone"
                    : field === "name"
                      ? "Name"
                      : field === "address"
                        ? "Address (optional)"
                        : "Password"}
              </Label>
              <Input
                id={field}
                name={field}
                type={field === "password" ? "password" : "text"}
                required={field !== "address"}
                value={/** @type {Record<string, string>} */ (form)[field]}
                onChange={onChange}
                autoComplete={field === "password" ? "new-password" : undefined}
              />
            </div>
          ))}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creating…" : "Create admin"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
