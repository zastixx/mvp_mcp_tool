#!/usr/bin/env node

import { Command } from 'commander';
import { generateCommand } from './commands/generate.js';

const program = new Command();

program
  .name('create-mcp-tool')
  .description('AI-powered MCP server generator')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate MCP server from description')
  .option('-d, --description <desc>', 'Natural language description of tools needed')
  .option('-o, --output <path>', 'Output directory', './generated-mcp-server')
  .option('-n, --name <name>', 'Project name')
  .action(generateCommand);

program.parse();