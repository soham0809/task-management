import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Team from '@/models/Team';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import AuditLog from '@/models/AuditLog';

// Create a new team
export async function POST(req) {
    try {
        await dbConnect();

        // Verify user is authenticated
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized'
            }, { status: 401 });
        }

        const { name, description, teamCode, password } = await req.json();

        // Validate input
        if (!name || !teamCode || !password) {
            return NextResponse.json({
                success: false,
                message: 'Please provide name, team code and password'
            }, { status: 400 });
        }

        // Check if team code already exists
        const existingTeam = await Team.findOne({ teamCode });
        if (existingTeam) {
            return NextResponse.json({
                success: false,
                message: 'Team code already in use, please choose another'
            }, { status: 400 });
        }

        // Create the team
        const team = await Team.create({
            name,
            description,
            teamCode,
            password,
            creator: user._id,
            members: [user._id]
        });

        // Update the user's team
        user.team = team._id;
        await user.save();

        // Log the team creation
        await AuditLog.create({
            user: user._id,
            action: 'team_create',
            details: {
                teamId: team._id,
                teamName: team.name,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Team created successfully',
            team: {
                _id: team._id,
                name: team.name,
                description: team.description,
                teamCode: team.teamCode,
                creator: team.creator,
                members: team.members,
                createdAt: team.createdAt,
            }
        });

    } catch (error) {
        console.error('Create team error:', error);

        return NextResponse.json({
            success: false,
            message: 'Failed to create team',
            error: error.message
        }, { status: 500 });
    }
}

// Get all teams (admin only)
export async function GET(req) {
    try {
        await dbConnect();

        // Verify user is authenticated
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized'
            }, { status: 401 });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized, admin access required'
            }, { status: 403 });
        }

        // Get all teams
        const teams = await Team.find().populate('creator', 'name email').sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            teams
        });

    } catch (error) {
        console.error('Get teams error:', error);

        return NextResponse.json({
            success: false,
            message: 'Failed to fetch teams',
            error: error.message
        }, { status: 500 });
    }
} 