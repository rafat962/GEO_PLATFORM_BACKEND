const evaluateExpression = (expression) => {
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
        throw new Error("Expression contains invalid characters");
    }
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return (${expression})`)();
};

// Factory function - receives DynamicStructuredTool + z loaded dynamically by agent.js
const createCalculatorTool = (DynamicStructuredTool, z) =>
    new DynamicStructuredTool({
        name: "calculator",
        description:
            "Evaluate a basic arithmetic expression. Use this whenever the user asks for a numeric calculation.",
        schema: z.object({
            expression: z
                .string()
                .describe(
                    "A math expression using +, -, *, /, parentheses, e.g. '(12 + 3) * 4'",
                ),
        }),
        func: async ({ expression }) => {
            try {
                const result = evaluateExpression(expression);
                return `Result: ${result}`;
            } catch (err) {
                return `Could not evaluate "${expression}": ${err.message}`;
            }
        },
    });

module.exports = { createCalculatorTool };
