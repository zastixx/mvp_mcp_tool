import axios from 'axios';
import { z } from 'zod';

export class ApiTools {
  static getToolDefinitions() {
    return [
      {
        name: 'api_request',
        description: 'Make HTTP requests to external APIs',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'API endpoint URL' },
            method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'], description: 'HTTP method' },
            headers: { type: 'object', description: 'Request headers' },
            data: { type: 'object', description: 'Request body data' },
          },
          required: ['url', 'method'],
        },
      },
    ];
  }

  static canHandleTool(name: string): boolean {
    return name === 'api_request';
  }

  static async handleTool(name: string, args: any) {
    switch (name) {
      case 'api_request':
        return await this.makeApiRequest(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private static async makeApiRequest(args: any) {
    const { url, method, headers = {}, data } = args;

    try {
      const response = await axios({
        url,
        method,
        headers,
        data,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: response.status,
              statusText: response.statusText,
              data: response.data,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `API request failed: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
}