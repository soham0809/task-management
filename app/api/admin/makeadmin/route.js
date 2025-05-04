import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function POST(request) {
    try {
        await dbConnect();

        // Get the currently logged in user
        const user = await getAuthUser(request);

        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized'
            }, { status: 401 });
        }

        // Update user role to admin
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { role: 'admin' },
            { new: true }
        ).select('-password');

        return NextResponse.json({
            success: true,
            message: 'User role updated to admin successfully',
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                team: updatedUser.team
            }
        });

    } catch (error) {
        console.error('Make admin error:', error);

        return NextResponse.json({
            success: false,
            message: 'Failed to update user role',
            error: error.message
        }, { status: 500 });
    }
} 