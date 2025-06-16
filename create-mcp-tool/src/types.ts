export interface ToolPattern {
  id: string;
  name: string;
  category: string;
  description: string;
  actions: string[];
  dependencies: string[];
  template: string;
}

export interface Integration {
  id: string;
  name: string;
  displayName: string;
  dependencies: string[];
  envVars: string[];
  configTemplate: string;
}

export interface GenerationConfig {
  projectName: string;
  description: string;
  selectedPatterns: ToolPattern[];
  selectedIntegrations: Integration[];
  outputPath: string;
}

export interface AIAnalysis {
  toolCategories: string[];
  suggestedIntegrations: string[];
  customTools: Array<{
    name: string;
    description: string;
    category: string;
  }>;
}