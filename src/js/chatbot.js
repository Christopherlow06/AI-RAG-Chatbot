function toggleSubMenu(button) {
  button.nextElementSibling.classList.toggle("show");
  button.classList.toggle("rotate");
}

function toggleActive(clickedButton) {
  const buttons = document.querySelectorAll(".toggle-button");
  buttons.forEach((button) => button.classList.remove("active"));
  clickedButton.classList.add("active");
}

const url = 'http://10.20.5.59:8080';

document.addEventListener("DOMContentLoaded", function () {
  const accessToken = localStorage.getItem("access_token");

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

  const sendBtn = document.getElementById("send-btn");
  const chatbotInput = document.getElementById("chatbot-input");
  const chatbotMessages = document.getElementById("chatbot-messages");
  const searchboxinput = document.getElementById("searchbox");

  const modal = document.getElementById("image-modal");
  const modalImg = document.getElementById("modal-img");
  const dragSpeed = 0.5;        //1 is normal 

  let clicked = false;
  let startX, startY;
  let offsetX = 0;
  let offsetY = 0;

  //wheel + ctrl to scroll
  modal.addEventListener("wheel", function (e) {
    //activates only if ctrl key is held
    if (!e.ctrlKey) return;
    //prevent default scrolling feature
    e.preventDefault();

    let scale = parseFloat(this.dataset.scale || "1");  //read current zoom or take 1
    const delta = e.deltaY > 0 ? -0.1 : 0.1;            //get scrollwheel direction
    scale = Math.min(Math.max(scale + delta, 0.5), 5);  //specify max and min zoom which is .5 to 5
    modalImg.style.transform = `scale(${scale})`;       //apply to img to zoom lvl
    this.dataset.scale = scale.toString();              //store zoom level for further usage
    modalImg.style.transform = `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`;
  });

  // Drag start
  modalImg.addEventListener("mousedown", (e) => {
    //prevent default scrolling feature
    e.preventDefault();
    clicked = true;      //to indicate dragging started
    startX = e.clientX;  //record mouse starting x pos
    startY = e.clientY;  //record mouse starting y pos
    modal.style.cursor = "grabbing";
  });

  // Drag end
  window.addEventListener("mouseup", () => {
    clicked = false;     //indicate the end of the drag
    modal.style.cursor = "auto";
  });

  // Drag move
  window.addEventListener("mousemove", (e) => {
    //check for clicked
    if (!clicked) return;

    //e.clientx/y is current mouse coords, startx/y is last recorded mouse coords 
    //multiply by drag speed to get how far the mouse moved in dx/dy
    const dx = (e.clientX - startX) * dragSpeed;
    const dy = (e.clientY - startY) * dragSpeed;
    //update the current mouse coords
    startX = e.clientX;
    startY = e.clientY;

    //update the offset 
    offsetX += dx;
    offsetY += dy;

    //set zoom scale if not 1
    const scale = modal.dataset.scale || 1;
    //apply the zoom n offset to the pic
    modalImg.style.transform = `scale(${modal.dataset.scale || 1}) translate(${offsetX}px, ${offsetY}px)`;
  });
   
  // Close modal on ESC key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.style.display === "flex") {
      modal.style.display = "none";
      modalImg.style.transform = "scale(1)";
      isZoomed = false;
    }
  });

  // Close modal if clicking outside image
  document.getElementById("image-modal").addEventListener("click", function (e) {
    if (e.target.id === "image-modal") {
      this.style.display = "none";
    }
  });

  sendBtn.addEventListener("click", sendMessage);
  chatbotInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  let isProcessing = false; // Prevents multiple sends

  async function sendMessage() {
    if (isProcessing) return; // Exit if already processing
    isProcessing = true;

    const userMessage = chatbotInput.value.trim();
    if (!userMessage) {
      isProcessing = false;
      return;
    }

    const currentCategory = document.getElementById("category").value;

    // Validate category selection
    if (!currentCategory) {
      appendMessage("bot", "Please select a category first.");
      isProcessing = false;
      return;
    }

    appendMessage("user", userMessage);
    chatbotInput.value = "";
    // Disable the button during processing
    sendBtn.disabled = true;
    
    try {
      await processPdfQuery(userMessage, currentCategory);
    } catch (error) {
      console.error("Error processing message:", error);
      appendMessage("bot", "Sorry, I encountered an error processing your request.");
    } finally {
    // Re-enable the button after processing completes or fails
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
    isProcessing = false;
    }
  }

  async function processPdfQuery(query, category) {
    try {
      appendMessage("bot", "Processing your query...");
      const loadingElement = chatbotMessages.lastChild;

      console.log("Sending request to API with:", { query, category });

      const response = await fetch(`${url}/api/process_pdf_query`, {
        method: "POST",
        headers: {'Authorization': 'Bearer ' + accessToken,
                  'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          category: category
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await response.json();
      console.log("Full API Response:", result);

      chatbotMessages.removeChild(loadingElement);

      if (result.status === "success") {
        // Get the nested multimodal response
        const multimodal = result.multimodal_response;
        console.log("Multimodal Response:", multimodal);

        if (!multimodal) {
          appendMessage("bot", "Received response but missing multimodal data");
          return;
        }

        // First display the image from image_b64 (preferred) or colpali_image (fallback)
        const imageB64 = multimodal.image_b64 || result.colpali_image;
        if (imageB64) {
          console.log("Displaying image from response");
          const imgElement = document.createElement("img");
          imgElement.src = `data:image/png;base64,${imageB64}`;
          imgElement.style.maxWidth = "15%";
          imgElement.style.marginBottom = "10px";
          chatbotMessages.appendChild(imgElement);

          // Modal logic
         imgElement.addEventListener("click", function () {
          modalImg.src = imgElement.src;
          modalImg.style.transform = "translate(-50%, -50%) scale(1)";
          modal.dataset.scale = "1"; // custom scale state  
          modal.style.display = "flex";

        });
        }

        // Then display the answer text
        if (multimodal.answer) {
          appendMessage("bot", multimodal.answer);
        } else {
          appendMessage("bot", "No text answer available in response");
        }
        
      } else {
        const errorMsg = result.message || "Failed to process your query.";
        appendMessage("bot", errorMsg);
      }
    } catch (error) {
      console.error("Error:", error);
      appendMessage("bot", "Sorry, I encountered an error processing your query.");
    }
  }

  function appendMessage(sender, message) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", sender);
    messageElement.textContent = message;
    chatbotMessages.appendChild(messageElement);

    setTimeout(() => {
      const body = document.getElementById("chatbot-body");
      body.scrollTop = body.scrollHeight;
    }, 50);
  }

   // Initialize Select2 for searchable dropdown
  if (window.jQuery) {
    $('#category').select2({
      placeholder: "Select a category",
      width: 'resolve' // Ensures it matches container width
    });
  } else {
    console.warn("jQuery not found. Select2 won't work.");
  }
});