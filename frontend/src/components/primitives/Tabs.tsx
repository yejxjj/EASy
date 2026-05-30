"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

import { cn } from "@/lib/cn";

export const Tabs = TabsPrimitive.Root;

/**
 * Horizontal scroll on narrow viewports keeps every tab reachable without
 * wrapping (the ref mockup also uses a single-row tab strip).
 */
export const TabsList = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <div className="no-scrollbar -mb-px overflow-x-auto">
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "border-border inline-flex items-center gap-1 border-b text-sm",
        className,
      )}
      {...props}
    />
  </div>
));
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative -mb-px inline-flex h-10 items-center whitespace-nowrap px-3 font-medium",
      "text-fg-muted hover:text-fg transition-colors",
      // Active: brand-coloured underline + darker text (matches ref).
      "data-[state=active]:text-fg data-[state=active]:after:bg-brand",
      "after:absolute after:right-0 after:bottom-0 after:left-0 after:h-[2px] after:bg-transparent after:transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
