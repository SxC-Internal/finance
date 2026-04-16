import { useMemo, useState } from "react";
import type { ReviewItem, User } from "@/types";
import {
  ALL_STATUS_FILTER,
  filterReviews,
  getAccessibleReviews,
  type ReviewStatusFilter,
} from "@/lib/reviews";

export function useDataReview(user: User, reviews: ReviewItem[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatusFilter>(
    ALL_STATUS_FILTER,
  );

  const accessibleReviews = useMemo(
    () => getAccessibleReviews(user, reviews),
    [user, reviews],
  );

  const filteredReviews = useMemo(
    () => filterReviews(accessibleReviews, searchTerm, statusFilter),
    [accessibleReviews, searchTerm, statusFilter],
  );

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    accessibleReviews,
    filteredReviews,
  };
}
