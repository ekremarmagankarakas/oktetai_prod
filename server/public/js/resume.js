document.addEventListener("DOMContentLoaded", () => {
  // Initialize Quill Editors
  const quillCover = initializeQuill('#quillEditorCover', '#quillToolbarCover');
  const quillResume = initializeQuill('#quillEditorResume', '#quillToolbarResume');

  // Get key elements
  const elements = getElements();

  // Tab Switching Logic
  initializeTabs(elements.tabs, elements.sections);

  // Event Listeners
  setEventListeners();

  // Helper Functions

  function initializeQuill(editorSelector, toolbarSelector) {
    const quill = new Quill(editorSelector, {
      theme: 'snow',
      readOnly: true,
      modules: { toolbar: toolbarSelector },
    });

    // Hide toolbar initially
    document.querySelector(toolbarSelector).style.display = 'block';
    return quill;
  }

  function getElements() {
    return {
      tabsContainer: document.querySelector('.tabs'),
      container: document.getElementById('container'),
      tabs: document.querySelectorAll('.tab'),
      sections: document.querySelectorAll('.content-section'),
      resumeJobFormCover: document.getElementById('resumeJobFormCover'),
      resumeJobFormResume: document.getElementById('resumeJobFormResume'),
      buttonContainerCover: document.querySelector('.button-container-cover'),
      buttonContainerResume: document.querySelector('.button-container-resume'),
      quillContainerCover: document.getElementById('quillContainerCover'),
      quillContainerResume: document.getElementById('quillContainerResume'),
      loadingIndicatorResume: document.getElementById('loadingIndicatorResume'),
      loadingIndicatorCover: document.getElementById('loadingIndicatorCover'),
    };
  }

  function initializeTabs(tabs, sections) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        sections.forEach(section => section.classList.remove('active'));

        tab.classList.add('active');
        document.querySelector(tab.getAttribute('data-target')).classList.add('active');
      });
    });
  }

  function setEventListeners() {
    document.getElementById('generateCoverLetterButton').addEventListener('click', async () => {
      await handleGenerate(
        quillCover,
        elements.loadingIndicatorCover,
        elements.resumeJobFormCover,
        elements.buttonContainerCover,
        elements.quillContainerCover,
        '/generate-custom-cover-letter',
        { 
          aiPrompt: document.getElementById('resumeTextCover').value, 
          content: document.getElementById('jobDescription').value 
        }
      );
    });

    document.getElementById('improveResumeButton').addEventListener('click', async () => {
      await handleGenerate(
        quillResume,
        elements.loadingIndicatorResume,
        elements.resumeJobFormResume,
        elements.buttonContainerResume,
        elements.quillContainerResume,
        '/get-improvements',
        { aiPrompt: document.getElementById('resumeTextResume').value }
      );
    });

    document.getElementById('downloadDocxButtonCover').addEventListener('click', () =>
      downloadFile(quillCover, '/download-docx', 'cover-letter.docx')
    );

    document.getElementById('downloadDocxButtonResume').addEventListener('click', () =>
      downloadFile(quillResume, '/download-docx', 'resume.docx')
    );

    document.getElementById('downloadPdfButtonCover').addEventListener('click', () =>
      downloadFile(quillCover, '/download-pdf', 'cover-letter.pdf')
    );

    document.getElementById('downloadPdfButtonResume').addEventListener('click', () =>
      downloadFile(quillResume, '/download-pdf', 'resume.pdf')
    );

    document.getElementById('sendPromptButtonCover').addEventListener('click', async () =>
      updateContent(quillCover, '/update-cover-letter', 'searchInputCover')
    );

    document.getElementById('sendPromptButtonResume').addEventListener('click', async () =>
      updateContent(quillResume, '/update-resume', 'searchInputResume')
    );
  }

  async function handleGenerate(quill, loadingIndicator, form, buttonContainer, quillContainer, url, payload) {
    showLoadingIndicator(loadingIndicator);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      const formattedContent = formatContent(data.content);

      // Hide forms and buttons, expand container
      form.style.display = 'none';
      buttonContainer.style.display = 'none';
      handleExpandAndHideTabs();
      showQuillEditor(quill, quillContainer, formattedContent);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      // Hide loading indicator after getting the response
      hideLoadingIndicator(loadingIndicator);
    }
  }

  function showLoadingIndicator(loadingIndicator) {
    if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden');
    }
  }
  
  function hideLoadingIndicator(loadingIndicator) {
    if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
    }
  }

  function handleExpandAndHideTabs() {
    console.log("Hiding tabs and expanding container");
    elements.tabsContainer.style.display = 'none';
    elements.container.classList.add('expanded');
  }

  function showQuillEditor(quill, container, content) {
    container.style.display = 'flex';
    quill.root.innerHTML = DOMPurify.sanitize(content);
    quill.enable(true);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function formatContent(content) {
    return content
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => `<p>${line}</p>`)
      .join('');
  }

  async function downloadFile(quill, url, filename) {
    const content = quill.root.innerText;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadLink = document.createElement('a');
        downloadLink.href = window.URL.createObjectURL(blob);
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        window.URL.revokeObjectURL(downloadLink.href);
      } else {
        console.error('Failed to download file');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  }

  async function updateContent(quill, url, inputId) {
    const prompt = document.getElementById(inputId).value;
    const currentContent = quill.root.innerHTML;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiPrompt: prompt, content: currentContent }),
      });

      if (response.ok) {
        const data = await response.json();
        quill.setText('');
        quill.clipboard.dangerouslyPasteHTML(0, DOMPurify.sanitize(data.content));
        document.getElementById(inputId).value = '';
      } else {
        console.error('Failed to update content:', response.statusText);
        alert('Failed to update content. Please try again.');
      }
    } catch (error) {
      console.error('Error updating content:', error);
      alert('An error occurred while updating the content. Please try again.');
    }
  }
});
