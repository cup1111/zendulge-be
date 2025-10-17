#!/usr/bin/env node
// fix-vscode-cli.js - Script to automatically install VS Code CLI in PATH

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

console.log('🔧 VS Code CLI PATH Fixer');
console.log('========================');

// Check if VS Code CLI is already available
const checkCodeCommand = async () => {
  try {
    await execAsync('which code');
    return true;
  } catch (error) {
    return false;
  }
};

// Find VS Code installation
const findVSCodeInstallation = async () => {
  const possiblePaths = [
    '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',
    '/usr/local/bin/code',
    '/opt/homebrew/bin/code',
    // Add more possible paths for different systems
  ];

  for (const codePath of possiblePaths) {
    if (fs.existsSync(codePath)) {
      console.log(`✅ Found VS Code at: ${codePath}`);
      return codePath;
    }
  }

  // Try to find via spotlight on macOS
  try {
    const { stdout } = await execAsync('mdfind "kMDItemCFBundleIdentifier == \'com.microsoft.VSCode\'"');
    const vscodeAppPath = stdout.trim().split('\n')[0];
    if (vscodeAppPath && fs.existsSync(vscodeAppPath)) {
      const codePath = path.join(vscodeAppPath, 'Contents/Resources/app/bin/code');
      if (fs.existsSync(codePath)) {
        console.log(`✅ Found VS Code via Spotlight at: ${codePath}`);
        return codePath;
      }
    }
  } catch (error) {
    // Spotlight search failed, continue
  }

  return null;
};

// Create symlink to make code command available
const createSymlink = async (vscodePath) => {
  const symlinkPath = '/usr/local/bin/code';
  
  try {
    // Check if /usr/local/bin exists, create if not
    const binDir = '/usr/local/bin';
    if (!fs.existsSync(binDir)) {
      console.log('📁 Creating /usr/local/bin directory...');
      await execAsync(`sudo mkdir -p ${binDir}`);
    }

    // Remove existing symlink if it exists
    if (fs.existsSync(symlinkPath)) {
      console.log('🗑️  Removing existing code symlink...');
      await execAsync(`sudo rm ${symlinkPath}`);
    }

    // Create new symlink
    console.log('🔗 Creating symlink...');
    await execAsync(`sudo ln -s "${vscodePath}" ${symlinkPath}`);
    
    console.log('✅ Symlink created successfully!');
    return true;
  } catch (error) {
    console.error('❌ Failed to create symlink:', error.message);
    return false;
  }
};

// Add to shell profile
const addToShellProfile = async (vscodePath) => {
  const homeDir = process.env.HOME;
  const profiles = [
    path.join(homeDir, '.zshrc'),
    path.join(homeDir, '.bash_profile'),
    path.join(homeDir, '.bashrc'),
  ];

  const exportLine = `export PATH="$PATH:${path.dirname(vscodePath)}"`;
  
  for (const profile of profiles) {
    if (fs.existsSync(profile)) {
      try {
        const content = fs.readFileSync(profile, 'utf8');
        if (!content.includes(exportLine)) {
          console.log(`📝 Adding to ${profile}...`);
          fs.appendFileSync(profile, `\n# VS Code CLI\n${exportLine}\n`);
        } else {
          console.log(`✅ ${profile} already contains VS Code PATH`);
        }
      } catch (error) {
        console.error(`❌ Failed to update ${profile}:`, error.message);
      }
    }
  }
};

// Main function
const main = async () => {
  try {
    // Check if code command is already available
    if (await checkCodeCommand()) {
      console.log('✅ VS Code CLI is already available in PATH!');
      console.log('You can now run: npm run setup-vscode-plugin');
      return;
    }

    console.log('🔍 Searching for VS Code installation...');
    
    // Find VS Code installation
    const vscodePath = await findVSCodeInstallation();
    
    if (!vscodePath) {
      console.log('❌ VS Code installation not found!');
      console.log('');
      console.log('Please install VS Code first:');
      console.log('1. Download from: https://code.visualstudio.com/');
      console.log('2. Install VS Code');
      console.log('3. Run this script again');
      return;
    }

    console.log('📋 Choose installation method:');
    console.log('1. Create system-wide symlink (recommended, requires sudo)');
    console.log('2. Add to shell profile');
    console.log('3. Manual instructions');

    // For automation, let's try the symlink method first
    console.log('🚀 Attempting symlink method...');
    
    const symlinkSuccess = await createSymlink(vscodePath);
    
    if (symlinkSuccess) {
      // Verify the installation worked
      if (await checkCodeCommand()) {
        console.log('🎉 Success! VS Code CLI is now available in PATH!');
        console.log('You can now run: npm run setup-vscode-plugin');
      } else {
        console.log('⚠️  Symlink created but code command still not found.');
        console.log('You may need to restart your terminal.');
      }
    } else {
      console.log('📝 Falling back to shell profile method...');
      await addToShellProfile(vscodePath);
      console.log('✅ Added VS Code to shell profile.');
      console.log('Please restart your terminal or run: source ~/.zshrc');
      console.log('Then run: npm run setup-vscode-plugin');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('Manual installation instructions:');
    console.log('1. Open VS Code');
    console.log('2. Press Cmd+Shift+P (macOS) or Ctrl+Shift+P (Windows/Linux)');
    console.log('3. Type "Shell Command: Install \'code\' command in PATH"');
    console.log('4. Select and run the command');
    console.log('5. Restart your terminal');
  }
};

// Run the script
main();
