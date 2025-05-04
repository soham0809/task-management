import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const TeamSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide a team name'],
            maxlength: [60, 'Team name cannot be more than 60 characters'],
        },
        description: {
            type: String,
            maxlength: [200, 'Description cannot be more than 200 characters'],
        },
        teamCode: {
            type: String,
            required: [true, 'Please provide a team code'],
            unique: true,
        },
        password: {
            type: String,
            required: [true, 'Please provide a team password'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }
        ],
    },
    { timestamps: true }
);

// Middleware to hash password before saving
TeamSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
TeamSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.models.Team || mongoose.model('Team', TeamSchema); 