import { NextRequest, NextResponse } from "next/server";
import { updateBudgetSchema, getBudgetById, updateBudget } from "@/lib/server/finance-service";
import { getRequestUser, RequestAuthError } from "@/lib/server/request-user";
import { z } from "zod";

export async function GET(request: NextRequest, { params }: { params: Promise<{ budgetId: string }> }) {
  try {
    const { budgetId } = await params;
    const user = await getRequestUser();
    const budget = await getBudgetById(budgetId, user);

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: budget });
  } catch (error) {
    if (error instanceof RequestAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to fetch budget";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ budgetId: string }> }) {
  try {
    const { budgetId } = await params;
    const user = await getRequestUser();

    const body = await request.json();
    const input = updateBudgetSchema.parse({
      budgetId,
      ...body,
    });

    const budget = await updateBudget(input, user);

    return NextResponse.json({ success: true, data: budget });
  } catch (error) {
    if (error instanceof RequestAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to update budget";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
