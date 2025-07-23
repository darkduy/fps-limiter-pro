document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements ===
    const elements = {
        masterDisable: document.getElementById('masterDisable'),
        mainControls: document.querySelector('.main-controls'),
        currentSiteLabel: document.getElementById('currentSite'),
        applyGlobal: document.getElementById('applyGlobal'),
        iframeEnable: document.getElementById('iframeEnable'),
        enabledCheckbox: document.getElementById('enabledCheckbox'),
        fpsSlider: document.getElementById('fpsSlider'),
        fpsInput: document.getElementById('fpsInput'),
        autoModeMasterEnable: document.getElementById('autoModeMasterEnable'),
        autoModeListEl: document.getElementById('autoModeList'),
        addSiteForm: document.getElementById('addSiteForm'),
        newSiteDomainInput: document.getElementById('newSiteDomain'),
    };

    // === State Variables ===
    let currentHost = 'global';
    let autoModeConfigs = [];
    let siteConfigCache = {};

    // === Functions ===
    function syncFpsControls(value) {
        if (elements.fpsSlider) elements.fpsSlider.value = value;
        if (elements.fpsInput) elements.fpsInput.value = value;
    }

    function renderAutoModeList() {
        if (!elements.autoModeListEl) return;
        elements.autoModeListEl.innerHTML = '';
        autoModeConfigs.forEach((config, index) => {
            const item = document.createElement('li');
            item.className = 'auto-mode-item';
            item.innerHTML = `<span class="domain">${config.domain}</span><input type="number" value="${config.fps}" min="1" max="240" data-index="${index}"><button data-index="${index}">Xóa</button>`;
            elements.autoModeListEl.appendChild(item);
        });
    }

    async function saveAutoModeList() {
        await chrome.storage.local.set({ autoModeConfigs: autoModeConfigs });
    }

    async function loadSettingsForCurrentTab() {
        const data = await chrome.storage.local.get(null);
        autoModeConfigs = data.autoModeConfigs || [];
        renderAutoModeList();

        if (elements.masterDisable) {
            elements.masterDisable.checked = data.globalDisabled ?? false;
            if (elements.mainControls) {
                elements.mainControls.style.display = elements.masterDisable.checked ? 'none' : 'block';
            }
        }
        
        if (elements.autoModeMasterEnable) elements.autoModeMasterEnable.checked = data.autoModeMasterEnable ?? true;
        if (elements.iframeEnable) elements.iframeEnable.checked = data.applyInFrames ?? false;

        const siteConfig = data[currentHost];
        const globalConfig = data.global ?? { enabled: true, value: 60 };
        
        if (elements.applyGlobal) elements.applyGlobal.checked = !siteConfig;
        
        siteConfigCache = siteConfig ?? globalConfig;
        if (elements.enabledCheckbox) elements.enabledCheckbox.checked = siteConfigCache.enabled;
        syncFpsControls(siteConfigCache.value);
    }

    // === Event Listeners (đã thêm "lưới an toàn") ===

    const saveSiteSettings = () => {
        if (!elements.enabledCheckbox || !elements.fpsInput || !elements.applyGlobal) return;
        const newConfig = {
            enabled: elements.enabledCheckbox.checked,
            value: parseInt(elements.fpsInput.value, 10),
        };
        siteConfigCache = newConfig;
        const keyToSave = elements.applyGlobal.checked ? 'global' : currentHost;
        chrome.storage.local.set({ [keyToSave]: newConfig });
    };

    // Kiểm tra phần tử tồn tại trước khi gán sự kiện
    if (elements.masterDisable) {
        elements.masterDisable.addEventListener('change', (e) => chrome.storage.local.set({ globalDisabled: e.target.checked }));
    }
    if (elements.autoModeMasterEnable) {
        elements.autoModeMasterEnable.addEventListener('change', (e) => chrome.storage.local.set({ autoModeMasterEnable: e.target.checked }));
    }
    if (elements.iframeEnable) {
        elements.iframeEnable.addEventListener('change', (e) => chrome.storage.local.set({ applyInFrames: e.target.checked }));
    }
    if (elements.applyGlobal) {
        elements.applyGlobal.addEventListener('change', async (e) => {
            if (e.target.checked) {
                await chrome.storage.local.remove(currentHost);
            } else {
                await chrome.storage.local.set({ [currentHost]: siteConfigCache });
            }
        });
    }
    if (elements.enabledCheckbox) {
        elements.enabledCheckbox.addEventListener('change', saveSiteSettings);
    }
    if (elements.fpsSlider) {
        elements.fpsSlider.addEventListener('change', saveSiteSettings);
    }
    if (elements.fpsInput) {
        elements.fpsInput.addEventListener('change', () => {
            let value = parseInt(elements.fpsInput.value, 10);
            if (isNaN(value) || value < 1) value = 1;
            if (value > 240) value = 240;
            syncFpsControls(value);
            saveSiteSettings();
        });
    }

    document.querySelectorAll('.presets button').forEach(button => {
        button.addEventListener('click', () => {
            syncFpsControls(button.dataset.fps);
            saveSiteSettings();
        });
    });

    if (elements.addSiteForm) {
        elements.addSiteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newDomain = elements.newSiteDomainInput.value.trim();
            if (newDomain && !autoModeConfigs.some(c => c.domain === newDomain)) {
                autoModeConfigs.push({ domain: newDomain, fps: 60 });
                elements.newSiteDomainInput.value = '';
                renderAutoModeList();
                saveAutoModeList();
            }
        });
    }

    if (elements.autoModeListEl) {
        elements.autoModeListEl.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const index = parseInt(e.target.dataset.index, 10);
                autoModeConfigs.splice(index, 1);
                renderAutoModeList();
                saveAutoModeList();
            }
        });
        elements.autoModeListEl.addEventListener('change', (e) => {
            if (e.target.tagName === 'INPUT') {
                const index = parseInt(e.target.dataset.index, 10);
                let newFps = parseInt(e.target.value, 10);
                if (isNaN(newFps) || newFps < 1) newFps = 1;
                autoModeConfigs[index].fps = newFps;
                saveAutoModeList();
            }
        });
    }

    // === Initialization ===
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
            try {
                const url = new URL(tabs[0].url);
                if (url.protocol.startsWith('http')) {
                    currentHost = url.hostname;
                }
            } catch (e) {}
        }
        if (elements.currentSiteLabel) {
            elements.currentSiteLabel.textContent = `Trang: ${currentHost}`;
        }
        loadSettingsForCurrentTab();
    });
});
