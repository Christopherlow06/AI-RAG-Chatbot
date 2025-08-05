console.log('Script loaded'); // Confirm script is loaded

function back() {
  window.location.href = "admin_login.html";
}

// Wait until the script is fully loaded before trying to access elements
const fileInput = document.getElementById('file');
const categorySelect = document.getElementById('category');
const upsertButton = document.querySelector('.upload'); // Select the button by class
const statusDiv = document.getElementById('status');

console.log(upsertButton); // Check if the button element is being selected

async function upsertData() {
  const file     = fileInput.files[0];
  const category = categorySelect.value;

  if (!file || !category) {
    statusDiv.innerHTML = `<p class="error">Please select both file and category</p>`;
    return;
  }

  try {
    upsertButton.disabled = true;
    statusDiv.style.visibility = 'visible';
    statusDiv.innerHTML = `<p class="info"><span class="spinner"></span> Uploading PDF…</p>`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const response = await fetch('http://10.20.5.59:8080/api/upsert_pdf', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.status === "duplicate") {
        statusDiv.style.visibility = 'visible';
        statusDiv.innerHTML = `<p class="warning">${result.message}</p>`;
    } else if (response.ok) {
        statusDiv.style.visibility = 'visible';
        statusDiv.innerHTML = `<p class="success">${result.message}</p>`;
      fileInput.value = '';
    } else {
      throw new Error(result.error || 'Upload failed');
    }

  } catch (error) {
    console.error(error);  // always good to log for debugging
    statusDiv.style.visibility = 'visible';
    statusDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  } finally {
    upsertButton.disabled = false;
  }
}

// Add event listener
if (upsertButton) {
    upsertButton.addEventListener('click', e => {
      e.preventDefault();
      upsertData();
});
} else {
    console.error("Upload button not found");
}
