/**
 * Map a product-icon string (chosen by the backend, see scenarios.py) to a
 * concrete `lucide-react` component. Named imports only — keeps the bundle
 * tree-shakable.
 */

import {
  Activity,
  Camera,
  Cpu,
  Headphones,
  Laptop,
  type LucideIcon,
  Package,
  Refrigerator,
  Shield,
  Smartphone,
  Tv,
  WashingMachine,
  Wind,
  Zap,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Wind,
  Refrigerator,
  Activity,
  Camera,
  Tv,
  Smartphone,
  Laptop,
  Headphones,
  WashingMachine,
  Cpu,
  Shield,
  Zap,
};

export function iconForName(name: string | undefined | null): LucideIcon {
  if (!name) return Package;
  return ICON_MAP[name] ?? Package;
}
