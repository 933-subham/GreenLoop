import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['citizen', 'partner', 'driver', 'admin', 'warden', 'sustainability_officer', 'municipality_admin'],
        default: 'citizen'
    },
    status: {
        type: String,
        enum: ['active', 'pending', 'blocked'],
        default: 'active'
    },
    city: { type: mongoose.Schema.Types.ObjectId, ref: 'City', default: null },
    state: { type: String, default: '' },
    district: { type: String, default: '' },
    cityName: { type: String, default: '' },

    ecoCoins: { type: Number, default: 0 },
    citizenPoints: { type: Number, default: 0 },  // leaderboard metric for citizens
    penaltyCount: { type: Number, default: 0 },    // number of approved false report penalties
    partnerPoints: { type: Number, default: 0 },   // leaderboard metric for partners

    stats: {
        reportsSubmitted: { type: Number, default: 0 },
        tasksCompleted: { type: Number, default: 0 }
    }
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
