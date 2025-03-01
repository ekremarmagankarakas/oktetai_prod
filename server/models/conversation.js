const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const conversationSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' }, // Reference to User model
    title: { type: String, required: true }, // Title of the conversation
    conversations: [{
        source: String, // Identifier for the API or message source
        messages: [{
            role: String,
            content: String
        }]
    }],
    notes: { type: String },
    deleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    modifiedAt: { type: Date, default: Date.now }
});

conversationSchema.pre('save', function(next) {
    this.modifiedAt = new Date();
    next();
});

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;
