import { NextRequest } from "next/server";

// Mock auth to return a test session
jest.mock("@/lib/auth-server", () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

// Mock analytics service
jest.mock("@/lib/server/analytics-service", () => ({
  getReports: jest.fn(),
  createReport: jest.fn(),
  approveReport: jest.fn(),
  revokeReport: jest.fn(),
  createReportSchema: {
    parse: (v: unknown) => v,
  },
}));

// Mock auth-helper
jest.mock("@/lib/server/auth-helper", () => ({
  ...jest.requireActual("@/lib/server/auth-helper"),
  createUserFromSession: jest.fn().mockReturnValue({
    id: "u_tech_lead",
    name: "Tech Lead",
    email: "tech.lead@sxc.ac.id",
    role: "tech",
    departmentId: "d_tech",
    membershipRole: "head",
  }),
}));

import { auth } from "@/lib/auth-server";
import {
  approveReport,
  revokeReport,
  getReports,
} from "@/lib/server/analytics-service";
import { GET } from "@/app/api/analytics/reports/route";
import { PATCH } from "@/app/api/analytics/reports/[id]/approve/route";

const mockGetSession = auth.api.getSession as unknown as jest.Mock;
const mockApprove = approveReport as unknown as jest.Mock;
const mockRevoke = revokeReport as unknown as jest.Mock;
const mockGetReports = getReports as unknown as jest.Mock;

const testSession = {
  user: { id: "u_tech_lead", name: "Tech Lead", email: "tech.lead@sxc.ac.id" },
};

function makeRequest(url: string, method = "GET", body?: object): NextRequest {
  const req = new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return req;
}

describe("GET /api/analytics/reports", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await GET(makeRequest("http://localhost/api/analytics/reports?departmentId=d_tech"));
    expect(res.status).toBe(401);
  });

  it("returns reports list for authenticated user", async () => {
    mockGetSession.mockResolvedValue(testSession);
    mockGetReports.mockResolvedValue([
      { id: "ar_001", title: "Weekly Platform Health", status: "pending", departmentId: "d_tech", createdBy: "u_tech_lead", fileUrl: "", createdAt: new Date().toISOString() },
    ]);
    const res = await GET(makeRequest("http://localhost/api/analytics/reports?departmentId=d_tech"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
  });
});

describe("PATCH /api/analytics/reports/[id]/approve", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await PATCH(
      makeRequest("http://localhost/api/analytics/reports/ar_001/approve", "PATCH", {}),
      { params: Promise.resolve({ id: "ar_001" }) }
    );
    expect(res.status).toBe(401);
  });

  it("calls approveReport when revoke is false", async () => {
    mockGetSession.mockResolvedValue(testSession);
    const approved = { id: "ar_001", status: "approved", departmentId: "d_tech", title: "Test", fileUrl: "", createdBy: "u_tech_lead", createdAt: new Date().toISOString() };
    mockApprove.mockResolvedValue(approved);

    const res = await PATCH(
      makeRequest("http://localhost/api/analytics/reports/ar_001/approve", "PATCH", { revoke: false }),
      { params: Promise.resolve({ id: "ar_001" }) }
    );
    expect(res.status).toBe(200);
    expect(mockApprove).toHaveBeenCalledWith("ar_001", expect.objectContaining({ id: "u_tech_lead" }));
    expect(mockRevoke).not.toHaveBeenCalled();
  });

  it("calls revokeReport when revoke is true", async () => {
    mockGetSession.mockResolvedValue(testSession);
    const revoked = { id: "ar_001", status: "pending", departmentId: "d_tech", title: "Test", fileUrl: "", createdBy: "u_tech_lead", createdAt: new Date().toISOString() };
    mockRevoke.mockResolvedValue(revoked);

    const res = await PATCH(
      makeRequest("http://localhost/api/analytics/reports/ar_001/approve", "PATCH", { revoke: true }),
      { params: Promise.resolve({ id: "ar_001" }) }
    );
    expect(res.status).toBe(200);
    expect(mockRevoke).toHaveBeenCalledWith("ar_001", expect.objectContaining({ id: "u_tech_lead" }));
    expect(mockApprove).not.toHaveBeenCalled();
  });
});
