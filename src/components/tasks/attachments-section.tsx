"use client";

import { useRef } from "react";
import { Paperclip, X, Download } from "lucide-react";
import type { TaskDTO } from "@/types/task";
import { useAppStore } from "@/features/app/store/app-store";
import { useUploadAttachment, useDeleteAttachment } from "@/features/tasks/hooks";

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsSection({ task }: { task: TaskDTO }) {
  const pushToast = useAppStore((s) => s.pushToast);
  const upload = useUploadAttachment();
  const remove = useDeleteAttachment();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    upload.mutate(
      { taskId: task.id, file },
      { onError: (err) => pushToast({ message: err instanceof Error ? err.message : "Upload failed" }) }
    );
  }

  return (
    <div>
      {task.attachments.length === 0 && (
        <div className="py-1.5 text-xs text-text-secondary">No attachments yet.</div>
      )}
      {task.attachments.map((a) => (
        <div key={a.id} className="flex items-center gap-[9px] py-1.5 text-[13.5px]">
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            download={a.fileName}
            className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-text hover:text-brand-blue"
          >
            <Download className="h-[13px] w-[13px] shrink-0" />
            <span className="truncate">{a.fileName}</span>
          </a>
          <span className="shrink-0 text-[11px] text-text-faint">{fmtSize(a.sizeBytes)}</span>
          <button
            onClick={() => remove.mutate({ taskId: task.id, attachmentId: a.id })}
            className="text-text-faint hover:text-state-danger"
            aria-label="Delete attachment"
          >
            <X className="h-[14px] w-[14px]" />
          </button>
        </div>
      ))}

      <input ref={fileInputRef} type="file" onChange={onFileChosen} className="hidden" />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={upload.isPending}
        className="mt-1 flex items-center gap-[9px] py-1 text-[12.5px] font-semibold text-text-secondary hover:text-brand-blue disabled:opacity-60"
      >
        <Paperclip className="h-[13px] w-[13px]" />
        {upload.isPending ? "Uploading…" : "Attach a file"}
      </button>
    </div>
  );
}
