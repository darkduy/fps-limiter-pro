import type { AutoModeConfig, SiteConfig } from '../types';

document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        masterDisable: document.getElementById('masterDisable') as HTMLInputElement,
        mainControls: document.querySelector('.main-controls') as HTMLElement,
        currentSiteLabel: document.getElementById('currentSite') as HTMLElement,
        applyGlobal: document.getElementById('applyGlobal') as HTMLInputElement,
        iframeEnable: document.getElementById('iframeEnable') as HTMLInputElement,
        enabledCheckbox: document.getElementById('enabledCheckbox') as HTMLInputElement,
        fpsSlider: document.getElementById('fpsSlider') as HTMLInputElement,
        fpsInput: document.getElementById('fpsInput') as HTMLInputElement,
        autoModeMasterEnable: document.getElementById('autoModeMasterEnable') as HTMLInputElement,
        autoModeListEl: document.getElementById('autoModeList') as HTMLUListElement,
        addSiteForm: document.getElementById('addSiteForm') as HTMLFormElement,
        newSiteDomainInput: document.getElementById('newSiteDomain') as HTMLInputElement,
        heavyPageNotification: document.getElementById('heavyPageNotification') as HTMLElement,
        addToAutoListBtn: document.getElementById('addToAutoListBtn') as HTMLButtonElement,
    };

    let currentHost: string = 'global';
    let autoModeConfigs: AutoModeConfig[] = [];
    let siteConfigCache: SiteConfig = { enabled: true, value: 60 };
    let heavyHosts: string[] = [];

    function syncFpsControls(value: string | number): void {
        if (elements.fpsSlider) elements.fpsSlider.value = String(value);
        if (elements.fpsInput) elements.fpsInput.value = String(value);
    }

    function renderAutoModeList(): void {
        if (!elements.autoModeListEl) return;
        elements.autoModeListEl.innerHTML = '';
        autoModeConfigs.forEach((config, index) => {
            const item = document.createElement('li');
            item.className = 'auto-mode-item';
            item.innerHTML = `<span class="domain">${config.domain}</span><input type="number" value="${config.fps}" min="1" max="240" data-index="${index}"><button data-index="${index}">Xóa</button>`;
            elements.autoModeListEl.appendChild(item);
        });
    }

    async function saveAutoModeList(): Promise<void> {
        await chrome.storage.local.set({ autoModeConfigs: autoModeConfigs });
    }

    async function loadSettingsForCurrentTab(): Promise<void> {
        const data = await chrome.storage.local.get(null);
        autoModeConfigs = data.autoModeConfigs || [];
        heavyHosts = data.heavyHosts || [];
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

        if (heavyHosts.includes(currentHost)) {
            if (elements.heavyPageNotification) {
                elements.heavyPageNotification.style.display = 'flex';
            }
        }
    }

    const saveSiteSettings = (): void => {
        if (!elements.enabledCheckbox || !elements.fpsInput || !elements.applyGlobal) return;
        const newConfig: SiteConfig = {
            enabled: elements.enabledCheckbox.checked,
            value: parseInt(elements.fpsInput.value, 10),
        };
        siteConfigCache = newConfig;
        const keyToSave = elements.applyGlobal.checked ? 'global' : currentHost;
        chrome.storage.local.set({ [keyToSave]: newConfig });
    };
    
    // Gán sự kiện với kiểm tra an toàn
    if (elements.masterDisable) elements.masterDisable.addEventListener('change', (e) => chrome.storage.local.set({ globalDisabled: (e.target as HTMLInputElement).checked }));
    if (elements.autoModeMasterEnable) elements.autoModeMasterEnable.addEventListener('change', (e) => chrome.storage.local.set({ autoModeMasterEnable: (e.target as HTMLInputElement).checked }));
    if (elements.iframeEnable) elements.iframeEnable.addEventListener('change', (e) => chrome.storage.local.set({ applyInFrames: (e.target as HTMLInputElement).checked }));
    if (elements.applyGlobal) elements.applyGlobal.addEventListener('change', async (e) => {
        if ((e.target as HTMLInputElement).checked) {
            await chrome.storage.local.remove(currentHost);
        } else {
            await chrome.storage.local.set({ [currentHost]: siteConfigCache });
        }
    });

    if (elements.enabledCheckbox) elements.enabledCheckbox.addEventListener('change', saveSiteSettings);
    if (elements.fpsSlider) elements.fpsSlider.addEventListener('change', saveSiteSettings);
    if (elements.fpsInput) elements.fpsInput.addEventListener('change', () => {
        let value = parseInt(elements.fpsInput.value, 10);
        if (isNaN(value) || value < 1) value = 1;
        if (value > 240) value = 240;
        syncFpsControls(value);
        saveSiteSettings();
    });

    document.querySelectorAll('.presets button').forEach(button => {
        button.addEventListener('click', () => {
            syncFpsControls((button as HTMLElement).dataset.fps ?? '60');
            saveSiteSettings();
        });
    });

    if (elements.addSiteForm) elements.addSiteForm.addEventListener('submit', (e: SubmitEvent) => {
        e.preventDefault();
        const newDomain = elements.newSiteDomainInput.value.trim();
        if (newDomain && !autoModeConfigs.some(c => c.domain === newDomain)) {
            autoModeConfigs.push({ domain: newDomain, fps: 60 });
            elements.newSiteDomainInput.value = '';
            renderAutoModeList();
            saveAutoModeList();
        }
    });

    if (elements.autoModeListEl) {
        elements.autoModeListEl.addEventListener('click', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'BUTTON') {
                const index = parseInt(target.dataset.index!, 10);
                autoModeConfigs.splice(index, 1);
                renderAutoModeList();
                saveAutoModeList();
            }
        });
        elements.autoModeListEl.addEventListener('change', (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target.tagName === 'INPUT') {
                const index = parseInt(target.dataset.index!, 10);
                let newFps = parseInt(target.value, 10);
                if (isNaN(newFps) || newFps < 1) newFps = 1;
                autoModeConfigs[index].fps = newFps;
                saveAutoModeList();
            }
        });
    }
    
    if (elements.addToAutoListBtn) elements.addToAutoListBtn.addEventListener('click', async () => {
        if (currentHost !== 'global' && !autoModeConfigs.some(c => c.domain === currentHost)) {
            autoModeConfigs.push({ domain: currentHost, fps: 30 });
            renderAutoModeList();
            await saveAutoModeList();
        }
        const index = heavyHosts.indexOf(currentHost);
        if (index > -1) heavyHosts.splice(index, 1);
        await chrome.storage.local.set({ heavyHosts });
        if (elements.heavyPageNotification) elements.heavyPageNotification.style.display = 'none';
    });

    // Initialization
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab && tab.url) {
            try {
                const url = new URL(tab.url);
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
