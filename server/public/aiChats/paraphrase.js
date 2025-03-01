let isRequestPending = false;
const paraphraseOutput = document.getElementById('paraphrasingOutputTextarea');
let responseMessage = '';

document.addEventListener('paraphrase', (event) => {
    isRequestPending = true;
    const paraphraseInput = event.detail.paraphraseInput;
    const sendmytext = "I want to paraphrase the following text. Just change some of the words with their synonyms so that they do not get detected by ai checkers. Only output the paraphrased text and never output anything else. Here is the text to be paraphrased: " + paraphraseInput;

    fetch('/api/chat-single', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ models: ['gpt-3.5-turbo'], messages: [{ role: "user", content: sendmytext }] })
    }).then(response => response.json())
    .then(data => {
        let responseMessage;

        if (data.error && data.error === 'Input contains restricted or potentially harmful content.') {
          responseMessage = 'Input was caught by moderation';
        } else if (data.content) {
          responseMessage = data.content;
        } else {
          responseMessage = 'No response from server';
        }
    
        paraphraseOutput.value = responseMessage || 'No response from server';
        isRequestPending = false;
    })
    .catch(error => {
        console.error('Error:', error);
        isRequestPending = false;
    });
});