import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Team from '@/models/Team';
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

        // Fetch all teams
        const teams = await Team.find({}).sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            teams: teams.map(team => ({
                _id: team._id,
                name: team.name,
                description: team.description,
                teamCode: team.teamCode,
                creator: team.creator,
                members: team.members,
                createdAt: team.createdAt,
                updatedAt: team.updatedAt
            }))
        });

    } catch (error) {
        console.error('Admin teams fetch error:', error);

        return NextResponse.json({
            success: false,
            message: 'Failed to fetch teams',
            error: error.message
        }, { status: 500 });
    }
} 