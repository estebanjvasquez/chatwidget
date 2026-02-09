(function() {
    'use strict';

    // 1. Universal Initialization
    function initWidget() {
        // Prevent duplicates
        if (document.getElementById('n8n-chat-widget')) return;

        // --- STYLES ---
        const styles = `
            .n8n-chat-widget { --chat-color: var(--n8n-color, #854fff); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; z-index: 2147483647; }
            .n8n-chat-widget * { box-sizing: border-box; }
            /* Button */
            .n8n-chat-btn { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background: var(--chat-color); border-radius: 50%; box-shadow: 0 4px 15px rgba(0,0,0,0.2); cursor: pointer; border: none; color: white; display: flex; align-items: center; justify-content: center; transition: transform 0.3s; z-index: 99999; }
            .n8n-chat-btn:hover { transform: scale(1.1); }
            .n8n-chat-btn svg { width: 28px; height: 28px; fill: white; }
            /* Container */
            .n8n-chat-window { position: fixed; bottom: 90px; right: 20px; width: 380px; height: 600px; max-height: 80vh; background: white; border-radius: 12px; box-shadow: 0 5px 30px rgba(0,0,0,0.15); display: none; flex-direction: column; overflow: hidden; border: 1px solid #e0e0e0; z-index: 99999; }
            .n8n-chat-window.open { display: flex; }
            /* Header */
            .n8n-chat-header { padding: 16px; background: var(--chat-color); color: white; display: flex; align-items: center; justify-content: space-between; }
            .n8n-chat-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
            .n8n-chat-close { background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; line-height: 1; }
            /* Messages */
            .n8n-chat-body { flex: 1; overflow-y: auto; padding: 15px; background: #f9f9f9; display: flex; flex-direction: column; gap: 10px; }
            .n8n-chat-msg { max-width: 85%; padding: 12px; border-radius: 10px; font-size: 14px; line-height: 1.5; word-wrap: break-word; }
            .n8n-chat-msg.user { align-self: flex-end; background: var(--chat-color); color: white; border-bottom-right-radius: 2px; }
            .n8n-chat-msg.bot { align-self: flex-start; background: white; color: #333; border: 1px solid #ddd; border-bottom-left-radius: 2px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
            .n8n-chat-msg.bot strong { font-weight: bold; }
            .n8n-chat-msg.bot a { color: var(--chat-color); }
            /* Input */
            .n8n-chat-footer { padding: 12px; background: white; border-top: 1px solid #eee; display: flex; gap: 8px; }
            .n8n-chat-footer textarea { flex: 1; border: 1px solid #ddd; border-radius: 20px; padding: 10px 14px; resize: none; height: 44px; outline: none; font-family: inherit; font-size: 14px; }
            .n8n-chat-footer textarea:focus { border-color: var(--chat-color); }
            .n8n-chat-footer button { background: var(--chat-color); color: white; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }
            .n8n-chat-footer button:hover { opacity: 0.9; }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);

        // --- CONFIGURATION ---
        // Use user config or defaults
        const config = window.ChatWidgetConfig || {
            webhookUrl: '', 
            branding: { name: 'Support', welcomeText: 'Hello! How can I help?' },
            style: { primaryColor: '#854fff' }
        };

        // --- HTML ---
        const html = `
            <div id="n8n-chat-widget" class="n8n-chat-widget">
                <button id="n8n-btn" class="n8n-chat-btn">
                    <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                </button>
                <div id="n8n-window" class="n8n-chat-window">
                    <div class="n8n-chat-header">
                        <h3>${config.branding.name}</h3>
                        <button class="n8n-chat-close">&times;</button>
                    </div>
                    <div id="n8n-messages" class="n8n-chat-body">
                        <div style="text-align:center; padding:20px; opacity:0.6; font-size:0.9em;">
                            ${config.branding.welcomeText}
                        </div>
                    </div>
                    <div class="n8n-chat-footer">
                        <textarea id="n8n-input" placeholder="Type a message..." rows="1"></textarea>
                        <button id="n8n-send">➤</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        
        // Set Color
        document.querySelector('.n8n-chat-widget').style.setProperty('--n8n-color', config.style.primaryColor);

        // --- ELEMENTS & LOGIC ---
        const btn = document.getElementById('n8n-btn');
        const win = document.getElementById('n8n-window');
        const close = document.querySelector('.n8n-chat-close');
        const msgs = document.getElementById('n8n-messages');
        const input = document.getElementById('n8n-input');
        const send = document.getElementById('n8n-send');
        
        let sessionId = localStorage.getItem('n8n_sid') || crypto.randomUUID();
        localStorage.setItem('n8n_sid', sessionId);

        function toggle() {
            win.classList.toggle('open');
            if (win.classList.contains('open')) input.focus();
        }

        btn.addEventListener('click', toggle);
        close.addEventListener('click', toggle);

        function addMsg(text, type) {
            const div = document.createElement('div');
            div.className = `n8n-chat-msg ${type}`;
            if (type === 'bot') div.innerHTML = text; // Allow HTML from n8n
            else div.textContent = text;
            msgs.appendChild(div);
            msgs.scrollTop = msgs.scrollHeight;
        }

        async function sendMsg() {
            const text = input.value.trim();
            if (!text) return;
            
            addMsg(text, 'user');
            input.value = '';
            
            // Loading Indicator
            const loader = document.createElement('div');
            loader.className = 'n8n-chat-msg bot';
            loader.innerHTML = '<span style="animation:blink 1s infinite">...</span>';
            loader.id = 'n8n-loader';
            msgs.appendChild(loader);

            try {
                // Verify URL
                if (!config.webhookUrl) throw new Error("Webhook URL missing in config");

                const response = await fetch(config.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        chatInput: text, 
                        sessionId: sessionId 
                    })
                });

                const data = await response.json();
                
                // Debug response in Console
                console.log("N8N Response:", data);

                // --- SMART PARSING (Fixes Undefined) ---
                let reply = "";
                
                // 1. Check for Array (Standard N8N output)
                if (Array.isArray(data)) {
                    if (data.length > 0) {
                        reply = data[0].output || data[0].text || data[0].message || data[0].response;
                    }
                } 
                // 2. Check for Object
                else if (typeof data === 'object') {
                    reply = data.output || data.text || data.response || data.message;
                }

                // 3. Fallback
                if (!reply) reply = "Received empty response from server.";

                document.getElementById('n8n-loader').remove();
                addMsg(reply, 'bot');

            } catch (err) {
                console.error(err);
                if (document.getElementById('n8n-loader')) document.getElementById('n8n-loader').remove();
                addMsg("⚠️ Connection Error. Check console.", 'bot');
            }
        }

        send.addEventListener('click', sendMsg);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMsg();
            }
        });
    }

    // Initialize when page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
})();
