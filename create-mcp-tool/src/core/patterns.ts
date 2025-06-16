import { ToolPattern } from '../types.js';

export const TOOL_PATTERNS: Record<string, ToolPattern> = {
  api: {
    id: 'api',
    name: 'API Request Tools',
    category: 'api',
    description: 'Tools for making HTTP requests to external APIs',
    actions: ['get', 'post', 'put', 'delete'],
    dependencies: ['axios', 'zod'],
    template: 'api-tools.ts.hbs'
  },
  
  file: {
    id: 'file',
    name: 'File Operation Tools',
    category: 'file',
    description: 'Tools for reading, writing, and managing files',
    actions: ['read', 'write', 'list', 'delete'],
    dependencies: ['fs-extra', 'path'],
    template: 'file-tools.ts.hbs'
  },
  
  notification: {
    id: 'notification',
    name: 'Notification Tools',
    category: 'notification',
    description: 'Tools for sending notifications via various channels',
    actions: ['send', 'broadcast', 'schedule'],
    dependencies: ['nodemailer'],
    template: 'notification-tools.ts.hbs'
  }
};

export function getPatternsByCategories(categories: string[]): ToolPattern[] {
  return categories
    .map(category => TOOL_PATTERNS[category])
    .filter(Boolean);
}