import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
    try {
        await dbConnect();

        // Get the current authenticated user
        const user = await getAuthUser(req);

        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not authenticated'
            }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                notifications: user.notifications
            }
        });
    } catch (error) {
        console.error('Auth me error:', error);

        return NextResponse.json({
            success: false,
            message: 'Failed to get user data',
            error: error.message
        }, { status: 500 });
    }
} 