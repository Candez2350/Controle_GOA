export function auditLog(req, res, next) {
    const userStr = req.user ? `[User: ${req.user.id} (${req.user.role})]` : '[Unauthenticated]';
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[AUDIT] ${new Date().toISOString()} - ${userStr} ${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms)`);
    });

    next();
}
