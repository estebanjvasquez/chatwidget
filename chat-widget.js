// =================================================================
// n8n Chat Widget - Optimized for HTML Cards & Chat Trigger
// =================================================================
(function() {
    // 1. STYLES (Compressed & Optimized)
    const styles = `
        .n8n-chat-widget { --chat-primary: var(--n8n-primary, #854fff); --chat-bg: #ffffff; --chat-font: #333; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .n8n-chat-widget * { box-sizing: border-box; }
        .n8n-chat-widget .chat-container { position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: none; width: 380px; height: 600px; background: var(--chat-bg); border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.1); flex-direction: column; overflow: hidden; }
        .n8n-chat-widget .chat-container.open { display: flex; }
        /* Header */
        .n8n-chat-widget .brand-header { padding: 15px; background: var(--chat-primary); color: white; display: flex; align-items: center; gap: 10px; }
        .n8n-chat-widget .brand-header img { width: 30px; height: 30px; background: white; border-radius: 50%; padding: 2px; }
        .n8n-chat-widget .brand-header span { font-weight: 600; font-size: 16px; flex-grow: 1; }
        .n8n-chat-widget .close-btn { background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; line-height: 1; }
        
        /* Messages Area */
        .n8n-chat-widget .chat-messages { flex: 1; overflow-y: auto; padding: 15px; background: #f4f6f8; display: flex; flex-direction: column; gap: 10px; }
        .n8n-chat-widget .chat-message { max-width: 85%; padding: 10px 14px; border-radius: 10px; font-size: 14px; line-height: 1.5; word-wrap: break-word; }
        
        /* User Message */
        .n8n-chat-widget .chat-message.user { align-self: flex-end; background: var(--chat-primary); color: white; border-bottom-right-radius: 2px; }
        
        /* Bot Message & HTML Cards */
        .n8n-chat-widget .chat-message.bot { align-self: flex-start; background: white; color: var(--chat-font); border: 1px solid #e1e4e8; border-bottom-left-radius: 2px; }
        .n8n-chat-widget .chat-message.bot strong { font-weight: 600; }
        .n8n-chat-widget .chat-message.bot a { color: var(--chat-primary); }
        .n8n-chat-widget .chat-message.bot ul { padding-left: 20px; margin: 5px 0; }
        
        /* Loading Spinner */
        .n8n-chat-widget .typing-indicator { align-self: flex-start; background: white; padding: 10px; border-radius: 10px; display: none; }
        .n8n-chat-widget .typing-indicator span { display: inline-block; width: 6px; height: 6px; background: #ccc; border-radius: 50%; margin: 0 2px; animation: chat-typing 1s infinite; }
        .n8n-chat-widget .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .n8n-chat-widget .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes chat-typing { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }

        /* Input Area */
        .n8n-chat-widget .chat-input-area { padding: 15px; background: white; border-top: 1px solid #eee; display: flex; gap: 10px; }
        .n8n-chat-widget textarea { flex: 1; border: 1px solid #ddd; border-radius: 20px; padding: 10px 15px; resize: none; height: 42px; font-family: inherit; outline: none; }
        .n8n-chat-widget textarea:focus { border-color: var(--chat-primary); }
        .n8n-chat-widget .send-btn { background: var(--chat-primary); color: white; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
        .n8n-chat-widget .send-btn:hover { transform: scale(1.05); }

        /* Toggle Button */
        .n8n-chat-widget .chat-toggle { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background: var(--chat-primary); border-radius: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); cursor: pointer; border: none; z-index: 9998; color: white; display: flex; align-items: center; justify-content: center; transition: transform 0.3s; }
        .n8n-chat-widget .chat-toggle:hover { transform: scale(1.1); }
        .n8n-chat-widget .chat-toggle.hidden { display: none; }
    `;

    // Inject Styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // 2. CONFIGURATION
    const config = window.ChatWidgetConfig || {
        webhookUrl: '', // Will be set by user
        branding: {
            logo: 'https://cdn-icons-png.flaticon.com/512/4712/4712009.png',
            name: 'Support Agent',
            welcomeText: 'Hello! How can I help you today?'
        },
        style: {
            primaryColor: '#854fff'
        }
    };

    // 3. HTML STRUCTURE
    const widgetHTML = `
        <div class="n8n-chat-widget">
            <button class="chat-toggle">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
            </button>
            <div class="chat-container">
                <div class="brand-header">
                    <img src="${config.branding.logo}" alt="Logo">
                    <span>${config.branding.name}</span>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="chat-messages" id="n8n-chat-messages">
                    <!-- Messages go here -->
                    <div class="typing-indicator" id="n8n-typing"><span></span><span></span><span></span></div>
                </div>
                <div class="chat-input-area">
                    <textarea placeholder="Type a message..." rows="1"></textarea>
                    <button class="send-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    // 4. LOGIC
    const container = document.querySelector('.n8n-chat-widget .chat-container');
    const toggleBtn = document.querySelector('.n8n-chat-widget .chat-toggle');
    const closeBtn = document.querySelector('.n8n-chat-widget .close-btn');
    const messagesDiv = document.getElementById('n8n-chat-messages');
    const textarea = document.querySelector('.n8n-chat-widget textarea');
    const sendBtn = document.querySelector('.n8n-chat-widget .send-btn');
    const typingIndicator = document.getElementById('n8n-typing');

    // Set Color
    document.querySelector('.n8n-chat-widget').style.setProperty('--n8n-primary', config.style.primaryColor);

    let sessionId = localStorage.getItem('n8n_chat_session') || crypto.randomUUID();
    localStorage.setItem('n8n_chat_session', sessionId);
    let isFirstLoad = true;

    // Toggle Window
    function toggleChat() {
        container.classList.toggle('open');
        toggleBtn.classList.toggle('hidden', container.classList.contains('open'));
        
        // On first open, send a "start" signal if empty
        if (isFirstLoad && messagesDiv.children.length <= 1) { 
            // Only typing indicator exists
            sendToWebhook("start", true); // True = hidden message
            isFirstLoad = false;
        }
    }

    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    // Add Message to UI
    function addMessage(text, type) {
        const div = document.createElement('div');
        div.className = `chat-message ${type}`;
        
        if (type === 'bot') {
            // Allow HTML for Bot (for the cards)
            div.innerHTML = text; 
        } else {
            // Text only for User (Security)
            div.textContent = text; 
        }
        
        messagesDiv.insertBefore(div, typingIndicator);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // Send to n8n Webhook
    async function sendToWebhook(text, hidden = false) {
        if (!hidden) addMessage(text, 'user');
        
        textarea.value = '';
        typingIndicator.style.display = 'block';
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        try {
            const response = await fetch(config.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatInput: text,
                    sessionId: sessionId
                })
            });

            const data = await response.json();
            typingIndicator.style.display = 'none';

            // Handle n8n response array or object
            let outputText = "";
            if (Array.isArray(data)) {
                outputText = data[0].output;
            } else {
                outputText = data.output;
            }

            addMessage(outputText, 'bot');

        } catch (error) {
            console.error('Chat Error:', error);
            typingIndicator.style.display = 'none';
            addMessage("Sorry, I'm having trouble connecting right now.", 'bot');
        }
    }

    // Event Listeners for Sending
    sendBtn.addEventListener('click', () => {
        const text = textarea.value.trim();
        if (text) sendToWebhook(text);
    });

    textarea.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const text = textarea.value.trim();
            if (text) sendToWebhook(text);
        }
    });

})();