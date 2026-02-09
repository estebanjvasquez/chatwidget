// --- VERSION 3 ---
(function() {
    'use strict';

    // 1. Wait for DOM (Fixes activation issues)
    function initWidget() {
        if (document.getElementById('n8n-chat-container')) return;

        // --- STYLES ---
        const styles = `
            .n8n-chat-widget { --chat-primary: var(--n8n-primary, #854fff); --chat-bg: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; z-index: 2147483647; }
            .n8n-chat-widget * { box-sizing: border-box; }
            .n8n-chat-widget .chat-container { position: fixed; bottom: 20px; right: 20px; width: 380px; height: 600px; max-height: 80vh; background: var(--chat-bg); border-radius: 12px; box-shadow: 0 5px 40px rgba(0,0,0,0.16); display: none; flex-direction: column; overflow: hidden; border: 1px solid #e1e4e8; }
            .n8n-chat-widget .chat-container.open { display: flex; }
            .n8n-chat-widget .brand-header { padding: 16px; background: var(--chat-primary); color: white; display: flex; align-items: center; justify-content: space-between; }
            .n8n-chat-widget .brand-header span { font-weight: 600; font-size: 16px; margin-left: 10px; }
            .n8n-chat-widget .close-btn { background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; line-height: 1; }
            .n8n-chat-widget .chat-messages { flex: 1; overflow-y: auto; padding: 15px; background: #f9f9f9; display: flex; flex-direction: column; gap: 10px; }
            .n8n-chat-widget .chat-message { max-width: 85%; padding: 12px; border-radius: 12px; font-size: 14px; line-height: 1.5; word-wrap: break-word; }
            .n8n-chat-widget .chat-message.user { align-self: flex-end; background: var(--chat-primary); color: white; border-bottom-right-radius: 2px; }
            /* Bot Message Styles (HTML Support) */
            .n8n-chat-widget .chat-message.bot { align-self: flex-start; background: white; color: #333; border: 1px solid #ddd; border-bottom-left-radius: 2px; }
            .n8n-chat-widget .chat-message.bot strong { font-weight: 700; }
            .n8n-chat-widget .chat-message.bot a { color: var(--chat-primary); }
            /* Chat Input */
            .n8n-chat-widget .chat-input-area { padding: 15px; background: white; border-top: 1px solid #eee; display: flex; gap: 10px; align-items: center; }
            .n8n-chat-widget textarea { flex: 1; border: 1px solid #ddd; border-radius: 20px; padding: 10px 15px; resize: none; height: 44px; outline: none; font-family: inherit; }
            .n8n-chat-widget .send-btn { background: var(--chat-primary); color: white; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }
            /* Toggle Button */
            .n8n-chat-widget .chat-toggle { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background: var(--chat-primary); border-radius: 50%; box-shadow: 0 4px 14px rgba(0,0,0,0.25); cursor: pointer; border: none; color: white; display: flex; align-items: center; justify-content: center; transition: transform 0.3s; z-index: 2147483646; }
            .n8n-chat-widget .chat-toggle.hidden { display: none; }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);

        // --- CONFIG ---
        const config = window.ChatWidgetConfig || {
            webhookUrl: '', 
            branding: { name: 'Chat', logo: '', welcomeText: 'Hi!' },
            style: { primaryColor: '#854fff' }
        };

        // --- HTML ---
        const widgetHTML = `
            <div class="n8n-chat-widget">
                <button class="chat-toggle" id="n8n-chat-toggle">💬</button>
                <div class="chat-container" id="n8n-chat-container">
                    <div class="brand-header">
                        <div style="display:flex; align-items:center;">
                            ${config.branding.logo ? `<img src="${config.branding.logo}" style="width:30px; height:30px; border-radius:50%; margin-right:10px;">` : ''}
                            <span>${config.branding.name}</span>
                        </div>
                        <button class="close-btn" id="n8n-chat-close">&times;</button>
                    </div>
                    <div class="chat-messages" id="n8n-chat-messages">
                        <div style="text-align:center; padding:20px; opacity:0.7; font-size:0.9em;">${config.branding.welcomeText}</div>
                    </div>
                    <div class="chat-input-area">
                        <textarea id="n8n-chat-input" placeholder="Type a message..." rows="1"></textarea>
                        <button class="send-btn" id="n8n-chat-send">➤</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        document.querySelector('.n8n-chat-widget').style.setProperty('--n8n-primary', config.style.primaryColor);

        // --- LOGIC ---
        const container = document.getElementById('n8n-chat-container');
        const toggleBtn = document.getElementById('n8n-chat-toggle');
        const closeBtn = document.getElementById('n8n-chat-close');
        const messagesDiv = document.getElementById('n8n-chat-messages');
        const textarea = document.getElementById('n8n-chat-input');
        const sendBtn = document.getElementById('n8n-chat-send');

        let sessionId = localStorage.getItem('n8n_chat_session') || crypto.randomUUID();
        localStorage.setItem('n8n_chat_session', sessionId);

        function toggleChat() {
            container.classList.toggle('open');
            toggleBtn.classList.toggle('hidden', container.classList.contains('open'));
            if(container.classList.contains('open')) textarea.focus();
        }

        toggleBtn.addEventListener('click', toggleChat);
        closeBtn.addEventListener('click', toggleChat);

        function addMessage(text, type) {
            const div = document.createElement('div');
            div.className = `chat-message ${type}`;
            if (type === 'bot') div.innerHTML = text; // Allow HTML
            else div.textContent = text;
            messagesDiv.appendChild(div);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        // --- ROBUST SEND FUNCTION ---
        async function sendMessage(text) {
            if (!text.trim()) return;
            addMessage(text, 'user');
            textarea.value = '';
            
            const loader = document.createElement('div');
            loader.className = 'chat-message bot';
            loader.innerHTML = '...';
            loader.id = 'n8n-loading';
            messagesDiv.appendChild(loader);

            try {
                // Ensure URL is correct
                let url = config.webhookUrl;
                if (!url) throw new Error("Webhook URL is missing in config");

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json' 
                    },
                    body: JSON.stringify({ chatInput: text, sessionId: sessionId })
                });

                if (!response.ok) {
                    throw new Error(`Server Error: ${response.status}`);
                }

                const data = await response.json();
                
                // Debug to Console
                console.log("N8N Response:", data);

                let botResponse = null;

                // STRATEGY: Try every possible format
                if (Array.isArray(data) && data.length > 0) {
                    botResponse = data[0].output || data[0].text || data[0].response;
                } else if (typeof data === 'object') {
                    botResponse = data.output || data.text || data.response || data.message;
                }
                
                // FALLBACK: If structure is unknown, dump stringified version
                if (!botResponse) {
                    botResponse = "Debug: " + JSON.stringify(data);
                }

                if (document.getElementById('n8n-loading')) document.getElementById('n8n-loading').remove();
                addMessage(botResponse, 'bot');

            } catch (error) {
                console.error("Chat Error:", error);
                if (document.getElementById('n8n-loading')) document.getElementById('n8n-loading').remove();
                addMessage(`⚠️ Error: ${error.message}. Check Console (F12).`, 'bot');
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
})();
