import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-server";
import { createBudgetSchema, getBudgets, createBudget } from "@/lib/server/finance-service";
import { createUserFromSession } from "@/lib/server/auth-helper";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = createUserFromSession(session.user);

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");

    if (!departmentId) {
      return NextResponse.json({ error: "departmentId is required" }, { status: 400 });
    }

    const budgets = await getBudgets(departmentId, user);

    return NextResponse.json({ success: true, data: budgets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch budgets";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = createUserFromSession(session.user);

    const body = await request.json();
    const input = createBudgetSchema.parse(body);
    const budget = await createBudget(input, user);

    return NextResponse.json({ success: true, data: budget }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to create budget";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
