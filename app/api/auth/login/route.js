import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { generateToken, setAuthCookie } from '@/lib/auth';
import AuditLog from '@/models/AuditLog';

export async function POST(req) {
    try {
        await dbConnect();

        const { email, password } = await req.json();

        // Validate input
        if (!email || !password) {
            return NextResponse.json({
                success: false,
                message: 'Please provide email and password'
            }, { status: 400 });
        }

        // Find user by email and select password for comparison
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'Invalid credentials'
            }, { status: 401 });
        }

        // Check if password matches
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return NextResponse.json({
                success: false,
                message: 'Invalid credentials'
            }, { status: 401 });
        }

        // Generate token
        const token = generateToken(user._id);

        // Log the login
        await AuditLog.create({
            user: user._id,
            action: 'user_login',
            details: {
                userId: user._id,
                email: user.email,
            },
        });

        // Set cookie and return user data (exclude password)
        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        const response = NextResponse.json({
            success: true,
            message: 'Login successful',
            user: userData
        });

        // Set the auth cookie
        return setAuthCookie(response, token);

    } catch (error) {
        console.error('Login error:', error);

        return NextResponse.json({
            success: false,
            message: 'Login failed',
            error: error.message
        }, { status: 500 });
    }
} 