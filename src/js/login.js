async function login() {
  const login_id = document.getElementById("id").value;
  const password = document.getElementById("password").value;
  const errorMessageElement = document.getElementById("error-message"); 

  try {
      const response = await fetch("http://10.20.5.59:8080/api/login", {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            login_id, 
            password 
          })
        });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('access_token', data.access_token);
        window.location.href = "chatbot.html";
      } else {
          // Display the error message
          errorMessageElement.textContent = "Login failed: " + (data.error || "Unknown error");
          errorMessageElement.style.visibility = "visible"; // Make the error message visible
          // Clear the input fields
          document.getElementById("id").value = "";
          document.getElementById("password").value = "";
      }
  } catch (error) {
      console.error("Error during login:", error);
      errorMessageElement.textContent = "Login error. Please try again.";
      errorMessageElement.style.visibility="visible";
  }
}

//Added event listener for enter key on password input
document.addEventListener('DOMContentLoaded', () => { // important to wait for the page to load.
  const passwordInput = document.getElementById("password");
  if (passwordInput) { //check if the element exists
      passwordInput.addEventListener("keypress", function(event) {
          if (event.key === "Enter") {
              event.preventDefault(); // prevent default form submission to just allow login function
              login(); // Call your login function
          }
      });
  }
});