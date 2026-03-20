"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FileText, Plus, Trash2 } from "lucide-react";

import { Button, Input, Textarea, Card, Modal } from "@/components/ui";
import { settingsApi, templatesApi } from "@/lib/api";

export function TemplatesSection() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get(),
  });
  const canManage =
    settings?.organizationRole === "owner" || settings?.organizationRole === "admin";

  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: () => templatesApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; message: string }) => templatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template created");
      setIsCreateOpen(false);
      setNewTitle("");
      setNewMessage("");
    },
    onError: () => toast.error("Failed to create template"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => templatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template deleted");
    },
    onError: () => toast.error("Failed to delete template"),
  });

  const handleCreate = () => {
    if (!newTitle.trim() || !newMessage.trim()) {
      toast.error("Title and message required");
      return;
    }
    createMutation.mutate({ title: newTitle.trim(), message: newMessage.trim() });
  };

  return (
    <>
      <Card variant="elevated" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reminder Templates
          </h2>
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              Add template
            </Button>
          )}
        </div>
        <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
          Organization-wide templates: shared title and message presets for reminders. Only owners and admins can add or
          remove templates.
        </p>
        {!canManage && (
          <p className="text-sm text-surface-600 dark:text-surface-300 mb-4">
            You can browse templates below; ask an owner or admin to edit them.
          </p>
        )}

        {isLoading ? (
          <p className="text-sm text-surface-500">Loading...</p>
        ) : !templates?.length ? (
          <p className="text-sm text-surface-500 dark:text-surface-400">
            No templates yet. Create one to quickly reuse title and message when making reminders.
          </p>
        ) : (
          <ul className="space-y-3">
            {templates.map((t) => (
              <li
                key={t.id}
                className="flex items-start justify-between gap-4 p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-700"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-surface-900 dark:text-surface-50 truncate">{t.title}</p>
                  <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-2 mt-0.5">{t.message}</p>
                </div>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger-600 dark:text-danger-400 shrink-0"
                    onClick={() => deleteMutation.mutate(t.id)}
                    isLoading={deleteMutation.isPending}
                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  >
                    Delete
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setNewTitle("");
          setNewMessage("");
        }}
        title="Add template"
        description="Save a title and message to reuse when creating reminders"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="e.g., Call mom"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Textarea
            label="Message"
            placeholder="The message that will be spoken..."
            rows={4}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              isLoading={createMutation.isPending}
              disabled={!newTitle.trim() || !newMessage.trim()}
            >
              Save template
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
