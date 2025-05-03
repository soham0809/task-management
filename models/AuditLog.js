import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        action: {
            type: String,
            required: true,
            enum: [
                'task_created',
                'task_updated',
                'task_deleted',
                'task_assigned',
                'task_completed',
                'task_comment_added',
                'user_registered',
                'user_login',
            ],
        },
        details: {
            type: Object,
            default: {},
        },
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
        },
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        },
    },
    { timestamps: true }
);

// Create an index for faster queries
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ user: 1 });
AuditLogSchema.index({ taskId: 1 });
AuditLogSchema.index({ createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema); 