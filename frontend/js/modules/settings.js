/**
 * Settings Module — Manages AI configuration and system preferences
 */
const SettingsModule = {
    async init() {
        this.loadConfig();
    },

    async loadConfig() {
        try {
            const config = await API.getConfig();
            const statusEl = document.getElementById('current-key-status');
            const modelSelect = document.getElementById('select-groq-model');

            if (statusEl) {
                statusEl.textContent = `Current Key: ${config.groq_api_key_masked}`;
                statusEl.style.color = config.groq_api_key_configured ? 'var(--accent-emerald)' : 'var(--accent-rose)';
            }

            if (modelSelect && config.groq_model) {
                modelSelect.value = config.groq_model;
            }
        } catch (e) {
            console.error('Failed to load config:', e);
        }
    },

    async saveConfig() {
        const apiKey = document.getElementById('input-api-key').value.trim();
        const model = document.getElementById('select-groq-model').value;
        const btn = event.target;
        const originalText = btn.innerHTML;

        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            await API.updateConfig({
                groq_api_key: apiKey || null, // Only send if changed
                groq_model: model
            });

            showNotification('Settings saved successfully!', 'success');
            document.getElementById('input-api-key').value = '';
            this.loadConfig();

            // Update AI status in sidebar
            const aiStatusText = document.querySelector('.ai-status span');
            if (aiStatusText) aiStatusText.textContent = 'AI Engine Updated';

        } catch (e) {
            console.error('Save config error:', e);
            showNotification('Failed to save settings.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    },

    async testConnection() {
        const btn = event.target;
        const originalText = btn.innerHTML;
        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';

            // Call chat with a simple wake-up message
            const response = await API.chat("Ping");
            if (response && response.response) {
                showNotification('Connection successful! AI is responding.', 'success');
            } else {
                showNotification('Connection failed. Check your API key.', 'error');
            }
        } catch (e) {
            console.error('Test connection error:', e);
            showNotification('Connection error: ' + (e.message || 'Check console'), 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
};

// Helper for notifications (could be moved to app.js later)
function showNotification(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 100);
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

window.SettingsModule = SettingsModule;
