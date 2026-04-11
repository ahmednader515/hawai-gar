"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/providers/i18n-provider";
import type { DriverProfile } from "@prisma/client";

type AccountErrorCode =
  | "PASSWORD_REQUIRED"
  | "INVALID_PASSWORD"
  | "EMAIL_IN_USE"
  | "WEAK_PASSWORD"
  | "VALIDATION"
  | "GENERIC";

function mapError(t: (k: string) => string, code: string | undefined): string {
  const key = `accountForm.errors.${code ?? "GENERIC"}`;
  const msg = t(key);
  if (msg === key) return t("accountForm.errors.GENERIC");
  return msg;
}

type Props =
  | {
      variant: "admin";
      initialName: string | null;
      initialEmail: string;
    }
  | {
      variant: "carrier";
      initialName: string | null;
      initialEmail: string;
      initialDriver: DriverProfile;
    };

export function AccountSettingsForm(props: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const { update } = useSession();

  const [name, setName] = useState(
    props.variant === "admin" ? props.initialName ?? "" : "",
  );
  const [email, setEmail] = useState(props.initialEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fullName, setFullName] = useState(
    props.variant === "carrier" ? props.initialDriver.fullName : "",
  );
  const [phone, setPhone] = useState(props.variant === "carrier" ? props.initialDriver.phone : "");
  const [nationalId, setNationalId] = useState(
    props.variant === "carrier" ? props.initialDriver.nationalId ?? "" : "",
  );
  const [licenseNumber, setLicenseNumber] = useState(
    props.variant === "carrier" ? props.initialDriver.licenseNumber ?? "" : "",
  );
  const [carPlate, setCarPlate] = useState(
    props.variant === "carrier" ? props.initialDriver.carPlate : "",
  );
  const [carType, setCarType] = useState(
    props.variant === "carrier" ? props.initialDriver.carType ?? "" : "",
  );
  const [carCapacity, setCarCapacity] = useState(
    props.variant === "carrier" ? props.initialDriver.carCapacity ?? "" : "",
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const emailChanged = email.trim() !== props.initialEmail;
    const passwordChangeRequested = newPassword.length > 0 || confirmPassword.length > 0;

    if (passwordChangeRequested) {
      if (newPassword !== confirmPassword) {
        setError(t("accountForm.errors.MISMATCH"));
        return;
      }
      if (newPassword.length > 0 && newPassword.length < 8) {
        setError(t("accountForm.errors.WEAK_PASSWORD"));
        return;
      }
    }

    if ((emailChanged || passwordChangeRequested) && !currentPassword.trim()) {
      setError(t("accountForm.errors.PASSWORD_REQUIRED"));
      return;
    }

    const body: Record<string, unknown> = {
      name: props.variant === "admin" ? name.trim() || null : undefined,
      email: email.trim(),
      currentPassword: currentPassword || undefined,
      newPassword: newPassword || undefined,
    };

    if (props.variant === "carrier") {
      body.fullName = fullName.trim();
      body.phone = phone.trim();
      body.nationalId = nationalId.trim() || null;
      body.licenseNumber = licenseNumber.trim() || null;
      body.carPlate = carPlate.trim();
      body.carType = carType.trim();
      body.carCapacity = carCapacity.trim();
    }

    setLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: AccountErrorCode };

      if (!res.ok) {
        setError(mapError(t, data.error));
        setLoading(false);
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      await update({
        name: props.variant === "carrier" ? fullName.trim() : name.trim() || undefined,
        email: email.trim(),
      });
      router.refresh();
    } catch {
      setError(t("accountForm.errors.GENERIC"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-8">
      {props.variant === "carrier" ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t("accountForm.sectionProfile")}</h2>
          <div className="space-y-2">
            <Label htmlFor="fullName">{t("accountForm.fullName")}</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t("accountForm.phone")}</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={loading}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationalId">{t("accountForm.nationalId")}</Label>
            <Input
              id="nationalId"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              disabled={loading}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">{t("accountForm.licenseNumber")}</Label>
            <Input
              id="licenseNumber"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              disabled={loading}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carPlate">{t("accountForm.carPlate")}</Label>
            <Input
              id="carPlate"
              value={carPlate}
              onChange={(e) => setCarPlate(e.target.value)}
              required
              disabled={loading}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carType">{t("accountForm.carType")}</Label>
            <Input
              id="carType"
              value={carType}
              onChange={(e) => setCarType(e.target.value)}
              required
              disabled={loading}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carCapacity">{t("accountForm.carCapacity")}</Label>
            <Input
              id="carCapacity"
              value={carCapacity}
              onChange={(e) => setCarCapacity(e.target.value)}
              required
              disabled={loading}
              className="h-11"
            />
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t("accountForm.sectionProfile")}</h2>
          <div className="space-y-2">
            <Label htmlFor="name">{t("accountForm.displayName")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="h-11"
            />
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("accountForm.sectionSecurity")}</h2>
        <div className="space-y-2">
          <Label htmlFor="email">{t("accountForm.email")}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="h-11"
          />
        </div>
        <p className="text-sm text-muted-foreground">{t("accountForm.passwordHint")}</p>
        <div className="space-y-2">
          <Label htmlFor="currentPassword">{t("accountForm.currentPassword")}</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            disabled={loading}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">{t("accountForm.newPassword")}</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            disabled={loading}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t("accountForm.confirmPassword")}</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            disabled={loading}
            className="h-11"
          />
        </div>
      </section>

      {error ? (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
      ) : null}
      {success ? (
        <p className="text-sm text-green-700 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-lg">
          {t("accountForm.success")}
        </p>
      ) : null}

      <Button type="submit" disabled={loading} size="lg" className="min-w-[8rem]">
        {loading ? t("accountForm.saving") : t("accountForm.save")}
      </Button>
    </form>
  );
}
