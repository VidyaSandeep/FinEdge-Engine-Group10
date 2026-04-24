import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const budgetSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        month: {
            type: Number,
            required: true,
            min: 1,
            max: 12,
        },
        year: {
            type: Number,
            required: true,
            min: 2000,
        },
        monthlyGoal: {
            type: Number,
            required: true,
            min: 0,
        },
        savingsTarget: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

budgetSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

export const BudgetModel = model('Budget', budgetSchema);