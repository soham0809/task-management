import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Team from '@/models/Team';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function GET(request, context) {
    try {
        await dbConnect();

        // Verify user is authenticated
        const user = await getAuthUser(request);
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized'
            }, { status: 401 });
        }

        // In Next.js 14+, the recommended way to access dynamic route params is from context.params
        const id = context.params.id;

        if (!id) {
            return NextResponse.json({
                success: false,
                message: 'Team ID is required'
            }, { status: 400 });
        }

        // Check if user is part of this team or admin
        if (user.role !== 'admin' && (!user.team || user.team.toString() !== id)) {
            return NextResponse.json({
                success: false,
                message: 'You do not have access to this team'
            }, { status: 403 });
        }

        // Fetch team
        const team = await Team.findById(id);
        if (!team) {
            return NextResponse.json({
                success: false,
                message: 'Team not found'
            }, { status: 404 });
        }

        // Fetch team members
        const members = await User.find({ team: id }).select('-password');

        return NextResponse.json({
            success: true,
            team: {
                _id: team._id,
                name: team.name,
                description: team.description,
                teamCode: team.teamCode,
                creator: team.creator,
                members: team.members,
                createdAt: team.createdAt,
            },
            members
        });

    } catch (error) {
        console.error('Get team error:', error);

        return NextResponse.json({
            success: false,
            message: 'Failed to fetch team',
            error: error.message
        }, { status: 500 });
    }
} 