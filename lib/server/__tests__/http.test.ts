import { mapServiceErrorToStatus } from "@/lib/server/http";

describe("mapServiceErrorToStatus", () => {
    it("maps payload too large errors to 413", () => {
        expect(mapServiceErrorToStatus(new Error("Payload too large: file exceeds 10 MB limit"))).toBe(413);
    });

    it("maps unsupported media type errors to 415", () => {
        expect(mapServiceErrorToStatus(new Error("Unsupported media type: application/x-msdownload"))).toBe(415);
    });

    it("keeps existing validation mapping", () => {
        expect(mapServiceErrorToStatus(new Error("Validation failed: duplicate attachment detected"))).toBe(422);
    });
});
