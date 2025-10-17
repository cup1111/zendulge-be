// setup-project.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read extensions from extensions.json
const extensionsPath = path.join(__dirname, 'extensions.json');
let requiredExtensions = [];

try {
  const extensionsContent = fs.readFileSync(extensionsPath, 'utf8');
  const extensionsConfig = JSON.parse(extensionsContent);
  requiredExtensions = extensionsConfig.recommendations || [];
} catch (error) {
  console.error('Could not read extensions.json, using fallback list:', error.message);
  // Fallback list if extensions.json is not found
  requiredExtensions = [
    'esbenp.prettier-vscode',
    'dbaeumer.vscode-eslint',
    'ms-vscode.vscode-typescript-next',
    'eamodio.gitlens',
    'ms-vscode-remote.remote-containers',
    'formulahendry.auto-rename-tag'
  ];
}

// Install the required VS Code extensions
console.log('Installing required VS Code extensions...');
console.log(`Found ${requiredExtensions.length} extensions to install.`);

// Check if VS Code CLI is available
const checkCodeCommand = () => {
  return new Promise((resolve) => {
    exec('which code', (error) => {
      resolve(!error);
    });
  });
};

// Function to install extensions with promises for better error handling
const installExtension = (extension) => {
  return new Promise((resolve, reject) => {
    console.log(`Installing ${extension}...`);
    exec(`code --install-extension ${extension} --force`, (error, stdout, stderr) => {
      if (error) {
        if (error.message.includes('code: command not found')) {
          reject(new Error('VS Code CLI not found. Please install VS Code command line tools.'));
        } else {
          reject(error);
        }
        return;
      }
      if (stderr) {
        console.warn(`Warning for ${extension}: ${stderr}`);
      }
      console.log(`✅ Successfully installed ${extension}`);
      resolve(stdout);
    });
  });
};

// Install all extensions
const installAllExtensions = async () => {
  // First check if VS Code CLI is available
  const hasCodeCommand = await checkCodeCommand();
  
  if (!hasCodeCommand) {
    console.log('❌ VS Code CLI (code command) not found in PATH.');
    console.log('');
    console.log('🚀 Quick fix: Run the automatic fixer:');
    console.log('   npm run fix-vscode-cli');
    console.log('');
    console.log('Or manually install VS Code CLI:');
    console.log('1. Open VS Code');
    console.log('2. Press Cmd+Shift+P (macOS) or Ctrl+Shift+P (Windows/Linux)');
    console.log('3. Type "Shell Command: Install \'code\' command in PATH"');
    console.log('4. Select and run the command');
    console.log('5. Restart your terminal and run this script again');
    console.log('');
    console.log('Alternatively, you can install these extensions manually:');
    requiredExtensions.forEach(ext => console.log(`  - ${ext}`));
    return;
  }

  const results = [];
  for (const extension of requiredExtensions) {
    try {
      await installExtension(extension);
      results.push({ extension, status: 'success' });
    } catch (error) {
      results.push({ extension, status: 'failed', error: error.message });
    }
  }
  
  // Summary
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  
  console.log(`\n📊 Installation Summary:`);
  console.log(`✅ Successfully installed: ${successful} extensions`);
  if (failed > 0) {
    console.log(`❌ Failed to install: ${failed} extensions`);
    results.filter(r => r.status === 'failed').forEach(r => {
      console.log(`   - ${r.extension}: ${r.error}`);
    });
  }
};

// Run the installation
installAllExtensions().catch(console.error);

// Add a pre-commit hook for Git to enforce extension usage
const gitHooksDir = path.join(__dirname, '..', '.git', 'hooks');
if (fs.existsSync(path.join(__dirname, '..', '.git'))) {
  try {
    if (!fs.existsSync(gitHooksDir)) {
      fs.mkdirSync(gitHooksDir);
    }

    // Generate dynamic hook script based on extensions list
    const extensionChecks = requiredExtensions
      .map(ext => `code --list-extensions | grep -q "${ext}" || echo "Warning: ${ext} extension not installed"`)
      .join('\n');

    // Create a pre-commit hook script
    const preCommitPath = path.join(gitHooksDir, 'pre-commit');
    fs.writeFileSync(
      preCommitPath,
      `#!/bin/sh
# Check for required VS Code extensions
${extensionChecks}
`,
      { mode: 0o755 },
    );

    console.log('Git pre-commit hook created with extension checks');
  } catch (err) {
    console.error('Failed to set up Git hooks:', err);
  }
}

console.log('Project setup complete!');
