export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const { validateEmailProviderConfig } = await import("./lib/server/email-provider");
        try {
            validateEmailProviderConfig();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (process.env.NODE_ENV === "production") {
                throw new Error(`[startup] ${message}`);
            }
            console.warn(`[startup] Email provider not configured: ${message}`);
        }
    }
}
