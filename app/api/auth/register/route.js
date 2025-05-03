import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { generateToken, setAuthCookie } from '@/lib/auth';
import AuditLog from '@/models/AuditLog';

export async function POST(req) {
    try {
        await dbConnect();

        const { name, email, password } = await req.json();

        // Validate input
        if (!name || !email || !password) {
            return NextResponse.json({
                success: false,
                message: 'Please provide all required fields'
            }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return NextResponse.json({
                success: false,
                message: 'User with this email already exists'
            }, { status: 400 });
        }

        // Create new user
        const user = await User.create({
            name,
            email,
            password, // Password will be hashed by the model pre-save hook
        });

        // Generate token
        const token = generateToken(user._id);

        // Log the registration
        await AuditLog.create({
            user: user._id,
            action: 'user_registered',
            details: {
                userId: user._id,
                name: user.name,
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
            message: 'Registration successful',
            user: userData
        }, { status: 201 });

        // Set the auth cookie
        return setAuthCookie(response, token);

    } catch (error) {
        console.error('Registration error:', error);

        return NextResponse.json({
            success: false,
            message: 'Registration failed',
            error: error.message
        }, { status: 500 });
    }
} 