let quillResume;
document.addEventListener("DOMContentLoaded", () => {
  quillResume = initializeQuill("#quillEditorResume", "#quillToolbarResume");

  const elements = getElements();

  showQuillEditor(quillResume, elements.quillContainerResume, "");

  setEventListeners();

  function initializeQuill(editorSelector, toolbarSelector) {
    const quill = new Quill(editorSelector, {
      theme: "snow",
      readOnly: false,
      modules: {
        toolbar: toolbarSelector,
        keyboard: {
          bindings: {
            tab: {
              key: 9, // Tab key
              handler: function (range, context) {
                const overlay = document.getElementById("suggestionOverlay");
                if (overlay && overlay.style.display === "block") {
                  const suggestion = overlay.innerText;
                  if (suggestion) {
                    // Insert the suggestion and hide the overlay
                    this.quill.insertText(range.index, suggestion + " ");
                    this.quill.setSelection(
                      range.index + suggestion.length + 1,
                    );
                    hideSuggestionOverlay();
                    return false; // Prevent default tab behavior
                  }
                }
                // No suggestion overlay: Insert a tab character
                this.quill.insertText(range.index, "\t");
                this.quill.setSelection(range.index + 1);
                return false; // Prevent default browser behavior
              },
            },
          },
        },
      },
    });

    document.querySelector(toolbarSelector).style.display = "block";

    const contextMenu = document.getElementById("contextMenu");
    const paraphraseButtonEssay = document.getElementById(
      "paraphraseButtonEssay",
    );

    quill.root.addEventListener("contextmenu", (event) => {
      event.preventDefault();

      const selection = quill.getSelection();
      if (selection && selection.length > 0) {
        contextMenu.style.left = `${event.pageX}px`;
        contextMenu.style.top = `${event.pageY}px`;
        contextMenu.style.display = "block";
      } else {
        contextMenu.style.display = "none";
      }
    });

    document.addEventListener("click", () => {
      contextMenu.style.display = "none";
    });

    paraphraseButtonEssay.addEventListener("click", async () => {
      const selection = quill.getSelection();
      if (selection && selection.length > 0) {
        const selectedText = quill.getText(selection.index, selection.length);

        const paraphrasedText = await fetchParaphrasedText(selectedText);

        if (paraphrasedText) {
          quill.deleteText(selection.index, selection.length);
          quill.insertText(selection.index, paraphrasedText);
        }
      }

      contextMenu.style.display = "none";
    });

    let suggestionTimer = null;

    quill.on("text-change", () => {
      hideSuggestionOverlay();
      clearTimeout(suggestionTimer);

      suggestionTimer = setTimeout(async () => {
        const selection = quill.getSelection();
        if (selection && selection.index != null) {
          const cursorIndex = selection.index;

          const contentBefore = quill.getText(
            Math.max(0, cursorIndex - 100),
            100,
          );
          // const contentAfter = quill.getText(cursorIndex, 100);
          const currentContext = contentBefore + "(cursor)";

          const suggestion = await fetchSuggestion(currentContext);
          if (suggestion) {
            showSuggestionOverlay(quill, suggestion);
          }
        }
      }, 1000);
    });

    document.addEventListener("click", (event) => {
      const overlay = document.getElementById("suggestionOverlay");
      if (overlay && !overlay.contains(event.target)) {
        hideSuggestionOverlay();
      }
    });

    return quill;
  }

  async function fetchParaphrasedText(selectedText) {
    showLoadingIndicator(2);
    try {
      const response = await fetch("/paraphrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiPrompt: selectedText }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.content || "";
      } else {
        console.error("Failed to paraphrase text:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching paraphrased text:", error);
    } finally {
      hideLoadingIndicator(2);
    }
    return "";
  }

  async function fetchSuggestion(context) {
    try {
      const response = await fetch("/generate-inline-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiPrompt: context }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.content || "";
      }
    } catch (error) {
      console.error("Error fetching suggestion:", error);
    }
    return "";
  }

  function showSuggestionOverlay(quill, suggestion) {
    const overlay =
      document.getElementById("suggestionOverlay") || createSuggestionOverlay();

    const selection = quill.getSelection();
    if (!selection || selection.index == null) {
      console.warn("No active selection in Quill editor.");
      return;
    }

    const cursorPosition = quill.getBounds(selection.index);
    const editorPosition = quill.container.getBoundingClientRect();

    let overlayLeft = editorPosition.left + cursorPosition.left;
    let overlayTop = editorPosition.top + cursorPosition.bottom + 5;

    overlay.innerText = suggestion;
    overlay.style.display = "block";

    const overlayWidth = overlay.offsetWidth;
    const overlayHeight = overlay.offsetHeight;

    if (overlayLeft + overlayWidth > window.innerWidth) {
      overlayLeft = window.innerWidth - overlayWidth - 10;
    }

    if (overlayTop + overlayHeight > window.innerHeight) {
      overlayTop = window.innerHeight - overlayHeight - 10;
    }

    overlay.style.left = `${Math.max(overlayLeft, 10)}px`;
    overlay.style.top = `${Math.max(overlayTop, 10)}px`;

    overlay.onclick = () => {
      quill.focus();
      const range = quill.getSelection();
      if (range && range.index != null) {
        quill.insertText(range.index, suggestion + " ");
        quill.setSelection(range.index + suggestion.length + 1);
        hideSuggestionOverlay();
      }
    };
  }

  function hideSuggestionOverlay() {
    const overlay = document.getElementById("suggestionOverlay");
    if (overlay) {
      overlay.style.display = "none";
      overlay.onclick = null;
    }
  }

  function createSuggestionOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "suggestionOverlay";
    overlay.style.position = "absolute";
    overlay.style.background = "#f9f9f9";
    overlay.style.border = "1px solid #ccc";
    overlay.style.borderRadius = "4px";
    overlay.style.padding = "5px 8px";
    overlay.style.fontSize = "14px";
    overlay.style.color = "#555";
    overlay.style.cursor = "pointer";
    overlay.style.zIndex = "1000";
    overlay.style.display = "none";
    document.body.appendChild(overlay);
    return overlay;
  }

  function getElements() {
    return {
      container: document.getElementById("containerEssay"),
      resumeJobFormResume: document.getElementById("resumeJobFormResume"),
      buttonContainerResume: document.querySelector(".button-container-resume"),
      quillContainerResume: document.getElementById("quillContainerResume"),
    };
  }

  function setEventListeners() {
    document
      .getElementById("downloadDocxButtonResume")
      .addEventListener("click", () =>
        downloadFile(quillResume, "/download-docx", "resume.docx"),
      );

    document
      .getElementById("downloadPdfButtonResume")
      .addEventListener("click", () =>
        downloadFile(quillResume, "/download-pdf", "resume.pdf"),
      );

    document
      .getElementById("sendPromptButtonResume")
      .addEventListener("click", async () =>
        updateContent(quillResume, "/update-essay", "searchInputResume"),
      );
  }

  function showLoadingIndicator(indicatorNumber) {
    let loadingIndicator;
    if (indicatorNumber === 1) {
      loadingIndicator = document.getElementById("loadingIndicator");
    } else if (indicatorNumber === 2) {
      loadingIndicator = document.getElementById("loadingIndicator2");
    }
    if (loadingIndicator) {
      loadingIndicator.classList.remove("hidden");
    }
  }

  function hideLoadingIndicator(indicatorNumber) {
    let loadingIndicator;
    if (indicatorNumber === 1) {
      loadingIndicator = document.getElementById("loadingIndicator");
    } else if (indicatorNumber === 2) {
      loadingIndicator = document.getElementById("loadingIndicator2");
    }
    if (loadingIndicator) {
      loadingIndicator.classList.add("hidden");
    }
  }

  function showQuillEditor(quill, container, content) {
    container.style.display = "flex";
    quill.root.innerHTML = DOMPurify.sanitize(content);
    quill.enable(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function formatContent(content) {
    return content
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => `<p>${line}</p>`)
      .join("");
  }

  async function downloadFile(quill, url, filename) {
    const content = quill.root.innerText;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadLink = document.createElement("a");
        downloadLink.href = window.URL.createObjectURL(blob);
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        window.URL.revokeObjectURL(downloadLink.href);
      } else {
        console.error("Failed to download file");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  }

  async function updateContent(quill, url, inputId) {
    const prompt = document.getElementById(inputId).value;
    const currentContent = quill.root.innerHTML;

    showLoadingIndicator(2);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiPrompt: prompt, content: currentContent }),
      });

      if (response.ok) {
        const data = await response.json();
        quill.setText("");
        quill.clipboard.dangerouslyPasteHTML(
          0,
          DOMPurify.sanitize(data.content),
        );
        document.getElementById(inputId).value = "";
      } else {
        console.error("Failed to update content:", response.statusText);
        alert("Failed to update content. Please try again.");
      }
    } catch (error) {
      console.error("Error updating content:", error);
      alert("An error occurred while updating the content. Please try again.");
    } finally {
      hideLoadingIndicator(2);
    }
  }

  const aiDetectButton = document.getElementById("aiDetectButton");

  aiDetectButton.addEventListener("click", async () => {
    showLoadingIndicator(2);
    try {
      // Get the content from the Quill editor
      const content = quillResume.getText(); // Use .getText() to get plain text

      // Fetch sentence scores from the /aidetect endpoint
      const response = await fetch("/aidetect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
      });

      if (response.ok) {
        const data = await response.json();
        const { sentenceScores } = data;

        if (sentenceScores && sentenceScores.length > 0) {
          // Annotate the sentences in Quill editor
          annotateSentences(sentenceScores);
        } else {
          console.log("No sentence scores found.");
          alert("No annotations available for this content.");
        }
      } else {
        console.error("Error from /aidetect:", response.statusText);
        alert("Failed to fetch sentence scores. Please try again.");
      }
    } catch (error) {
      console.error("Error during AI detection:", error);
      alert("An error occurred while processing. Please try again.");
    } finally {
      hideLoadingIndicator(2);
    }
  });

  // Function to annotate sentences in the Quill editor
  function annotateSentences(sentenceScores) {
    sentenceScores.forEach(({ sentence, score }) => {
      const index = quillResume.getText().indexOf(sentence);
      if (index !== -1) {
        // Define color ranges
        let color;
        if (score > 0.9) {
          color = "rgba(255, 69, 58, 0.3)"; // High scores: Bright Red
        } else if (score > 0.7) {
          color = "rgba(255, 165, 0, 0.3)"; // Medium scores: Orange
        } else {
          color = "rgba(144, 238, 144, 0.3)"; // Low scores: Light Green
        }
        quillResume.formatText(index, sentence.length, {
          background: color,
        });
      }
    });
  }
});

export { quillResume };

