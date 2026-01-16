import jwt from "jsonwebtoken";

export const adminLogin = async (req, res) => {
    const { username, password } = req.body;

    const ADMIN_USER = process.env.ADMIN_USER || "admin";
    const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        const token = jwt.sign(
            { role: "admin", username: username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        return res.json({ token });
    }

    return res.status(401).json({ message: "Invalid credentials" });
};
