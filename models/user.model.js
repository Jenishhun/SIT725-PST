const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    currency: { type: String, default: 'USD' }
});

// Only hash password if it's modified (and not already hashed)
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    if (this.password.startsWith('$2b$') && this.password.length === 60) {
        return next();
    }
    
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
