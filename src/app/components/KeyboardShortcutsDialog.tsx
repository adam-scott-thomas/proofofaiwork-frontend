import { Command, Search, Plus, Inbox, FolderKanban, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Separator } from "./ui/separator";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  {
    category: "Navigation",
    items: [
      { keys: ["G", "D"], description: "Go to Dashboard" },
      { keys: ["G", "U"], description: "Go to Upload Pool" },
      { keys: ["G", "P"], description: "Go to Projects" },
      { keys: ["G", "C"], description: "Go to Conversations" },
      { keys: ["G", "W"], description: "Go to Work Profile" },
      { keys: ["G", "A"], description: "Go to Assessments" },
    ],
  },
  {
    category: "Actions",
    items: [
      { keys: ["⌘", "K"], description: "Open search" },
      { keys: ["⌘", "N"], description: "Create new project" },
      { keys: ["⌘", "U"], description: "Upload conversation" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
    ],
  },
];

function KeyboardKey({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border border-[rgba(0,0,0,0.15)] bg-[#F5F5F7] px-2 font-mono text-[11px] text-[#3A3A3A]">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Navigate and perform actions faster with keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <div className="mb-3 text-[13px] uppercase tracking-wider text-[#717182]">
                {section.category}
              </div>
              <div className="space-y-2">
                {section.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-1.5">
                    <span className="text-[14px] text-[#3A3A3A]">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <KeyboardKey>{key}</KeyboardKey>
                          {i < item.keys.length - 1 && (
                            <span className="text-[13px] text-[#717182]">then</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {section.category !== shortcuts[shortcuts.length - 1].category && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
        </div>
        <div className="rounded-md bg-[#F5F5F7] p-4 text-[13px] text-[#717182]">
          <strong className="text-[#3A3A3A]">Pro tip:</strong> Press <KeyboardKey>?</KeyboardKey> anytime to view shortcuts
        </div>
      </DialogContent>
    </Dialog>
  );
}
