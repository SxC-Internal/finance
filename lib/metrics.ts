import type { LucideIcon } from "lucide-react";
import {
  Users,
  Briefcase,
  Award,
  FileText,
  DollarSign,
  Activity as ActivityIcon,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Bug,
} from "lucide-react";

export const DEFAULT_METRIC_ICON: LucideIcon = Users;

export const METRIC_ICONS: Record<string, LucideIcon> = {
  users: Users,
  briefcase: Briefcase,
  award: Award,
  "file-text": FileText,
  "dollar-sign": DollarSign,
  activity: ActivityIcon,
  "check-circle": CheckCircle,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  bug: Bug,
};
