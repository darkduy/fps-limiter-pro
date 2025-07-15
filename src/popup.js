document.addEventListener('DOMContentLoaded', () => {
    const masterDisable = document.getElementById('masterDisable');
    const mainControls = document.querySelector('.main-controls');
    const currentSiteLabel = document.getElementById('currentSite');
    const applyGlobal = document.getElementById('applyGlobal');
    const iframeEnable = document.getElementById('iframeEnable');
    const enabledCheckbox = document.getElementById('enabledCheckbox');
    const fpsSlider = document.getElementById('fpsSlider');
    const fpsInput = document.getElementById('fpsInput');

    let currentHost = 'global';

    function syncFpsControls(value) {
        fpsSlider.value = value;
        fpsInput.value = value;
    }

    async function saveSettings() {
        const siteSettings = {
            enabled: enabledCheckbox.checked,
            value: parseInt(fpsInput.value, 10),
        };

        if (applyGlobal.checked) {
            await chrome.storage.local.remove(currentHost);
            await chrome.storage.local.set({ global: siteSettings });
        } else {
            await chrome.storage.local.set({ [currentHost]: siteSettings });
        }
    }
    
    function toggleSiteSettingsUI(disabled) {
        const group = document.querySelector('.site-settings');
        group.style.opacity = disabled ? '0.5' : '1';
        group.querySelectorAll('input, button').forEach(el => el.disabled = disabled);
    }

    async function loadSettings() {
        const data = await chrome.storage.local.get(null);
        
        masterDisable.checked = data.globalDisabled ?? false;
        mainControls.style.display = masterDisable.checked ? 'none' : 'block';
        
        iframeEnable.checked = data.applyInFrames ?? false;

        const siteConfig = data[currentHost];
        const globalConfig = data.global ?? { enabled: true, value: 60 };
        
        applyGlobal.checked = !siteConfig;
        
        const finalConfig = siteConfig ?? globalConfig;
        enabledCheckbox.checked = finalConfig.enabled;
        syncFpsControls(finalConfig.value);

        toggleSiteSettingsUI(applyGlobal.checked);
    }

    masterDisable.addEventListener('change', () => {
        chrome.storage.local.set({ globalDisabled: masterDisable.checked });
        mainControls.style.display = masterDisable.checked ? 'none' : 'block';
    });

    iframeEnable.addEventListener('change', () => {
        chrome.storage.local.set({ applyInFrames: iframeEnable.checked });
    });
    
    applyGlobal.addEventListener('change', () => {
        toggleSiteSettingsUI(applyGlobal.checked);
        saveSettings();
    });

    enabledCheckbox.addEventListener('change', saveSettings);
    
    fpsSlider.addEventListener('input', () => {
        syncFpsControls(fpsSlider.value);
    });
    fpsSlider.addEventListener('change', saveSettings);

    fpsInput.addEventListener('change', () => {
        let value = parseInt(fpsInput.value, 10);
        if (isNaN(value) || value < 1) value = 1;
        if (value > 240) value = 240;
        syncFpsControls(value);
        saveSettings();
    });

    document.querySelectorAll('.presets button').forEach(button => {
        button.addEventListener('click', () => {
            const fps = button.getAttribute('data-fps');
            syncFpsControls(fps);
            saveSettings();
        });
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
            try {
                const url = new URL(tabs[0].url);
                if (['http:', 'https:'].includes(url.protocol)) {
                    currentHost = url.hostname;
                }
            } catch (e) {}
        }
        currentSiteLabel.textContent = `Trang: ${currentHost}`;
        loadSettings();
    });
});
