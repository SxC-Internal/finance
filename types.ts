export type ProgramStatus = 'Active' | 'Upcoming' | 'Completed';
export type UserRole = 'admin' | 'finance' | 'ops' | 'marketing' | 'hr' | 'tech';
export type ReviewStatus = 'Completed' | 'Pending' | 'In Review' | 'Draft';
export type EmailBlastStatus = 'draft' | 'pending_approval' | 'sent' | 'rejected' | 'approved';

// ----- Schema-aligned (dummy DB) types -----

export type UUID = string;

export type DepartmentSlug = Exclude<UserRole, 'admin'>;

export interface DbUser {
  id: UUID;
  name: string;
  email: string;
  password: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DbDepartment {
  id: UUID;
  name: string;
  slug: DepartmentSlug;
  createdAt: string;
}

export type MembershipRole = 'head' | 'manager' | 'member';

export type FinanceRole = 'manager' | 'associate';

export interface DbUserDepartment {
  id: UUID;
  userId: UUID;
  departmentId: UUID;
  role: MembershipRole;
  createdAt: string;
}

export type ExpenseCategory = 'Marketing' | 'Operations' | 'Venue' | 'Catering' | 'Equipment' | 'Travel' | 'Other';

export type FinanceTransactionType = 'income' | 'expense';

export interface DbFinanceTransaction {
  id: UUID;
  title: string;
  amount: number;
  type: FinanceTransactionType;
  transactionDate: string;
  departmentId: UUID;
  createdBy: UUID;
  createdAt: string;
  programBudgetId?: string;
  category?: ExpenseCategory;
}

export interface DbFinanceProgramBudget {
  id: UUID;
  name: string;
  allocatedAmount: number;
  departmentId: UUID;
  createdBy: UUID;
  createdAt: string;
  endDate?: string;
}

export interface DbEmailBlast {
  id: UUID;
  subject: string;
  body: string;
  contentMode: 'text' | 'html';
  senderName?: string;
  senderEmail?: string;
  replyToEmail?: string;
  status: EmailBlastStatus;
  composedBy: UUID;
  approvedBy?: UUID;
  rejectedBy?: UUID;
  rejectionReason?: string;
  sentAt?: string;
  sentCount: number;
  departmentId: UUID;
  createdAt: string;
  isArchived?: boolean;
}

export interface DbEmailBlastRecipient {
  id: UUID;
  blastId: UUID;
  email: string;
}

export type EmailBlastAttachmentKind = 'image' | 'file';

export interface DbEmailBlastAttachment {
  id: UUID;
  blastId: UUID;
  kind: EmailBlastAttachmentKind;
  storageKey: string;
  publicUrl?: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  uploadedBy: UUID;
  createdAt: string;
}

export type HrMemberStatus = 'active' | 'inactive' | 'probation' | 'on_leave';

export interface DbHrMember {
  id: UUID;
  userId: UUID;
  position: string;
  joinDate: string;
  status: HrMemberStatus;
  departmentId: UUID;
  createdAt: string;
}

export interface DbAnalyticsReport {
  id: UUID;
  title: string;
  fileUrl: string;
  departmentId: UUID;
  createdBy: UUID;
  createdAt: string;
}

export interface DbMarketingCampaign {
  id: UUID;
  name: string;
  platform: string;
  budget: number;
  startDate: string;
  endDate: string;
  departmentId: UUID;
  createdAt: string;
}

export type OperationsTaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

export interface DbOperationsTask {
  id: UUID;
  title: string;
  status: OperationsTaskStatus;
  deadline: string;
  assignedTo: UUID;
  departmentId: UUID;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  departmentId?: string; // If null, assume admin/global
  membershipRole?: MembershipRole;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  departmentId: string;
  image: string;
  email: string;
}

export interface Program {
  id: string;
  title: string;
  batch: string;
  participants: number;
  mentors: number;
  status: ProgramStatus;
  progress: number;
  startDate: string;
  description: string;
}

export interface ReviewItem {
  id: string;
  projectName: string;
  owner: string;
  date: string;
  status: ReviewStatus;
  value: string;
  departmentId: string;
}

export interface StatMetric {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: string;
}

export type ChartDatum = {
  name: string;
  [key: string]: number | string;
};

export interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  avatar: string;
}

export interface Department {
  id: string;
  name: string;
  email: string;
  description: string;
  color: string;
  hoverColor: string;
  icon: string;
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  DATA_REVIEW = 'DATA_REVIEW',
  PROGRAMS = 'PROGRAMS',
  MEMBERS = 'MEMBERS',
  SETTINGS = 'SETTINGS',
  FINANCE_DASHBOARD = 'FINANCE_DASHBOARD',
  FINANCE_CAPITAL = 'FINANCE_CAPITAL',
  FINANCE_EMAIL_BLAST = 'FINANCE_EMAIL_BLAST'
}

export type Theme = 'dark' | 'light';

// --- Finance-specific types for enhanced UI ---

export interface FinancialChartDatum {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface EmailMetricsTimeSeries {
  date: string;
  openRate: number;
  replyRate: number;
  sentCount: number;
}

export interface BudgetAlert {
  type: 'over_budget' | 'low_balance' | 'overspent';
  programBudgetId: string;
  programName: string;
  severity: 'high' | 'medium';
}

// Extended view models for UI
export interface ProgramBudgetViewModel {
  id: string;
  name: string;
  allocatedAmount: number;
  spent: number;
  remaining: number;
  expenses: DbFinanceTransaction[];
  isOverBudget: boolean;
  endDate?: string;
  utilizationPercentage: number;
}

export interface CapitalOverviewViewModel {
  totalIncome: number;
  totalExpenses: number;
  totalAllocated: number;
  remaining: number;
  incomeChangePercent: number;
  expenseChangePercent: number;
  previousPeriodIncome: number;
  previousPeriodExpenses: number;
}

export interface FinancialStatCardData {
  label: string;
  value: number;
  formattedValue: string;
  changePercent: number;
  icon: React.ReactNode;
  sparklineData: { month: string; value: number }[];
  trendUp?: boolean;
}

export interface ActivityFeedItem {
  id: string;
  user: string;
  userAvatar: string;
  action: 'income' | 'expense' | 'blast_sent' | 'blast_approved' | 'blast_rejected' | 'budget_allocated';
  target: string;
  time: string;
  timestamp: Date;
  metadata?: {
    amount?: number;
    status?: string;
    programName?: string;
  };
}