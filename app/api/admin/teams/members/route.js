import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Team from '@/models/Team';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import AuditLog from '@/models/AuditLog';

// Add a user to a team or remove from a team
export async function POST(request) {
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

        // Get request body
        const { userId, teamId, action } = await request.json();

        // Validate inputs
        if (!userId || !action || (action === 'add' && !teamId)) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields'
            }, { status: 400 });
        }

        // Get the target user
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }

        // Handle remove from team action
        if (action === 'remove') {
            if (!targetUser.team) {
                return NextResponse.json({
                    success: false,
                    message: 'User is not in any team'
                }, { status: 400 });
            }

            // Find the current team
            const currentTeam = await Team.findById(targetUser.team);
            if (currentTeam) {
                // Remove user from team members
                currentTeam.members = currentTeam.members.filter(
                    memberId => memberId.toString() !== userId
                );
                await currentTeam.save();
            }

            // Remove team from user
            targetUser.team = null;
            await targetUser.save();

            // Log the action
            await AuditLog.create({
                user: user._id,
                action: 'team_member_remove',
                details: {
                    teamId: currentTeam?._id || targetUser.team,
                    teamName: currentTeam?.name || 'Unknown Team',
                    targetUserId: targetUser._id,
                    targetUserName: targetUser.name
                }
            });

            return NextResponse.json({
                success: true,
                message: `Successfully removed ${targetUser.name} from team`
            });
        }

        // Handle add to team action
        if (action === 'add') {
            // Find the target team
            const team = await Team.findById(teamId);
            if (!team) {
                return NextResponse.json({
                    success: false,
                    message: 'Team not found'
                }, { status: 404 });
            }

            // If user is already in a team, remove them from that team first
            if (targetUser.team) {
                const previousTeam = await Team.findById(targetUser.team);
                if (previousTeam) {
                    previousTeam.members = previousTeam.members.filter(
                        memberId => memberId.toString() !== userId
                    );
                    await previousTeam.save();
                }
            }

            // Check if user is already in the target team
            const alreadyInTeam = team.members.some(
                memberId => memberId.toString() === userId
            );

            if (!alreadyInTeam) {
                // Add user to team members
                team.members.push(targetUser._id);
                await team.save();
            }

            // Update user's team
            targetUser.team = team._id;
            await targetUser.save();

            // Log the action
            await AuditLog.create({
                user: user._id,
                action: 'team_member_add',
                details: {
                    teamId: team._id,
                    teamName: team.name,
                    targetUserId: targetUser._id,
                    targetUserName: targetUser.name
                }
            });

            return NextResponse.json({
                success: true,
                message: `Successfully added ${targetUser.name} to ${team.name}`
            });
        }

        return NextResponse.json({
            success: false,
            message: 'Invalid action. Use "add" or "remove".'
        }, { status: 400 });

    } catch (error) {
        console.error('Team member management error:', error);

        return NextResponse.json({
            success: false,
            message: 'Failed to manage team member',
            error: error.message
        }, { status: 500 });
    }
} 