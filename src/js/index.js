function tofaq(){
    window.location.href = 'faq.html';
}
function tochatbot(){
    window.location.href = 'chatbot.html';
}
//select the next element
function toggleSubMenu(button){
    button.nextElementSibling.classList.toggle("show")
    button.classList.toggle("rotate")
}

function changesize() {
    const fontsize = document.getElementById("fontsize");
    const textbox = document.getElementById("description");
    const selectedsize = fontsize.value;
    textbox.style.fontSize = selectedsize;
}

const url = 'http://10.20.5.59:8080';

document.addEventListener("DOMContentLoaded", function () {
const accessToken = localStorage.getItem("access_token");

  // === Role check and admin menu filtering ===
  if (accessToken) {
    fetch(`${url}/api/role`, {
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
})