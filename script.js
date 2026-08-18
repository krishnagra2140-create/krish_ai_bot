const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const clearBtn = document.getElementById("clear-btn");
const exampleButtons = document.querySelectorAll(".example-btn");

// Store conversation
let messages = [];

// Add message to chat
function appendMessage(sender, text) {
    const messageDiv = document.createElement("div");

    if (sender === "user") {
        messageDiv.className = "message user-message";
    } else {
        messageDiv.className = "message ai-message";
    }

    messageDiv.innerText = text;

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    return messageDiv;
}

// Send message to Netlify Function
async function sendMessage() {
    const text = userInput.value.trim();

    if (text === "") return;

    // Show user message
    appendMessage("user", text);

    // Clear input
    userInput.value = "";

    // Add user message to conversation
    messages.push({
        role: "user",
        content: text
    });

    // Show thinking
    const thinkingMessage = appendMessage("ai", "Thinking...");
    thinkingMessage.classList.add("thinking");

    // Disable button
    sendBtn.disabled = true;

    try {
        const response = await fetch("/.netlify/functions/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: messages
            })
        });

        const data = await response.json();

        // Remove Thinking...
        thinkingMessage.remove();

        if (!response.ok) {
            throw new Error(data.error || "AI request failed");
        }

        // FIX: Safely check for both 'reply' and 'answer' depending on your backend
        const aiAnswer = data.reply || data.answer;

        if (!aiAnswer) {
            throw new Error("Received empty response from AI");
        }

        // Save AI response
        messages.push({
            role: "assistant", // Make sure this matches what Gemini expects
            content: aiAnswer
        });

        // Show AI response
        appendMessage("ai", aiAnswer);

    } catch (error) {
        console.error(error);

        thinkingMessage.remove();

        appendMessage(
            "ai",
            "Sorry bro 😕 Something went wrong. Please try again."
        );
    }

    // Enable button
    sendBtn.disabled = false;

    userInput.focus();
}

// Clear chat
function clearChat() {
    messages = [];

    chatBox.innerHTML = `
        <div class="message ai-message">
            Hello! I’m Krish AI 👋
        </div>
    `;

    userInput.focus();
}

// Send button
sendBtn.addEventListener("click", sendMessage);

// Enter key
userInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});

// Clear button
clearBtn.addEventListener("click", clearChat);

// Example questions
exampleButtons.forEach(button => {
    button.addEventListener("click", function() {
        userInput.value = this.innerText;
        sendMessage();
    });
});