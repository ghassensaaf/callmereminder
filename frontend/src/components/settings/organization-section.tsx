"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Building2, Users, UserPlus, Check } from "lucide-react";

import { Button, Card, Input, Badge } from "@/components/ui";
import { organizationApi, settingsApi } from "@/lib/api";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function OrganizationSection() {
  const queryClient = useQueryClient();
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin" | "owner">("member");
  const [isCreating, setIsCreating] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get(),
  });
  const { data: orgs } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => organizationApi.list(),
  });
  const { data: activeOrg, isLoading: activeOrgLoading } = useQuery({
    queryKey: ["active-organization", settings?.activeOrganizationId],
    queryFn: () => organizationApi.getFull(),
    enabled: !!settings?.activeOrganizationId,
  });
  const { data: myInvitations } = useQuery({
    queryKey: ["my-invitations"],
    queryFn: () => organizationApi.listUserInvitations(),
  });

  const effectiveSlug = useMemo(
    () => (orgSlug.trim() ? slugify(orgSlug) : slugify(orgName)),
    [orgName, orgSlug]
  );

  async function refreshOrgData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["settings"] }),
      queryClient.invalidateQueries({ queryKey: ["organizations"] }),
      queryClient.invalidateQueries({ queryKey: ["active-organization"] }),
      queryClient.invalidateQueries({ queryKey: ["my-invitations"] }),
    ]);
  }

  async function createOrganization() {
    if (!orgName.trim()) {
      toast.error("Organization name is required");
      return;
    }
    if (!effectiveSlug) {
      toast.error("Organization slug is required");
      return;
    }
    setIsCreating(true);
    try {
      await organizationApi.create({ name: orgName.trim(), slug: effectiveSlug });
      toast.success("Organization created");
      setOrgName("");
      setOrgSlug("");
      await refreshOrgData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data?.detail || "Failed to create organization");
    } finally {
      setIsCreating(false);
    }
  }

  async function setActiveOrganization(organizationId: string) {
    try {
      await organizationApi.setActive(organizationId);
      await refreshOrgData();
      toast.success("Active organization updated");
    } catch {
      toast.error("Failed to switch organization");
    }
  }

  async function inviteMember() {
    if (!inviteEmail.trim()) {
      toast.error("Invite email is required");
      return;
    }
    setIsInviting(true);
    try {
      await organizationApi.inviteMember({
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setInviteEmail("");
      await refreshOrgData();
      toast.success("Invitation sent");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data?.detail || "Failed to invite member");
    } finally {
      setIsInviting(false);
    }
  }

  async function respondInvitation(invitationId: string, action: "accept" | "reject") {
    try {
      if (action === "accept") {
        await organizationApi.acceptInvitation(invitationId);
      } else {
        await organizationApi.rejectInvitation(invitationId);
      }
      await refreshOrgData();
      toast.success(action === "accept" ? "Invitation accepted" : "Invitation rejected");
    } catch {
      toast.error("Failed to update invitation");
    }
  }

  return (
    <Card variant="elevated" className="p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Organization & members
        </h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          Create organizations, invite team members, and choose the active organization for shared company settings.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
        <p className="text-sm font-medium text-surface-800 dark:text-surface-100">Create organization</p>
        <Input label="Name" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Acme Inc." />
        <Input
          label="Slug"
          value={orgSlug}
          onChange={(e) => setOrgSlug(e.target.value)}
          placeholder="acme-inc"
          hint={`Will be saved as: ${effectiveSlug || "—"}`}
        />
        <Button type="button" isLoading={isCreating} onClick={createOrganization}>
          Create organization
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-surface-800 dark:text-surface-100">Your organizations</p>
        {(orgs ?? []).length === 0 ? (
          <p className="text-sm text-surface-500 dark:text-surface-400">No organizations yet.</p>
        ) : (
          <div className="space-y-2">
            {(orgs ?? []).map((org) => {
              const isActive = settings?.activeOrganizationId === org.id;
              return (
                <div
                  key={org.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-50 dark:bg-surface-900/40 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{org.name}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">{org.slug}</p>
                  </div>
                  {isActive ? (
                    <Badge variant="success" size="sm">
                      <Check className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Button type="button" size="sm" variant="outline" onClick={() => setActiveOrganization(org.id)}>
                      Set active
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {settings?.activeOrganizationId && (
        <div className="space-y-3 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
          <p className="text-sm font-medium text-surface-800 dark:text-surface-100 flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invite team member
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <Input
                label="Email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="member@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Role</label>
              <select
                className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2.5 text-sm"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "member" | "admin" | "owner")}
              >
                <option value="member">member</option>
                <option value="admin">admin</option>
                <option value="owner">owner</option>
              </select>
            </div>
          </div>
          <Button type="button" isLoading={isInviting} onClick={inviteMember}>
            Send invitation
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium text-surface-800 dark:text-surface-100">Your pending invitations</p>
        {(myInvitations ?? []).filter((i) => i.status === "pending").length === 0 ? (
          <p className="text-sm text-surface-500 dark:text-surface-400">No pending invitations.</p>
        ) : (
          <div className="space-y-2">
            {(myInvitations ?? [])
              .filter((i) => i.status === "pending")
              .map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-50 dark:bg-surface-900/40 px-3 py-2"
                >
                  <div>
                    <p className="text-sm text-surface-900 dark:text-surface-100">{invite.email}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      role: {invite.role}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => respondInvitation(invite.id, "reject")}>
                      Reject
                    </Button>
                    <Button type="button" size="sm" onClick={() => respondInvitation(invite.id, "accept")}>
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {settings?.activeOrganizationId && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-surface-800 dark:text-surface-100 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Active organization members
          </p>
          {activeOrgLoading ? (
            <p className="text-sm text-surface-500 dark:text-surface-400">Loading members...</p>
          ) : (
            <div className="space-y-2">
              {(activeOrg?.members ?? []).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg bg-surface-50 dark:bg-surface-900/40 px-3 py-2 text-sm"
                >
                  <span className="text-surface-900 dark:text-surface-100">
                    {m.user?.name || m.user?.email || m.userId}
                  </span>
                  <Badge size="sm" variant="outline">
                    {m.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
