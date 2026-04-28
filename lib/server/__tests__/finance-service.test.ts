import type { User } from "@/types";

// Mock Prisma to simulate a connection failure
jest.mock("@/lib/db/prisma", () => ({
  prisma: {
    financeTransaction: {
      findMany: jest.fn().mockRejectedValue(
        Object.assign(new Error("Can't reach database server"), { name: "PrismaClientKnownRequestError" })
      ),
      create: jest.fn().mockRejectedValue(
        new Error("Can't reach database server")
      ),
    },
    financeProgramBudget: {
      findMany: jest.fn().mockRejectedValue(new Error("Can't reach database server")),
      create: jest.fn().mockRejectedValue(new Error("Can't reach database server")),
    },
  },
}));

// Simulate production mode for these tests
const originalNodeEnv = process.env.NODE_ENV;
beforeAll(() => {
  Object.defineProperty(process.env, "NODE_ENV", { value: "production", writable: true });
});
afterAll(() => {
  Object.defineProperty(process.env, "NODE_ENV", { value: originalNodeEnv, writable: true });
});

import { getTransactions, createTransaction } from "@/lib/server/finance-service";

const adminUser: User = {
  id: "u_admin",
  name: "Admin",
  email: "admin@sxc.ac.id",
  role: "admin",
};

const financeManagerUser: User = {
  id: "u_fin_head",
  name: "Finance Lead",
  email: "finance.lead@sxc.ac.id",
  role: "finance",
  departmentId: "d_finance",
  membershipRole: "manager",
};

describe("finance-service in production mode (no fallback)", () => {
  it("getTransactions throws Service unavailable when DB is down", async () => {
    await expect(
      getTransactions("d_finance", adminUser)
    ).rejects.toThrow("Service unavailable");
  });

  it("createTransaction throws Service unavailable when DB is down", async () => {
    await expect(
      createTransaction(
        {
          title: "Test TX",
          amount: 100000,
          type: "income",
          transactionDate: "2026-01-01",
          departmentId: "d_finance",
        },
        financeManagerUser
      )
    ).rejects.toThrow("Service unavailable");
  });

  it("does NOT silently return stale in-memory data", async () => {
    const result = getTransactions("d_finance", adminUser);
    await expect(result).rejects.toThrow();
  });
});
