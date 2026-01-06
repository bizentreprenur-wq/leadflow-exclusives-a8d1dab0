import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Search,
  Globe,
  CheckCircle2,
  Send,
  FileText,
  Zap,
  Chrome,
  Home,
  DollarSign,
  Info,
  HelpCircle,
  LogOut,
  Settings,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { toast } from "sonner";

interface CommandPaletteProps {
  onNavigate?: (tab: string) => void;
  onLogout?: () => void;
}

export default function CommandPalette({ onNavigate, onLogout }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const isDark = html.classList.contains("dark");
    html.classList.toggle("dark", !isDark);
    localStorage.setItem("theme", isDark ? "light" : "dark");
    toast.success(`Switched to ${isDark ? "light" : "dark"} mode`);
  };

  const toolCommands = [
    {
      icon: Search,
      label: "Lead Search",
      shortcut: "⌘1",
      action: () => onNavigate?.("search"),
    },
    {
      icon: Globe,
      label: "Platform Search",
      shortcut: "⌘2",
      action: () => onNavigate?.("platform"),
    },
    {
      icon: CheckCircle2,
      label: "Verify Leads",
      shortcut: "⌘3",
      action: () => onNavigate?.("verify"),
    },
    {
      icon: Send,
      label: "Email Outreach",
      shortcut: "⌘4",
      action: () => onNavigate?.("email"),
    },
    {
      icon: Zap,
      label: "Sequences",
      shortcut: "⌘5",
      action: () => onNavigate?.("sequences"),
    },
    {
      icon: FileText,
      label: "Templates",
      shortcut: "⌘6",
      action: () => onNavigate?.("templates"),
    },
    {
      icon: Chrome,
      label: "Chrome Extension",
      shortcut: "⌘7",
      action: () => onNavigate?.("extension"),
    },
  ];

  const navigationCommands = [
    {
      icon: Home,
      label: "Go to Home",
      action: () => navigate("/"),
    },
    {
      icon: DollarSign,
      label: "View Pricing",
      action: () => navigate("/pricing"),
    },
    {
      icon: Info,
      label: "About Us",
      action: () => navigate("/about"),
    },
    {
      icon: HelpCircle,
      label: "Contact Support",
      action: () => navigate("/contact"),
    },
  ];

  const settingsCommands = [
    {
      icon: document.documentElement.classList.contains("dark") ? Sun : Moon,
      label: "Toggle Theme",
      shortcut: "⌘T",
      action: toggleTheme,
    },
    {
      icon: User,
      label: "View Profile",
      action: () => toast.info("Profile settings coming soon!"),
    },
    {
      icon: LogOut,
      label: "Log Out",
      action: () => onLogout?.(),
    },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Lead Tools">
          {toolCommands.map((cmd) => (
            <CommandItem
              key={cmd.label}
              onSelect={() => runCommand(cmd.action)}
            >
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.label}</span>
              {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          {navigationCommands.map((cmd) => (
            <CommandItem
              key={cmd.label}
              onSelect={() => runCommand(cmd.action)}
            >
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          {settingsCommands.map((cmd) => (
            <CommandItem
              key={cmd.label}
              onSelect={() => runCommand(cmd.action)}
            >
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.label}</span>
              {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
