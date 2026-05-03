import { NextRequest, NextResponse } from "next/server";
import { createTransactionSchema, getTransactions, createTransaction } from "@/lib/server/finance-service";
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

    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const type = (searchParams.get("type") as "income" | "expense") || undefined;

    const transactions = await getTransactions(departmentId, user, {
      startDate,
      endDate,
      type,
    });

    return NextResponse.json({ success: true, data: transactions });
  } catch (error) {
    if (error instanceof RequestAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Failed to fetch transactions";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser();

    const body = await request.json();
    const input = createTransactionSchema.parse(body);
    const transaction = await createTransaction(input, user);

    return NextResponse.json({ success: true, data: transaction }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to create transaction";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
