import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { withAuth } from '@/lib/auth';

// Get all team members
export const GET = withAuth(async (req, user) => {
    try {
        await dbConnect();

        // Get all users (excluding passwords)
        const users = await User.find()
            .select('name email role avatar')
            .sort({ name: 1 });

        return NextResponse.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Get users error:', error);

        return NextResponse.json({
            success: false,
            message: 'Failed to get users',
            error: error.message
        }, { status: 500 });
    }
}); 