import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { updateBudgetSchema, getBudgetById, updateBudget } from "@/lib/server/finance-service";
import { createUserFromSession } from "@/lib/server/auth-helper";
import { z } from "zod";

export async function GET(request: NextRequest, { params }: { params: Promise<{ budgetId: string }> }) {
  try {
    const { budgetId } = await params;
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = createUserFromSession(session.user);

    const budget = await getBudgetById(budgetId, user);

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: budget });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch budget";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ budgetId: string }> }) {
  try {
    const { budgetId } = await params;
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = createUserFromSession(session.user);

    const body = await request.json();
    const input = updateBudgetSchema.parse({
      budgetId,
      ...body,
    });

    const budget = await updateBudget(input, user);

    return NextResponse.json({ success: true, data: budget });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to update budget";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
