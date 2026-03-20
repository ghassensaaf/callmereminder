"use client";

import { useState } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Phone, Plus, Trash2, Star, Pencil, Check, X } from "lucide-react";

import { Button, Input, Card, Badge } from "@/components/ui";
import { settingsApi, vapiConfigsApi } from "@/lib/api";
import type { VapiConfigDto, VapiPhoneNumberDto } from "@/types/vapi-config";

function shortId(id: string) {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export function VapiConfigSection() {
  const queryClient = useQueryClient();
  const [addingConfig, setAddingConfig] = useState(false);
  const [newConfigName, setNewConfigName] = useState("");
  const [newConfigKey, setNewConfigKey] = useState("");
  const [newConfigAsDefault, setNewConfigAsDefault] = useState(false);

  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editKey, setEditKey] = useState("");

  const [addNumberFor, setAddNumberFor] = useState<string | null>(null);
  const [newPhoneId, setNewPhoneId] = useState("");
  const [newPhoneNickname, setNewPhoneNickname] = useState("");
  const [newPhoneAsDefault, setNewPhoneAsDefault] = useState(false);

  const [editingNumber, setEditingNumber] = useState<{ id: string; nickname: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["vapi-configs"],
    queryFn: () => vapiConfigsApi.list(),
  });

  const configs = data?.configs ?? [];
  const hasNumbers = configs.some((c) => c.numbers.length > 0);

  async function refreshAll() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["vapi-configs"] }),
      queryClient.invalidateQueries({ queryKey: ["settings"] }),
    ]);
  }

  async function handleAddConfig() {
    const name = newConfigName.trim();
    const key = newConfigKey.trim();
    if (!name || !key) {
      toast.error("Name and API key are required");
      return;
    }
    try {
      await vapiConfigsApi.create({
        name,
        vapiApiKey: key,
        is_default: configs.length === 0 || newConfigAsDefault,
      });
      toast.success("Configuration added");
      setAddingConfig(false);
      setNewConfigName("");
      setNewConfigKey("");
      setNewConfigAsDefault(false);
      await refreshAll();
    } catch (err) {
      toast.error(axios.isAxiosError(err) ? err.response?.data?.detail || "Failed" : "Failed");
    }
  }

  async function handleSaveConfig(config: VapiConfigDto) {
    try {
      await vapiConfigsApi.update(config.id, {
        name: editName.trim() || config.name,
        ...(editKey.trim() ? { vapiApiKey: editKey.trim() } : {}),
      });
      toast.success("Saved");
      setEditingConfig(null);
      setEditKey("");
      await refreshAll();
    } catch (err) {
      toast.error(axios.isAxiosError(err) ? err.response?.data?.detail || "Failed" : "Failed");
    }
  }

  async function handleDeleteConfig(id: string) {
    if (!confirm("Delete this configuration and all its numbers?")) return;
    try {
      await vapiConfigsApi.delete(id);
      toast.success("Deleted");
      await refreshAll();
    } catch (err) {
      toast.error("Failed to delete");
    }
  }

  async function handleSetDefaultConfig(id: string) {
    try {
      await vapiConfigsApi.setDefaultConfig(id);
      toast.success("Default account updated");
      await refreshAll();
    } catch (err) {
      toast.error("Failed");
    }
  }

  async function handleAddNumber(configId: string) {
    const pid = newPhoneId.trim();
    if (!pid) {
      toast.error("Vapi phone number ID is required");
      return;
    }
    try {
      await vapiConfigsApi.addNumber(configId, {
        vapiPhoneNumberId: pid,
        nickname: newPhoneNickname.trim() || "Line",
        is_default: newPhoneAsDefault,
      });
      toast.success("Number added (validated with Vapi)");
      setAddNumberFor(null);
      setNewPhoneId("");
      setNewPhoneNickname("");
      setNewPhoneAsDefault(false);
      await refreshAll();
    } catch (err) {
      toast.error(axios.isAxiosError(err) ? err.response?.data?.detail || "Validation failed" : "Failed");
    }
  }

  async function handleSaveNickname() {
    if (!editingNumber) return;
    try {
      await vapiConfigsApi.updateNumber(editingNumber.id, {
        nickname: editingNumber.nickname.trim(),
      });
      toast.success("Updated");
      setEditingNumber(null);
      await refreshAll();
    } catch (err) {
      toast.error("Failed to update");
    }
  }

  async function handleSetDefaultNumber(numberId: string) {
    try {
      await vapiConfigsApi.updateNumber(numberId, { set_default: true });
      toast.success("Default line updated");
      await refreshAll();
    } catch (err) {
      toast.error("Failed");
    }
  }

  async function handleDeleteNumber(numberId: string) {
    if (!confirm("Remove this number from the configuration?")) return;
    try {
      await vapiConfigsApi.deleteNumber(numberId);
      toast.success("Removed");
      await refreshAll();
    } catch (err) {
      toast.error("Failed");
    }
  }

  async function removeAllVapi() {
    if (!confirm("Remove all Vapi integrations? Reminders will not call until you add a config again.")) return;
    try {
      await settingsApi.delete();
      await refreshAll();
      toast.success("All Vapi data removed");
    } catch {
      toast.error("Failed");
    }
  }

  return (
    <Card variant="elevated" className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Vapi integrations
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1 max-w-xl">
            Each configuration has a name and API key. Add multiple outbound numbers per key; each is validated with
            Vapi before saving. Set a default account and a default number per account. New reminders use the default
            line unless you pick another.
          </p>
        </div>
        {!isLoading &&
          (hasNumbers ? (
            <Badge variant="success" dot>
              Ready to call
            </Badge>
          ) : (
            <Badge variant="warning" dot>
              Add a number
            </Badge>
          ))}
      </div>

      <div className="space-y-4">
        {!addingConfig ? (
          <Button type="button" variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setAddingConfig(true)}>
            Add configuration
          </Button>
        ) : (
          <div className="rounded-xl border border-surface-200 dark:border-surface-700 p-4 space-y-3 bg-surface-50/50 dark:bg-surface-900/30">
            <p className="text-sm font-medium text-surface-800 dark:text-surface-100">New configuration</p>
            <Input label="Display name" placeholder="e.g. Personal, Work" value={newConfigName} onChange={(e) => setNewConfigName(e.target.value)} />
            <Input
              label="Vapi API key"
              type="password"
              placeholder="sk-..."
              value={newConfigKey}
              onChange={(e) => setNewConfigKey(e.target.value)}
            />
            {configs.length > 0 && (
              <label className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
                <input type="checkbox" checked={newConfigAsDefault} onChange={(e) => setNewConfigAsDefault(e.target.checked)} />
                Make this the default account for new reminders
              </label>
            )}
            <div className="flex gap-2">
              <Button type="button" onClick={handleAddConfig}>
                Save
              </Button>
              <Button type="button" variant="ghost" onClick={() => setAddingConfig(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isLoading && <p className="text-sm text-surface-500">Loading…</p>}

        {configs.map((config) => (
          <div
            key={config.id}
            className="rounded-xl border border-surface-200 dark:border-surface-700 p-4 space-y-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-surface-900 dark:text-surface-50">{config.name}</h3>
                  {config.is_default && (
                    <Badge variant="primary" size="sm">
                      <Star className="h-3 w-3 mr-0.5 fill-current" />
                      Default account
                    </Badge>
                  )}
                </div>
                <p className="text-xs font-mono text-surface-500 dark:text-surface-400">
                  API key: {config.api_key_masked ?? "—"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!config.is_default && (
                  <Button type="button" variant="outline" size="sm" onClick={() => handleSetDefaultConfig(config.id)}>
                    Set default account
                  </Button>
                )}
                {editingConfig !== config.id ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<Pencil className="h-3.5 w-3.5" />}
                    onClick={() => {
                      setEditingConfig(config.id);
                      setEditName(config.name);
                      setEditKey("");
                    }}
                  >
                    Edit
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-danger-600 dark:text-danger-400 border-danger-200 dark:border-danger-800"
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={() => handleDeleteConfig(config.id)}
                >
                  Delete
                </Button>
              </div>
            </div>

            {editingConfig === config.id && (
              <div className="pt-2 border-t border-surface-200 dark:border-surface-700 space-y-2">
                <Input label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                <Input
                  label="New API key (optional)"
                  type="password"
                  hint="Must work with every number below; leave blank to keep current key"
                  value={editKey}
                  onChange={(e) => setEditKey(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" leftIcon={<Check className="h-4 w-4" />} onClick={() => handleSaveConfig(config)}>
                    Save changes
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    leftIcon={<X className="h-4 w-4" />}
                    onClick={() => setEditingConfig(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-medium text-surface-500 uppercase tracking-wide">Outbound numbers</p>
              {config.numbers.length === 0 ? (
                <p className="text-sm text-surface-500">No numbers yet — add one to place calls from this account.</p>
              ) : (
                <ul className="space-y-2">
                  {config.numbers.map((n: VapiPhoneNumberDto) => (
                    <li
                      key={n.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-50 dark:bg-surface-900/40 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        {editingNumber?.id === n.id ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              className="rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-900 px-2 py-1 text-sm flex-1 min-w-[8rem]"
                              value={editingNumber.nickname}
                              onChange={(e) => setEditingNumber({ id: n.id, nickname: e.target.value })}
                            />
                            <Button type="button" variant="primary" size="sm" onClick={handleSaveNickname}>
                              Save
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setEditingNumber(null)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="font-medium text-surface-900 dark:text-surface-100">{n.nickname}</span>
                            {n.is_default && (
                              <Badge variant="success" size="sm" className="ml-2">
                                Default line
                              </Badge>
                            )}
                            <p className="text-xs font-mono text-surface-500 truncate mt-0.5" title={n.vapi_phone_number_id}>
                              {shortId(n.vapi_phone_number_id)}
                            </p>
                          </>
                        )}
                      </div>
                      {editingNumber?.id !== n.id && (
                        <div className="flex flex-wrap gap-1">
                          {!n.is_default && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleSetDefaultNumber(n.id)}>
                              Set default line
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            leftIcon={<Pencil className="h-3.5 w-3.5" />}
                            onClick={() => setEditingNumber({ id: n.id, nickname: n.nickname })}
                          >
                            Rename
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-danger-600 dark:text-danger-400"
                            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                            onClick={() => handleDeleteNumber(n.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {addNumberFor === config.id ? (
              <div className="rounded-lg border border-dashed border-surface-300 dark:border-surface-600 p-3 space-y-2">
                <p className="text-sm font-medium">Add number</p>
                <Input
                  label="Vapi phone number ID (UUID)"
                  placeholder="From Vapi dashboard → Phone numbers"
                  value={newPhoneId}
                  onChange={(e) => setNewPhoneId(e.target.value)}
                />
                <Input label="Nickname" placeholder="e.g. Main, Support" value={newPhoneNickname} onChange={(e) => setNewPhoneNickname(e.target.value)} />
                <label className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
                  <input type="checkbox" checked={newPhoneAsDefault} onChange={(e) => setNewPhoneAsDefault(e.target.checked)} />
                  Default line for this account
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={() => handleAddNumber(config.id)}>
                    Validate & add
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setAddNumberFor(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => {
                  setAddNumberFor(config.id);
                  setNewPhoneAsDefault(config.numbers.length === 0);
                }}
              >
                Add number
              </Button>
            )}
          </div>
        ))}

        {configs.length > 0 && (
          <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
            <Button type="button" variant="ghost" size="sm" className="text-danger-600 dark:text-danger-400" onClick={removeAllVapi}>
              Remove all Vapi integrations
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
