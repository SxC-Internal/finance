import { NextRequest, NextResponse } from "next/server";
import { createBudgetSchema, getBudgets, createBudget } from "@/lib/server/finance-service";
import { getRequestUser, RequestAuthError } from "@/lib/server/request-user";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser();

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");

    if (!departmentId) {
      return NextResponse.json({ error: "departmentId is required" }, { status: 400 });
    }

    const budgets = await getBudgets(departmentId, user);

    return NextResponse.json({ success: true, data: budgets });
  } catch (error) {
    if (error instanceof RequestAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to fetch budgets";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser();

    const body = await request.json();
    const input = createBudgetSchema.parse(body);
    const budget = await createBudget(input, user);

    return NextResponse.json({ success: true, data: budget }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to create budget";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
