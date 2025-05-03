import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { withAuth } from '@/lib/auth';

// Get user notifications
export const GET = withAuth(async (req, user) => {
    try {
        await dbConnect();

        // Get user with populated notifications
        const userWithNotifications = await User.findById(user._id)
            .select('notifications')
            .sort({ 'notifications.createdAt': -1 });

        return NextResponse.json({
            success: true,
            notifications: userWithNotifications.notifications || []
        });
    } catch (error) {
        console.error('Get notifications error:', error);

        return NextResponse.json({
            success: false,
            message: 'Failed to get notifications',
            error: error.message
        }, { status: 500 });
    }
});

// Mark notifications as read
export const POST = withAuth(async (req, user) => {
    try {
        await dbConnect();

        const { notificationIds } = await req.json();

        if (!notificationIds || !Array.isArray(notificationIds)) {
            return NextResponse.json({
                success: false,
                message: 'Please provide notification IDs to mark as read'
            }, { status: 400 });
        }

        // Update each notification to mark as read
        await User.updateOne(
            { _id: user._id },
            { $set: { "notifications.$[elem].read": true } },
            {
                arrayFilters: [{
                    "_id": { $in: notificationIds }
                }],
                multi: true
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Notifications marked as read'
        });
    } catch (error) {
        console.error('Mark notifications error:', error);

        return NextResponse.json({
            success: false,
            message: 'Failed to mark notifications as read',
            error: error.message
        }, { status: 500 });
    }
}); 