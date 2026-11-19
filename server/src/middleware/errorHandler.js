
export function errorHandler(err, req, res, next) {
    console.error("Backend error:", err);

    const status = err.status || err.statusCode || 500;

    res.status(status).json({
        success: false,
        message:
            status === 500
                ? "Something went wrong on the server."
                : err.message,
    });
}
