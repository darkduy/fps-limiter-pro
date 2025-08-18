// src/services/aiEngine.ts - AI-powered optimization engine
import type {
  SettingsCache,
  TabAnalytics,
  PerformanceMetrics,
  SystemInfo,
  AIRecommendation,
  GameDetectionResult,
} from '../types';

interface LearningData {
  url: string;
  domain: string;
  userPreferences: {
    fpsSettings: number[];
    timestamps: number[];
    satisfactionScore: number;
  };
  performanceHistory: PerformanceMetrics[];
  contextualFactors: {
    timeOfDay: number;
    batteryLevel: number;
    cpuUsage: number;
    networkType: string;
    isGaming: boolean;
  }[];
}

interface PatternAnalysis {
  usage: {
    peakHours: number[];
    preferredFps: { [domain: string]: number };
    batteryAwareness: number; // 0-1 scale
    performanceSensitivity: number; // 0-1 scale
  };
  performance: {
    problematicSites: string[];
    optimalSettings: { [domain: string]: number };
    resourceIntensiveTimes: number[];
  };
  recommendations: AIRecommendation[];
}

export class AIEngine {
  private isInitialized = false;
  private learningData: Map<string, LearningData> = new Map();
  private recommendations: AIRecommendation[] = [];
  private analysisHistory: PatternAnalysis[] = [];
  private settings: SettingsCache = {};

  async initialize(settings: SettingsCache): Promise<void> {
    this.settings = settings;
    
    try {
      // Load existing learning data
      const stored = await chrome.storage.local.get('aiLearningData');
      if (stored.aiLearningData) {
        this.learningData = new Map(Object.entries(stored.aiLearningData));
      }

      // Load stored recommendations
      const storedRecommendations = await chrome.storage.local.get('aiRecommendations');
      if (storedRecommendations.aiRecommendations) {
        this.recommendations = storedRecommendations.aiRecommendations;
      }

      this.isInitialized = true;
      console.log('🧠 AI Engine initialized');
    } catch (error) {
      console.error('Failed to initialize AI Engine:', error);
    }
  }

  async updateSettings(settings: SettingsCache): Promise<void> {
    this.settings = settings;
  }

  isReady(): boolean {
    return this.isInitialized && this.settings.aiOptimization === true;
  }

  /**
   * Get optimal FPS recommendation based on AI analysis
   */
  getOptimalFps(
    url: string,
    tabAnalytics?: TabAnalytics,
    performanceData?: PerformanceMetrics,
    systemInfo?: SystemInfo,
  ): { fps: number; confidence: number; reasoning: string } | null {
    if (!this.isReady()) return null;

    try {
      const domain = new URL(url).hostname;
      const learningData = this.learningData.get(domain);

      // If no learning data, use heuristic analysis
      if (!learningData) {
        return this.getHeuristicRecommendation(url, tabAnalytics, performanceData, systemInfo);
      }

      // Analyze user preferences and patterns
      const contextualScore = this.calculateContextualScore(learningData, systemInfo);
      const performanceScore = this.calculatePerformanceScore(learningData, performanceData);
      const userPreferenceScore = this.calculateUserPreferenceScore(learningData);

      // Weighted recommendation
      const weights = { contextual: 0.4, performance: 0.4, preference: 0.2 };
      const recommendedFps = Math.round(
        contextualScore * weights.contextual +
        performanceScore * weights.performance +
        userPreferenceScore * weights.preference
      );

      const confidence = this.calculateConfidence(learningData, tabAnalytics);

      return {
        fps: Math.max(15, Math.min(240, recommendedFps)),
        confidence,
        reasoning: this.generateReasoning(contextualScore, performanceScore, userPreferenceScore),
      };
    } catch (error) {
      console.error('AI FPS calculation error:', error);
      return null;
    }
  }

  /**
   * Heuristic-based recommendation for new sites
   */
  private getHeuristicRecommendation(
    url: string,
    tabAnalytics?: TabAnalytics,
    performanceData?: PerformanceMetrics,
    systemInfo?: SystemInfo,
  ): { fps: number; confidence: number; reasoning: string } {
    let baseFps = 60;
    let confidence = 0.5;
    let reasoning = 'Heuristic analysis based on';
    const factors: string[] = [];

    try {
      const domain = new URL(url).hostname;
      
      // Domain-based heuristics
      if (this.isGamingDomain(domain)) {
        baseFps = 144;
        confidence += 0.2;
        factors.push('gaming domain detection');
      } else if (this.isVideoDomain(domain)) {
        baseFps = 60;
        confidence += 0.1;
        factors.push('video platform optimization');
      } else if (this.isSocialDomain(domain)) {
        baseFps = 30;
        confidence += 0.1;
        factors.push('social media efficiency');
      }

      // Performance-based adjustments
      if (performanceData) {
        if (performanceData.cpuUsage > 80) {
          baseFps = Math.max(30, baseFps * 0.7);
          factors.push('high CPU usage mitigation');
        }
        if (performanceData.jankFrames > 10) {
          baseFps = Math.max(30, baseFps * 0.8);
          factors.push('jank reduction');
        }
      }

      // System-based adjustments
      if (systemInfo) {
        if (systemInfo.battery && systemInfo.battery.level < 20) {
          baseFps = Math.min(baseFps, 30);
          confidence += 0.1;
          factors.push('battery conservation');
        }
        if (systemInfo.thermal.state !== 'normal') {
          const thermalMultiplier = {
            'fair': 0.9,
            'serious': 0.7,
            'critical': 0.5,
          }[systemInfo.thermal.state] || 1;
          baseFps = Math.max(15, baseFps * thermalMultiplier);
          factors.push('thermal protection');
        }
      }

      // Tab analytics adjustments
      if (tabAnalytics?.classification.type === 'game') {
        baseFps = Math.max(baseFps, 120);
        confidence += 0.2;
        factors.push('game classification');
      }

      reasoning += ` ${factors.join(', ')}`;
      
      return {
        fps: Math.round(baseFps),
        confidence: Math.min(1, confidence),
        reasoning,
      };
    } catch (error) {
      return {
        fps: 60,
        confidence: 0.3,
        reasoning: 'Fallback to default settings due to analysis error',
      };
    }
  }

  /**
   * Process performance data to improve learning
   */
  async processPerformanceData(
    tabId: number,
    performanceData: PerformanceMetrics,
    tabAnalytics: TabAnalytics,
  ): Promise<void> {
    if (!this.isReady()) return;

    try {
      const domain = tabAnalytics.domain;
      let learningData = this.learningData.get(domain);

      if (!learningData) {
        learningData = this.createNewLearningData(tabAnalytics.url, domain);
      }

      // Update performance history
      learningData.performanceHistory.push(performanceData);
      
      // Keep only recent history (last 100 entries)
      if (learningData.performanceHistory.length > 100) {
        learningData.performanceHistory.shift();
      }

      // Update contextual factors
      const contextualFactor = {
        timeOfDay: new Date().getHours(),
        batteryLevel: performanceData.batteryLevel,
        cpuUsage: performanceData.cpuUsage,
        networkType: performanceData.networkType,
        isGaming: tabAnalytics.classification.type === 'game',
      };

      learningData.contextualFactors.push(contextualFactor);
      if (learningData.contextualFactors.length > 50) {
        learningData.contextualFactors.shift();
      }

      // Detect performance issues and learn from them
      if (performanceData.jankFrames > 15 || performanceData.averageFps < 30) {
        await this.generatePerformanceRecommendation(domain, performanceData, tabAnalytics);
      }

      this.learningData.set(domain, learningData);
      await this.saveLearningData();
    } catch (error) {
      console.error('Error processing performance data:', error);
    }
  }

  /**
   * Determine if a tab should be suspended based on AI analysis
   */
  async shouldSuspendTab(
    tab: chrome.tabs.Tab,
    analytics?: TabAnalytics,
    systemInfo?: SystemInfo | null,
  ): Promise<boolean> {
    if (!this.isReady() || !tab.url) return true;

    try {
      const domain = new URL(tab.url).hostname;
      const learningData = this.learningData.get(domain);

      // Don't suspend important or frequently used tabs
      if (analytics) {
        const isImportant = analytics.usage.totalTime > 30 * 60 * 1000; // 30+ minutes
        const isRecent = Date.now() - analytics.usage.lastActive < 10 * 60 * 1000; // 10 minutes
        const isGame = analytics.classification.type === 'game';

        if (isImportant || isRecent || isGame) {
          return false;
        }
      }

      // User pattern analysis
      if (learningData) {
        const currentHour = new Date().getHours();
        const isActivePeriod = learningData.contextualFactors.some(
          factor => Math.abs(factor.timeOfDay - currentHour) <= 1
        );

        if (isActivePeriod) {
          return false;
        }
      }

      // System resource consideration
      if (systemInfo?.hardware.memory.usage < 70) {
        return false; // Plenty of memory available
      }

      return true;
    } catch (error) {
      console.error('Tab suspension AI error:', error);
      return true;
    }
  }

  /**
   * Generate AI recommendations
   */
  async performAnalysis(): Promise<void> {
    if (!this.isReady()) return;

    try {
      const analysis = await this.analyzeUserPatterns();
      const newRecommendations = await this.generateRecommendations(analysis);

      // Add new recommendations
      for (const rec of newRecommendations) {
        if (!this.recommendations.some(existing => existing.id === rec.id)) {
          this.recommendations.push(rec);
        }
      }

      // Keep only recent recommendations (last 50)
      this.recommendations = this.recommendations
        .sort((a, b) => b.metadata.createdAt - a.metadata.createdAt)
        .slice(0, 50);

      await this.saveRecommendations();
    } catch (error) {
      console.error('AI analysis error:', error);
    }
  }

  /**
   * Store a recommendation
   */
  async storeRecommendation(recommendation: AIRecommendation): Promise<void> {
    this.recommendations.push(recommendation);
    await this.saveRecommendations();
  }

  /**
   * Get current recommendations
   */
  getRecommendations(): AIRecommendation[] {
    return this.recommendations.filter(rec => 
      Date.now() - rec.metadata.createdAt < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    );
  }

  /**
   * Perform daily analysis and cleanup
   */
  async performDailyAnalysis(tabAnalytics: Map<number, TabAnalytics>): Promise<void> {
    if (!this.isReady()) return;

    try {
      // Analyze usage patterns
      const dailyStats = this.calculateDailyStats(tabAnalytics);
      
      // Generate insights
      const insights = await this.generateDailyInsights(dailyStats);
      
      // Create recommendations based on insights
      for (const insight of insights) {
        const recommendation: AIRecommendation = {
          id: `daily_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'optimization',
          category: 'general',
          title: insight.title,
          description: insight.description,
          reasoning: insight.reasoning,
          value: insight.value,
          confidence: insight.confidence,
          impact: insight.impact,
          metadata: {
            createdAt: Date.now(),
            source: 'usage_pattern',
            basedOn: ['daily_analysis'],
          },
        };

        await this.storeRecommendation(recommendation);
      }

      console.log('📊 Daily AI analysis completed');
    } catch (error) {
      console.error('Daily analysis error:', error);
    }
  }

  /**
   * Cleanup old data
   */
  async cleanup(): Promise<void> {
    try {
      // Remove old learning data (older than 30 days)
      const cutoffTime = Date.now() - 30 * 24 * 60 * 60 * 1000;
      
      for (const [domain, data] of this.learningData.entries()) {
        // Remove old performance history
        data.performanceHistory = data.performanceHistory.filter(
          entry => entry.timestamp > cutoffTime
        );
        
        // Remove old contextual factors
        data.contextualFactors = data.contextualFactors.slice(-20); // Keep last 20
        
        // If no data left, remove the domain
        if (data.performanceHistory.length === 0 && data.contextualFactors.length === 0) {
          this.learningData.delete(domain);
        }
      }

      // Remove old recommendations
      this.recommendations = this.recommendations.filter(
        rec => rec.metadata.createdAt > cutoffTime
      );

      await this.saveLearningData();
      await this.saveRecommendations();
    } catch (error) {
      console.error('AI cleanup error:', error);
    }
  }

  // Private helper methods

  private createNewLearningData(url: string, domain: string): LearningData {
    return {
      url,
      domain,
      userPreferences: {
        fpsSettings: [],
        timestamps: [],
        satisfactionScore: 0.5,
      },
      performanceHistory: [],
      contextualFactors: [],
    };
  }

  private calculateContextualScore(learningData: LearningData, systemInfo?: SystemInfo): number {
    const currentHour = new Date().getHours();
    const currentBattery = systemInfo?.battery?.level || 100;
    const currentCpu = systemInfo?.hardware.cpu.usage || 0;

    // Find similar contextual patterns
    const similarContexts = learningData.contextualFactors.filter(factor => {
      const hourDiff = Math.abs(factor.timeOfDay - currentHour);
      const batteryDiff = Math.abs(factor.batteryLevel - currentBattery);
      const cpuDiff = Math.abs(factor.cpuUsage - currentCpu);

      return hourDiff <= 2 && batteryDiff <= 20 && cpuDiff <= 20;
    });

    if (similarContexts.length === 0) return 60; // Default

    // Calculate average from similar contexts
    const avgPreference = similarContexts.reduce((sum, context) => {
      const index = learningData.contextualFactors.indexOf(context);
      return sum + (learningData.userPreferences.fpsSettings[index] || 60);
    }, 0) / similarContexts.length;

    return avgPreference;
  }

  private calculatePerformanceScore(learningData: LearningData, currentPerformance?: PerformanceMetrics): number {
    if (!currentPerformance || learningData.performanceHistory.length === 0) return 60;

    // Analyze historical performance to predict optimal FPS
    const recentHistory = learningData.performanceHistory.slice(-10);
    const avgJank = recentHistory.reduce((sum, p) => sum + p.jankFrames, 0) / recentHistory.length;
    const avgCpu = recentHistory.reduce((sum, p) => sum + p.cpuUsage, 0) / recentHistory.length;

    let recommendedFps = 60;

    // Adjust based on performance patterns
    if (avgJank > 10) {
      recommendedFps = Math.max(30, recommendedFps * 0.8);
    }
    if (avgCpu > 70) {
      recommendedFps = Math.max(30, recommendedFps * 0.7);
    }

    return recommendedFps;
  }

  private calculateUserPreferenceScore(learningData: LearningData): number {
    const { fpsSettings } = learningData.userPreferences;
    if (fpsSettings.length === 0) return 60;

    // Calculate weighted average based on recency
    const weights = fpsSettings.map((_, index) => Math.pow(0.9, fpsSettings.length - 1 - index));
    const weightedSum = fpsSettings.reduce((sum, fps, index) => sum + fps * weights[index], 0);
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);

    return weightedSum / weightSum;
  }

  private calculateConfidence(learningData: LearningData, tabAnalytics?: TabAnalytics): number {
    let confidence = 0.3; // Base confidence

    // Increase confidence based on data amount
    confidence += Math.min(0.4, learningData.performanceHistory.length * 0.02);
    confidence += Math.min(0.2, learningData.userPreferences.fpsSettings.length * 0.05);

    // Increase confidence if we have tab analytics
    if (tabAnalytics) {
      confidence += 0.1;
      if (tabAnalytics.classification.confidence > 0.8) {
        confidence += 0.1;
      }
    }

    return Math.min(1, confidence);
  }

  private generateReasoning(contextual: number, performance: number, preference: number): string {
    const reasons: string[] = [];

    if (Math.abs(contextual - 60) > 10) {
      reasons.push(`contextual patterns (${Math.round(contextual)} FPS)`);
    }
    if (Math.abs(performance - 60) > 10) {
      reasons.push(`performance optimization (${Math.round(performance)} FPS)`);
    }
    if (Math.abs(preference - 60) > 10) {
      reasons.push(`user preferences (${Math.round(preference)} FPS)`);
    }

    return reasons.length > 0 
      ? `AI recommendation based on ${reasons.join(', ')}`
      : 'AI recommendation based on general optimization patterns';
  }

  private isGamingDomain(domain: string): boolean {
    const gamingDomains = [
      'steam', 'itch.io', 'kongregate', 'miniclip', 'newgrounds', 'armor games',
      'krunker.io', 'agar.io', 'slither.io', 'diep.io'
    ];
    return gamingDomains.some(gaming => domain.includes(gaming));
  }

  private isVideoDomain(domain: string): boolean {
    const videoDomains = ['youtube', 'netflix', 'twitch', 'vimeo', 'dailymotion', 'hulu'];
    return videoDomains.some(video => domain.includes(video));
  }

  private isSocialDomain(domain: string): boolean {
    const socialDomains = ['facebook', 'twitter', 'instagram', 'linkedin', 'reddit', 'tiktok'];
    return socialDomains.some(social => domain.includes(social));
  }

  private async analyzeUserPatterns(): Promise<PatternAnalysis> {
    const analysis: PatternAnalysis = {
      usage: {
        peakHours: [],
        preferredFps: {},
        batteryAwareness: 0,
        performanceSensitivity: 0,
      },
      performance: {
        problematicSites: [],
        optimalSettings: {},
        resourceIntensiveTimes: [],
      },
      recommendations: [],
    };

    // Analyze patterns from learning data
    for (const [domain, data] of this.learningData.entries()) {
      // Calculate preferred FPS for this domain
      if (data.userPreferences.fpsSettings.length > 0) {
        const avgFps = data.userPreferences.fpsSettings.reduce((a, b) => a + b, 0) / 
                      data.userPreferences.fpsSettings.length;
        analysis.usage.preferredFps[domain] = avgFps;
      }

      // Identify problematic sites
      const avgJank = data.performanceHistory.length > 0
        ? data.performanceHistory.reduce((sum, p) => sum + p.jankFrames, 0) / data.performanceHistory.length
        : 0;
      
      if (avgJank > 15) {
        analysis.performance.problematicSites.push(domain);
      }
    }

    return analysis;
  }

  private async generateRecommendations(analysis: PatternAnalysis): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];

    // Battery awareness recommendations
    if (analysis.usage.batteryAwareness < 0.5) {
      recommendations.push({
        id: `battery_awareness_${Date.now()}`,
        type: 'setting',
        category: 'battery',
        title: 'Enable Battery Optimization',
        description: 'Automatically reduce FPS when battery is low to extend usage time',
        reasoning: 'Analysis shows low battery awareness in usage patterns',
        value: { batteryOptimization: true },
        confidence: 0.8,
        impact: 'medium',
        estimatedImprovement: { performance: 0, battery: 25, smoothness: -5 },
        metadata: {
          createdAt: Date.now(),
          source: 'usage_pattern',
          basedOn: ['battery_usage_analysis'],
        },
      });
    }

    // Performance recommendations for problematic sites
    for (const site of analysis.performance.problematicSites) {
      recommendations.push({
        id: `performance_${site}_${Date.now()}`,
        type: 'fps',
        category: 'performance',
        title: `Reduce FPS for ${site}`,
        description: `Lower FPS to improve performance on ${site}`,
        reasoning: 'High jank frame rate detected on this site',
        value: 30,
        confidence: 0.7,
        impact: 'high',
        estimatedImprovement: { performance: 20, battery: 10, smoothness: 15 },
        metadata: {
          createdAt: Date.now(),
          source: 'performance_analysis',
          basedOn: ['jank_analysis', site],
        },
      });
    }

    return recommendations;
  }

  private async generatePerformanceRecommendation(
    domain: string,
    performanceData: PerformanceMetrics,
    tabAnalytics: TabAnalytics,
  ): Promise<void> {
    const recommendation: AIRecommendation = {
      id: `perf_issue_${domain}_${Date.now()}`,
      type: 'optimization',
      category: 'performance',
      title: `Performance Issue Detected: ${domain}`,
      description: `High frame drops detected. Consider reducing FPS or enabling adaptive mode.`,
      reasoning: `${performanceData.jankFrames} jank frames detected with ${Math.round(performanceData.averageFps)} average FPS`,
      value: { domain, suggestedFps: Math.max(30, Math.round(performanceData.averageFps * 0.7)) },
      confidence: 0.8,
      impact: 'high',
      estimatedImprovement: { performance: 25, battery: 15, smoothness: 30 },
      metadata: {
        createdAt: Date.now(),
        source: 'performance_analysis',
        basedOn: ['real_time_performance', domain],
      },
    };

    await this.storeRecommendation(recommendation);
  }

  private calculateDailyStats(tabAnalytics: Map<number, TabAnalytics>): any {
    const stats = {
      totalTabs: tabAnalytics.size,
      averageFps: 0,
      problemSites: [] as string[],
      topDomains: [] as string[],
      peakUsageHours: [] as number[],
    };

    const domainStats = new Map<string, { count: number; totalFps: number; issues: number }>();
    const hourlyUsage = new Array(24).fill(0);

    for (const [tabId, analytics] of tabAnalytics.entries()) {
      const domain = analytics.domain;
      const domainStat = domainStats.get(domain) || { count: 0, totalFps: 0, issues: 0 };
      
      domainStat.count++;
      domainStat.totalFps += analytics.performance.averageFps;
      if (analytics.performance.jankPercentage > 20) {
        domainStat.issues++;
      }
      
      domainStats.set(domain, domainStat);

      // Track hourly usage
      const hour = new Date(analytics.usage.lastActive).getHours();
      hourlyUsage[hour]++;
    }

    // Calculate averages and find patterns
    stats.averageFps = Array.from(domainStats.values()).reduce((sum, stat) => sum + stat.totalFps / stat.count, 0) / domainStats.size;
    
    stats.problemSites = Array.from(domainStats.entries())
      .filter(([domain, stat]) => stat.issues / stat.count > 0.3)
      .map(([domain]) => domain);
    
    stats.topDomains = Array.from(domainStats.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([domain]) => domain);
    
    stats.peakUsageHours = hourlyUsage
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);

    return stats;
  }

  private async generateDailyInsights(stats: any): Promise<any[]> {
    const insights: any[] = [];

    // Performance insights
    if (stats.problemSites.length > 0) {
      insights.push({
        title: 'Performance Issues Detected',
        description: `${stats.problemSites.length} sites showing performance problems`,
        reasoning: 'High jank rates detected on multiple domains',
        value: { problematicSites: stats.problemSites },
        confidence: 0.8,
        impact: 'high',
      });
    }

    // Usage pattern insights
    if (stats.peakUsageHours.length > 0) {
      insights.push({
        title: 'Peak Usage Pattern Identified',
        description: `Most active during hours: ${stats.peakUsageHours.join(', ')}`,
        reasoning: 'Usage pattern analysis for optimization scheduling',
        value: { peakHours: stats.peakUsageHours },
        confidence: 0.7,
        impact: 'medium',
      });
    }

    return insights;
  }

  private async saveLearningData(): Promise<void> {
    try {
      const dataToSave = Object.fromEntries(this.learningData.entries());
      await chrome.storage.local.set({ aiLearningData: dataToSave });
    } catch (error) {
      console.error('Failed to save learning data:', error);
    }
  }

  private async saveRecommendations(): Promise<void> {
    try {
      await chrome.storage.local.set({ aiRecommendations: this.recommendations });
    } catch (error) {
      console.error('Failed to save recommendations:', error);
    }
  }
}
