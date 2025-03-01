const { addConversation, verifyOwnership } = require('../controllers/conversationController');
const Conversation = require('../models/conversation');

jest.mock('../models/conversation');

describe('verifyOwnership', () => {
  it('should throw an error if the conversation is not found', async () => {
      // Arrange: Mock findById to return null
      Conversation.findById.mockResolvedValue(null);

      // Act & Assert: Call verifyOwnership and expect an error
      await expect(verifyOwnership('fakeConversationId', 'fakeUserId'))
          .rejects.toThrow('Conversation not found');
  });

  it('should throw an error if the userId does not match the conversation owner', async () => {
      // Arrange: Mocked conversation object with non-matching userId
      const mockConversation = {
          user: {
              equals: jest.fn().mockReturnValue(false),
          },
      };
      Conversation.findById.mockResolvedValue(mockConversation);

      // Act & Assert: Call verifyOwnership and expect an error
      await expect(verifyOwnership('someConversationId', 'fakeUserId'))
          .rejects.toThrow('Unauthorized access');
  });

  it('should return the conversation if the userId matches the conversation owner', async () => {
      // Arrange: Mocked conversation object with matching userId
      const mockConversation = {
          user: {
              equals: jest.fn().mockReturnValue(true),
          },
      };
      Conversation.findById.mockResolvedValue(mockConversation);

      // Act: Call verifyOwnership
      const result = await verifyOwnership('someConversationId', 'correctUserId');

      // Assert: Check that result is the mockConversation
      expect(result).toBe(mockConversation);
  });
});