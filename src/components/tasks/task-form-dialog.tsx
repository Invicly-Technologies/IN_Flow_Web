"use client";

import { Plus } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ComposerForm } from "@/components/tasks/inline-composer";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string | null;
  defaultDueDate?: string | null; // "YYYY-MM-DD"
}

export function TaskFormDialog({ open, onOpenChange, defaultProjectId = null, defaultDueDate = null }: TaskFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Create new task"
        description="Turn your ideas into action."
        icon={<Plus className="h-5 w-5" />}
        className="w-[480px]"
      >
        <ComposerForm
          defaults={{ projectId: defaultProjectId, dueDate: defaultDueDate }}
          onClose={() => onOpenChange(false)}
          bordered={false}
        />
      </DialogContent>
    </Dialog>
  );
}
