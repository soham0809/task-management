import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { withAuth } from '@/lib/auth';

// Get a single task by ID
export const GET = withAuth(async (req, user) => {
    try {
        await dbConnect();

        // Extract task ID from the URL path
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const taskId = pathParts[pathParts.length - 1];

        // Find the task
        const task = await Task.findById(taskId)
            .populate('creator', 'name email')
            .populate('assignedTo', 'name email');

        if (!task) {
            return NextResponse.json({
                success: false,
                message: 'Task not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            task
        });
    } catch (error) {
        console.error('Get task error:', error);

        return NextResponse.json({
            success: false,
            message: 'Failed to get task',
            error: error.message
        }, { status: 500 });
    }
});

// Update a task by ID
export const PUT = withAuth(async (req, user) => {
    try {
        await dbConnect();

        // Extract task ID from the URL
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const taskId = pathParts[pathParts.length - 1];

        // Get the update data
        const updateData = await req.json();

        // Find the original task
        const originalTask = await Task.findById(taskId);

        if (!originalTask) {
            return NextResponse.json({
                success: false,
                message: 'Task not found'
            }, { status: 404 });
        }

        // Check if the user has permission to update
        const isCreator = originalTask.creator.toString() === user._id.toString();
        const isAssignee = originalTask.assignedTo && originalTask.assignedTo.toString() === user._id.toString();
        const isAdmin = user.role === 'admin';

        if (!isCreator && !isAssignee && !isAdmin) {
            return NextResponse.json({
                success: false,
                message: 'You do not have permission to update this task'
            }, { status: 403 });
        }

        // Check if assignee has changed
        const assigneeChanged = updateData.assignedTo !== undefined &&
            ((!originalTask.assignedTo && updateData.assignedTo) ||
                (originalTask.assignedTo && updateData.assignedTo &&
                    originalTask.assignedTo.toString() !== updateData.assignedTo.toString()));

        // Check if task status changed to completed
        const completedStatusChanged = updateData.status === 'completed' && originalTask.status !== 'completed';

        // Update task
        const task = await Task.findByIdAndUpdate(
            taskId,
            updateData,
            { new: true, runValidators: true }
        );

        // Handle assignee changes
        if (assigneeChanged) {
            // Remove task from previous assignee if there was one
            if (originalTask.assignedTo) {
                await User.findByIdAndUpdate(
                    originalTask.assignedTo,
                    {
                        $pull: { assignedTasks: taskId }
                    }
                );
            }

            // Add task to new assignee if there is one
            if (updateData.assignedTo) {
                // Add notification to new assignee
                await User.findByIdAndUpdate(
                    updateData.assignedTo,
                    {
                        $push: {
                            assignedTasks: taskId,
                            notifications: {
                                message: `You were assigned a task: ${task.title}`,
                                taskId: task._id,
                            }
                        }
                    }
                );
            }

            // Log task assignment
            await AuditLog.create({
                user: user._id,
                action: 'task_assigned',
                taskId: task._id,
                details: {
                    taskId: task._id,
                    title: task.title,
                    assignedFrom: originalTask.assignedTo,
                    assignedTo: updateData.assignedTo,
                },
            });
        }

        // If task is marked as completed, add completion date
        if (completedStatusChanged) {
            task.completedAt = new Date();
            await task.save();

            // Log task completion
            await AuditLog.create({
                user: user._id,
                action: 'task_completed',
                taskId: task._id,
                details: {
                    taskId: task._id,
                    title: task.title,
                    completedBy: user._id,
                },
            });
        }

        // Log task update
        await AuditLog.create({
            user: user._id,
            action: 'task_updated',
            taskId: task._id,
            details: {
                taskId: task._id,
                title: task.title,
                updatedFields: Object.keys(updateData),
            },
        });

        // Return the updated task
        const populatedTask = await Task.findById(task._id)
            .populate('creator', 'name email')
            .populate('assignedTo', 'name email');

        return NextResponse.json({
            success: true,
            message: 'Task updated successfully',
            task: populatedTask
        });
    } catch (error) {
        console.error('Update task error:', error);

        return NextResponse.json({
            success: false,
            message: 'Failed to update task',
            error: error.message
        }, { status: 500 });
    }
});

// Delete a task by ID
export const DELETE = withAuth(async (req, user) => {
    try {
        await dbConnect();

        // Extract task ID from the URL
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const taskId = pathParts[pathParts.length - 1];

        // Find the task
        const task = await Task.findById(taskId);

        if (!task) {
            return NextResponse.json({
                success: false,
                message: 'Task not found'
            }, { status: 404 });
        }

        // Check if user has permission to delete
        const isCreator = task.creator.toString() === user._id.toString();
        const isAdmin = user.role === 'admin';

        if (!isCreator && !isAdmin) {
            return NextResponse.json({
                success: false,
                message: 'You do not have permission to delete this task'
            }, { status: 403 });
        }

        // Delete the task
        await Task.findByIdAndDelete(taskId);

        // Remove task from creator's tasks
        await User.findByIdAndUpdate(
            task.creator,
            { $pull: { tasks: taskId } }
        );

        // Remove task from assignee's tasks if assigned
        if (task.assignedTo) {
            await User.findByIdAndUpdate(
                task.assignedTo,
                { $pull: { assignedTasks: taskId } }
            );
        }

        // Log task deletion
        await AuditLog.create({
            user: user._id,
            action: 'task_deleted',
            details: {
                taskId: task._id,
                title: task.title,
                deletedBy: user._id,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        console.error('Delete task error:', error);

        return NextResponse.json({
            success: false,
            message: 'Failed to delete task',
            error: error.message
        }, { status: 500 });
    }
}); 