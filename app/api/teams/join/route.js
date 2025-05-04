import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Team from '@/models/Team';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import AuditLog from '@/models/AuditLog';

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

        const { teamCode, password } = await req.json();

        // Validate input
        if (!teamCode || !password) {
            return NextResponse.json({
                success: false,
                message: 'Please provide team code and password'
            }, { status: 400 });
        }

        // Find the team by code
        const team = await Team.findOne({ teamCode }).select('+password');
        if (!team) {
            return NextResponse.json({
                success: false,
                message: 'Team not found'
            }, { status: 404 });
        }

        // Verify password
        const isMatch = await team.comparePassword(password);
        if (!isMatch) {
            return NextResponse.json({
                success: false,
                message: 'Invalid team password'
            }, { status: 401 });
        }

        // Check if user is already in a team
        if (user.team) {
            const currentTeam = await Team.findById(user.team);

            // If the user is already in this team, just return success
            if (currentTeam && currentTeam._id.toString() === team._id.toString()) {
                return NextResponse.json({
                    success: true,
                    message: 'You are already a member of this team',
                    team: {
                        _id: team._id,
                        name: team.name,
                        description: team.description,
                        teamCode: team.teamCode,
                    }
                });
            }

            // Remove user from previous team's members
            if (currentTeam) {
                currentTeam.members = currentTeam.members.filter(
                    member => member.toString() !== user._id.toString()
                );
                await currentTeam.save();
            }
        }

        // Check if user is already in team members
        const alreadyMember = team.members.some(
            member => member.toString() === user._id.toString()
        );

        if (!alreadyMember) {
            // Add user to team
            team.members.push(user._id);
            await team.save();
        }

        // Update user's team
        user.team = team._id;
        await user.save();

        // Log the team join
        await AuditLog.create({
            user: user._id,
            action: 'team_join',
            details: {
                teamId: team._id,
                teamName: team.name,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Successfully joined team',
            team: {
                _id: team._id,
                name: team.name,
                description: team.description,
                teamCode: team.teamCode,
            }
        });

    } catch (error) {
        console.error('Join team error:', error);

        return NextResponse.json({
            success: false,
            message: 'Failed to join team',
            error: error.message
        }, { status: 500 });
    }
} 