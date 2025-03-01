let conversationHistory = [];
let currentFilePath = null;
let fileTree = {};

// Initialize Ace Editor
let codeEditor = ace.edit("editorCode");
codeEditor.setTheme("ace/theme/clouds_midnight");
codeEditor.session.setMode("ace/mode/javascript");
codeEditor.setOptions({
    fontFamily: 'Inconsolata',
    fontSize: '12pt',
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
});
codeEditor.setShowPrintMargin(false); 
codeEditor.setValue("// Select a file to view its content", -1); 

document.getElementById('projectForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  // Show loading indicator
  showLoadingIndicator();

  const language = document.getElementById('language').value;
  const method = document.getElementById('method').value;
  const idea = document.getElementById('idea').value;

  try {
      const response = await fetch('/generate-project', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ language, method, idea }),
      });

      if (response.ok) {
          const { content, prompt } = await response.json();
          conversationHistory.push({ role: 'user', content: prompt });
          conversationHistory.push({ role: 'assistant', content: content });
          displayGeneratedProject(content);
      } else {
          alert('Error generating project');
      }
  } catch (error) {
      alert('An unexpected error occurred');
  } finally {
      // Hide loading indicator after getting the response
      hideLoadingIndicator();
  }
});

function displayGeneratedProject(result) {
  // Split the result into individual files and their content based on the separator
  const parts = result.split(/----(.*?)----/).filter(Boolean);

  const files = [];
  for (let i = 0; i < parts.length; i += 2) {
      if (i + 1 < parts.length) {
          const filePath = parts[i].trim();
          const fileContent = parts[i + 1].trim();
          files.push({ path: filePath, content: fileContent });
      }
  }

  // Create a file hierarchy tree
  files.forEach(file => {
      const pathParts = file.path.split('/');
      let current = fileTree;

      pathParts.forEach((part, index) => {
          if (!current[part]) {
              if (index === pathParts.length - 1) {
                  // It's a file
                  current[part] = { type: 'file', content: file.content, filePath: file.path };
              } else {
                  // It's a folder
                  current[part] = { type: 'folder', children: {} };
              }
          }
          current = current[part].children || current[part];
      });
  });

  const tabsContainer = document.getElementById('tabs-container');

  // Clear existing tabs and code content
  tabsContainer.innerHTML = '';

  // Make the project container visible
  document.getElementById('generatedProject').classList.remove('hidden');
  document.getElementById('starterForm').classList.add('hidden');

  // Function to create folder and file elements recursively
  function createTreeElements(tree, parentElement, depth = 0) {
      Object.keys(tree).forEach(key => {
          const node = tree[key];
          const tab = document.createElement('div');
          tab.classList.add('tab');
          tab.textContent = key;

          if (node.type === 'folder') {
              tab.classList.add('folder');
              tab.addEventListener('click', () => {
                  const nextSibling = tab.nextElementSibling;
                  if (nextSibling && nextSibling.classList.contains('children')) {
                      nextSibling.classList.toggle('hidden');
                  }
              });

              // Create a container for children and make it initially hidden
              const childrenContainer = document.createElement('div');
              childrenContainer.classList.add('children', 'hidden');
              createTreeElements(node.children, childrenContainer, depth + 1);

              parentElement.appendChild(tab);
              parentElement.appendChild(childrenContainer);
          } else if (node.type === 'file') {
              tab.classList.add('file');
              tab.dataset.filePath = node.filePath;
              tab.addEventListener('click', () => {
                  // Remove active class from all tabs
                  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

                  // Add active class to the clicked tab
                  tab.classList.add('active');

                  // Display the corresponding file content in the Ace editor
                  codeEditor.setValue(node.content, -1); // -1 to move cursor to the start of the content

                  // Determine language mode based on file extension
                  const extension = node.filePath.split('.').pop().toLowerCase();
                  const mode = getAceModeByExtension(extension);
                  codeEditor.session.setMode(`ace/mode/${mode}`);

                  // Update the current file path to track the selected file
                  currentFilePath = node.filePath;
              });

              parentElement.appendChild(tab);
          }
      });
  }

  // Create the initial tree elements
  createTreeElements(fileTree, tabsContainer);
  
}

document.addEventListener('DOMContentLoaded', function() {
  const promptForm = document.getElementById('promptForm');
  const aiPrompt = document.getElementById('aiPrompt');

  // Handle Enter key for submitting the prompt (without Shift)
  aiPrompt.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();  
          if (aiPrompt.value.trim() !== '') {
              promptForm.dispatchEvent(new Event('submit', { cancelable: true }));
          }
      }
  });

  // Adjust height of the prompt textarea as user types
  function adjustPromptHeight() {
      aiPrompt.style.height = 'auto';
      const maxHeight = 240;
      aiPrompt.style.height = `${Math.min(aiPrompt.scrollHeight, maxHeight)}px`;
  }

  aiPrompt.addEventListener('input', adjustPromptHeight);

  // Handle form submission
  promptForm.addEventListener('submit', function(event) {
      event.preventDefault(); 
      const promptValue = aiPrompt.value.trim();
      
      if (promptValue) {
          // Handle sending the prompt (e.g., send to server or process it)
          console.log('Sending prompt:', promptValue);
          document.getElementById('sendPrompt').dispatchEvent(new Event('click'));

          aiPrompt.value = ''; // Clear the textarea
          adjustPromptHeight(); // Reset height after clearing
      }
  });
});

// Event listener for saving file edits in Ace Editor
codeEditor.session.on('change', () => {
  const activeTab = document.querySelector('.tab.active');
  if (currentFilePath && activeTab && activeTab.dataset.filePath === currentFilePath) {
    // Update the file content in the file tree
        let current = fileTree;
        const pathParts = currentFilePath.split('/');
        pathParts.forEach((part, index) => {
            if (index === pathParts.length - 1) {
                current[part].content = codeEditor.getValue();
            } else {
                current = current[part].children;
            }
        });
    }
});

document.getElementById('sendPrompt').addEventListener('click', async () => {
  const mode = document.getElementById('modeSelect').value;
  const prompt = document.getElementById('aiPrompt').value.trim();
  const activeTab = document.querySelector('.tab.active');

  if (!prompt) {
      alert('Please enter a prompt');
      return;
  }

  if (mode === 'full-project') {
    try {
      const response = await fetch('/update-project', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt, conversationHistory }),
      });

      if (response.ok) {
          const { content, aiPrompt } = await response.json();
          conversationHistory.push({ role: 'user', content: aiPrompt });
          conversationHistory.push({ role: 'assistant', content: content });
          clearFileTree();
          displayGeneratedProject(content);
      } else {
          alert('Error generating project');
      }
    } catch (error) {
        alert('An unexpected error occurred');
    }
  }
  else {
    if (activeTab.dataset.filePath === undefined) {
        alert('Please select a file to work with');
        return;
    }

    const currentContent = codeEditor.getValue();
    
    try {
        // Send the prompt along with the file content to the backend
        const response = await fetch('/process-prompt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                conversationHistory: conversationHistory,
                currentContent: currentContent,
                filePath: activeTab.dataset.filePath
            }),
        });
  
        if (response.ok) {
            const { content, aiPrompt } = await response.json();
            conversationHistory.push({ role: 'user', content: aiPrompt });
            conversationHistory.push({ role: 'assistant', content: content });

            // Update the current file in the Ace editor
            codeEditor.setValue(content, -1);
  
            // Also update the content in the file tree
            updateFileTreeContent(activeTab.dataset.filePath, content);
        } else {
            alert('Error processing prompt');
        }
    } catch (error) {
        alert('An unexpected error occurred');
    }
  }
});

function clearFileTree() {
  const tabsContainer = document.getElementById('tabs-container');
  tabsContainer.innerHTML = '';  // Clear all tabs
}

function updateFileTreeContent(filePath, content) {
  let current = fileTree;
  const pathParts = filePath.split('/');
  pathParts.forEach((part, index) => {
      if (index === pathParts.length - 1) {
          // Update the file content
          current[part].content = content;
      } else {
          current = current[part].children;
      }
  });
}

const downloadButton = document.getElementById('downloadButton');

// Download button event listener
downloadButton.addEventListener('click', async () => {
  const filesToDownload = [];

  // Traverse the file tree to collect files
  function collectFiles(tree, currentPath = '') {
      Object.keys(tree).forEach(key => {
          const node = tree[key];
          const newPath = currentPath ? `${currentPath}/${key}` : key;

          if (node.type === 'file') {
              filesToDownload.push({ path: newPath, content: node.content });
          } else if (node.type === 'folder') {
              collectFiles(node.children, newPath);
          }
      });
  }

  collectFiles(fileTree);

  try {
      const response = await fetch('/download-project', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files: filesToDownload }),
      });

      if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'project_files.zip';
          document.body.appendChild(a);
          a.click();
          a.remove();
      } else {
          alert('Error downloading files');
      }
  } catch (error) {
      alert('An unexpected error occurred during download');
  }
});

function showLoadingIndicator() {
  const loadingIndicator = document.getElementById('loadingIndicator');
  if (loadingIndicator) {
      loadingIndicator.classList.remove('hidden');
  }
}

function hideLoadingIndicator() {
  const loadingIndicator = document.getElementById('loadingIndicator');
  if (loadingIndicator) {
      loadingIndicator.classList.add('hidden');
  }
}

function getAceModeByExtension(extension) {
  const extensionToModeMap = {
      'js': 'javascript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'java': 'java',
      'c': 'c_cpp',
      'cpp': 'c_cpp',
      'cs': 'csharp',
      'rb': 'ruby',
      'php': 'php',
      'xml': 'xml',
      'ts': 'typescript',
      'md': 'markdown',
      'yaml': 'yaml',
      'yml': 'yaml',
      'go': 'golang',
      'rs': 'rust',
      'sh': 'sh',
      'sql': 'sql',
      // Add other extensions as needed
  };

  return extensionToModeMap[extension] || 'text'; // Default to 'text' if no match
}
