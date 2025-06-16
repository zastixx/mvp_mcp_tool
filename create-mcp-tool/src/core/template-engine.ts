import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { GenerationConfig } from '../types.js';

export class TemplateEngine {
  private templatesPath: string;

  constructor(templatesPath: string) {
    this.templatesPath = templatesPath;
  }

  async generateProject(config: GenerationConfig): Promise<void> {
    const { outputPath, projectName, selectedPatterns, selectedIntegrations } = config;

    // Ensure directory structure
    await fs.ensureDir(outputPath);
    await fs.ensureDir(path.join(outputPath, 'src', 'tools'));
    await fs.ensureDir(path.join(outputPath, 'src', 'integrations'));

    // Generate core files
    await this.renderTemplate('base/package.json.hbs', path.join(outputPath, 'package.json'), {
      projectName,
      patterns: selectedPatterns,
      integrations: selectedIntegrations,
      dependencies: this.collectDependencies(selectedPatterns, selectedIntegrations)
    });

    await this.renderTemplate('base/tsconfig.json.hbs', path.join(outputPath, 'tsconfig.json'), {});

    await this.renderTemplate('base/src/index.ts.hbs', path.join(outputPath, 'src', 'index.ts'), {
      projectName,
      patterns: selectedPatterns,
      integrations: selectedIntegrations
    });

    // Generate tool files
    for (const pattern of selectedPatterns) {
      if (!pattern.template) {
        console.warn(chalk.yellow(`⚠️ Skipping pattern "${pattern.id}" (missing template)`));
        continue;
      }

      const outputFile = path.join(outputPath, 'src', 'tools', `${pattern.id}-tools.ts`);
      const templatePath = `base/src/tools/${pattern.template}`;

      await this.renderTemplate(templatePath, outputFile, {
        pattern,
        integrations: selectedIntegrations
      });
    }

    // Generate integration files
    for (const integration of selectedIntegrations) {
      if (!integration.configTemplate) {
        console.warn(chalk.yellow(`⚠️ Skipping integration "${integration.name}" (missing template)`));
        continue;
      }

      const outputFile = path.join(outputPath, 'src', 'integrations', `${integration.name}.ts`);
      const templatePath = `integrations/${integration.configTemplate}`;

      await this.renderTemplate(templatePath, outputFile, { integration });
    }

    // Generate README
    await this.renderTemplate('base/README.md.hbs', path.join(outputPath, 'README.md'), {
      projectName,
      patterns: selectedPatterns,
      integrations: selectedIntegrations,
      envVars: selectedIntegrations.flatMap(i => i.envVars || [])
    });

    // Generate .env.example
    const envVars = selectedIntegrations.flatMap(i => i.envVars || []);
    const envContent = envVars.map(v => `${v}=your_${v.toLowerCase()}_here`).join('\n');
    const envPath = path.join(outputPath, '.env.example');

    await fs.writeFile(envPath, envContent);
    console.log(chalk.gray(`✔ Created ${path.relative(process.cwd(), envPath)}`));
  }

  private async renderTemplate(templatePath: string, outputPath: string, data: any): Promise<void> {
    const fullTemplatePath = path.join(this.templatesPath, templatePath);

    if (!await fs.pathExists(fullTemplatePath)) {
      throw new Error(`Missing template: ${fullTemplatePath}`);
    }

    const templateContent = await fs.readFile(fullTemplatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);
    const rendered = template(data);

    await fs.outputFile(outputPath, rendered);
    console.log(chalk.gray(`✔ Created ${path.relative(process.cwd(), outputPath)}`));
  }

  private collectDependencies(patterns: any[], integrations: any[]): Record<string, string> {
    const deps: Record<string, string> = {
      '@modelcontextprotocol/sdk': '^0.4.0'
    };

    patterns.forEach(pattern => {
      if (Array.isArray(pattern.dependencies)) {
        pattern.dependencies.forEach((dep: string) => {
          deps[dep] = 'latest';
        });
      }
    });

    integrations.forEach(integration => {
      if (Array.isArray(integration.dependencies)) {
        integration.dependencies.forEach((dep: string) => {
          deps[dep] = 'latest';
        });
      }
    });

    return deps;
  }
}
