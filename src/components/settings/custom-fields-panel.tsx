"use client";

import { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { useCustomFields, useCreateCustomField, useDeleteCustomField, type CustomFieldType } from "@/features/custom-fields/hooks";
import { Panel, PanelHead, PanelBody } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { ApiClientError } from "@/lib/api-client";

const TYPE_LABELS: Record<CustomFieldType, string> = {
  TEXT: "Text",
  NUMBER: "Number",
  DATE: "Date",
  CHECKBOX: "Checkbox",
  SELECT: "Select",
};

export function CustomFieldsPanel() {
  const { data: fields, isLoading } = useCustomFields();
  const createField = useCreateCustomField();
  const deleteField = useDeleteCustomField();

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<CustomFieldType>("TEXT");
  const [optionsRaw, setOptionsRaw] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    const options = type === "SELECT" ? optionsRaw.split(",").map((o) => o.trim()).filter(Boolean) : undefined;
    if (type === "SELECT" && (!options || options.length === 0)) {
      setError("Add at least one option, separated by commas.");
      return;
    }
    createField.mutate(
      { name: name.trim(), type, options },
      {
        onSuccess: () => {
          setAdding(false);
          setName("");
          setOptionsRaw("");
          setType("TEXT");
        },
        onError: (err) => setError(err instanceof ApiClientError ? err.message : "Something went wrong"),
      }
    );
  }

  return (
    <Panel>
      <PanelHead title="Custom fields" />
      <PanelBody className="px-4 pb-[18px] pt-2">
        <p className="mb-3 text-xs text-text-secondary">
          Define extra fields that show up on every task in this workspace.
        </p>

        {isLoading && <p className="text-xs text-text-faint">Loading…</p>}
        {!isLoading && !fields?.length && !adding && (
          <p className="mb-2 text-xs text-text-faint">No custom fields yet.</p>
        )}
        <div className="mb-2 flex flex-col gap-1">
          {fields?.map((f) => (
            <div key={f.id} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-[13px]">
              <span className="flex-1 font-semibold">{f.name}</span>
              <span className="rounded-full bg-bg px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
                {TYPE_LABELS[f.type]}
              </span>
              <button
                onClick={() => deleteField.mutate(f.id)}
                className="text-text-faint hover:text-state-danger"
                aria-label="Delete field"
              >
                <Trash2 className="h-[14px] w-[14px]" />
              </button>
            </div>
          ))}
        </div>

        {adding ? (
          <form onSubmit={submit} className="flex flex-col gap-2.5 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">New field</span>
              <button type="button" onClick={() => setAdding(false)} aria-label="Cancel">
                <X className="h-[14px] w-[14px] text-text-faint" />
              </button>
            </div>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Field name (e.g. Story Points)"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand-blue"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CustomFieldType)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand-blue"
            >
              {(Object.keys(TYPE_LABELS) as CustomFieldType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            {type === "SELECT" && (
              <input
                value={optionsRaw}
                onChange={(e) => setOptionsRaw(e.target.value)}
                placeholder="Options, comma-separated (e.g. Low, Medium, High)"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand-blue"
              />
            )}
            {error && <p className="text-xs text-state-danger">{error}</p>}
            <Button type="submit" size="sm" disabled={createField.isPending} className="w-fit">
              {createField.isPending ? "Adding…" : "Add field"}
            </Button>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-blue"
          >
            <Plus className="h-[14px] w-[14px]" />
            Add custom field
          </button>
        )}
      </PanelBody>
    </Panel>
  );
}
