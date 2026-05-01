import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        category: {
            type: String,
            required: true,
            default: 'All'
        },
        month: {
            type: Number,
            required: true,
            min: 1,
            max: 12,
            default: () => new Date().getMonth() + 1
        },
        year: {
            type: Number,
            required: true,
            min: 2000,
            default: () => new Date().getFullYear()
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
            default: 0
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);


budgetSchema.index({ userId: 1, year: 1, month: 1, category: 1 }, { unique: true });

const BudgetModel = mongoose.model('Budget', budgetSchema);
export default BudgetModel;
