import { readStoredFileBuffer } from "@/lib/server/file-storage";

describe("file-storage path safety", () => {
    it("rejects traversal outside local storage root", async () => {
        await expect(readStoredFileBuffer("../outside.txt")).rejects.toThrow("invalid storage key path");
    });
});
