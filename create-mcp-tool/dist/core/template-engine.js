var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
export class TemplateEngine {
    constructor(templatesPath) {
        this.templatesPath = templatesPath;
    }
    generateProject(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const { outputPath, projectName, selectedPatterns, selectedIntegrations } = config;
            // Ensure directory structure
            yield fs.ensureDir(outputPath);
            yield fs.ensureDir(path.join(outputPath, 'src', 'tools'));
            yield fs.ensureDir(path.join(outputPath, 'src', 'integrations'));
            // Generate core files
            yield this.renderTemplate('base/package.json.hbs', path.join(outputPath, 'package.json'), {
                projectName,
                patterns: selectedPatterns,
                integrations: selectedIntegrations,
                dependencies: this.collectDependencies(selectedPatterns, selectedIntegrations)
            });
            yield this.renderTemplate('base/tsconfig.json.hbs', path.join(outputPath, 'tsconfig.json'), {});
            yield this.renderTemplate('base/src/index.ts.hbs', path.join(outputPath, 'src', 'index.ts'), {
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
                yield this.renderTemplate(templatePath, outputFile, {
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
                yield this.renderTemplate(templatePath, outputFile, { integration });
            }
            // Generate README
            yield this.renderTemplate('base/README.md.hbs', path.join(outputPath, 'README.md'), {
                projectName,
                patterns: selectedPatterns,
                integrations: selectedIntegrations,
                envVars: selectedIntegrations.flatMap(i => i.envVars || [])
            });
            // Generate .env.example
            const envVars = selectedIntegrations.flatMap(i => i.envVars || []);
            const envContent = envVars.map(v => `${v}=your_${v.toLowerCase()}_here`).join('\n');
            const envPath = path.join(outputPath, '.env.example');
            yield fs.writeFile(envPath, envContent);
            console.log(chalk.gray(`✔ Created ${path.relative(process.cwd(), envPath)}`));
        });
    }
    renderTemplate(templatePath, outputPath, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const fullTemplatePath = path.join(this.templatesPath, templatePath);
            if (!(yield fs.pathExists(fullTemplatePath))) {
                throw new Error(`Missing template: ${fullTemplatePath}`);
            }
            const templateContent = yield fs.readFile(fullTemplatePath, 'utf-8');
            const template = Handlebars.compile(templateContent);
            const rendered = template(data);
            yield fs.outputFile(outputPath, rendered);
            console.log(chalk.gray(`✔ Created ${path.relative(process.cwd(), outputPath)}`));
        });
    }
    collectDependencies(patterns, integrations) {
        const deps = {
            '@modelcontextprotocol/sdk': '^0.4.0'
        };
        patterns.forEach(pattern => {
            if (Array.isArray(pattern.dependencies)) {
                pattern.dependencies.forEach((dep) => {
                    deps[dep] = 'latest';
                });
            }
        });
        integrations.forEach(integration => {
            if (Array.isArray(integration.dependencies)) {
                integration.dependencies.forEach((dep) => {
                    deps[dep] = 'latest';
                });
            }
        });
        return deps;
    }
}
