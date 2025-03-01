export function processText(text, container) {
  text.split("\n").forEach((line, index, array) => {
    const textNode = document.createElement("span");
    textNode.textContent = line;
    container.appendChild(textNode);
    if (index < array.length - 1) {
      container.appendChild(document.createElement("br"));
    }
  });
}

export function isVisible(element) {
  const computedStyle = window.getComputedStyle(element);
  return computedStyle.display !== "none";
}

export function createLabel(role, content, imgpath) {
  const newLabel = document.createElement("span");
  newLabel.classList.add("label");
  newLabel.style.background = "transparent";

  const img = document.createElement("img");
  img.src = role === "user" ? "/img/user-icon.webp" : imgpath;
  img.style.marginRight = "10px";
  img.style.width = "20px";
  img.style.height = "20px";

  newLabel.appendChild(img);

  const textSpan = document.createElement("span");
  textSpan.textContent = content;
  newLabel.appendChild(textSpan);

  return newLabel;
}

export function addImageLabel(role, imgpath) {
  const newLabel = document.createElement("span");
  newLabel.classList.add("label");
  newLabel.style.background = "transparent";

  const container = document.createElement("div");
  container.width = "100%";
  container.style.display = "flex";

  const img = document.createElement("img");
  img.src = role === "user" ? "/img/user-icon.webp" : imgpath;
  img.style.marginRight = "10px";
  img.style.width = "20px";
  img.style.height = "20px";

  const textSpan = document.createElement("span");
  textSpan.textContent = role === "user" ? "You" : "Assistant";
  textSpan.style.fontWeight = "bold";
  textSpan.style.fontSize = "18px";

  container.appendChild(img);
  container.appendChild(textSpan);
  newLabel.appendChild(container);
  return newLabel;
}

export function addTextLabel(newLabel, content) {
  const codeRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  const fragment = document.createDocumentFragment();

  while ((match = codeRegex.exec(content)) !== null) {
    processPlainText(content.slice(lastIndex, match.index), fragment);

    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.className = match[1] ? `language-${match[1]}` : "language-plaintext";
    code.textContent = match[2];
    pre.appendChild(code);
    fragment.appendChild(pre);

    hljs.highlightElement(code);

    lastIndex = match.index + match[0].length;
  }

  processPlainText(content.slice(lastIndex), fragment);

  fragment.appendChild(document.createElement("br"));
  fragment.appendChild(document.createElement("br"));
  newLabel.appendChild(fragment);

  if (window.MathJax) {
    // Re-render math for just this new label
    MathJax.typesetPromise([newLabel]).catch((err) => console.error(err));
  }
}

function processPlainText(text, fragment) {
  const formatRegex = /(\*\*(.*?)\*\*)|(__(.*?)__)|(\*(.*?)\*)|(_(.*?)_)/g;
  let lastIndex = 0;
  let match;

  while ((match = formatRegex.exec(text)) !== null) {
    if (lastIndex < match.index) {
      text
        .slice(lastIndex, match.index)
        .split("\n")
        .forEach((line, index, array) => {
          const textNode = document.createElement("span");
          textNode.textContent = line;
          fragment.appendChild(textNode);
          if (index < array.length - 1) {
            fragment.appendChild(document.createElement("br"));
          }
        });
    }

    if (match[2] || match[4]) {
      // Bold text
      const boldText = document.createElement("strong");
      boldText.textContent = match[2] || match[4];
      fragment.appendChild(boldText);
    } else if (match[6] || match[8]) {
      // Italic text
      const italicText = document.createElement("em");
      italicText.textContent = match[6] || match[8];
      fragment.appendChild(italicText);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    text
      .slice(lastIndex)
      .split("\n")
      .forEach((line, index, array) => {
        const textNode = document.createElement("span");
        textNode.textContent = line;
        fragment.appendChild(textNode);
        if (index < array.length - 1) {
          fragment.appendChild(document.createElement("br"));
        }
      });
  }
}

export function processLoadedConversation(
  event,
  labelContainer,
  container,
  conversationHistory,
  defaultSystemMessage,
  needSystemMessage,
  imagePath,
  source,
  button,
) {
  labelContainer.innerHTML = "";
  container.classList.add("transparent-background");
  conversationHistory = [];

  const chatGPTConvo = event.detail.conversations.find(
    (convo) => convo.source === source,
  );

  if (chatGPTConvo === undefined && needSystemMessage) {
    conversationHistory.push({ role: "system", content: defaultSystemMessage });
  }

  if (chatGPTConvo && chatGPTConvo.messages) {
    chatGPTConvo.messages.forEach((message) => {
      if (message.role !== "system") {
        conversationHistory.push({
          role: message.role,
          content: message.content,
        });
        const newLabel = addImageLabel(message.role, imagePath);
        addTextLabel(newLabel, message.content);
        labelContainer.appendChild(newLabel);
      }
    });
  }
  if (chatGPTConvo === undefined) {
    container.style.display = "none";
    button.classList.remove("active-style");
  } else {
    container.style.display = "block";
    button.classList.add("active-style");
  }
  adjustGridColumns();

  return conversationHistory;
}

export function updateConversation(id, conversationHistory, source) {
  fetch(`/conversations/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages: conversationHistory, source: source }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Success:", data);
    })
    .catch((error) => console.error("Error:", error));
}

export function handleResponse(
  data,
  conversationHistory,
  labelContainer,
  newLabelResponse,
) {
  let responseMessage;

  if (
    data.error &&
    data.error === "Input contains restricted or potentially harmful content."
  ) {
    responseMessage = "Input was caught by moderation";
  } else if (data.error && data.error === "Too many requests") {
    responseMessage =
      data.message + " Retry again in " + data.retryAfter + " seconds.";
  } else if (data.content) {
    responseMessage = data.content;
  } else {
    responseMessage = "No response from server";
  }

  conversationHistory.push({ role: "assistant", content: responseMessage });

  addTextLabel(newLabelResponse, responseMessage);
  labelContainer.appendChild(newLabelResponse);

  return conversationHistory;
}

export function handleInput(
  event,
  labelContainer,
  chatContainer,
  conversationHistory,
) {
  const mytext = event.detail.content;
  const newLabel = addImageLabel("user", "/img/user-icon.webp");
  addTextLabel(newLabel, mytext);
  labelContainer.appendChild(newLabel);

  chatContainer.classList.add("transparent-background");
  conversationHistory.push({ role: "user", content: mytext });
  return conversationHistory;
}

export function adjustGridColumns() {
  const container = document.querySelector(".outputContainer");
  const children = container.querySelectorAll(
    ".llamaContainer, .chatContainer4, .chatContainer, .geminiContainer, .claudeContainer, .perplexityContainer, .geminiFlashContainer, .claudeSonnetContainer",
  );
  const visibleChildren = Array.from(children).filter(
    (child) => child.style.display !== "none",
  );
  const visibleCount = visibleChildren.length;
  const selectModelsButton = document.getElementById("selectModelsButton");

  if (visibleCount === 0) {
    selectModelsButton.style.display = "block";
    container.classList.add("no-models");
  } else {
    selectModelsButton.style.display = "none";
    container.classList.remove("no-models");
  }

  container.classList.remove("oneContainerPadding");
  visibleChildren.forEach((child) => {
    child.classList.remove(
      "right-border",
      "bottom-border",
      "left-border",
      "top-border",
      "oneContainerMaxWidth",
    );
  });

  if (visibleCount === 1) {
    container.style.gridTemplateColumns = "1fr";
    visibleChildren.forEach((child) =>
      child.classList.add("oneContainerMaxWidth"),
    );
    container.classList.add("oneContainerPadding");
  } else if (visibleCount > 1 && visibleCount <= 8) {
    const columns = visibleCount === 3 ? 3 : 2;
    container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

    visibleChildren.forEach((child, index) => {
      if (index % columns !== 0) child.classList.add("left-border");
      if ((index + 1) % columns !== 0) child.classList.add("right-border");
      if (index < visibleCount - columns) child.classList.add("bottom-border");
    });

    if (visibleCount === 5 || visibleCount === 7) {
      visibleChildren[visibleCount - 2].classList.add("bottom-border");
    }
  } else {
    container.style.gridTemplateColumns = "none";
  }
}

export function addTypingPlaceholder(container) {
  const typingPlaceholder = document.createElement("div");
  typingPlaceholder.classList.add("typing-placeholder");
  const img = document.createElement("img");
  img.src = "/img/typing.gif"; // Path to your typing GIF
  img.alt = "Typing...";
  typingPlaceholder.appendChild(img);
  container.appendChild(typingPlaceholder);
  return typingPlaceholder;
}
