"use client";

import { AlertCircle, LucideIcon } from "lucide-react";

interface ErrorStateProps {
  title: string;
  message: string;
  icon?: LucideIcon;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export default function ErrorState({
  title,
  message,
  icon: Icon = AlertCircle,
  onAction,
  actionLabel = "Try again",
  className = "w-full h-full min-h-[300px]",
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-6 text-center animate-fade-in ${className}`}
    >
      {/* Icon Graphic Bracket */}
      <div className="p-4 bg-destructive/10 rounded-full text-destructive mb-4 border border-destructive/10">
        <Icon className="w-6 h-6" />
      </div>

      {/* Typography Footprint */}
      <h3 className="text-sm font-semibold text-foreground tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground max-w-xs mt-1.5 leading-relaxed">
        {message}
      </p>

      {/* Optional Interactive Recovery Action */}
      {onAction && (
        <button
          onClick={onAction}
          type="button"
          className="mt-5 px-4 py-1.5 text-xs font-medium text-foreground bg-secondary hover:bg-secondary/80 border border-border rounded-xl transition-all duration-200 active:scale-95 shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
