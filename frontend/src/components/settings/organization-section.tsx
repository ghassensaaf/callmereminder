"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Building2, Users, UserPlus } from "lucide-react";

import { Button, Card, Input, Badge } from "@/components/ui";
import { organizationApi, settingsApi } from "@/lib/api";

function canInvite(role: string | null | undefined) {
  return role === "owner" || role === "admin";
}

export function OrganizationSection() {
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const [isInviting, setIsInviting] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get(),
  });

  const { data: orgDetails, isLoading: orgDetailsLoading } = useQuery({
    queryKey: ["organization-full", settings?.organizationId],
    queryFn: () => organizationApi.getFull(settings!.organizationId!),
    enabled: !!settings?.organizationId,
  });

  const { data: myInvitations } = useQuery({
    queryKey: ["my-invitations"],
    queryFn: () => organizationApi.listUserInvitations(),
  });

  async function refreshOrgData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["settings"] }),
      queryClient.invalidateQueries({ queryKey: ["organization-full"] }),
      queryClient.invalidateQueries({ queryKey: ["my-invitations"] }),
    ]);
  }

  async function inviteMember() {
    if (!inviteEmail.trim()) {
      toast.error("Invite email is required");
      return;
    }
    if (!settings?.organizationId) {
      toast.error("No organization");
      return;
    }
    setIsInviting(true);
    try {
      await organizationApi.inviteMember({
        email: inviteEmail.trim(),
        role: inviteRole,
        organizationId: settings.organizationId,
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

  const hasOrg = !!settings?.organizationId;
  const role = settings?.organizationRole;

  return (
    <Card variant="elevated" className="p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Organization & members
        </h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          Your account belongs to one organization. Shared settings (Vapi, prompts, templates) apply to everyone in this
          workspace.
        </p>
      </div>

      {hasOrg && (
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 p-4 space-y-1">
          <p className="text-sm font-medium text-surface-800 dark:text-surface-100">{settings?.organizationName}</p>
          <p className="text-xs text-surface-500 dark:text-surface-400">{settings?.organizationSlug}</p>
          <Badge variant="outline" size="sm" className="mt-2">
            Your role: {role}
          </Badge>
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
                    <p className="text-xs text-surface-500 dark:text-surface-400">role: {invite.role}</p>
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

      {hasOrg && canInvite(role) && (
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
                onChange={(e) => setInviteRole(e.target.value as "member" | "admin")}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <Button type="button" isLoading={isInviting} onClick={inviteMember}>
            Send invitation
          </Button>
        </div>
      )}

      {hasOrg && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-surface-800 dark:text-surface-100 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </p>
          {orgDetailsLoading ? (
            <p className="text-sm text-surface-500 dark:text-surface-400">Loading members...</p>
          ) : (
            <div className="space-y-2">
              {(orgDetails?.members ?? []).map((m) => (
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
