import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'iems-secret-key-2024-super-secure';
const TOKEN_EXPIRY = '7d';

export function hashPassword(password) {
    return bcrypt.hashSync(password, 10);
}

export function comparePassword(password, hash) {
    return bcrypt.compareSync(password, hash);
}

export function createToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
    );
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

export function getTokenFromHeaders(request) {
    const auth = request.headers.get('authorization');
    if (auth && auth.startsWith('Bearer ')) {
        return auth.slice(7);
    }
    // Also check cookies
    const cookies = request.headers.get('cookie');
    if (cookies) {
        const match = cookies.match(/token=([^;]+)/);
        if (match) return match[1];
    }
    return null;
}

export function requireAuth(request) {
    const token = getTokenFromHeaders(request);
    if (!token) {
        return { error: 'Authentication required', status: 401 };
    }
    const user = verifyToken(token);
    if (!user) {
        return { error: 'Invalid or expired token', status: 401 };
    }
    return { user };
}
