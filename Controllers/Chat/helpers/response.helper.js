export const successResponse = (data) => ({ status: "success", data });

export const errorResponse = (message) => ({ status: "error", message });
