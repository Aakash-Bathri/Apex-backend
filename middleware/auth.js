import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // console.log("Decoded token:", decoded); // Debug log
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    console.log(`[Auth] Token verified for user: ${decoded.email} (${decoded.id})`);
    next();
  } catch (err) {
    console.error(`[Auth] verification failed:`, err.message);
    const authHeader = req.headers.authorization;
    console.error(`[Auth] Header was: ${authHeader ? authHeader.substring(0, 20) + '...' : 'Missing'}`);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
