import type { ReviewItem, ReviewStatus, User } from "@/types";

export const ALL_STATUS_FILTER = "All Status" as const;
export type ReviewStatusFilter = ReviewStatus | typeof ALL_STATUS_FILTER;

export function getAccessibleReviews(user: User, reviews: ReviewItem[]): ReviewItem[] {
  return user.role === "admin"
    ? reviews
    : reviews.filter((r) => r.departmentId === user.departmentId);
}

export function filterReviews(
  reviews: ReviewItem[],
  searchTerm: string,
  statusFilter: ReviewStatusFilter,
): ReviewItem[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return reviews.filter((review) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      review.projectName.toLowerCase().includes(normalizedSearch) ||
      review.id.toLowerCase().includes(normalizedSearch) ||
      review.owner.toLowerCase().includes(normalizedSearch);

    const matchesStatus =
      statusFilter === ALL_STATUS_FILTER || review.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
}

export function getReviewStatusBadgeClass(status: ReviewStatus | string): string {
  switch (status) {
    case "Completed":
      return "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "Pending":
      return "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "In Review":
      return "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400";
    default:
      return "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400";
  }
}
