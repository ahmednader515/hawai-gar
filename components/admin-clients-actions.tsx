"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Ban, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/providers/i18n-provider";
import type { CarrierRow, CompanyRow, ShipmentCompanyDirectoryRow } from "@/lib/admin-clients-types";
import { TagInput } from "@/components/tag-input";
import {
  initialDestinationTagsFromCarrier,
  initialTruckTagsFromCarrier,
  serializeTagList,
} from "@/lib/catalog-tags";

const da = "dashboard.admin";

function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" dir="auto">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[81] w-full max-w-lg max-h-[min(90vh,720px)] overflow-y-auto rounded-xl border border-border bg-background p-5 shadow-lg"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
        <div className="space-y-3">{children}</div>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">{footer}</div>
      </div>
    </div>,
    document.body,
  );
}

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  pendingLabel,
  onConfirm,
  onCancel,
  pending,
  confirmVariant = "destructive",
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  pendingLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
  confirmVariant?: "default" | "destructive" | "outline" | "secondary";
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, pending]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4" dir="auto">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label={cancelLabel}
        onClick={() => {
          if (!pending) onCancel();
        }}
        disabled={pending}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[86] w-full max-w-md rounded-xl border border-border bg-background p-5 shadow-lg"
      >
        <h2 id={titleId} className="text-lg font-semibold text-foreground mb-2">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={confirmVariant} onClick={onConfirm} disabled={pending}>
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function AlertModal({
  open,
  message,
  onClose,
  okLabel,
}: {
  open: boolean;
  message: string;
  onClose: () => void;
  okLabel: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" dir="auto">
      <button type="button" className="absolute inset-0 bg-black/55" aria-label={okLabel} onClick={onClose} />
      <div
        role="alertdialog"
        aria-modal="true"
        className="relative z-[91] w-full max-w-md rounded-xl border border-border bg-background p-5 shadow-lg"
      >
        <p className="text-sm text-foreground leading-relaxed">{message}</p>
        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={onClose}>
            {okLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function errMsg(code: string, t: (k: string) => string): string {
  switch (code) {
    case "EMAIL_IN_USE":
      return t(`${da}.clientsErrorEmailInUse`);
    case "WEAK_PASSWORD":
      return t(`${da}.clientsErrorWeakPassword`);
    case "CANNOT_DELETE_SELF":
      return t(`${da}.clientsErrorCannotDeleteSelf`);
    case "VALIDATION":
      return t(`${da}.clientsErrorValidation`);
    default:
      return t(`${da}.clientsErrorGeneric`);
  }
}

export function CompanyUserActions({
  row,
  currentUserId,
  listVariant,
  uiVariant = "table",
}: {
  row: CompanyRow;
  currentUserId: string;
  listVariant: "active" | "blacklisted";
  /** `card` renders a footer block for mobile; `table` renders a &lt;td&gt; for desktop. */
  uiVariant?: "table" | "card";
}) {
  const { t } = useI18n();
  const router = useRouter();
  const baseId = useId();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [blacklistOpen, setBlacklistOpen] = useState(false);
  const [unblacklistOpen, setUnblacklistOpen] = useState(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [blacklistPending, setBlacklistPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [email, setEmail] = useState(row.email);
  const [companyName, setCompanyName] = useState(row.companyName ?? "");
  const [contactPerson, setContactPerson] = useState(row.contactPerson ?? row.name ?? "");
  const [phone, setPhone] = useState(row.phone ?? "");
  const [city, setCity] = useState(row.city ?? "");
  const [address, setAddress] = useState(row.address ?? "");
  const [commercialRegister, setCommercialRegister] = useState(row.commercialRegister ?? "");
  const [newPassword, setNewPassword] = useState("");

  const resetForm = useCallback(() => {
    setEmail(row.email);
    setCompanyName(row.companyName ?? "");
    setContactPerson(row.contactPerson ?? row.name ?? "");
    setPhone(row.phone ?? "");
    setCity(row.city ?? "");
    setAddress(row.address ?? "");
    setCommercialRegister(row.commercialRegister ?? "");
    setNewPassword("");
    setFormError(null);
  }, [row]);

  useEffect(() => {
    if (editOpen) resetForm();
  }, [editOpen, resetForm]);

  async function save() {
    setSaving(true);
    setFormError(null);
    try {
      const body: Record<string, unknown> = {
        email,
        companyName,
        contactPerson,
        phone,
        city: city || null,
        address: address || null,
        commercialRegister: commercialRegister || null,
      };
      if (newPassword.trim()) body.newPassword = newPassword;
      const res = await fetch(`/api/admin/users/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setFormError(errMsg(data.error ?? "GENERIC", t));
        return;
      }
      setEditOpen(false);
      router.refresh();
    } catch {
      setFormError(t(`${da}.clientsErrorGeneric`));
    } finally {
      setSaving(false);
    }
  }

  async function performDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${row.id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setDeleteOpen(false);
        setErrorAlert(errMsg(data.error ?? "GENERIC", t));
        return;
      }
      setDeleteOpen(false);
      router.refresh();
    } catch {
      setDeleteOpen(false);
      setErrorAlert(t(`${da}.tableDeleteError`));
    } finally {
      setDeleting(false);
    }
  }

  async function performSetBlacklisted(blacklisted: boolean) {
    setBlacklistPending(true);
    try {
      const res = await fetch(`/api/admin/users/${row.id}/blacklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blacklisted }),
      });
      if (!res.ok) {
        setBlacklistOpen(false);
        setUnblacklistOpen(false);
        setErrorAlert(t(`${da}.clientsErrorGeneric`));
        return;
      }
      setBlacklistOpen(false);
      setUnblacklistOpen(false);
      router.refresh();
    } catch {
      setBlacklistOpen(false);
      setUnblacklistOpen(false);
      setErrorAlert(t(`${da}.clientsErrorGeneric`));
    } finally {
      setBlacklistPending(false);
    }
  }

  const canDelete = row.id !== currentUserId;
  const canBlacklist = row.id !== currentUserId;

  const actionButtons = (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setEditOpen(true)}>
        <Pencil className="size-3.5" aria-hidden />
        {t(`${da}.tableEdit`)}
      </Button>
      {listVariant === "active" ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-1"
          disabled={!canBlacklist || blacklistPending}
          onClick={() => setBlacklistOpen(true)}
          aria-label={t(`${da}.clientsBlacklistAria`)}
        >
          <Ban className="size-3.5" aria-hidden />
          {t(`${da}.clientsBlacklist`)}
        </Button>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-1"
          disabled={blacklistPending}
          onClick={() => setUnblacklistOpen(true)}
          aria-label={t(`${da}.clientsUnblacklistAria`)}
        >
          <ShieldCheck className="size-3.5" aria-hidden />
          {t(`${da}.clientsUnblacklist`)}
        </Button>
      )}
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="gap-1"
        disabled={!canDelete || deleting}
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="size-3.5" aria-hidden />
        {deleting ? t(`${da}.tableDeleting`) : t(`${da}.tableDelete`)}
      </Button>
    </div>
  );

  return (
    <>
      {uiVariant === "table" ? (
        <td className="p-3 align-top text-start whitespace-nowrap">{actionButtons}</td>
      ) : (
        <div className="mt-3 border-t border-border/80 pt-3">{actionButtons}</div>
      )}

      <ConfirmModal
        open={blacklistOpen}
        title={t(`${da}.clientsBlacklistDialogTitle`)}
        message={t(`${da}.clientsBlacklistConfirmCompany`)}
        confirmLabel={t(`${da}.clientsBlacklist`)}
        cancelLabel={t(`${da}.clientsCancel`)}
        pendingLabel={t(`${da}.clientsBlacklistPending`)}
        pending={blacklistPending}
        confirmVariant="default"
        onCancel={() => {
          if (!blacklistPending) setBlacklistOpen(false);
        }}
        onConfirm={() => void performSetBlacklisted(true)}
      />

      <ConfirmModal
        open={unblacklistOpen}
        title={t(`${da}.clientsUnblacklistDialogTitle`)}
        message={t(`${da}.clientsUnblacklistConfirmCompany`)}
        confirmLabel={t(`${da}.clientsUnblacklist`)}
        cancelLabel={t(`${da}.clientsCancel`)}
        pendingLabel={t(`${da}.clientsUnblacklistPending`)}
        pending={blacklistPending}
        confirmVariant="default"
        onCancel={() => {
          if (!blacklistPending) setUnblacklistOpen(false);
        }}
        onConfirm={() => void performSetBlacklisted(false)}
      />

      <ConfirmModal
        open={deleteOpen}
        title={t(`${da}.clientsDeleteDialogTitle`)}
        message={t(`${da}.clientsDeleteConfirmCompany`)}
        confirmLabel={t(`${da}.tableDelete`)}
        cancelLabel={t(`${da}.clientsCancel`)}
        pendingLabel={t(`${da}.tableDeleting`)}
        pending={deleting}
        onCancel={() => {
          if (!deleting) setDeleteOpen(false);
        }}
        onConfirm={() => void performDelete()}
      />

      <AlertModal
        open={errorAlert != null}
        message={errorAlert ?? ""}
        okLabel={t(`${da}.clientsAlertOk`)}
        onClose={() => setErrorAlert(null)}
      />

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t(`${da}.clientsEditCompanyTitle`)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              {t(`${da}.clientsCancel`)}
            </Button>
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? t(`${da}.clientsSaving`) : t(`${da}.clientsSave`)}
            </Button>
          </>
        }
      >
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-email`}>{t(`${da}.clientsColEmail`)}</Label>
          <Input id={`${baseId}-email`} value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" className="font-mono text-sm" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-cn`}>{t(`${da}.clientsColCompanyName`)}</Label>
          <Input id={`${baseId}-cn`} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-cp`}>{t(`${da}.clientsColContact`)}</Label>
          <Input id={`${baseId}-cp`} value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-ph`}>{t(`${da}.clientsColPhone`)}</Label>
          <Input id={`${baseId}-ph`} value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-city`}>{t(`${da}.clientsColCity`)}</Label>
          <Input id={`${baseId}-city`} value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-addr`}>{t(`${da}.clientsColAddress`)}</Label>
          <Input id={`${baseId}-addr`} value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-cr`}>{t(`${da}.clientsCommercialRegister`)}</Label>
          <Input id={`${baseId}-cr`} value={commercialRegister} onChange={(e) => setCommercialRegister(e.target.value)} dir="ltr" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-pw`}>{t(`${da}.clientsNewPasswordOptional`)}</Label>
          <Input
            id={`${baseId}-pw`}
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            dir="ltr"
            placeholder="········"
          />
        </div>
      </Modal>
    </>
  );
}

export function DriverUserActions({
  row,
  currentUserId,
  listVariant,
  uiVariant = "table",
}: {
  row: CarrierRow;
  currentUserId: string;
  listVariant: "active" | "blacklisted";
  uiVariant?: "table" | "card";
}) {
  const { t } = useI18n();
  const router = useRouter();
  const baseId = useId();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [blacklistOpen, setBlacklistOpen] = useState(false);
  const [unblacklistOpen, setUnblacklistOpen] = useState(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [blacklistPending, setBlacklistPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [email, setEmail] = useState(row.email);
  const [fullName, setFullName] = useState(row.fullName ?? row.name ?? "");
  const [phone, setPhone] = useState(row.phone ?? "");
  const [carType, setCarType] = useState(row.carType ?? "");
  const [carCapacity, setCarCapacity] = useState(row.carCapacity ?? "");
  const [listingCompanyName, setListingCompanyName] = useState(
    row.listingCompanyName?.trim() || row.fullName || row.name || "",
  );
  const [representativeName, setRepresentativeName] = useState(
    row.representativeName?.trim() || row.fullName || row.name || "",
  );
  const [truckTags, setTruckTags] = useState<string[]>(() => initialTruckTagsFromCarrier(row));
  const [destinationTags, setDestinationTags] = useState<string[]>(() =>
    initialDestinationTagsFromCarrier(row),
  );
  const [newPassword, setNewPassword] = useState("");

  const resetForm = useCallback(() => {
    setEmail(row.email);
    setFullName(row.fullName ?? row.name ?? "");
    setPhone(row.phone ?? "");
    setCarType(row.carType ?? "");
    setCarCapacity(row.carCapacity ?? "");
    setListingCompanyName(row.listingCompanyName?.trim() || row.fullName || row.name || "");
    setRepresentativeName(row.representativeName?.trim() || row.fullName || row.name || "");
    setTruckTags(initialTruckTagsFromCarrier(row));
    setDestinationTags(initialDestinationTagsFromCarrier(row));
    setNewPassword("");
    setFormError(null);
  }, [row]);

  useEffect(() => {
    if (editOpen) resetForm();
  }, [editOpen, resetForm]);

  async function save() {
    setSaving(true);
    setFormError(null);
    if (truckTags.length === 0 || destinationTags.length === 0) {
      setFormError(t(`${da}.clientsValidationTags`));
      setSaving(false);
      return;
    }
    try {
      const body: Record<string, unknown> = {
        email,
        fullName,
        phone,
        carType,
        carCapacity,
        listingCompanyName,
        representativeName,
        truckTypesCatalog: serializeTagList(truckTags),
        serviceDestinations: serializeTagList(destinationTags),
      };
      if (newPassword.trim()) body.newPassword = newPassword;
      const res = await fetch(`/api/admin/users/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setFormError(errMsg(data.error ?? "GENERIC", t));
        return;
      }
      setEditOpen(false);
      router.refresh();
    } catch {
      setFormError(t(`${da}.clientsErrorGeneric`));
    } finally {
      setSaving(false);
    }
  }

  async function performDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${row.id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setDeleteOpen(false);
        setErrorAlert(errMsg(data.error ?? "GENERIC", t));
        return;
      }
      setDeleteOpen(false);
      router.refresh();
    } catch {
      setDeleteOpen(false);
      setErrorAlert(t(`${da}.tableDeleteError`));
    } finally {
      setDeleting(false);
    }
  }

  async function performSetBlacklisted(blacklisted: boolean) {
    setBlacklistPending(true);
    try {
      const res = await fetch(`/api/admin/users/${row.id}/blacklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blacklisted }),
      });
      if (!res.ok) {
        setBlacklistOpen(false);
        setUnblacklistOpen(false);
        setErrorAlert(t(`${da}.clientsErrorGeneric`));
        return;
      }
      setBlacklistOpen(false);
      setUnblacklistOpen(false);
      router.refresh();
    } catch {
      setBlacklistOpen(false);
      setUnblacklistOpen(false);
      setErrorAlert(t(`${da}.clientsErrorGeneric`));
    } finally {
      setBlacklistPending(false);
    }
  }

  const canDelete = row.id !== currentUserId;
  const canBlacklist = row.id !== currentUserId;

  const actionButtons = (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setEditOpen(true)}>
        <Pencil className="size-3.5" aria-hidden />
        {t(`${da}.tableEdit`)}
      </Button>
      {listVariant === "active" ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-1"
          disabled={!canBlacklist || blacklistPending}
          onClick={() => setBlacklistOpen(true)}
          aria-label={t(`${da}.clientsBlacklistAria`)}
        >
          <Ban className="size-3.5" aria-hidden />
          {t(`${da}.clientsBlacklist`)}
        </Button>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-1"
          disabled={blacklistPending}
          onClick={() => setUnblacklistOpen(true)}
          aria-label={t(`${da}.clientsUnblacklistAria`)}
        >
          <ShieldCheck className="size-3.5" aria-hidden />
          {t(`${da}.clientsUnblacklist`)}
        </Button>
      )}
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="gap-1"
        disabled={!canDelete || deleting}
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="size-3.5" aria-hidden />
        {deleting ? t(`${da}.tableDeleting`) : t(`${da}.tableDelete`)}
      </Button>
    </div>
  );

  return (
    <>
      {uiVariant === "table" ? (
        <td className="p-3 align-top text-start whitespace-nowrap">{actionButtons}</td>
      ) : (
        <div className="mt-3 border-t border-border/80 pt-3">{actionButtons}</div>
      )}

      <ConfirmModal
        open={blacklistOpen}
        title={t(`${da}.clientsBlacklistDialogTitle`)}
        message={t(`${da}.clientsBlacklistConfirmDriver`)}
        confirmLabel={t(`${da}.clientsBlacklist`)}
        cancelLabel={t(`${da}.clientsCancel`)}
        pendingLabel={t(`${da}.clientsBlacklistPending`)}
        pending={blacklistPending}
        confirmVariant="default"
        onCancel={() => {
          if (!blacklistPending) setBlacklistOpen(false);
        }}
        onConfirm={() => void performSetBlacklisted(true)}
      />

      <ConfirmModal
        open={unblacklistOpen}
        title={t(`${da}.clientsUnblacklistDialogTitle`)}
        message={t(`${da}.clientsUnblacklistConfirmDriver`)}
        confirmLabel={t(`${da}.clientsUnblacklist`)}
        cancelLabel={t(`${da}.clientsCancel`)}
        pendingLabel={t(`${da}.clientsUnblacklistPending`)}
        pending={blacklistPending}
        confirmVariant="default"
        onCancel={() => {
          if (!blacklistPending) setUnblacklistOpen(false);
        }}
        onConfirm={() => void performSetBlacklisted(false)}
      />

      <ConfirmModal
        open={deleteOpen}
        title={t(`${da}.clientsDeleteDialogTitle`)}
        message={t(`${da}.clientsDeleteConfirmDriver`)}
        confirmLabel={t(`${da}.tableDelete`)}
        cancelLabel={t(`${da}.clientsCancel`)}
        pendingLabel={t(`${da}.tableDeleting`)}
        pending={deleting}
        onCancel={() => {
          if (!deleting) setDeleteOpen(false);
        }}
        onConfirm={() => void performDelete()}
      />

      <AlertModal
        open={errorAlert != null}
        message={errorAlert ?? ""}
        okLabel={t(`${da}.clientsAlertOk`)}
        onClose={() => setErrorAlert(null)}
      />

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t(`${da}.clientsEditDriverTitle`)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              {t(`${da}.clientsCancel`)}
            </Button>
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? t(`${da}.clientsSaving`) : t(`${da}.clientsSave`)}
            </Button>
          </>
        }
      >
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-em`}>{t(`${da}.clientsColEmail`)}</Label>
          <Input id={`${baseId}-em`} value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" className="font-mono text-sm" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-lcn`}>{t(`${da}.clientsColCompanyName`)}</Label>
          <Input id={`${baseId}-lcn`} value={listingCompanyName} onChange={(e) => setListingCompanyName(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-rep`}>{t(`${da}.clientsColContact`)}</Label>
          <Input id={`${baseId}-rep`} value={representativeName} onChange={(e) => setRepresentativeName(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-fn`}>{t(`${da}.clientsColFullName`)}</Label>
          <Input id={`${baseId}-fn`} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-ph`}>{t(`${da}.clientsColPhone`)}</Label>
          <Input id={`${baseId}-ph`} value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-ct`}>{t(`${da}.clientsColCarType`)}</Label>
          <Input id={`${baseId}-ct`} value={carType} onChange={(e) => setCarType(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-cap`}>{t(`${da}.clientsColCapacity`)}</Label>
          <Input id={`${baseId}-cap`} value={carCapacity} onChange={(e) => setCarCapacity(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-tt`}>{t(`${da}.clientsColTruckTypes`)}</Label>
          <TagInput
            id={`${baseId}-tt`}
            tags={truckTags}
            onTagsChange={setTruckTags}
            placeholder={t("registerForm.placeholders.truckTypesCatalog")}
            addLabel={t("registerForm.tagAdd")}
            removeTagAria={t("registerForm.tagRemoveAria")}
            hint={t("registerForm.tagInputHint")}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-dest`}>{t(`${da}.clientsColDestinations`)}</Label>
          <TagInput
            id={`${baseId}-dest`}
            tags={destinationTags}
            onTagsChange={setDestinationTags}
            placeholder={t("registerForm.placeholders.serviceDestinations")}
            addLabel={t("registerForm.tagAdd")}
            removeTagAria={t("registerForm.tagRemoveAria")}
            hint={t("registerForm.tagInputHint")}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-pw`}>{t(`${da}.clientsNewPasswordOptional`)}</Label>
          <Input
            id={`${baseId}-pw`}
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            dir="ltr"
            placeholder="········"
          />
        </div>
      </Modal>
    </>
  );
}

export function DirectoryCarrierActions({
  row,
  listVariant,
  uiVariant = "table",
}: {
  row: ShipmentCompanyDirectoryRow;
  listVariant: "active" | "blacklisted";
  uiVariant?: "table" | "card";
}) {
  const { t } = useI18n();
  const router = useRouter();
  const baseId = useId();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [blacklistOpen, setBlacklistOpen] = useState(false);
  const [unblacklistOpen, setUnblacklistOpen] = useState(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [blacklistPending, setBlacklistPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [company_name, setCompany_name] = useState(row.company_name ?? "");
  const [representative_name, setRepresentative_name] = useState(row.representative_name ?? "");
  const [email, setEmail] = useState(row.email ?? "");
  const [phone, setPhone] = useState(row.phone ?? "");
  const [truck_types, setTruck_types] = useState(row.truck_types ?? "");
  const [destinations, setDestinations] = useState(row.destinations ?? "");

  const resetForm = useCallback(() => {
    setCompany_name(row.company_name ?? "");
    setRepresentative_name(row.representative_name ?? "");
    setEmail(row.email ?? "");
    setPhone(row.phone ?? "");
    setTruck_types(row.truck_types ?? "");
    setDestinations(row.destinations ?? "");
    setFormError(null);
  }, [row]);

  useEffect(() => {
    if (editOpen) resetForm();
  }, [editOpen, resetForm]);

  async function save() {
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/admin/shipment-companies/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: company_name || null,
          representative_name: representative_name || null,
          email: email || null,
          phone: phone || null,
          truck_types: truck_types || null,
          destinations: destinations || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setFormError(errMsg(data.error ?? "GENERIC", t));
        return;
      }
      setEditOpen(false);
      router.refresh();
    } catch {
      setFormError(t(`${da}.clientsErrorGeneric`));
    } finally {
      setSaving(false);
    }
  }

  async function performDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/shipment-companies/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        setDeleteOpen(false);
        setErrorAlert(t(`${da}.tableDeleteError`));
        return;
      }
      setDeleteOpen(false);
      router.refresh();
    } catch {
      setDeleteOpen(false);
      setErrorAlert(t(`${da}.tableDeleteError`));
    } finally {
      setDeleting(false);
    }
  }

  async function performSetBlacklisted(blacklisted: boolean) {
    setBlacklistPending(true);
    try {
      const res = await fetch(`/api/admin/shipment-companies/${row.id}/blacklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blacklisted }),
      });
      if (!res.ok) {
        setBlacklistOpen(false);
        setUnblacklistOpen(false);
        setErrorAlert(t(`${da}.clientsErrorGeneric`));
        return;
      }
      setBlacklistOpen(false);
      setUnblacklistOpen(false);
      router.refresh();
    } catch {
      setBlacklistOpen(false);
      setUnblacklistOpen(false);
      setErrorAlert(t(`${da}.clientsErrorGeneric`));
    } finally {
      setBlacklistPending(false);
    }
  }

  const actionButtons = (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setEditOpen(true)}>
        <Pencil className="size-3.5" aria-hidden />
        {t(`${da}.tableEdit`)}
      </Button>
      {listVariant === "active" ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-1"
          disabled={blacklistPending}
          onClick={() => setBlacklistOpen(true)}
          aria-label={t(`${da}.clientsBlacklistDirectoryAria`)}
        >
          <Ban className="size-3.5" aria-hidden />
          {t(`${da}.clientsBlacklist`)}
        </Button>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-1"
          disabled={blacklistPending}
          onClick={() => setUnblacklistOpen(true)}
          aria-label={t(`${da}.clientsUnblacklistDirectoryAria`)}
        >
          <ShieldCheck className="size-3.5" aria-hidden />
          {t(`${da}.clientsUnblacklist`)}
        </Button>
      )}
      <Button type="button" variant="destructive" size="sm" className="gap-1" disabled={deleting} onClick={() => setDeleteOpen(true)}>
        <Trash2 className="size-3.5" aria-hidden />
        {deleting ? t(`${da}.tableDeleting`) : t(`${da}.tableDelete`)}
      </Button>
    </div>
  );

  return (
    <>
      {uiVariant === "table" ? (
        <td className="p-3 align-top text-start whitespace-nowrap">{actionButtons}</td>
      ) : (
        <div className="mt-3 border-t border-border/80 pt-3">{actionButtons}</div>
      )}

      <ConfirmModal
        open={blacklistOpen}
        title={t(`${da}.clientsBlacklistDialogTitle`)}
        message={t(`${da}.clientsBlacklistConfirmDirectory`)}
        confirmLabel={t(`${da}.clientsBlacklist`)}
        cancelLabel={t(`${da}.clientsCancel`)}
        pendingLabel={t(`${da}.clientsBlacklistPending`)}
        pending={blacklistPending}
        confirmVariant="default"
        onCancel={() => {
          if (!blacklistPending) setBlacklistOpen(false);
        }}
        onConfirm={() => void performSetBlacklisted(true)}
      />

      <ConfirmModal
        open={unblacklistOpen}
        title={t(`${da}.clientsUnblacklistDialogTitle`)}
        message={t(`${da}.clientsUnblacklistConfirmDirectory`)}
        confirmLabel={t(`${da}.clientsUnblacklist`)}
        cancelLabel={t(`${da}.clientsCancel`)}
        pendingLabel={t(`${da}.clientsUnblacklistPending`)}
        pending={blacklistPending}
        confirmVariant="default"
        onCancel={() => {
          if (!blacklistPending) setUnblacklistOpen(false);
        }}
        onConfirm={() => void performSetBlacklisted(false)}
      />

      <ConfirmModal
        open={deleteOpen}
        title={t(`${da}.clientsDeleteDialogTitle`)}
        message={t(`${da}.clientsDeleteConfirmDirectory`)}
        confirmLabel={t(`${da}.tableDelete`)}
        cancelLabel={t(`${da}.clientsCancel`)}
        pendingLabel={t(`${da}.tableDeleting`)}
        pending={deleting}
        onCancel={() => {
          if (!deleting) setDeleteOpen(false);
        }}
        onConfirm={() => void performDelete()}
      />

      <AlertModal
        open={errorAlert != null}
        message={errorAlert ?? ""}
        okLabel={t(`${da}.clientsAlertOk`)}
        onClose={() => setErrorAlert(null)}
      />

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t(`${da}.clientsEditDirectoryTitle`)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              {t(`${da}.clientsCancel`)}
            </Button>
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? t(`${da}.clientsSaving`) : t(`${da}.clientsSave`)}
            </Button>
          </>
        }
      >
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-cn`}>{t(`${da}.clientsColCompanyName`)}</Label>
          <Input id={`${baseId}-cn`} value={company_name} onChange={(e) => setCompany_name(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-rep`}>{t(`${da}.clientsColContact`)}</Label>
          <Input id={`${baseId}-rep`} value={representative_name} onChange={(e) => setRepresentative_name(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-em`}>{t(`${da}.clientsColEmail`)}</Label>
          <Input id={`${baseId}-em`} value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" className="font-mono text-sm" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-ph`}>{t(`${da}.clientsColPhone`)}</Label>
          <Input id={`${baseId}-ph`} value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-tt`}>{t(`${da}.clientsColTruckTypes`)}</Label>
          <Input id={`${baseId}-tt`} value={truck_types} onChange={(e) => setTruck_types(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${baseId}-dest`}>{t(`${da}.clientsColDestinations`)}</Label>
          <Input id={`${baseId}-dest`} value={destinations} onChange={(e) => setDestinations(e.target.value)} />
        </div>
      </Modal>
    </>
  );
}
