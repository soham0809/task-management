import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Please provide a title'],
            trim: true,
            maxlength: [100, 'Title cannot be more than 100 characters'],
        },
        description: {
            type: String,
            required: [true, 'Please provide a description'],
            maxlength: [1000, 'Description cannot be more than 1000 characters'],
        },
        dueDate: {
            type: Date,
            required: [true, 'Please provide a due date'],
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium',
        },
        status: {
            type: String,
            enum: ['todo', 'in-progress', 'review', 'completed'],
            default: 'todo',
        },
        creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        completedAt: {
            type: Date,
        },
        attachments: [
            {
                name: String,
                url: String,
                uploadedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        comments: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                comment: String,
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        tags: [String],
        isRecurring: {
            type: Boolean,
            default: false,
        },
        recurringPattern: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'none'],
            default: 'none',
        },
    },
    { timestamps: true }
);

// Index for faster searching and sorting
TaskSchema.index({ title: 'text', description: 'text' });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ creator: 1 });
TaskSchema.index({ assignedTo: 1 });

// Virtual for checking if a task is overdue
TaskSchema.virtual('isOverdue').get(function () {
    return this.status !== 'completed' && this.dueDate < new Date();
});

export default mongoose.models.Task || mongoose.model('Task', TaskSchema); 