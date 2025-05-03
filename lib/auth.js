import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d';

export const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, {
        expiresIn: TOKEN_EXPIRY,
    });
};

export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

export const setAuthCookie = (res, token) => {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
    };

    res.cookies.set('auth_token', token, cookieOptions);
    return res;
};

export const removeAuthCookie = (res) => {
    res.cookies.delete('auth_token');
    return res;
};

export const getAuthUser = async (req) => {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        return null;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return null;
    }

    try {
        const user = await User.findById(decoded.userId).select('-password');
        return user;
    } catch (error) {
        return null;
    }
};

export const withAuth = (handler) => {
    return async (req) => {
        const user = await getAuthUser(req);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        return handler(req, user);
    };
};

export const withAdminAuth = (handler) => {
    return async (req) => {
        const user = await getAuthUser(req);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        if (user.role !== 'admin') {
            return NextResponse.json(
                { success: false, message: 'Admin access required' },
                { status: 403 }
            );
        }

        return handler(req, user);
    };
}; 