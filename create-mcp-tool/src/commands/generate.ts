import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { fileURLToPath } from 'url';
import { AIGenerator } from '../core/ai-generator.js';
import { TemplateEngine } from '../core/template-engine.js';
import { getPatternsByCategories } from '../core/patterns.js';
import { getIntegrationsByIds } from '../core/integrations.js';
import { GenerationConfig } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateCommand(options: any) {
  console.log(chalk.blue.bold('🤖 create-mcp-tool - AI-Powered MCP Server Generator\n'));

  let description = options.description;
  let projectName = options.name;
  const outputPath = path.resolve(options.output);

  // Get description if not provided
  if (!description) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Describe the MCP tools you need:',
        validate: (input) => input.length > 10 || 'Please provide a detailed description'
      }
    ]);
    description = answers.description;
  }

  // Get project name if not provided
  if (!projectName) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: path.basename(outputPath)
      }
    ]);
    projectName = answers.projectName;
  }

  // AI Analysis
  const spinner = ora('🔍 Analyzing your requirements with AI...').start();

  try {
    const apiKey = process.env.TOGETHER_API_KEY;
    if (!apiKey) {
      throw new Error('TOGETHER_API_KEY environment variable is required');
    }

    const aiGenerator = new AIGenerator(apiKey);
    const analysis = await aiGenerator.analyzeDescription(description);

    spinner.succeed('✅ Analysis completed');

    // Show analysis results
    console.log(chalk.green('\n📋 Analysis Results:'));
    console.log(`Tool Categories: ${analysis.toolCategories.join(', ')}`);
    console.log(`Suggested Integrations: ${analysis.suggestedIntegrations.join(', ')}`);
    console.log(`Custom Tools: ${analysis.customTools.length} detected\n`);

    // Get patterns and integrations
    const selectedPatterns = getPatternsByCategories(analysis.toolCategories);
    const selectedIntegrations = getIntegrationsByIds(analysis.suggestedIntegrations);

    // Confirm with user
    const confirm = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Generate MCP server with these configurations?',
        default: true
      }
    ]);

    if (!confirm.proceed) {
      console.log(chalk.yellow('Generation cancelled.'));
      return;
    }

    // Generate project
    const generateSpinner = ora('🚀 Generating MCP server...').start();

    const config: GenerationConfig = {
      projectName,
      description,
      selectedPatterns,
      selectedIntegrations,
      outputPath
    };

    // ✅ Use correct absolute path to /src/templates
    const templatesPath = path.resolve(__dirname, '../../src/templates');
    const templateEngine = new TemplateEngine(templatesPath);

    await templateEngine.generateProject(config);

    generateSpinner.succeed('✅ MCP server generated successfully!');

    // Show next steps
    console.log(chalk.green.bold('\n🎉 Success! Your MCP server has been generated.\n'));
    console.log(chalk.blue('Next steps:'));
    console.log(`1. cd ${path.relative(process.cwd(), outputPath)}`);
    console.log('2. npm install');
    console.log('3. Copy .env.example to .env and fill in your API keys');
    console.log('4. npm run build');
    console.log('5. npm start');

  } catch (error) {
    spinner.fail('❌ Generation failed');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}
