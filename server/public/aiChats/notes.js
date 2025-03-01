import { quillResume } from '../js/essay.js';

let id = null;
let saveIcon = document.getElementById('saveIcon');

// Wait for quillResume to be initialized
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('newConvo', (event) => {
        id = null;
        if (quillResume) {
            quillResume.setContents([]); // Clear the Quill editor content
        }
    });

    document.addEventListener('conversationLoaded', (event) => {
        id = event.detail._id;
        const notes = event.detail.notes || '';
        if (quillResume) {
            quillResume.root.innerHTML = notes; // Load the notes into the Quill editor
        }
    });

    document.addEventListener('notessaved', (event) => {
        const notes = event.detail.notes;

        if (id === null) {
            id = event.detail.id;
        }

        fetch(`/conversations/${id}/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ notes })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                if (data.message !== 'Notes saved successfully') {
                    alert(data.message);
                } else {
                    changeIconTemporary();
                }
            } else {
                console.error('Error saving notes:', data);
            }
        })
        .catch(error => {
            console.error('Error saving notes:', error);
        });
    });
});

function changeIconTemporary() {
    saveIcon.textContent = 'check';
    setTimeout(() => {
        saveIcon.textContent = 'save';
    }, 2000); // Change back to save icon after 2 seconds
}
