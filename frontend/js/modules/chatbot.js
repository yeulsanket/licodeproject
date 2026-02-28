/**
 * Chatbot Module — Floating AI chatbot widget
 */
const ChatbotModule = {
    history: [],

    toggle() {
        const win = document.getElementById('chatbot-window');
        if (win) {
            win.classList.toggle('open');
            if (win.classList.contains('open')) {
                document.getElementById('chatbot-input')?.focus();
            }
        }
    },

    async send() {
        const input = document.getElementById('chatbot-input');
        const message = input?.value?.trim();
        if (!message) return;

        // Show user message
        this.appendMessage(message, 'user');
        input.value = '';

        // Add to history
        this.history.push({ role: 'user', content: message });

        // Show typing indicator
        const typingId = this.showTyping();

        try {
            const data = await API.chat({ message, history: this.history });
            this.removeTyping(typingId);
            this.appendMessage(data.response, 'bot');
            this.history.push({ role: 'assistant', content: data.response });
        } catch (e) {
            this.removeTyping(typingId);
            this.appendMessage('Sorry, I couldn\'t connect to the AI service. Please check the backend.', 'bot');
        }
    },

    appendMessage(text, sender) {
        const container = document.getElementById('chatbot-messages');
        const msg = document.createElement('div');
        msg.className = `chat-message ${sender}`;
        msg.innerHTML = `<div class="message-bubble">${this.formatText(text)}</div>`;
        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
    },

    formatText(text) {
        // Basic markdown-like formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code style="background:rgba(129,140,248,0.15);padding:0.1em 0.3em;border-radius:4px;font-size:0.85em">$1</code>')
            .replace(/\n/g, '<br>');
    },

    showTyping() {
        const container = document.getElementById('chatbot-messages');
        const id = 'typing-' + Date.now();
        const el = document.createElement('div');
        el.className = 'chat-message bot';
        el.id = id;
        el.innerHTML = `<div class="message-bubble"><span class="typing-dots"><span>.</span><span>.</span><span>.</span></span></div>`;
        container.appendChild(el);
        container.scrollTop = container.scrollHeight;
        return id;
    },

    removeTyping(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }
};

window.ChatbotModule = ChatbotModule;
