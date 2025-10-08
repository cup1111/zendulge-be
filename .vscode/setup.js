// setup-project.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Install the required VS Code extensions
console.log('Installing required VS Code extensions...');

const requiredExtensions = [
  'dbaeumer.vscode-eslint',
  'esbenp.prettier-vscode',
  'eamodio.gitlens',
  'sonarsource.sonarlint-vscode',
];

// Install each extension
requiredExtensions.forEach((extension) => {
  console.log(`Installing ${extension}...`);
  exec(`code --install-extension ${extension} --force`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error installing ${extension}: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`${stdout}`);
  });
});

// Add a pre-commit hook for Git to enforce extension usage
const gitHooksDir = path.join(__dirname, '.git', 'hooks');
if (fs.existsSync(path.join(__dirname, '.git'))) {
  try {
    if (!fs.existsSync(gitHooksDir)) {
      fs.mkdirSync(gitHooksDir);
    }

    // Create a pre-commit hook script
    const preCommitPath = path.join(gitHooksDir, 'pre-commit');
    fs.writeFileSync(
      preCommitPath,
      `#!/bin/sh
# Check for required VS Code extensions
code --list-extensions | grep -q "dbaeumer.vscode-eslint" || echo "Warning: ESLint extension not installed"
code --list-extensions | grep -q "esbenp.prettier-vscode" || echo "Warning: Prettier extension not installed"
code --list-extensions | grep -q "eamodio.gitlens" || echo "Warning: GitLens extension not installed"
code --list-extensions | grep -q "sonarsource.sonarlint-vscode" || echo "Warning: SonarLint extension not installed"
`,
      { mode: 0o755 },
    );

    console.log('Git pre-commit hook created');
  } catch (err) {
    console.error('Failed to set up Git hooks:', err);
  }
}

console.log('Project setup complete!');
