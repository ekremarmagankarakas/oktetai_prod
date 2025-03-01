const Conversation = require('../models/conversation');
const AsyncLock = require('async-lock');
const lock = new AsyncLock();

const verifyOwnership = async (conversationId, userId) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        throw new Error('Conversation not found');
    }
    if (!conversation.user.equals(userId)) {
        throw new Error('Unauthorized access');
    }
    return conversation;
};

exports.verifyOwnership = verifyOwnership;

exports.addConversation = (req, res) => {
    const { title } = req.body;

    const newConversation = new Conversation({
        user: req.user._id,
        title: title,
        conversations: []
    });

    newConversation.save()
        .then(result => res.json({ id: result._id.toString() }))
        .catch(err => {
            console.error(err);
            res.status(500).send({ message: "Failed to create conversation" });
        });
};

exports.updateConversation = async (req, res) => {
  const { id } = req.params;
  const { messages, source } = req.body;

  try {
      // Verify ownership of the conversation
      const conversation = await verifyOwnership(id, req.user._id);

      // Acquire lock to prevent concurrent updates
      await lock.acquire(id, async () => {
          try {
              // Check if source exists in the conversation array
              const sourceIndex = conversation.conversations.findIndex((c) => c.source === source);
              if (sourceIndex === -1) {
                  // Add new source if not found
                  conversation.conversations.push({ source, messages });
              } else {
                  // Update existing source's messages
                  conversation.conversations[sourceIndex].messages = messages;
              }

              // Save using findByIdAndUpdate to avoid VersionError
              await Conversation.findByIdAndUpdate(
                  id,
                  { $set: { conversations: conversation.conversations } },
                  { new: true, runValidators: true } // Return the updated document
              );

              res.send({ message: "Conversation updated successfully" });
          } catch (err) {
              console.error("Error while updating conversation:", err);
              throw new Error("Error updating conversation");
          }
      });
  } catch (err) {
      const statusCode = err.message === "Unauthorized access" ? 403 : 404;
      res.status(statusCode).send({ message: err.message });
  }
};

exports.deleteConversation = async (req, res) => {
  const { id } = req.params;

  try {
      const conversation = await verifyOwnership(id, req.user._id);

      conversation.deleted = true;
      await conversation.save();

      res.send({ message: "Conversation deleted successfully" });
  } catch (err) {
      const statusCode = err.message === 'Unauthorized access' ? 403 : 404;
      res.status(statusCode).send({ message: err.message });
  }
};

exports.getAllConversations = (req, res) => {
    Conversation.find({ user: req.user._id, deleted: false })
        .sort({ createdAt: -1 })
        .then(conversations => res.json(conversations))
        .catch(error => res.status(500).json({ message: 'Error fetching conversations', error }));
};

exports.updateConversationTitle = async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  try {
      const result = await Conversation.findByIdAndUpdate(id, { title }, { new: true });
      if (!result) {
          return res.status(404).json({ error: 'Conversation not found' });
      }
      res.json({ message: 'Title updated successfully', conversation: result });
  } catch (error) {
      console.error('Error updating conversation title:', error);
      res.status(500).json({ error: 'Error updating title' });
  }
};

exports.getConversationById = async (req, res) => {
  const { id } = req.params;
  try {
      const conversation = await verifyOwnership(id, req.user._id);
      res.json(conversation);
  } catch (error) {
      const statusCode = error.message === 'Unauthorized access' ? 403 : 404;
      res.status(statusCode).json({ message: error.message });
  }
};

exports.saveNotes = async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  try {
      const conversation = await verifyOwnership(id, req.user._id);

      conversation.notes = notes;
      await conversation.save();

      res.status(200).json({ message: 'Notes saved successfully' });
  } catch (error) {
      const statusCode = error.message === 'Unauthorized access' ? 403 : 404;
      res.status(statusCode).json({ message: error.message });
  }
};