import { isVisible, processLoadedConversation, updateConversation, handleResponse, handleInput, addTypingPlaceholder, addImageLabel } from './utils.js';
   
function setupAIService(
    name,
    defaultSystemMessage,
    isDefaultSystemMessage,
    imagePath,
    apiURL,
    labelContainerId,
    chatContainerId,
    buttonId
) {
    const labelContainer = document.getElementById(labelContainerId);
    const chatContainer = document.getElementById(chatContainerId);
    const button = document.getElementById(buttonId);

    let isRequestPending = false;
    let conversationHistory = [];
    if (isDefaultSystemMessage) {
        conversationHistory.push({ role: 'system', content: defaultSystemMessage});
    }
    let id = null;

    document.addEventListener('newConvo', (event) => {
        conversationHistory = [];
        id = null;
        chatContainer.style.display = 'none';
        labelContainer.innerHTML = '';
        button.classList.remove('active-style');
        chatContainer.classList.remove('transparent-background');
    });

    document.addEventListener('conversationLoaded', (event) => {
        conversationHistory = processLoadedConversation(event, labelContainer, chatContainer, conversationHistory, defaultSystemMessage, isDefaultSystemMessage, imagePath, name, button);
        id = event.detail._id;
        setTimeout(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 500);
    });

    document.addEventListener('submitclicked', async (event) => {
        const subscriptionPlan = event.detail.subscriptionPlan;

        if (name === 'Perplexity' || name === 'ClaudeSonnet' || name === 'Llama') {
            if (subscriptionPlan !== 'enterprise') {
                return;
            }
        }
        if (name === 'ChatGPT4' || name === 'Claude') {
            if (subscriptionPlan === 'basic') {
                return;
            }
        }

        if (id === null) {
            id = event.detail.id;
            conversationHistory = [];
            if (isDefaultSystemMessage) {
                conversationHistory.push({ role: 'system', content: defaultSystemMessage});
            }
        }
        if (isRequestPending || !isVisible(chatContainer)) {
            return;
        }

        isRequestPending = true;
        conversationHistory = handleInput(event, labelContainer, chatContainer, conversationHistory);

        const newLabelResponse = addImageLabel('assistant', imagePath);
        labelContainer.appendChild(newLabelResponse);
        const typingPlaceholder = addTypingPlaceholder(labelContainer);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        try {
          const response = await fetch('/api/chat-single', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ models: [apiURL], messages: conversationHistory }),
          })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Network response was not ok");
            }
            return response.json();
          })
          .then((data) => {
            console.log(data);
            labelContainer.removeChild(typingPlaceholder);
            conversationHistory = handleResponse(data, conversationHistory, labelContainer, newLabelResponse);
            chatContainer.scrollTop = chatContainer.scrollHeight;
            isRequestPending = false;
            updateConversation(id, conversationHistory, name);
          })
          .catch((error) => {
            console.error('Error:', error.message);
            labelContainer.removeChild(typingPlaceholder);
            isRequestPending = false;
          });      
        } catch(error) {
            console.error('Error:', error);
            labelContainer.removeChild(typingPlaceholder);
            isRequestPending = false;
        };
      });
}

// Setting up each AI service

setupAIService(
    'ChatGPT',
    "if you are going to input code, please use triple backticks and the language name like javascript",
    true,
    '/img/chatgpt-icon.webp',
    'gpt-3.5-turbo',
    'labelContainer',
    'chatContainer',
    'chatContainerButton'
);

setupAIService(
    'ChatGPT4',
    "if you are going to input code, please use triple backticks and the language name like javascript",
    true,
    '/img/chatgpt-icon.webp',
    'gpt-4o',
    'labelContainer4',
    'chatContainer4',
    'chatContainerButton4'
);

setupAIService(
    'Claude',
    " ",
    false,
    '/img/claude-icon.webp',
    'claude-3-haiku-20240307',
    'labelContainerClaude',
    'claudeContainer',
    'claudeContainerButton'
);

setupAIService(
    'ClaudeSonnet',
    " ",
    false,
    '/img/claude-icon.webp',
    'claude-3-sonnet-20240229',
    'labelContainerClaudeSonnet',
    'claudeSonnetContainer',
    'claudeSonnetContainerButton'
);

setupAIService(
    'Perplexity',
    " ",
    true,
    '/img/perplexity-icon.webp',
    'llama-3.1-sonar-small-128k-online',
    'labelContainerPerplexity',
    'perplexityContainer',
    'perplexityContainerButton'
);

setupAIService(
    'Llama',
    " ",
    true,
    '/img/llama-icon.webp',
    'llama-3.1-sonar-small-128k-online',
    'labelContainerLlama',
    'llamaContainer',
    'llamaContainerButton'
);

setupAIService(
  'GeminiFlash',
  " ",
  false,
  '/img/gemini-icon.webp',
  'gemini-1.5-flash',
  'labelContainerGeminiFlash',
  'geminiFlashContainer',
  'geminiFlashContainerButton'
);

setupAIService(
  'Gemini',
  " ",
  false,
  '/img/gemini-icon.webp',
  'gemini-1.5-pro',
  'labelContainerGemini',
  'geminiContainer',
  'geminiContainerButton'
);