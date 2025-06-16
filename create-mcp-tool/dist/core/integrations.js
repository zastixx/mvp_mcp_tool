export const INTEGRATIONS = {
    github: {
        id: 'github',
        name: 'github',
        displayName: 'GitHub API',
        dependencies: ['@octokit/rest'],
        envVars: ['GITHUB_TOKEN'],
        configTemplate: 'github.ts.hbs'
    },
    slack: {
        id: 'slack',
        name: 'slack',
        displayName: 'Slack API',
        dependencies: ['@slack/web-api'],
        envVars: ['SLACK_BOT_TOKEN'],
        configTemplate: 'slack.ts.hbs'
    }
};
export function getIntegrationsByIds(ids) {
    return ids
        .map(id => INTEGRATIONS[id])
        .filter(Boolean);
}
