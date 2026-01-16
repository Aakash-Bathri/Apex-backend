import jwt from "jsonwebtoken";

export const adminMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check for specific admin role or flag
        if (decoded.role !== "admin") {
            return res.status(403).json({ message: "Admin access required" });
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};
