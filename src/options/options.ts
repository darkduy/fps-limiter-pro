import { SettingsManager, debounce } from '../common/settingsManager';
import type { SettingsCache } from '../types';

const elements = {
    applyInFrames: document.getElementById('applyInFrames') as HTMLInputElement,
    suspenderEnable: document.getElementById('suspenderEnable') as HTMLInputElement,
    suspenderTimeout: document.getElementById('suspenderTimeout') as HTMLSelectElement,
    suspenderWhitelist: document.getElementById('suspenderWhitelist') as HTMLTextAreaElement,
};

async function renderSettings(): Promise<void> {
    const settings = await SettingsManager.getAllSettings();
    
    if (elements.applyInFrames) elements.applyInFrames.checked = settings.applyInFrames ?? false;
    if (elements.suspenderEnable) elements.suspenderEnable.checked = settings.suspenderEnable ?? false;
    if (elements.suspenderTimeout) elements.suspenderTimeout.value = String(settings.suspenderTimeout ?? 30);
    if (elements.suspenderWhitelist) elements.suspenderWhitelist.value = (settings.suspenderWhitelist || []).join('\n');
}

function setupEventListeners(): void {
    if (elements.applyInFrames) {
        elements.applyInFrames.addEventListener('change', () => {
            SettingsManager.updateSettings({ applyInFrames: elements.applyInFrames.checked });
        });
    }
    if (elements.suspenderEnable) {
        elements.suspenderEnable.addEventListener('change', () => {
            SettingsManager.updateSettings({ suspenderEnable: elements.suspenderEnable.checked });
        });
    }
    if (elements.suspenderTimeout) {
        elements.suspenderTimeout.addEventListener('change', () => {
            SettingsManager.updateSettings({ suspenderTimeout: parseInt(elements.suspenderTimeout.value, 10) });
        });
    }
    if (elements.suspenderWhitelist) {
        const debouncedSave = debounce(() => {
            const whitelist = elements.suspenderWhitelist.value
                .split('\n')
                .map(s => s.trim())
                .filter(Boolean);
            SettingsManager.updateSettings({ suspenderWhitelist: whitelist });
        }, 400);
        elements.suspenderWhitelist.addEventListener('input', debouncedSave);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderSettings();
    setupEventListeners();
});
