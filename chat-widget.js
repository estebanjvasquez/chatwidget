(function() {
    'use strict';

    // 1. Wait for DOM to be ready (Fixes "Not Activating" issue)
    function initWidget() {
        
        // Prevent double loading
        if (document.getElementById('n8n-chat-container')) return;

        // --- STYLES ---
        const styles = `
            .n8n-chat-widget { --chat-primary: var(--n8n-primary, #854fff); --chat-bg: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; z-index: 99999; }
            .n8n-chat-widget * { box-sizing: border-box; }
            .n8n-chat-widget .chat-container { position: fixed; bottom: 20px; right: 20px; width: 380px; height: 600px; max-height: 80vh; background: var(--chat-bg); border-radius: 12px; box-shadow: 0 5px 25px rgba(0,0,0,0.2); display: none; flex-direction: column; overflow: hidden; border: 1px solid #e1e4e8; }
            .n8n-chat-widget .chat-container.open { display: flex; }
            
            /* Header */
            .n8n-chat-widget .brand-header { padding: 16px; background: var(--chat-primary); color: white; display: flex; align-items: center; justify-content: space-between; }
            .n8n-chat-widget .brand-header span { font-weight: 600; font-size: 16px; margin-left: 10px; }
            .n8n-chat-widget .close-btn { background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; line-height: 1; }
            
            /* Messages */
            .n8n-chat-widget .chat-messages { flex: 1; overflow-y: auto; padding: 15px; background: #f9f9f9; display: flex; flex-direction: column; gap: 12px; }
            .n8n-chat-widget .chat-message { max-width: 85%; padding: 12px; border-radius: 12px; font-size: 14px; line-height: 1.5; word-wrap: break-word; }
            .n8n-chat-widget .chat-message.user { align-self: flex-end; background: var(--chat-primary); color: white; border-bottom-right-radius: 2px; }
            
            /* Bot Cards (HTML Support) */
            .n8n-chat-widget .chat-message.bot { align-self: flex-start; background: white; color: #333; border: 1px solid #ddd; border-bottom-left-radius: 2px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
            .n8n-chat-widget .chat-message.bot strong { font-weight: 700; color: #000; }
            .n8n-chat-widget .chat-message.bot ul { padding-left: 20px; margin: 8px 0; }
            .n8n-chat-widget .chat-message.bot a { color: var(--chat-primary); text-decoration: underline; }
            
            /* Input */
            .n8n-chat-widget .chat-input-area { padding: 15px; background: white; border-top: 1px solid #eee; display: flex; gap: 10px; align-items: center; }
            .n8n-chat-widget textarea { flex: 1; border: 1px solid #ddd; border-radius: 20px; padding: 10px 15px; resize: none; height: 44px; outline: none; font-family: inherit; }
            .n8n-chat-widget textarea:focus { border-color: var(--chat-primary); }
            .n8n-chat-widget .send-btn { background: var(--chat-primary); color: white; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
            .n8n-chat-widget .send-btn:hover { transform: scale(1.1); }
            
            /* Toggle Button */
            .n8n-chat-widget .chat-toggle { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background: var(--chat-primary); border-radius: 50%; box-shadow: 0 4px 14px rgba(0,0,0,0.25); cursor: pointer; border: none; color: white; display: flex; align-items: center; justify-content: center; transition: transform 0.3s; z-index: 99998; }
            .n8n-chat-widget .chat-toggle:hover { transform: scale(1.1); }
            .n8n-chat-widget .chat-toggle.hidden { display: none; }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);

        // --- CONFIGURATION ---
        // Defaults if window.ChatWidgetConfig is missing
        const config = window.ChatWidgetConfig || {
            webhookUrl: '', 
            branding: { name: 'Chat', logo: '', welcomeText: 'Hi!' },
            style: { primaryColor: '#854fff' }
        };

        // --- HTML STRUCTURE ---
        const widgetHTML = `
            <div class="n8n-chat-widget">
                <button class="chat-toggle" id="n8n-chat-toggle">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                </button>
                <div class="chat-container" id="n8n-chat-container">
                    <div class="brand-header">
                        <div style="display:flex; align-items:center;">
                            ${config.branding.logo ? `<img src="${config.branding.logo}" style="width:30px; height:30px; border-radius:50%; margin-right:10px;">` : ''}
                            <span>${config.branding.name}</span>
                        </div>
                        <button class="close-btn" id="n8n-chat-close">&times;</button>
                    </div>
                    <div class="chat-messages" id="n8n-chat-messages">
                        <div style="text-align:center; padding:20px; opacity:0.7; font-size:0.9em;">
                            ${config.branding.welcomeText}
                        </div>
                    </div>
                    <div class="chat-input-area">
                        <textarea id="n8n-chat-input" placeholder="Type a message..." rows="1"></textarea>
                        <button class="send-btn" id="n8n-chat-send">➤</button>
                    </div>
                </div>
            </div>
        `;

        // Inject into Body
        document.body.insertAdjacentHTML('beforeend', widgetHTML);

        // Set Custom Color
        document.querySelector('.n8n-chat-widget').style.setProperty('--n8n-primary', config.style.primaryColor);

        // --- LOGIC ---
        const container = document.getElementById('n8n-chat-container');
        const toggleBtn = document.getElementById('n8n-chat-toggle');
        const closeBtn = document.getElementById('n8n-chat-close');
        const messagesDiv = document.getElementById('n8n-chat-messages');
        const textarea = document.getElementById('n8n-chat-input');
        const sendBtn = document.getElementById('n8n-chat-send');

        // Session Management
        let sessionId = localStorage.getItem('n8n_chat_session');
        if (!sessionId) {
            sessionId = crypto.randomUUID();
            localStorage.setItem('n8n_chat_session', sessionId);
        }

        // Toggle Visibility
        function toggleChat() {
            container.classList.toggle('open');
            toggleBtn.classList.toggle('hidden', container.classList.contains('open'));
            if(container.classList.contains('open')) textarea.focus();
        }

        toggleBtn.addEventListener('click', toggleChat);
        closeBtn.addEventListener('click', toggleChat);

        // Add Message to UI
        function addMessage(text, type) {
            const div = document.createElement('div');
            div.className = `chat-message ${type}`;
            if (type === 'bot') {
                div.innerHTML = text; // Enable HTML for Bot Cards
            } else {
                div.textContent = text; // Safe text for User
            }
            messagesDiv.appendChild(div);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        // --- API CALL (Fixed "Array" Issue) ---
        async function sendMessage(text) {
            if (!text.trim()) return;
            
            addMessage(text, 'user');
            textarea.value = '';
            
            // Loading state
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'chat-message bot';
            loadingDiv.innerHTML = '...';
            loadingDiv.id = 'n8n-loading';
            messagesDiv.appendChild(loadingDiv);

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
                
                // Remove loader
                const loader = document.getElementById('n8n-loading');
                if (loader) loader.remove();

                // --- ROBUST RESPONSE PARSING (Fixes Array Errors) ---
                let botResponse = "Sorry, I didn't get that.";
                
                if (Array.isArray(data)) {
                    if (data.length > 0 && data[0].output) {
                        botResponse = data[0].output;
                    }
                } else if (data && data.output) {
                    botResponse = data.output;
                } else if (data && data.text) {
                    botResponse = data.text;
                }

                addMessage(botResponse, 'bot');

            } catch (error) {
                console.error("Chat Error:", error);
                const loader = document.getElementById('n8n-loading');
                if (loader) loader.remove();
                addMessage("⚠️ Error connecting to server.", 'bot');
            }
        }

        sendBtn.addEventListener('click', () => sendMessage(textarea.value));
        textarea.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(textarea.value);
            }
        });
    }

    // Initialize only when DOM is fully loaded (Fixes "Not Activating")
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }

})();