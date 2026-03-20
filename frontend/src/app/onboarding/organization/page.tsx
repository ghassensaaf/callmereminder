"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Building2, Mail } from "lucide-react";
import Image from "next/image";

import { AuthGuard } from "@/components/auth-guard";
import { Button, Card, Input, Badge } from "@/components/ui";
import { organizationApi, settingsApi } from "@/lib/api";
import { signOut, useSession } from "@/lib/auth-client";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export default function OrganizationOnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const effectiveSlug = useMemo(
    () => (orgSlug.trim() ? slugify(orgSlug) : slugify(orgName)),
    [orgName, orgSlug]
  );

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get(),
    enabled: !!session,
  });

  useEffect(() => {
    if (settings?.organizationId) {
      router.replace("/dashboard");
    }
  }, [settings?.organizationId, router]);

  const { data: invitations } = useQuery({
    queryKey: ["my-invitations"],
    queryFn: () => organizationApi.listUserInvitations(),
  });

  const pendingInvitations = (invitations ?? []).filter((i) => i.status === "pending");

  async function handleCreate() {
    if (!orgName.trim()) {
      toast.error("Organization name is required");
      return;
    }
    if (!effectiveSlug) {
      toast.error("A valid slug is required");
      return;
    }
    setIsCreating(true);
    try {
      await organizationApi.create({ name: orgName.trim(), slug: effectiveSlug });
      await queryClient.refetchQueries({ queryKey: ["settings"] });
      toast.success("Organization created");
      router.replace("/dashboard");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.response?.data?.detail || "Failed to create organization"
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleAccept(invitationId: string) {
    try {
      await organizationApi.acceptInvitation(invitationId);
      await queryClient.refetchQueries({ queryKey: ["settings"] });
      await queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
      toast.success("Invitation accepted — welcome to the team!");
      router.replace("/dashboard");
    } catch {
      toast.error("Failed to accept invitation");
    }
  }

  async function handleReject(invitationId: string) {
    try {
      await organizationApi.rejectInvitation(invitationId);
      await queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
      toast.success("Invitation declined");
    } catch {
      toast.error("Failed to decline invitation");
    }
  }

  return (
    <AuthGuard requireOrg={false}>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <Link href="/" className="flex items-center gap-3 justify-center mb-8 group">
            <Image
              src="/logo.png"
              alt="Dialcues"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
              priority
            />
            <span className="font-display font-bold text-xl text-surface-900 dark:text-surface-50">
              Dialcues
            </span>
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50 mb-2">
              Set up your organization
            </h1>
            <p className="text-surface-500 dark:text-surface-400">
              Every Dialcues account belongs to an organization. Create one for your company or join an existing team.
            </p>
          </div>

          {pendingInvitations.length > 0 && (
            <Card variant="elevated" className="p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <h2 className="font-semibold text-surface-900 dark:text-surface-50">
                  Pending invitations
                </h2>
              </div>
              <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                You&apos;ve been invited to join an organization. Accept to get started immediately.
              </p>
              <div className="space-y-3">
                {pendingInvitations.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-200 dark:border-surface-700 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                        {invite.email}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge size="sm" variant="outline">{invite.role}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(invite.id)}
                      >
                        Decline
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAccept(invite.id)}
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card variant="elevated" className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <h2 className="font-semibold text-surface-900 dark:text-surface-50">
                {pendingInvitations.length > 0 ? "Or create a new organization" : "Create your organization"}
              </h2>
            </div>
            <div className="space-y-4">
              <Input
                label="Organization name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Inc."
              />
              <Input
                label="Slug"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                placeholder="acme-inc"
                hint={`URL identifier: ${effectiveSlug || "—"}`}
              />
              <Button
                type="button"
                className="w-full"
                isLoading={isCreating}
                onClick={handleCreate}
              >
                Create organization
              </Button>
            </div>
          </Card>

          <p className="mt-6 text-center text-sm text-surface-500 dark:text-surface-400">
            Wrong account?{" "}
            <button
              type="button"
              onClick={() =>
                signOut({ fetchOptions: { onSuccess: () => window.location.assign("/login") } })
              }
              className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
            >
              Sign out
            </button>
          </p>
        </motion.div>
      </div>
    </AuthGuard>
  );
}
