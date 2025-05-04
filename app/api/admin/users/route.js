import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
    try {
        await dbConnect();

        // Verify user is authenticated and admin
        const user = await getAuthUser(request);

        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized'
            }, { status: 401 });
        }

        if (user.role !== 'admin') {
            return NextResponse.json({
                success: false,
                message: 'Admin access required'
            }, { status: 403 });
        }

        // Fetch all users
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            users: users.map(user => ({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                team: user.team,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }))
        });

    } catch (error) {
        console.error('Admin users fetch error:', error);

        return NextResponse.json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        }, { status: 500 });
    }
} 