const createDatetimeTool = (DynamicStructuredTool, z) =>
    new DynamicStructuredTool({
        name: "get_current_datetime",
        description:
            "Get the current date and time, optionally in a specific IANA timezone (e.g. 'Africa/Cairo', 'Europe/Oslo'). Defaults to UTC.",
        schema: z.object({
            timezone: z
                .string()
                .optional()
                .describe("IANA timezone string, optional"),
        }),
        func: async ({ timezone }) => {
            const now = new Date();
            if (!timezone) return `Current UTC time: ${now.toISOString()}`;

            try {
                const formatted = now.toLocaleString("en-US", {
                    timeZone: timezone,
                });
                return `Current time in ${timezone}: ${formatted}`;
            } catch {
                return `Unknown timezone "${timezone}". Current UTC time: ${now.toISOString()}`;
            }
        },
    });

module.exports = { createDatetimeTool };
