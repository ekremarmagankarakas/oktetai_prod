const express = require('express');
const conversationController = require('../controllers/conversationController');

const router = express.Router();

router
  .route('/conversations')
  .post(conversationController.addConversation) // Create a new conversation
  .get(conversationController.getAllConversations); // Get all conversations

router
  .route('/conversations/:id')
  .get(conversationController.getConversationById) // Get a conversation by ID
  .put(conversationController.updateConversation) // Update the conversation
  .delete(conversationController.deleteConversation); // Delete a conversation

router.put('/conversations/:id/title', conversationController.updateConversationTitle);
router.post('/conversations/:id/notes', conversationController.saveNotes);


module.exports = router;
