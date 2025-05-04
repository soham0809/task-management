import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import User from '@/models/User';

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
                team: user.team,
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

export async function PATCH(req) {
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

        // Get update data from request body
        const updateData = await req.json();

        // Fields that are allowed to be updated
        const allowedFields = ['name', 'avatar', 'team'];

        // Create an object with only allowed fields
        const sanitizedUpdate = {};
        for (const field of allowedFields) {
            if (field in updateData) {
                sanitizedUpdate[field] = updateData[field];
            }
        }

        // Update the user
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            sanitizedUpdate,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return NextResponse.json({
                success: false,
                message: 'Failed to update user'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'User updated successfully',
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                team: updatedUser.team,
                avatar: updatedUser.avatar,
                notifications: updatedUser.notifications
            }
        });
    } catch (error) {
        console.error('Update user error:', error);

        return NextResponse.json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        }, { status: 500 });
    }
} 