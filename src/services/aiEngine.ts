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
