const searchInput = document.querySelector("[data-search]");
const urlParams = new URLSearchParams(window.location.search);
const initialSearch = urlParams.get('search');
if (initialSearch) {
  searchInput.value = initialSearch;
}
const tbody = document.querySelector('#history-table tbody');

document.getElementById('refreshBtn').addEventListener('click', () => {
  const query = searchInput.value.trim();
  const url = new URL(window.location);
  url.searchParams.set('search', query);
  window.location.href = url.toString();
});

let record = [];
let filteredRecords = [];
let currentPage = 1;
const recordsPerPage = 25;

// create pagination 
const paginationWrapper = document.createElement('div');
paginationWrapper.id = 'pagination-controls';
paginationWrapper.innerHTML = `
  <button id="prevBtn">Previous</button>
  <span id="pageInfo">Page 1</span>
  <button id="nextBtn">Next</button>
`;
document.getElementById('pagination-placeholder').appendChild(paginationWrapper);

// search input filtering
searchInput.addEventListener("input", (e) => {
  const value = e.target.value.toLowerCase();
  filteredRecords = record.filter(rec =>
    rec.question.includes(value) || rec.answer.includes(value)
  );
  currentPage = 1;
  displayPage(currentPage);
});

// fetch and display data
const accessToken = localStorage.getItem('access_token');
fetch('http://10.20.5.59:8080/history',{
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + accessToken,
    'Content-Type': 'application/json' 
  }
})
  .then(async res =>{
    const data=await res.json();
    if(!res.ok){
      throw new Error(data.detail || "Failed to fetch history");
    }

// === Role check and admin menu filtering ===
if (accessToken) {
  fetch(`http://10.20.5.59:8080/api/role`, {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + accessToken
    }
  })
  .then(res => res.json())
  .then(data => {
  if (data.role === "admin") {
      const adminMenu = document.getElementById("admin-menu");
      if (adminMenu) adminMenu.style.display = "block";
  } else {
      const adminMenu = document.getElementById("admin-menu");
      if (adminMenu) adminMenu.style.display = "none";
  }
  })
  .catch(err => {
    console.error("Failed to fetch user role:", err);
  });
}


    record = data.map(rec => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(rec.date).toLocaleString()}</td>
        <td>${rec.question}</td>
        <td>${rec.answer}</td>
      `;
      tr.addEventListener('click', () => openModal(rec));
      return {
        question: rec.question.toLowerCase(),
        answer: rec.answer.toLowerCase(),
        element: tr,
        raw: rec
      };
    });

    // Use initial search input if available
    filteredRecords = record;
    if (initialSearch) {
      const searchValue = initialSearch.toLowerCase();
      filteredRecords = record.filter(rec =>
        rec.question.includes(searchValue) || rec.answer.includes(searchValue)
      );
    }

    displayPage(currentPage);
  })
  .catch(err => console.error('Error fetching history:', err));

// modal 
function openModal(record) {
  document.getElementById('full-question').innerText = record.question;
  document.getElementById('full-answer').innerText = record.answer;
  document.getElementById('modal').classList.remove('hidden');
}
document.getElementById('close').addEventListener('click', () => {
  document.getElementById('modal').classList.add('hidden');
});


// pagination logic
function displayPage(page) {
  tbody.innerHTML = '';
  const start = (page - 1) * recordsPerPage;
  const end = start + recordsPerPage;
  const pageRecords = filteredRecords.slice(start, end);
  pageRecords.forEach(r => tbody.appendChild(r.element));

  document.getElementById('pageInfo').innerText = `Page ${page} of ${Math.ceil(filteredRecords.length / recordsPerPage)}`;
  document.getElementById('prevBtn').disabled = page === 1;
  document.getElementById('nextBtn').disabled = end >= filteredRecords.length;
}

document.addEventListener('click', (e) => {
  if (e.target.id === 'prevBtn' && currentPage > 1) {
    currentPage--;
    displayPage(currentPage);
  }
  if (e.target.id === 'nextBtn' && currentPage * recordsPerPage < filteredRecords.length) {
    currentPage++;
    displayPage(currentPage);
  }
});
