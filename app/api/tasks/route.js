import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { getAuthUser, withAuth } from '@/lib/auth';
import { startOfToday, endOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

// Get all tasks with filtering
export const GET = withAuth(async (req, user) => {
    try {
        await dbConnect();

        const url = new URL(req.url);
        const searchParams = url.searchParams;

        // Extract query parameters
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const priority = searchParams.get('priority') || '';
        const dueDate = searchParams.get('dueDate') || '';
        const assignedTo = searchParams.get('assignedTo') || '';
        const createdBy = searchParams.get('createdBy') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        // Build the query
        const query = {};

        // Text search
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Status filter
        if (status) {
            query.status = status;
        }

        // Priority filter
        if (priority) {
            query.priority = priority;
        }

        // Due date filter
        if (dueDate) {
            const today = new Date();

            switch (dueDate) {
                case 'overdue':
                    query.dueDate = { $lt: startOfToday() };
                    query.status = { $ne: 'completed' };
                    break;
                case 'today':
                    query.dueDate = { $gte: startOfToday(), $lte: endOfToday() };
                    break;
                case 'this-week':
                    query.dueDate = { $gte: startOfWeek(today), $lte: endOfWeek(today) };
                    break;
                case 'next-week':
                    const nextWeekStart = new Date(today);
                    nextWeekStart.setDate(today.getDate() + 7);
                    query.dueDate = {
                        $gte: startOfWeek(nextWeekStart),
                        $lte: endOfWeek(nextWeekStart)
                    };
                    break;
                case 'this-month':
                    query.dueDate = { $gte: startOfMonth(today), $lte: endOfMonth(today) };
                    break;
            }
        }

        // Assignment filter
        if (assignedTo === 'me') {
            query.assignedTo = user._id;
        } else if (assignedTo === 'unassigned') {
            query.assignedTo = { $exists: false };
        } else if (assignedTo) {
            query.assignedTo = assignedTo;
        }

        // Creator filter
        if (createdBy === 'me') {
            query.creator = user._id;
        } else if (createdBy) {
            query.creator = createdBy;
        }

        // Get total count for pagination
        const total = await Task.countDocuments(query);

        // Get tasks with pagination
        const tasks = await Task.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('creator', 'name email')
            .populate('assignedTo', 'name email');

        return NextResponse.json({
            success: true,
            tasks,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get tasks error:', error);

        return NextResponse.json({
            success: false,
            message: 'Failed to get tasks',
            error: error.message
        }, { status: 500 });
    }
});

// Create a new task
export const POST = withAuth(async (req, user) => {
    try {
        await dbConnect();

        const taskData = await req.json();

        // Set the creator to current user
        taskData.creator = user._id;

        // Check if user has a team
        if (!user.team) {
            return NextResponse.json({
                success: false,
                message: 'You must be part of a team to create tasks'
            }, { status: 400 });
        }

        // If task is assigned to someone, verify they are in the same team
        if (taskData.assignedTo) {
            const assignedUser = await User.findById(taskData.assignedTo);

            if (!assignedUser) {
                return NextResponse.json({
                    success: false,
                    message: 'Assigned user not found'
                }, { status: 400 });
            }

            // Check if assignee is in the same team
            if (!assignedUser.team || assignedUser.team.toString() !== user.team.toString()) {
                return NextResponse.json({
                    success: false,
                    message: 'You can only assign tasks to members of your team'
                }, { status: 403 });
            }
        }

        // Create the task
        const task = await Task.create(taskData);

        // If task is assigned to someone, update their assignedTasks
        if (taskData.assignedTo) {
            await User.findByIdAndUpdate(
                taskData.assignedTo,
                {
                    $push: { assignedTasks: task._id },
                    $push: {
                        notifications: {
                            message: `You were assigned a new task: ${task.title}`,
                            taskId: task._id,
                        }
                    }
                }
            );
        }

        // Update creator's tasks
        await User.findByIdAndUpdate(
            user._id,
            { $push: { tasks: task._id } }
        );

        // Log task creation
        await AuditLog.create({
            user: user._id,
            action: 'task_created',
            taskId: task._id,
            details: {
                taskId: task._id,
                title: task.title,
                assignedTo: task.assignedTo,
                teamId: user.team
            },
        });

        // Return the created task
        const populatedTask = await Task.findById(task._id)
            .populate('creator', 'name email')
            .populate('assignedTo', 'name email');

        return NextResponse.json({
            success: true,
            message: 'Task created successfully',
            task: populatedTask
        }, { status: 201 });
    } catch (error) {
        console.error('Create task error:', error);

        return NextResponse.json({
            success: false,
            message: 'Failed to create task',
            error: error.message
        }, { status: 500 });
    }
}); 