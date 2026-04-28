"use client";

import {
  useCallback,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from "react";

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end";
}

export function Popover({
  trigger,
  children,
  open: controlledOpen,
  onOpenChange,
  align = "start",
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const ref = useRef<HTMLDivElement>(null);

  function toggle() {
    const next = !isOpen;
    if (isControlled) {
      onOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }
  }

  const close = useCallback(() => {
    if (isControlled) {
      onOpenChange?.(false);
    } else {
      setInternalOpen(false);
    }
  }, [isControlled, onOpenChange]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, close]);

  const alignClass =
    align === "center"
      ? "left-1/2 -translate-x-1/2"
      : align === "end"
      ? "right-0"
      : "left-0";

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={toggle}>{trigger}</div>
      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 ${alignClass} rounded-lg border border-zinc-200 bg-white p-3 shadow-lg animate-in fade-in`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
