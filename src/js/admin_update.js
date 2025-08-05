function back(){
    window.location.href="admin_login.html";
}


const url = 'http://10.20.5.59:8080';

document.addEventListener('DOMContentLoaded', async () => {
    // Fetch and populate categories with placeholder
    try {
        const response = await fetch('${url}/categories');
        const categories = await response.json();
        
        const categorySelect = document.getElementById('category');
        
        // Add placeholder option
        const placeholder = document.createElement('option');
        placeholder.textContent = 'Select Category';
        placeholder.disabled = true;
        placeholder.selected = true;
        categorySelect.appendChild(placeholder);
        
        // Add actual categories
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
});

async function checkDataExists(question, answer) {
    try {
        const response = await fetch('${url}/api/check_exists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, answer })
        });
        
        if (!response.ok) {
            throw new Error('Failed to check data existence');
        }
        
        const result = await response.json();
        return result.exists;
    } catch (error) {
        console.error('Error checking data existence:', error);
        throw error;
    }
}

async function upsertData() {
    const question = document.getElementById('question').value.trim();
    const answer = document.getElementById('answer').value.trim();
    const category = document.getElementById('category').value;

    if (!question || !answer || !category) {
        return alert('All fields are required');
    }

    try {
        // First check if data exists
        const exists = await checkDataExists(question, answer);
        if (exists) {
            return alert('The data already exists in the database. Please upsert another data.');
        }

        // If data doesn't exist, proceed with upsert
        console.log('Initiating upsert for:', { question, category });
        const response = await fetch('${url}/api/upsert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries: [{ question, answer, category }] })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || errorData.error || 'Upsert failed');
        }

        const data = await response.json();
        console.log('Upsert result:', data);
        alert(data.message || 'Data saved successfully');
        document.getElementById('question').value = '';
        document.getElementById('answer').value = '';
    } catch (error) {
        console.error('Upsert error:', error);
        alert(`Error: ${error.message}`);
    }
}