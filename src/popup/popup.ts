// Enhanced Popup Script with AI Integration and Modern Features
import type { AutoModeConfig, SiteConfig, AIRecommendation, FpsPreset, PerformanceMetrics } from '../types';

class EnhancedPopupManager {
    private elements: { [key: string]: HTMLElement | null } = {};
    private currentHost: string = 'global';
    private autoModeConfigs: AutoModeConfig[] = [];
    private siteConfigCache: SiteConfig = { enabled: true, value: 60 };
    private heavyHosts: string[] = [];
    private aiRecommendations: AIRecommendation[] = [];
    private presets: FpsPreset[] = [];
    private performanceMetrics: PerformanceMetrics | null = null;
    private updateInterval: number | null = null;
    private animationFrameId: number | null = null;

    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.initialize();
    }

    private initializeElements(): void {
        const elementIds = [
            'masterDisable', 'mainControls', 'currentSite', 'siteStatus', 'statusIndicator', 'statusText',
            'applyGlobal', 'enabledCheckbox', 'fpsSlider', 'fpsInput', 'currentFPS', 'adaptiveIndicator',
            'autoModeMasterEnable', 'autoModeList', 'addSiteForm', 'newSiteDomain', 'adaptiveMode',
            'gamingMode', 'heavyPageNotification', 'addToAutoListBtn', 'gameNotification', 'acceptGameMode',
            'batteryWarning', 'enableBatteryMode', 'aiPanel', 'showAI', 'closeAI', 'aiRecommendations',
            'presetGrid', 'performanceMonitor', 'realTimeFPS', 'frameTime', 'jankFrames', 'powerUsage',
            'profileSelect', 'addProfile', 'editProfile', 'deleteProfile', 'loadingOverlay',
            'openOptions', 'exportSettings', 'resetSettings', 'toggleAutoMode', 'autoModeContent'
        ];

        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
    }

    private setupEventListeners(): void {
        // Master disable toggle
        this.elements.masterDisable?.addEventListener('change', (e) => {
            const checked = (e.target as HTMLInputElement).checked;
            chrome.storage.local.set({ globalDisabled: checked });
            this.updateMainControlsVisibility(!checked);
            this.showNotification(checked ? '🛑 FPS Limiter Disabled' : '✅ FPS Limiter Enabled');
        });

        // FPS controls
        this.elements.fpsSlider?.addEventListener('input', (e) => {
            const value = (e.target as HTMLInputElement).value;
            this.syncFpsControls(value);
            this.updateFpsDisplay(parseInt(value));
        });

        this.elements.fpsSlider?.addEventListener('change', () => this.saveSiteSettings());

        this.elements.fpsInput?.addEventListener('input', (e) => {
            let value = parseInt((e.target as HTMLInputElement).value);
            value = Math.max(1, Math.min(240, value || 60));
            this.syncFpsControls(value.toString());
            this.updateFpsDisplay(value);
        });

        this.elements.fpsInput?.addEventListener('change', () => this.saveSiteSettings());

        // Checkbox controls
        this.elements.enabledCheckbox?.addEventListener('change', () => this.saveSiteSettings());
        this.elements.applyGlobal?.addEventListener('change', (e) => this.handleGlobalToggle(e));
        this.elements.autoModeMasterEnable?.addEventListener('change', (e) => {
            chrome.storage.local.set({ autoModeMasterEnable: (e.target as HTMLInputElement).checked });
        });

        // Advanced features
        this.elements.adaptiveMode?.addEventListener('change', (e) => {
            const enabled = (e.target as HTMLInputElement).checked;
            chrome.storage.local.set({ adaptiveMode: enabled });
            this.updateAdaptiveIndicator(enabled);
            this.showNotification(enabled ? '🧠 Adaptive Mode Enabled' : '🧠 Adaptive Mode Disabled');
        });

        this.elements.gamingMode?.addEventListener('change', (e) => {
            const enabled = (e.target as HTMLInputElement).checked;
            chrome.storage.local.set({ gamingMode: enabled });
            this.updateGamingIndicator(enabled);
            this.showNotification(enabled ? '🎮 Gaming Mode Enabled' : '🎮 Gaming Mode Disabled');
        });

        // AI Panel
        this.elements.showAI?.addEventListener('click', () => this.showAIPanel());
        this.elements.closeAI?.addEventListener('click', () => this.hideAIPanel());

        // Auto mode management
        this.elements.toggleAutoMode?.addEventListener('click', () => this.toggleAutoModeContent());
        this.elements.addSiteForm?.addEventListener('submit', (e) => this.handleAddSite(e));
        this.elements.autoModeList?.addEventListener('click', (e) => this.handleAutoModeClick(e));
        this.elements.autoModeList?.addEventListener('change', (e) => this.handleAutoModeChange(e));

        // Notifications
        this.elements.addToAutoListBtn?.addEventListener('click', () => this.addToAutoList());
        this.elements.acceptGameMode?.addEventListener('click', () => this.acceptGameMode());
        this.elements.enableBatteryMode?.addEventListener('click', () => this.enableBatteryMode());

        // Footer actions
        this.elements.openOptions?.addEventListener('click', () => chrome.runtime.openOptionsPage());
        this.elements.exportSettings?.addEventListener('click', () => this.exportSettings());
        this.elements.resetSettings?.addEventListener('click', () => this.resetSettings());

        // Profile management
        this.elements.profileSelect?.addEventListener('change', (e) => this.switchProfile(e));
        this.elements.addProfile?.addEventListener('click', () => this.addProfile());
        this.elements.editProfile?.addEventListener('click', () => this.editProfile());
        this.elements.deleteProfile?.addEventListener('click', () => this.deleteProfile());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    private async initialize(): Promise<void> {
        try {
            // Get current tab
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const tab = tabs[0];
            
            if (tab?.url) {
                try {
                    const url = new URL(tab.url);
                    if (url.protocol.startsWith('http')) {
                        this.currentHost = url.hostname;
                    }
                } catch (e) {}
            }

            this.updateSiteDisplay();
            await this.loadAllSettings();
            await this.loadAIRecommendations();
            this.startPerformanceMonitoring();
            this.setupAnimations();

        } catch (error) {
            console.error('Popup initialization error:', error);
            this.showError('Failed to initialize popup');
        }
    }

    private async loadAllSettings(): Promise<void> {
        try {
            const data = await chrome.storage.local.get(null);
            
            // Load basic settings
            this.autoModeConfigs = data.autoModeConfigs || [];
            this.heavyHosts = data.heavyHosts || [];
            this.presets = data.presets || [];
            
            // Update UI elements
            this.updateMasterDisable(data.globalDisabled ?? false);
            this.updateAdvancedFeatures(data);
            this.renderPresets();
            this.renderAutoModeList();
            this.loadSiteConfig(data);
            this.updateNotifications();
            this.loadProfileData(data);

        } catch (error) {
            console.error('Error loading settings:', error);
            this.showError('Failed to load settings');
        }
    }

    private updateMasterDisable(disabled: boolean): void {
        if (this.elements.masterDisable) {
            (this.elements.masterDisable as HTMLInputElement).checked = disabled;
        }
        this.updateMainControlsVisibility(!disabled);
    }

    private updateMainControlsVisibility(visible: boolean): void {
        if (this.elements.mainControls) {
            this.elements.mainControls.style.display = visible ? 'block' : 'none';
        }
    }

    private updateAdvancedFeatures(data: any): void {
        if (this.elements.autoModeMasterEnable) {
            (this.elements.autoModeMasterEnable as HTMLInputElement).checked = data.autoModeMasterEnable ?? true;
        }
        if (this.elements.adaptiveMode) {
            (this.elements.adaptiveMode as HTMLInputElement).checked = data.adaptiveMode ?? true;
        }
        if (this.elements.gamingMode) {
            (this.elements.gamingMode as HTMLInputElement).checked = data.gamingMode ?? false;
        }

        this.updateAdaptiveIndicator(data.adaptiveMode ?? true);
        this.updateGamingIndicator(data.gamingMode ?? false);
        this.updateBatteryIndicator(data.batteryOptimization ?? false);
    }

    private loadSiteConfig(data: any): void {
        const siteConfig = data[this.currentHost];
        const globalConfig = data.globalConfig ?? { enabled: true, value: 60 };
        
        if (this.elements.applyGlobal) {
            (this.elements.applyGlobal as HTMLInputElement).checked = !siteConfig;
        }
        
        this.siteConfigCache = siteConfig ?? globalConfig;
        
        if (this.elements.enabledCheckbox) {
            (this.elements.enabledCheckbox as HTMLInputElement).checked = this.siteConfigCache.enabled;
        }
        
        this.syncFpsControls(this.siteConfigCache.value.toString());
        this.updateFpsDisplay(this.siteConfigCache.value);
    }

    private loadProfileData(data: any): void {
        const profiles = data.profiles || [];
        const activeProfileId = data.activeProfileId;
        
        if (this.elements.profileSelect) {
            const select = this.elements.profileSelect as HTMLSelectElement;
            select.innerHTML = '<option value="">Default Profile</option>';
            
            profiles.forEach((profile: any) => {
                const option = document.createElement('option');
                option.value = profile.id;
                option.textContent = `${profile.icon || '📁'} ${profile.name}`;
                option.selected = profile.id === activeProfileId;
                select.appendChild(option);
            });
        }
    }

    private renderPresets(): void {
        if (!this.elements.presetGrid) return;
        
        this.elements.presetGrid.innerHTML = '';
        
        this.presets.forEach((preset, index) => {
            const presetEl = document.createElement('button');
            presetEl.className = 'preset-btn';
            presetEl.innerHTML = `
                <span class="preset-icon">${preset.icon}</span>
                <span class="preset-name">${preset.name}</span>
                <span class="preset-fps">${preset.fps} FPS</span>
            `;
            presetEl.title = preset.description;
            presetEl.addEventListener('click', () => this.applyPreset(preset));
            
            this.elements.presetGrid.appendChild(presetEl);
        });
    }

    private renderAutoModeList(): void {
        if (!this.elements.autoModeList) return;
        
        this.elements.autoModeList.innerHTML = '';
        
        this.autoModeConfigs.forEach((config, index) => {
            const item = document.createElement('li');
            item.className = 'auto-mode-item';
            item.innerHTML = `
                <span class="domain">${config.domain}</span>
                <input type="number" value="${config.fps}" min="1" max="240" data-index="${index}">
                <button data-index="${index}" title="Remove site">×</button>
            `;
            this.elements.autoModeList.appendChild(item);
        });
    }

    private async loadAIRecommendations(): Promise<void> {
        try {
            this.showLoadingOverlay(true);
            
            // Request AI recommendations from background script
            const response = await chrome.runtime.sendMessage({ type: 'GET_AI_RECOMMENDATIONS' });
            this.aiRecommendations = response?.recommendations || [];
            
            this.renderAIRecommendations();
            
            // Show AI button indicator if there are recommendations
            if (this.aiRecommendations.length > 0 && this.elements.showAI) {
                this.elements.showAI.classList.add('has-recommendations');
                this.elements.showAI.title = `${this.aiRecommendations.length} AI recommendations available`;
            }
            
        } catch (error) {
            console.error('Error loading AI recommendations:', error);
        } finally {
            this.showLoadingOverlay(false);
        }
    }

    private renderAIRecommendations(): void {
        if (!this.elements.aiRecommendations) return;
        
        this.elements.aiRecommendations.innerHTML = '';
        
        if (this.aiRecommendations.length === 0) {
            this.elements.aiRecommendations.innerHTML = `
                <div class="no-recommendations">
                    <span>🤖</span>
                    <p>No recommendations available yet. Keep browsing to generate AI insights!</p>
                </div>
            `;
            return;
        }
        
        this.aiRecommendations.forEach(recommendation => {
            const recEl = document.createElement('div');
            recEl.className = 'ai-recommendation';
            recEl.innerHTML = `
                <h4>${recommendation.title}</h4>
                <p>${recommendation.description}</p>
                <div class="confidence">
                    <span>Confidence: ${Math.round(recommendation.confidence * 100)}%</span>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${recommendation.confidence * 100}%"></div>
                    </div>
                </div>
                <button class="apply-recommendation" data-recommendation='${JSON.stringify(recommendation)}'>
                    Apply
                </button>
            `;
            
            const applyBtn = recEl.querySelector('.apply-recommendation');
            applyBtn?.addEventListener('click', () => this.applyAIRecommendation(recommendation));
            
            this.elements.aiRecommendations.appendChild(recEl);
        });
    }

    private updateNotifications(): void {
        // Heavy page notification
        if (this.heavyHosts.includes(this.currentHost)) {
            this.showNotificationPanel('heavyPageNotification');
        }
        
        // Game detection notification
        this.checkGameDetection();
        
        // Battery warning
        this.checkBatteryStatus();
    }

    private async checkGameDetection(): Promise<void> {
        // Request game detection from content script
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]?.id) {
                const response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'CHECK_GAME_DETECTION' });
                if (response?.isGame) {
                    this.showGameNotification(response.gameType, response.recommendedFps);
                }
            }
        } catch (e) {
            // Content script not ready or not available
        }
    }

    private async checkBatteryStatus(): Promise<void> {
        try {
            // @ts-ignore - Battery API might not be available
            const battery = await navigator.getBattery?.();
            if (battery && !battery.charging && battery.level < 0.2) {
                this.showNotificationPanel('batteryWarning');
            }
        } catch (e) {
            // Battery API not supported
        }
    }

    private showGameNotification(gameType: string, recommendedFps: number): void {
        if (this.elements.gameNotification && this.elements.gameTypeText) {
            this.elements.gameTypeText.textContent = `${gameType.toUpperCase()} game detected - ${recommendedFps} FPS recommended`;
            this.showNotificationPanel('gameNotification');
        }
    }

    private showNotificationPanel(panelId: string): void {
        const panel = this.elements[panelId];
        if (panel) {
            panel.style.display = 'block';
            panel.classList.add('slide-down');
        }
    }

    private hideNotificationPanel(panelId: string): void {
        const panel = this.elements[panelId];
        if (panel) {
            panel.classList.add('fade-out');
            setTimeout(() => {
                panel.style.display = 'none';
                panel.classList.remove('fade-out', 'slide-down');
            }, 300);
        }
    }

    private startPerformanceMonitoring(): void {
        if (this.updateInterval) clearInterval(this.updateInterval);
        
        this.updateInterval = window.setInterval(async () => {
            await this.updatePerformanceMetrics();
        }, 1000);
        
        // Also update immediately
        this.updatePerformanceMetrics();
    }

    private async updatePerformanceMetrics(): Promise<void> {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]?.id) {
                const response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_PERFORMANCE_METRICS' });
                if (response) {
                    this.performanceMetrics = response;
                    this.renderPerformanceMetrics();
                }
            }
        } catch (e) {
            // Content script not available
            this.renderPerformanceMetrics(null);
        }
    }

    private renderPerformanceMetrics(metrics?: PerformanceMetrics | null): void {
        const metricsToShow = metrics || this.performanceMetrics;
        
        if (this.elements.realTimeFPS) {
            this.elements.realTimeFPS.textContent = metricsToShow ? 
                `${Math.round(1000 / metricsToShow.frameTime)}` : '--';
        }
        
        if (this.elements.frameTime) {
            this.elements.frameTime.textContent = metricsToShow ? 
                `${metricsToShow.frameTime.toFixed(1)}ms` : '--ms';
        }
        
        if (this.elements.jankFrames) {
            // Calculate jank percentage (placeholder logic)
            const jankPercentage = metricsToShow ? Math.min(100, (metricsToShow.frameTime / 16.67 - 1) * 100) : 0;
            this.elements.jankFrames.textContent = `${Math.round(jankPercentage)}%`;
        }
        
        if (this.elements.powerUsage) {
            this.elements.powerUsage.textContent = metricsToShow ? 
                `${Math.round(metricsToShow.powerConsumption || 0)}%` : '--%';
        }
    }

    // Event Handlers
    private syncFpsControls(value: string): void {
        if (this.elements.fpsSlider) {
            (this.elements.fpsSlider as HTMLInputElement).value = value;
        }
        if (this.elements.fpsInput) {
            (this.elements.fpsInput as HTMLInputElement).value = value;
        }
    }

    private updateFpsDisplay(fps: number): void {
        if (this.elements.currentFPS) {
            this.elements.currentFPS.textContent = fps.toString();
            
            // Add visual feedback for FPS changes
            this.elements.currentFPS.classList.add('fps-changing');
            setTimeout(() => {
                this.elements.currentFPS?.classList.remove('fps-changing');
            }, 300);
        }
    }

    private updateSiteDisplay(): void {
        if (this.elements.currentSite) {
            this.elements.currentSite.textContent = this.currentHost === 'global' ? 'Global Settings' : this.currentHost;
        }
        
        // Update site status
        this.updateSiteStatus();
    }

    private updateSiteStatus(): void {
        if (this.elements.statusText) {
            const status = this.siteConfigCache.enabled ? 'Active' : 'Disabled';
            this.elements.statusText.textContent = status;
        }
        
        if (this.elements.statusIndicator) {
            const indicator = this.elements.statusIndicator;
            indicator.style.background = this.siteConfigCache.enabled ? 'var(--success-color)' : 'var(--error-color)';
        }
    }

    private saveSiteSettings(): void {
        if (!this.elements.enabledCheckbox || !this.elements.fpsInput || !this.elements.applyGlobal) return;
        
        const newConfig: SiteConfig = {
            enabled: (this.elements.enabledCheckbox as HTMLInputElement).checked,
            value: parseInt((this.elements.fpsInput as HTMLInputElement).value),
            adaptive: true,
            priority: 'balanced'
        };
        
        this.siteConfigCache = newConfig;
        this.updateSiteStatus();
        
        const keyToSave = (this.elements.applyGlobal as HTMLInputElement).checked ? 'globalConfig' : this.currentHost;
        chrome.storage.local.set({ [keyToSave]: newConfig });
        
        // Show save feedback
        this.showNotification('⚡ Settings saved');
    }

    private async handleGlobalToggle(e: Event): Promise<void> {
        const checked = (e.target as HTMLInputElement).checked;
        if (checked) {
            await chrome.storage.local.remove(this.currentHost);
        } else {
            await chrome.storage.local.set({ [this.currentHost]: this.siteConfigCache });
        }
        this.showNotification(checked ? '🌐 Using global settings' : '🎯 Using site-specific settings');
    }

    private applyPreset(preset: FpsPreset): void {
        this.syncFpsControls(preset.fps.toString());
        this.updateFpsDisplay(preset.fps);
        this.saveSiteSettings();
        this.showNotification(`${preset.icon} ${preset.name} applied - ${preset.fps} FPS`);
        
        // Visual feedback
        const presetBtns = document.querySelectorAll('.preset-btn');
        presetBtns.forEach(btn => btn.classList.remove('active'));
        
        const targetBtn = Array.from(presetBtns).find(btn => 
            btn.textContent?.includes(preset.name)
        );
        targetBtn?.classList.add('active');
        
        setTimeout(() => targetBtn?.classList.remove('active'), 1000);
    }

    private async applyAIRecommendation(recommendation: AIRecommendation): Promise<void>
