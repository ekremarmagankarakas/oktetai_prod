document.addEventListener("DOMContentLoaded", function () {
  const buttons = document.querySelectorAll(".menu-btn");
  const containers = document.querySelectorAll(
    ".llamaContainer, .chatContainer4, .chatContainer, .geminiContainer, .claudeContainer, .perplexityContainer, .geminiFlashContainer, .claudeSonnetContainer",
  );

  function openMyModal1() {
    const modal = document.getElementById("modal1");
    modal.style.display = "block";
  }

  containers.forEach((container) => {
    container.style.display = "none";
  });

  buttons.forEach((button) => {
    button.addEventListener("click", function () {
      const targetId = this.getAttribute("data-target");
      const targetContainer = document.getElementById(targetId);
      adjustGridColumns();

      if (!button.classList.contains("disabled-button")) {
        if (targetContainer.style.display === "block") {
          targetContainer.style.display = "none";
          button.classList.remove("active-style");
          adjustGridColumns();
        } else {
          targetContainer.style.display = "block";
          button.classList.add("active-style");
          adjustGridColumns();
        }
      }
    });
  });

  adjustGridColumns();

  buttons.forEach((button) => {
    button.addEventListener("click", function (event) {
      if (button.classList.contains("disabled-button")) {
        event.preventDefault();
        openMyModal1();
      }
    });
  });

  const showonlybuttons = document.querySelectorAll(".show-only-button");
  showonlybuttons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const containerId = button.getAttribute("data-container");
      showOnly(containerId);
    });
  });

  const selectModelsButton = document.getElementById("selectModelsButton");
  selectModelsButton.addEventListener("click", function () {
    openModal();
  });

  const addButton = document.getElementById("addButton");
  addButton.addEventListener("click", function () {
    addChat();
  });
});

// SEARCH CONTAINER START
document.addEventListener("DOMContentLoaded", function () {
  const chatForm = document.getElementById("chat-form");
  const myText = document.getElementById("mytext");
  myText.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (myText.value.trim() !== "") {
        chatForm.dispatchEvent(new Event("submit", { cancelable: true }));
      }
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const textarea = document.getElementById("mytext");
  const form = document.getElementById("chat-form");
  const outputnotes = document.querySelector(".outputnotes");
  const quillnotes = document.getElementById("quillContainerResume");

  function adjustHeight() {
    textarea.style.height = "auto";
    const maxHeight = 240;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.parentNode.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    outputnotes.style.height = `calc(100% - ${Math.min(textarea.scrollHeight, maxHeight)}px)`;
    quillnotes.style.height = `calc(100vh - 178px - ${Math.min(textarea.scrollHeight, maxHeight)}px)`;
  }

  textarea.addEventListener("input", adjustHeight);

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    textarea.value = "";
    adjustHeight();
  });
  adjustHeight();
});
// SEARCH CONTAINER END

// MODAL START
document.addEventListener("DOMContentLoaded", function () {
  const modal1 = document.getElementById("modal1");
  const btn1 = document.getElementById("openModal1");
  const span1 = document.getElementsByClassName("close-button1")[0];

  const modal2 = document.getElementById("myModal");
  const btn2 = document.getElementById("openModalButton");
  const span2 = document.getElementsByClassName("close")[0];

  btn1.onclick = function () {
    modal1.style.display = "block";
  };

  span1.onclick = function () {
    modal1.style.display = "none";
  };

  btn2.onclick = function () {
    modal2.style.display = "flex";
  };

  span2.onclick = function () {
    modal2.style.display = "none";
  };

  window.onclick = function (event) {
    if (event.target == modal1) {
      modal1.style.display = "none";
    }
    if (event.target == modal2) {
      modal2.style.display = "none";
    }
  };
});

document.addEventListener("DOMContentLoaded", function () {
  // Get modal elements
  const apiKeysModalOverlay = document.getElementById("apiKeysModalOverlay");
  const apiKeysModalButton = document.getElementById("apiKeysModal");
  const apiKeysCloseModalButton = document.getElementById("apiKeysCloseModal");
  const apiKeysForm = document.getElementById("apiKeysForm");

  // Show modal
  apiKeysModalButton.addEventListener("click", () => {
    apiKeysModalOverlay.style.display = "block"; // Show the modal
  });

  // Close modal when close button is clicked
  apiKeysCloseModalButton.addEventListener("click", () => {
    apiKeysModalOverlay.style.display = "none"; // Hide the modal
  });

  // Close modal when clicking outside the modal content
  window.addEventListener("click", (event) => {
    if (event.target === apiKeysModalOverlay) {
      apiKeysModalOverlay.style.display = "none"; // Hide the modal
    }
  });

  // Handle update button clicks
  document.querySelectorAll(".apiKeyUpdateButton").forEach((button) => {
    button.addEventListener("click", (event) => {
      const key = event.target.dataset.key;
      const inputField = document.getElementById(`apiKeys${key}`);

      inputField.classList.remove("hidden"); // Show the input field
      inputField.dataset.updated = true; // Mark the field for update
    });
  });

  // Handle delete button clicks
  document.querySelectorAll(".apiKeyDeleteButton").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const key = event.target.dataset.key;

      if (!confirm(`Are you sure you want to delete the ${key} API key?`))
        return;

      const response = await fetch("/delete-api-key", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });

      if (response.ok) {
        alert(`${key} API Key deleted successfully!`);
        location.reload();
      } else {
        alert(`Failed to delete ${key} API Key.`);
      }
    });
  });

  // Handle add button clicks
  document.querySelectorAll(".apiKeyAddButton").forEach((button) => {
    button.addEventListener("click", (event) => {
      const key = event.target.dataset.key;
      const inputField = document.getElementById(`apiKeys${key}`);

      inputField.classList.remove("hidden"); // Show the input field
      inputField.dataset.updated = true; // Mark the field for addition
    });
  });

  // Handle form submission
  apiKeysForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData();
    document.querySelectorAll(".apiKeysInputField").forEach((input) => {
      if (input.dataset.updated) {
        formData.append(input.name, input.value); // Only include updated or added fields
      }
    });

    // Send updated keys to the server
    const updatedKeys = Object.fromEntries(formData.entries());
    const response = await fetch("/update-api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedKeys),
    });

    if (response.ok) {
      alert("API Keys updated successfully!");
      location.reload();
    } else {
      alert("Failed to update API keys.");
    }
  });
});
// MODAL END

// SCROLL PROGRESS BAR START
document.querySelectorAll(".outputContainer > div").forEach((container) => {
  container.addEventListener("scroll", function () {
    let scrollProgressId = "scrollProgress" + this.id;
    let maxHeight = this.scrollHeight - this.clientHeight;
    let percentageScrolled = (this.scrollTop / maxHeight) * 100;
    let scrollBar = document.getElementById(scrollProgressId);
    if (scrollBar) {
      scrollBar.style.width = percentageScrolled + "%";
    }
    if (maxHeight === 0) {
      scrollBar.style.width = "0%";
    }
  });
});
// SCROLL PROGRESS BAR END

function adjustGridColumns() {
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

function openModal() {
  const openModalButton = document.getElementById("openModalButton");
  openModalButton.click(); // Programmatically click the button to open the modal
}

// CONVERSATION START
const fileUpload = document.getElementById("fileInput");
fileUpload.onchange = uploadFile;

async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const formData = new FormData();
  const file = fileInput.files[0];

  const allowedTypes = [
    "application/pdf",
    "text/plain",
    "image/jpeg",
    "image/png",
  ];
  if (!allowedTypes.includes(file.type)) {
    alert("Only PDF and TXT files are allowed.");
    return;
  }

  formData.append("file", file);

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      // Display the file name
      displayFileName(file.name);
    } else {
      // Show error message if response is not ok
      if (result.error === "File size exceeds the limit of 1MB") {
        alert("File size exceeds the limit of 1MB.");
      } else {
        alert(result.error || "An error occurred while uploading the file.");
      }
    }
  } catch (error) {
    // Show error message if an exception occurs
    console.error("Error uploading file:", error);
    alert("An error occurred while uploading the file.");
  }
}

function displayFileName(fileName) {
  const container = document.querySelector(".container");
  container.style.paddingBottom = "94px";

  const fileNamesContainer = document.getElementById("fileNamesContainer");
  const fileNameElement = document.createElement("div");
  fileNameElement.textContent = fileName;
  fileNameElement.addEventListener("click", () => deleteFile(fileNameElement));
  fileNamesContainer.appendChild(fileNameElement);
}

function deleteFile() {
  fetch("/deletefile", {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.message) {
        const fileNamesContainer =
          document.getElementById("fileNamesContainer");
        while (fileNamesContainer.firstChild) {
          fileNamesContainer.removeChild(fileNamesContainer.firstChild);
        }
        const container = document.querySelector(".container");
        container.style.paddingBottom = "70px";
      } else {
        console.error("Error deleting file:", result);
      }
    })
    .catch((error) => console.error("Error deleting file:", error));
}

document.addEventListener("DOMContentLoaded", function () {
  fetchConversations();

  const conversationList = document.getElementById("conversationList");
  let activeConversationItem = null;

  conversationList.addEventListener("click", function (e) {
    const li = e.target.closest("li");
    const textContainer = e.target.closest(".text-container");
    const deleteButton = e.target.closest("button.delete-button");
    const editButton = e.target.closest("button.edit-button");

    if (!li && !textContainer && !deleteButton && !editButton) return;

    if (li && li.dataset.conversationId) {
      loadConversation(li.dataset.conversationId);

      // Highlight the clicked conversation item
      if (activeConversationItem) {
        activeConversationItem.classList.remove("active-conversation");
      }
      li.classList.add("active-conversation");
      activeConversationItem = li;
    }

    if (textContainer && textContainer.parentElement.dataset.conversationId) {
      const parentLi = textContainer.parentElement;
      loadConversation(parentLi.dataset.conversationId);

      // Highlight the clicked conversation item
      if (activeConversationItem) {
        activeConversationItem.classList.remove("active-conversation");
      }
      parentLi.classList.add("active-conversation");
      activeConversationItem = parentLi;
    }

    if (deleteButton && deleteButton.dataset.conversationId) {
      deleteConversation(deleteButton.dataset.conversationId);
    }

    if (editButton && editButton.dataset.conversationId) {
      enableEditing(li, editButton.dataset.conversationId);
    }
  });

  // Toggle dropdown visibility
  conversationList.addEventListener("click", function (e) {
    if (e.target.classList.contains("dropbtn1")) {
      const dropdownContent = e.target.nextElementSibling;
      if (dropdownContent) {
        dropdownContent.classList.toggle("show");
      }
    }
  });

  // Close the dropdown if the user clicks outside of it
  window.addEventListener("click", function (e) {
    if (!e.target.matches(".dropbtn1")) {
      const dropdowns = document.querySelectorAll(".dropdown1-content");
      dropdowns.forEach((dropdown) => {
        if (dropdown.classList.contains("show")) {
          dropdown.classList.remove("show");
        }
      });
    }
  });
});

function fetchConversations() {
  fetch("/conversations")
    .then((response) => response.json())
    .then((conversations) => {
      const conversationList = document.getElementById("conversationList");
      conversationList.innerHTML = "";

      conversations.sort(
        (a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt),
      );

      const today = [];
      const yesterday = [];
      const lastWeek = [];
      const lastMonth = [];
      const now = new Date();
      const oneDay = 24 * 60 * 60 * 1000;
      const oneWeek = 7 * oneDay;
      const oneMonth = 30 * oneDay;

      conversations.forEach((conversation) => {
        const modifiedAt = new Date(conversation.modifiedAt);
        const timeDiff = now - modifiedAt;

        if (timeDiff < oneDay) {
          today.push(conversation);
        } else if (timeDiff < 2 * oneDay) {
          yesterday.push(conversation);
        } else if (timeDiff < oneWeek) {
          lastWeek.push(conversation);
        } else if (timeDiff < oneMonth) {
          lastMonth.push(conversation);
        }
      });

      function createSection(title, conversations) {
        if (conversations.length > 0) {
          const section = document.createElement("div");
          const header = document.createElement("h3");
          header.textContent = title;
          section.appendChild(header);

          conversations.forEach((conversation) => {
            let li = document.createElement("li");
            let textContainer = document.createElement("div");
            textContainer.className = "text-container";
            textContainer.textContent =
              conversation.title ||
              `Conversation on ${new Date(conversation.modifiedAt).toLocaleString()}`;
            li.appendChild(textContainer);
            li.dataset.conversationId = conversation._id;

            let dropdown = document.createElement("div");
            dropdown.classList.add("dropdown1");

            let dropdownButton = document.createElement("button");
            dropdownButton.classList.add("dropbtn1");
            dropdownButton.className = "dropbtn1 material-icons";
            dropdownButton.textContent = "more_vert";

            let dropdownContent = document.createElement("div");
            dropdownContent.classList.add("dropdown1-content");

            let deleteButton = document.createElement("button");
            deleteButton.classList.add("material-icons", "delete-button");
            deleteButton.textContent = "delete";
            deleteButton.dataset.conversationId = conversation._id;

            let editButton = document.createElement("button");
            editButton.classList.add("material-icons", "edit-button");
            editButton.textContent = "edit";
            editButton.dataset.conversationId = conversation._id;

            dropdownContent.appendChild(editButton);
            dropdownContent.appendChild(deleteButton);
            dropdown.appendChild(dropdownButton);
            dropdown.appendChild(dropdownContent);
            li.appendChild(dropdown);
            section.appendChild(li);
          });

          conversationList.appendChild(section);
        }
      }

      createSection("Today", today);
      createSection("Yesterday", yesterday);
      createSection("Last Week", lastWeek);
      createSection("Last Month", lastMonth);
    })
    .catch((error) => console.error("Error loading conversations:", error));
}

function enableEditing(listItem, conversationId) {
  const textContainer = listItem.querySelector(".text-container");
  const originalTitle = textContainer.textContent;

  // Create a textarea for inline editing
  const textarea = document.createElement("textarea");
  textarea.value = originalTitle;
  textarea.rows = 1;
  textContainer.replaceWith(textarea);

  // Focus on the textarea for immediate editing
  textarea.focus();

  // Add event listener to handle blur (click outside) and enter key
  textarea.addEventListener("blur", function () {
    cancelEditing(listItem, originalTitle);
  });

  textarea.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveChanges(listItem, conversationId);
    }
  });
}

function saveChanges(listItem, conversationId) {
  const textarea = listItem.querySelector("textarea");
  const updatedTitle = textarea.value;

  // Send updated data to the server
  fetch(`/conversations/${conversationId}/title`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: updatedTitle,
    }),
  })
    .then((response) => {
      if (response.ok) {
        console.log("Conversation updated successfully");
        fetchConversations(); // Refresh the conversation list
      } else {
        console.error("Failed to update conversation");
      }
    })
    .catch((error) => console.error("Error updating conversation:", error));
}

function cancelEditing(listItem, originalTitle) {
  const textarea = listItem.querySelector("textarea");

  // Replace textarea with the original title
  const textContainer = document.createElement("div");
  textContainer.className = "text-container";
  textContainer.textContent = originalTitle;
  textarea.replaceWith(textContainer);
}

function deleteConversation(conversationId) {
  fetch(`/conversations/${conversationId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.message) {
        alert(result.message);
        fetchConversations();
      } else {
        console.error("Error deleting conversation:", result);
      }
    })
    .catch((error) => console.error("Error deleting conversation:", error));
}

let idset = false;
function loadConversation(conversationId) {
  fetch(`/conversations/${conversationId}`)
    .then((response) => response.json())
    .then((conversation) => {
      idset = true;
      document.dispatchEvent(
        new CustomEvent("conversationLoaded", { detail: conversation }),
      );
    })
    .catch((error) => console.error("Error loading conversation:", error));
}

document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("toggleSidebarButton");
  const toggleButton1 = document.getElementById("toggleSidebarButton1");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  toggleButton.addEventListener("click", () => {
    sidebar.classList.toggle("deactive");
    overlay.classList.toggle("active");
  });
  toggleButton1.addEventListener("click", () => {
    sidebar.classList.toggle("deactive");
    overlay.classList.toggle("active");
  });
  overlay.addEventListener("click", () => {
    sidebar.classList.remove("deactive");
    overlay.classList.remove("active");
  });
});

const form = document.getElementById("chat-form");
const mytextInput = document.getElementById("mytext");
let id = null;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const mytext = mytextInput.value.trim();
  const maxInputSize = 1 * 1024 * 1024;
  const inputSize = new TextEncoder().encode(mytext).length;
  if (inputSize > maxInputSize) {
    alert(`Input size exceeds the limit of ${maxInputSize / 1024}KB`);
    return;
  }

  const sendmytext =
    "write a at most 4 word title for the following message. Just output the title and never output more than 4 words. Here is the text that you need to write a title for: " +
    mytext;

  const fileNamesContainer = document.getElementById("fileNamesContainer");
  while (fileNamesContainer.firstChild) {
    fileNamesContainer.removeChild(fileNamesContainer.firstChild);
  }
  const container = document.querySelector(".container");
  container.style.paddingBottom = "70px";

  if (!idset) {
    idset = true;

    // Step 1: Create the conversation first
    fetch("/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: "Loading...", messages: [] }),
    })
      .then((response) => response.json())
      .then(async (data) => {
        id = data.id;

        // Dispatch the event after creating the conversation
        const info = {
          content: mytext,
          id: id,
          subscriptionPlan: subscriptionPlan,
        };
        document.dispatchEvent(
          new CustomEvent("submitclicked", { detail: info }),
        );

        // Step 2: Fetch the API result
        return fetch("/api/chat-single", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            models: ["gpt-3.5-turbo"],
            messages: [{ role: "user", content: sendmytext }],
          }),
        });
      })
      .then((response) => response.json())
      .then((data) => {
        const title = data.content;

        // Step 3: Update the conversation title with the API result
        return fetch(`/conversations/${id}/title`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: title }),
        });
      })
      .then((response) => response.json())
      .then((data) => {
        console.log("Title updated successfully:", data);
        fetchConversations();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  } else {
    const info = {
      content: mytext,
      id: id,
      subscriptionPlan: subscriptionPlan,
    };
    document.dispatchEvent(new CustomEvent("submitclicked", { detail: info }));
  }
});

import { quillResume } from "./essay.js";
const quillEditorResume = document.getElementById("quillEditorResume");

document
  .getElementById("saveNotesButton")
  .addEventListener("click", async function () {
    const notes = quillResume.root.innerHTML;
    if (idset) {
      const info = { notes: notes, id: id };
      document.dispatchEvent(new CustomEvent("notessaved", { detail: info }));
    } else {
      idset = true;
      // Step 1: Create the conversation first
      fetch("/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: "Loading...", messages: [] }),
      })
        .then((response) => response.json())
        .then(async (data) => {
          id = data.id;

          // Dispatch the event after creating the conversation
          const info = { notes: notes, id: id };
          document.dispatchEvent(
            new CustomEvent("notessaved", { detail: info }),
          );

          // Step 2: Fetch the API result
          return fetch("/api/chat-single", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              models: ["gpt-3.5-turbo"],
              messages: [{ role: "user", content: notes }],
            }),
          });
        })
        .then((response) => response.json())
        .then((data) => {
          const title = data.content;

          // Step 3: Update the conversation title with the API result
          return fetch(`/conversations/${id}/title`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ title: title }),
          });
        })
        .then((response) => response.json())
        .then((data) => {
          console.log("Title updated successfully:", data);
          fetchConversations();
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  });

quillEditorResume.addEventListener("keydown", function (event) {
  if ((event.ctrlKey || event.metaKey) && event.key === "s") {
    event.preventDefault();
    const notes = quillResume.root.innerHTML;
    if (idset) {
      const info = { notes, id };
      document.dispatchEvent(new CustomEvent("notessaved", { detail: info }));
    } else {
      idset = true;
      // Step 1: Create the conversation first
      fetch("/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: "Loading...", messages: [] }),
      })
        .then((response) => response.json())
        .then(async (data) => {
          id = data.id;

          // Dispatch the event after creating the conversation
          const info = { notes: notes, id: id };
          document.dispatchEvent(
            new CustomEvent("notessaved", { detail: info }),
          );

          // Step 2: Fetch the API result
          return fetch("/api/chat-single", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              models: ["gpt-3.5-turbo"],
              messages: [{ role: "user", content: notes }],
            }),
          });
        })
        .then((response) => response.json())
        .then((data) => {
          const title = data.content;

          // Step 3: Update the conversation title with the API result
          return fetch(`/conversations/${id}/title`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ title: title }),
          });
        })
        .then((response) => response.json())
        .then((data) => {
          console.log("Title updated successfully:", data);
          fetchConversations();
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  }
});

document
  .getElementById("paraphraseButton")
  .addEventListener("click", async function () {
    const paraphraseInput = document.getElementById(
      "paraphrasingInputTextarea",
    ).value;
    const paraphraseOutput = document.getElementById(
      "paraphrasingOutputTextarea",
    );
    if (paraphraseInput.trim() === "") {
      paraphraseOutput.value = "";
      return;
    }

    const mytext = paraphraseInput.trim();
    const maxInputSize = 10 * 1024;
    const inputSize = new TextEncoder().encode(mytext).length;
    if (inputSize > maxInputSize) {
      alert(`Input size exceeds the limit of ${maxInputSize / 1024}KB`);
      return;
    }

    const info = { paraphraseInput: paraphraseInput };
    document.dispatchEvent(new CustomEvent("paraphrase", { detail: info }));
  });

function addChat() {
  mytextInput.value = "";

  const fileNamesContainer = document.getElementById("fileNamesContainer");
  while (fileNamesContainer.firstChild) {
    fileNamesContainer.removeChild(fileNamesContainer.firstChild);
  }
  const container = document.querySelector(".container");
  container.style.paddingBottom = "70px";

  id = null;
  idset = false;

  document.dispatchEvent(new CustomEvent("newConvo", {}));

  adjustGridColumns();

  document.getElementById("myModal").style.display = "flex";

  fetchConversations();
}
// CONVERSATION END

// STIPE PAYMENT START
const stripe = Stripe(
  "pk_test_51PJJMYJ8qnxprPfyv1pdDYqzLJklOCAypNAtB5uzdpjWzGMXkLhaM8GWJgwyjYEzdFQ6zLq5Sy1YaXw4OCxRf6Mx007JJvooUd",
);

document.querySelectorAll(".cta").forEach((button) => {
  button.addEventListener("click", () => {
    const plan = button.getAttribute("data-plan");
    fetch("/is-customer")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok " + response.statusText);
        }
        return response.json();
      })
      .then((data) => {
        if (data.isCustomer) {
          fetch("/customer-portal", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(
                  "Network response was not ok " + response.statusText,
                );
              }
              return response.json();
            })
            .then((data) => {
              if (data.url) {
                window.location.href = data.url;
              } else {
                console.error("Error: No URL returned from server");
              }
            })
            .catch((error) => {
              console.error("Error opening customer-portal:", error.message);
            });
        } else {
          fetch("/create-checkout-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ plan }),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(
                  "Network response was not ok " + response.statusText,
                );
              }
              return response.json();
            })
            .then((session) => {
              stripe.redirectToCheckout({ sessionId: session.id });
            })
            .catch((error) => {
              console.error("Error:", error);
            });
        }
      })
      .catch((error) => {
        console.error("Error fetching subscription plan:", error.message);
      });
  });
});

// STRIPE PAYMENT END

let previouslyVisibleContainers = [];
let previousActiveButtons = [];
let currentVisibleContainer = null;

function showOnly(containerId) {
  const containers = document.querySelectorAll(".outputContainer > div");
  const showOnlyButtons = document.querySelectorAll(".menu-btn");

  if (currentVisibleContainer === containerId) {
    // Restore the containers' initial visibility states and clear the active styles
    previouslyVisibleContainers.forEach((container) => {
      container.style.display = "block";
    });
    containers.forEach((container) => {
      if (!previouslyVisibleContainers.includes(container)) {
        container.style.display = "none";
      }
    });
    showOnlyButtons.forEach((button) => {
      const targetId = button.getAttribute("data-target");
      if (previousActiveButtons.includes(targetId)) {
        button.classList.add("active-style");
      } else {
        button.classList.remove("active-style");
      }
    });
    currentVisibleContainer = null;
    previouslyVisibleContainers = [];
    previousActiveButtons = [];
  } else {
    // Save the current state of visible containers
    previouslyVisibleContainers = Array.from(containers).filter(
      (container) => container.style.display === "block",
    );
    previousActiveButtons = Array.from(showOnlyButtons)
      .filter((button) => button.classList.contains("active-style"))
      .map((button) => button.getAttribute("data-target"));

    // Show only the selected container
    containers.forEach((container) => {
      container.style.display = container.id === containerId ? "block" : "none";
    });
    showOnlyButtons.forEach((button) => {
      const targetId = button.getAttribute("data-target");
      button.classList.toggle("active-style", targetId === containerId);
    });

    currentVisibleContainer = containerId;
  }

  adjustGridColumns();
}

document
  .querySelector(".dropdownButton")
  .addEventListener("click", function () {
    document.querySelector(".dropdownContent").classList.toggle("show");
  });

// Close the dropdown if the user clicks outside of it
window.onclick = function (event) {
  if (!event.target.matches(".dropdownButton")) {
    var dropdowns = document.getElementsByClassName("dropdownContent");
    for (var i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains("show")) {
        openDropdown.classList.remove("show");
      }
    }
  }
};

window.addEventListener("click", function (event) {
  if (
    !document.querySelector(".dropdownButton").contains(event.target) &&
    !document.querySelector(".dropdownContent").contains(event.target)
  ) {
    document.querySelector(".dropdownContent").classList.remove("show");
  }
});

const toggleParaphrasingButton = document.getElementById(
  "toggleParaphrasingButton",
);

toggleParaphrasingButton.addEventListener("click", function () {
  toggleParaphrasingButton.classList.toggle("active");
});

const toggleNotesButton = document.getElementById("toggleNotesButton");

toggleNotesButton.addEventListener("click", function () {
  toggleNotesButton.classList.toggle("active");
});

let previouslyVisibleContainers1 = [];
let previousActiveButtons1 = [];
let currentVisibleContainer1 = null;

function showOnly1(containerId) {
  const containers = document.querySelectorAll(
    "#aiSection, #notesSection, #paraphrasingSection",
  );
  const toggleButtons = document.querySelectorAll(
    "#toggleParaphrasingButton, #toggleNotesButton",
    "#toggleAIButton",
  );

  if (currentVisibleContainer1 === containerId) {
    // Restore the containers' initial visibility states
    previouslyVisibleContainers1.forEach((container) => {
      container.style.display = "block";
      container.style.width = "";
    });
    containers.forEach((container) => {
      if (!previouslyVisibleContainers1.includes(container)) {
        container.style.display = "none";
      }
    });
    toggleButtons.forEach((button) => {
      const targetId = button.getAttribute("data-target");
      if (previousActiveButtons1.includes(targetId)) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });
    currentVisibleContainer1 = null;
    previouslyVisibleContainers1 = [];
    previousActiveButtons1 = [];
  } else {
    // Save the current state of visible containers
    previouslyVisibleContainers1 = Array.from(containers).filter(
      (container) => container.style.display === "block",
    );
    previousActiveButtons1 = Array.from(toggleButtons)
      .filter((button) => button.classList.contains("active"))
      .map((button) => button.getAttribute("data-target"));

    // Show only the selected container
    containers.forEach((container) => {
      if (container.id === containerId) {
        container.style.display = "block";
        container.style.width = "100%";
      } else {
        container.style.display = "none";
      }
    });
    toggleButtons.forEach((button) => {
      const targetId = button.getAttribute("data-target");
      if (targetId === containerId) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });

    currentVisibleContainer1 = containerId;
  }
}

document.querySelectorAll(".maxSizeBtn").forEach((button) => {
  button.addEventListener("click", function () {
    const targetId = this.getAttribute("data-target");
    showOnly1(targetId);
  });
});

document.addEventListener("DOMContentLoaded", function () {
  // AI section toggle functionality
  const toggleAIButton = document.getElementById("toggleAIButton");
  const aiSection = document.getElementById("aiSection");

  // Set initial state
  toggleAIButton.classList.add("active");
  aiSection.style.display = "block";

  toggleAIButton.addEventListener("click", function () {
    if (aiSection.style.display === "block") {
      aiSection.style.display = "none";
      toggleAIButton.classList.remove("active");
    } else {
      aiSection.style.display = "block";
      toggleAIButton.classList.add("active");
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const colorModeToggle = document.getElementById("colorModeToggle");
  const root = document.documentElement; // Refers to the `:root` element

  // Function to apply the color mode based on localStorage
  const applyColorMode = (mode) => {
    if (mode === "light") {
      root.classList.add("light-mode");
    } else {
      root.classList.remove("light-mode");
    }
  };

  // Check localStorage for the saved mode
  const savedMode = localStorage.getItem("colorMode");

  // Apply the saved mode or default to dark mode
  if (savedMode) {
    applyColorMode(savedMode);
  }

  // Toggle the color mode on button click and store it in localStorage
  colorModeToggle.addEventListener("click", () => {
    root.classList.toggle("light-mode");
    const newMode = root.classList.contains("light-mode") ? "light" : "dark";
    localStorage.setItem("colorMode", newMode); // Save the new mode
  });
});

document.addEventListener("DOMContentLoaded", function () {
  // Notes section toggle functionality
  const toggleNotesButton = document.getElementById("toggleNotesButton");
  const notesSection = document.getElementById("notesSection");

  toggleNotesButton.addEventListener("click", function () {
    if (notesSection.style.display === "block") {
      notesSection.style.display = "none";
    } else {
      notesSection.style.display = "block";
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  // Notes section toggle functionality
  const toggleParaphrasingButton = document.getElementById(
    "toggleParaphrasingButton",
  );
  const paraphrasingSection = document.getElementById("paraphrasingSection");

  toggleParaphrasingButton.addEventListener("click", function () {
    if (paraphrasingSection.style.display === "block") {
      paraphrasingSection.style.display = "none";
    } else {
      paraphrasingSection.style.display = "block";
    }
  });
});
