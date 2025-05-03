import { NextResponse } from 'next/server';
import { removeAuthCookie } from '@/lib/auth';

export async function POST() {
    try {
        // Create a response
        const response = NextResponse.json({
            success: true,
            message: 'Logged out successfully'
        });

        // Remove the auth cookie
        return removeAuthCookie(response);
    } catch (error) {
        console.error('Logout error:', error);

        return NextResponse.json({
            success: false,
            message: 'Logout failed',
            error: error.message
        }, { status: 500 });
    }
} 