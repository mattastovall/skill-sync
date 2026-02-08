#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const AI_TOOLS = {
  cursor: {
    dir: '.cursor',
    skillsDir: 'skills',
    subagentsDir: 'subagents',
    configFile: 'settings.json'
  },
  claude: {
    dir: '.claude',
    skillsDir: 'skills',
    subagentsDir: 'subagents',
    configFile: 'claude.json'
  },
  codex: {
    dir: '.codex',
    skillsDir: 'skills',
    subagentsDir: 'subagents',
    configFile: 'config.json'
  },
  windsurf: {
    dir: '.windsurf',
    skillsDir: 'skills',
    subagentsDir: 'subagents',
    configFile: 'settings.json'
  },
  aider: {
    dir: '.aider',
    skillsDir: 'skills',
    subagentsDir: 'subagents',
    configFile: 'aider.conf.yml'
  },
  opencode: {
    dir: '.opencode',
    skillsDir: 'skills',
    subagentsDir: 'subagents',
    configFile: 'settings.json'
  }
};

function showHelp() {
  console.log(`
Skill Sync - Sync skills and subagents between AI tool directories

Usage:
  npx @mattastovall/skill-sync [command] [options]
  npx @mattastovall/skill-sync          # Sync all tools (default)

Commands:
  sync                      Sync all tools with each other (bidirectional) [default]
  setup                     Auto-detect and setup all installed AI tools
  mirror <source> <target>  Mirror skills from source to target tool
  list                      List detected AI tool directories
  init <tool>               Initialize a new AI tool directory structure
  help                      Show this help message

Options:
  --skills-only             Only sync skills (not subagents)
  --subagents-only          Only sync subagents (not skills)
  --dry-run                 Show what would be synced without making changes
  --force                   Overwrite existing files without prompting
  -v, --verbose             Show detailed output

Examples:
  npx @mattastovall/skill-sync                          # Sync all tools (default)
  npx @mattastovall/skill-sync --dry-run                # Preview sync
  npx @mattastovall/skill-sync setup                    # Auto-setup all installed tools
  npx @mattastovall/skill-sync mirror cursor claude     # Mirror Cursor skills to Claude
  npx @mattastovall/skill-sync list                    # Show detected directories
  npx @mattastovall/skill-sync init windsurf           # Create .windsurf structure

Supported Tools:
  ${Object.keys(AI_TOOLS).join(', ')}
`);
}

function detectTools(rootPath = process.cwd()) {
  const detected = {};
  
  for (const [name, config] of Object.entries(AI_TOOLS)) {
    const toolPath = path.join(rootPath, config.dir);
    if (fs.existsSync(toolPath)) {
      detected[name] = {
        path: toolPath,
        ...config,
        skills: [],
        subagents: []
      };
      
      // Detect skills (files AND directories)
      const skillsPath = path.join(toolPath, config.skillsDir);
      if (fs.existsSync(skillsPath)) {
        const skillsItems = fs.readdirSync(skillsPath);
        detected[name].skills = skillsItems
          .map(item => {
            const itemPath = path.join(skillsPath, item);
            const stats = fs.statSync(itemPath);
            // Include files ending in .md or .json
            if (stats.isFile() && (item.endsWith('.md') || item.endsWith('.json'))) {
              return itemPath;
            }
            // Include directories (for Cursor-style skills)
            if (stats.isDirectory()) {
              return itemPath;
            }
            return null;
          })
          .filter(item => item !== null);
      }
      
      // Detect subagents (files AND directories)
      const subagentsPath = path.join(toolPath, config.subagentsDir);
      if (fs.existsSync(subagentsPath)) {
        const subagentItems = fs.readdirSync(subagentsPath);
        detected[name].subagents = subagentItems
          .map(item => {
            const itemPath = path.join(subagentsPath, item);
            const stats = fs.statSync(itemPath);
            // Include files ending in .md or .json
            if (stats.isFile() && (item.endsWith('.md') || item.endsWith('.json'))) {
              return itemPath;
            }
            // Include directories (for subdirectory-style subagents)
            if (stats.isDirectory()) {
              return itemPath;
            }
            return null;
          })
          .filter(item => item !== null);
      }
    }
  }
  
  return detected;
}

function showHelp() {
  console.log(`
Skill Sync - Sync skills and subagents between AI tool directories

Usage:
  npx @mattastovall/skill-sync [command] [options]
  npx @mattastovall/skill-sync          # Sync all tools (default)

Commands:
  sync                      Sync all tools with each other (bidirectional) [default]
  list                      List detected AI tool directories and their skills
  global                    Manage global skills (add, list, install)
  setup                     Auto-detect and setup all installed AI tools
  mirror <source> <target>  Mirror skills from source to target tool
  init <tool>               Initialize a new AI tool directory structure
  help                      Show this help message

Global Commands:
  skill-sync global list                    # List all global skills
  skill-sync global add <skill-name>        # Add current directory skill to global
  skill-sync global add <skill-name> <path> # Add skill from path to global
  skill-sync global install <skill-name>    # Install global skill to all tools
  skill-sync global install <skill-name> <tool> # Install to specific tool

Options:
  --skills-only             Only sync skills (not subagents)
  --subagents-only          Only sync subagents (not skills)
  --dry-run                 Show what would be synced without making changes
  --force                   Overwrite existing files without prompting
  -v, --verbose             Show detailed output

Examples:
  npx @mattastovall/skill-sync                          # Sync all tools (default)
  npx @mattastovall/skill-sync --dry-run                # Preview sync
  npx @mattastovall/skill-sync list                     # List all tools and skills
  npx @mattastovall/skill-sync global list               # List global skills
  npx @mattastovall/skill-sync global add my-skill       # Add skill to global
  npx @mattastovall/skill-sync global install my-skill  # Install to all tools
  npx @mattastovall/skill-sync setup                    # Auto-setup all installed tools
  npx @mattastovall/skill-sync mirror cursor claude     # Mirror Cursor skills to Claude
  npx @mattastovall/skill-sync init windsurf           # Create .windsurf structure

Supported Tools:
  ${Object.keys(AI_TOOLS).join(', ')}
`);
}

function initTool(toolName) {
  if (!AI_TOOLS[toolName]) {
    console.error(`Error: Unknown tool "${toolName}"`);
    console.error(`Supported tools: ${Object.keys(AI_TOOLS).join(', ')}`);
    process.exit(1);
  }
  
  const config = AI_TOOLS[toolName];
  const toolPath = path.join(process.cwd(), config.dir);
  
  if (fs.existsSync(toolPath)) {
    console.log(`Directory ${config.dir} already exists.`);
  } else {
    fs.mkdirSync(toolPath, { recursive: true });
    console.log(`Created directory: ${config.dir}`);
  }
  
  // Create skills directory
  const skillsPath = path.join(toolPath, config.skillsDir);
  if (!fs.existsSync(skillsPath)) {
    fs.mkdirSync(skillsPath, { recursive: true });
    console.log(`Created directory: ${config.dir}/${config.skillsDir}`);
  }
  
  // Create subagents directory
  const subagentsPath = path.join(toolPath, config.subagentsDir);
  if (!fs.existsSync(subagentsPath)) {
    fs.mkdirSync(subagentsPath, { recursive: true });
    console.log(`Created directory: ${config.dir}/${config.subagentsDir}`);
  }
  
  // Create config file if it doesn't exist
  const configPath = path.join(toolPath, config.configFile);
  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      name: toolName,
      version: "1.0.0",
      created: new Date().toISOString()
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log(`Created config file: ${config.dir}/${config.configFile}`);
  }
  
  console.log(`\nInitialized ${toolName} structure successfully!`);
}

function copyDirectory(source, target, options = {}) {
  // Create target directory if it doesn't exist
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  // Read source directory
  const items = fs.readdirSync(source);
  
  for (const item of items) {
    const sourcePath = path.join(source, item);
    const targetPath = path.join(target, item);
    const stats = fs.statSync(sourcePath);
    
    if (stats.isDirectory()) {
      // Recursively copy subdirectory
      copyDirectory(sourcePath, targetPath, options);
    } else {
      // Copy file
      if (!fs.existsSync(targetPath) || options.force) {
        fs.copyFileSync(sourcePath, targetPath);
      }
    }
  }
}

function mirror(sourceTool, targetTool, options = {}) {
  if (!AI_TOOLS[sourceTool]) {
    console.error(`Error: Unknown source tool "${sourceTool}"`);
    process.exit(1);
  }
  
  if (!AI_TOOLS[targetTool]) {
    console.error(`Error: Unknown target tool "${targetTool}"`);
    process.exit(1);
  }
  
  const detected = detectTools();
  
  if (!detected[sourceTool]) {
    console.error(`Error: Source tool "${sourceTool}" not found in current directory`);
    console.error(`Run "ai-skills-mirror init ${sourceTool}" to create it.`);
    process.exit(1);
  }
  
  // Initialize target if it doesn't exist
  if (!detected[targetTool]) {
    if (options.verbose) {
      console.log(`Target tool "${targetTool}" not found. Initializing...`);
    }
    initTool(targetTool);
    detected[targetTool] = detectTools()[targetTool];
  }
  
  const source = detected[sourceTool];
  const target = detected[targetTool];
  
  let filesToSync = [];
  
  // Collect skills
  if (!options.subagentsOnly) {
    for (const skillPath of source.skills) {
      const filename = path.basename(skillPath);
      const targetPath = path.join(target.path, AI_TOOLS[targetTool].skillsDir, filename);
      filesToSync.push({
        source: skillPath,
        target: targetPath,
        type: 'skill',
        name: filename
      });
    }
  }
  
  // Collect subagents
  if (!options.skillsOnly) {
    for (const subagentPath of source.subagents) {
      const filename = path.basename(subagentPath);
      const targetPath = path.join(target.path, AI_TOOLS[targetTool].subagentsDir, filename);
      filesToSync.push({
        source: subagentPath,
        target: targetPath,
        type: 'subagent',
        name: filename
      });
    }
  }
  
  if (filesToSync.length === 0) {
    console.log(`No files to mirror from ${sourceTool} to ${targetTool}`);
    return;
  }
  
  console.log(`\nMirroring from ${sourceTool} to ${targetTool}:\n`);
  
  for (const file of filesToSync) {
    const exists = fs.existsSync(file.target);
    
    if (options.dryRun) {
      const action = exists ? 'Would update' : 'Would create';
      console.log(`  [DRY RUN] ${action}: ${file.type}/${file.name}`);
      continue;
    }
    
    if (exists && !options.force) {
      console.log(`  Skipping (exists): ${file.type}/${file.name}`);
      continue;
    }
    
    // Check if source is a file or directory
    const sourceStats = fs.statSync(file.source);
    
    if (sourceStats.isDirectory()) {
      // Copy directory recursively
      copyDirectory(file.source, file.target, options);
      const action = exists ? 'Updated' : 'Created';
      console.log(`  ${action}: ${file.type}/${file.name}/ (directory)`);
    } else {
      // Copy file
      const targetDir = path.dirname(file.target);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      fs.copyFileSync(file.source, file.target);
      const action = exists ? 'Updated' : 'Created';
      console.log(`  ${action}: ${file.type}/${file.name}`);
    }
  }
  
  console.log(`\nMirror complete!`);
}

function syncAll(options = {}) {
  const detected = detectTools();
  const tools = Object.keys(detected);
  
  if (tools.length < 2) {
    console.log('Need at least 2 AI tools to sync. Detected:', tools.length);
    return;
  }
  
  console.log(`\nSyncing ${tools.length} tools: ${tools.join(', ')}\n`);
  
  // Sync each tool with every other tool
  for (let i = 0; i < tools.length; i++) {
    for (let j = 0; j < tools.length; j++) {
      if (i !== j) {
        if (options.verbose) {
          console.log(`\n--- Mirroring ${tools[i]} -> ${tools[j]} ---`);
        }
        mirror(tools[i], tools[j], options);
      }
    }
  }
  
  console.log('\nSync complete across all tools!');
}

function detectInstalledTools() {
  const installed = [];
  const { execSync } = require('child_process');
  
  // Check for CLI tools
  const cliTools = {
    cursor: ['cursor', 'cursor-nightly'],
    claude: ['claude'],
    codex: ['codex'],
    windsurf: ['windsurf'],
    aider: ['aider'],
    opencode: ['opencode']
  };
  
  for (const [tool, commands] of Object.entries(cliTools)) {
    for (const cmd of commands) {
      try {
        execSync(`which ${cmd}`, { stdio: 'ignore' });
        if (!installed.includes(tool)) {
          installed.push(tool);
        }
        break;
      } catch (e) {
        // Command not found, try next
      }
    }
  }
  
  return installed;
}

function setup(options = {}) {
  console.log('\n🔍 Detecting installed AI tools...\n');
  
  const installed = detectInstalledTools();
  
  if (installed.length === 0) {
    console.log('❌ No AI tools detected on your system.');
    console.log('\nDetected tools are checked by looking for these CLI commands:');
    console.log('  - cursor, cursor-nightly');
    console.log('  - claude');
    console.log('  - codex');
    console.log('  - windsurf');
    console.log('  - aider');
    console.log('  - opencode');
    console.log('\nYou can still manually initialize tools with:');
    console.log('  skill-sync init <tool-name>');
    return;
  }
  
  console.log(`✅ Found ${installed.length} installed tool(s): ${installed.join(', ')}\n`);
  
  if (options.dryRun) {
    console.log('🔍 [DRY RUN] Would initialize directories for:');
    for (const tool of installed) {
      console.log(`   - ${tool} (.${AI_TOOLS[tool].dir}/)`);
    }
    console.log('\nRun without --dry-run to actually create the directories.\n');
    return;
  }
  
  console.log('📁 Initializing directories...\n');
  
  for (const tool of installed) {
    console.log(`Setting up ${tool}...`);
    initTool(tool);
    console.log('');
  }
  
  console.log('✨ Setup complete!');
  console.log('\nNext steps:');
  console.log('  1. Add skills to one of your tools');
  console.log('  2. Run: skill-sync sync');
  console.log('  3. All your tools will share the same skills!');
  console.log('\nOr run: skill-sync list  to see your setup');
}

// Parse command line arguments
const args = process.argv.slice(2);

// Parse options
const options = {
  skillsOnly: args.includes('--skills-only'),
  subagentsOnly: args.includes('--subagents-only'),
  dryRun: args.includes('--dry-run'),
  force: args.includes('--force'),
  verbose: args.includes('-v') || args.includes('--verbose')
};

// Remove options from args for command processing
const cleanArgs = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));

// Get command (first non-option argument)
const command = cleanArgs[0];

// Global skills directory
const GLOBAL_SKILLS_DIR = path.join(require('os').homedir(), '.skill-sync', 'global-skills');

function ensureGlobalSkillsDir() {
  if (!fs.existsSync(GLOBAL_SKILLS_DIR)) {
    fs.mkdirSync(GLOBAL_SKILLS_DIR, { recursive: true });
  }
}

function listGlobalSkills() {
  ensureGlobalSkillsDir();
  const items = fs.readdirSync(GLOBAL_SKILLS_DIR);
  
  console.log('\n📦 Global Skills:\n');
  
  if (items.length === 0) {
    console.log('  No global skills found.');
    console.log('\n  Add a global skill with:');
    console.log('    skill-sync global add <skill-name> [path]');
    console.log('\n  This will copy the skill from current directory or specified path');
    console.log('  to the global skills directory for use across all projects.\n');
    return;
  }
  
  for (const item of items) {
    const itemPath = path.join(GLOBAL_SKILLS_DIR, item);
    const stats = fs.statSync(itemPath);
    if (stats.isDirectory()) {
      console.log(`  📁 ${item}/`);
    } else {
      console.log(`  📄 ${item}`);
    }
  }
  console.log();
}

function addGlobalSkill(skillName, sourcePath) {
  ensureGlobalSkillsDir();
  
  // If no source path provided, look in current directory's .cursor/skills
  if (!sourcePath) {
    const cursorSkillPath = path.join(process.cwd(), '.cursor', 'skills', skillName);
    const claudeSkillPath = path.join(process.cwd(), '.claude', 'skills', skillName);
    
    if (fs.existsSync(cursorSkillPath)) {
      sourcePath = cursorSkillPath;
    } else if (fs.existsSync(claudeSkillPath)) {
      sourcePath = claudeSkillPath;
    } else {
      console.error(`❌ Skill "${skillName}" not found in current directory.`);
      console.error('   Looked in:');
      console.error(`   - ${cursorSkillPath}`);
      console.error(`   - ${claudeSkillPath}`);
      console.error('\n   Provide a path to the skill:');
      console.error(`   skill-sync global add ${skillName} /path/to/skill`);
      process.exit(1);
    }
  }
  
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Source path does not exist: ${sourcePath}`);
    process.exit(1);
  }
  
  const targetPath = path.join(GLOBAL_SKILLS_DIR, skillName);
  
  if (fs.existsSync(targetPath)) {
    console.log(`⚠️  Global skill "${skillName}" already exists.`);
    console.log(`   Use --force to overwrite.`);
    return;
  }
  
  const stats = fs.statSync(sourcePath);
  if (stats.isDirectory()) {
    copyDirectory(sourcePath, targetPath, options);
    console.log(`✅ Added global skill: ${skillName}/ (directory)`);
  } else {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✅ Added global skill: ${skillName}`);
  }
  console.log(`📍 Location: ${targetPath}\n`);
}

function installGlobalSkill(skillName, targetTool) {
  ensureGlobalSkillsDir();
  
  const globalSkillPath = path.join(GLOBAL_SKILLS_DIR, skillName);
  
  if (!fs.existsSync(globalSkillPath)) {
    console.error(`❌ Global skill "${skillName}" not found.`);
    console.log('\n📦 Available global skills:');
    listGlobalSkills();
    process.exit(1);
  }
  
  const detected = detectTools();
  const tools = targetTool ? [targetTool] : Object.keys(detected);
  
  if (tools.length === 0) {
    console.error('❌ No AI tools detected in current directory.');
    console.log('   Run: skill-sync setup');
    process.exit(1);
  }
  
  console.log(`\n📦 Installing global skill "${skillName}"...\n`);
  
  for (const tool of tools) {
    if (!detected[tool]) {
      console.log(`  ⚠️  Tool "${tool}" not found, skipping...`);
      continue;
    }
    
    const targetPath = path.join(detected[tool].path, AI_TOOLS[tool].skillsDir, skillName);
    
    if (fs.existsSync(targetPath)) {
      console.log(`  ⚠️  ${tool}: Already exists, skipping`);
      continue;
    }
    
    const stats = fs.statSync(globalSkillPath);
    if (stats.isDirectory()) {
      copyDirectory(globalSkillPath, targetPath, {});
      console.log(`  ✅ ${tool}: Installed ${skillName}/`);
    } else {
      fs.copyFileSync(globalSkillPath, targetPath);
      console.log(`  ✅ ${tool}: Installed ${skillName}`);
    }
  }
  
  console.log('\n✅ Installation complete!');
}

function listTools() {
  const detected = detectTools();
  
  console.log('\nDetected AI Tool Directories:\n');
  
  if (Object.keys(detected).length === 0) {
    console.log('  No AI tool directories found in current directory.');
    console.log('  Run "ai-skills-mirror init <tool>" to create one.\n');
    return;
  }
  
  for (const [name, info] of Object.entries(detected)) {
    console.log(`  ${name}:`);
    console.log(`    Path: ${info.path}`);
    console.log(`    Skills: ${info.skills.length} files`);
    if (info.skills.length > 0) {
      for (const skill of info.skills) {
        const skillName = path.basename(skill);
        console.log(`      - ${skillName}`);
      }
    }
    console.log(`    Subagents: ${info.subagents.length} files`);
    if (info.subagents.length > 0) {
      for (const subagent of info.subagents) {
        const subagentName = path.basename(subagent);
        console.log(`      - ${subagentName}`);
      }
    }
    console.log();
  }
}

switch (command) {
  case 'mirror':
    if (cleanArgs.length < 3) {
      console.error('Usage: ai-skills-mirror mirror <source> <target>');
      console.error('Example: ai-skills-mirror mirror cursor claude');
      process.exit(1);
    }
    mirror(cleanArgs[1], cleanArgs[2], options);
    break;
    
  case 'sync':
    syncAll(options);
    break;

  case 'setup':
    setup(options);
    break;

  case 'list':
    listTools();
    break;
    
  case 'init':
    if (cleanArgs.length < 2) {
      console.error('Usage: ai-skills-mirror init <tool>');
      console.error('Supported tools: cursor, claude, codex, windsurf, aider');
      process.exit(1);
    }
    initTool(cleanArgs[1]);
    break;

  case 'global':
    if (cleanArgs.length < 2) {
      console.error('Usage: skill-sync global <subcommand>');
      console.error('\nSubcommands:');
      console.error('  list                           List all global skills');
      console.error('  add <skill-name> [path]        Add skill to global');
      console.error('  install <skill-name> [tool]    Install global skill to tool(s)');
      process.exit(1);
    }
    
    const subcommand = cleanArgs[1];
    
    switch (subcommand) {
      case 'list':
        listGlobalSkills();
        break;
        
      case 'add':
        if (cleanArgs.length < 3) {
          console.error('Usage: skill-sync global add <skill-name> [path]');
          process.exit(1);
        }
        addGlobalSkill(cleanArgs[2], cleanArgs[3]);
        break;
        
      case 'install':
        if (cleanArgs.length < 3) {
          console.error('Usage: skill-sync global install <skill-name> [tool]');
          process.exit(1);
        }
        installGlobalSkill(cleanArgs[2], cleanArgs[3]);
        break;
        
      default:
        console.error(`Unknown global subcommand: ${subcommand}`);
        console.error('Run "skill-sync global" for usage information.');
        process.exit(1);
    }
    break;

  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;

  default:
    // No command provided - run sync to sync all tools
    if (!command) {
      syncAll(options);
    } else {
      console.error(`Unknown command: ${command}`);
      console.error('Run "skill-sync help" for usage information.');
      process.exit(1);
    }
    break;
}

function listGlobalSkills() {
  ensureGlobalSkillsDir();
  const items = fs.readdirSync(GLOBAL_SKILLS_DIR);
  
  console.log('\n📦 Global Skills:\n');
  
  if (items.length === 0) {
    console.log('  No global skills found.');
    console.log('\n  Add a global skill with:');
    console.log('    skill-sync global add <skill-name> [path]');
    console.log('\n  This will copy the skill from current directory or specified path');
    console.log('  to the global skills directory for use across all projects.\n');
    return;
  }
  
  for (const item of items) {
    const itemPath = path.join(GLOBAL_SKILLS_DIR, item);
    const stats = fs.statSync(itemPath);
    if (stats.isDirectory()) {
      console.log(`  📁 ${item}/`);
    } else {
      console.log(`  📄 ${item}`);
    }
  }
  console.log();
}

function addGlobalSkill(skillName, sourcePath) {
  ensureGlobalSkillsDir();
  
  // If no source path provided, look in current directory's .cursor/skills
  if (!sourcePath) {
    const cursorSkillPath = path.join(process.cwd(), '.cursor', 'skills', skillName);
    const claudeSkillPath = path.join(process.cwd(), '.claude', 'skills', skillName);
    
    if (fs.existsSync(cursorSkillPath)) {
      sourcePath = cursorSkillPath;
    } else if (fs.existsSync(claudeSkillPath)) {
      sourcePath = claudeSkillPath;
    } else {
      console.error(`❌ Skill "${skillName}" not found in current directory.`);
      console.error('   Looked in:');
      console.error(`   - ${cursorSkillPath}`);
      console.error(`   - ${claudeSkillPath}`);
      console.error('\n   Provide a path to the skill:');
      console.error(`   skill-sync global add ${skillName} /path/to/skill`);
      process.exit(1);
    }
  }
  
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Source path does not exist: ${sourcePath}`);
    process.exit(1);
  }
  
  const targetPath = path.join(GLOBAL_SKILLS_DIR, skillName);
  
  if (fs.existsSync(targetPath)) {
    console.log(`⚠️  Global skill "${skillName}" already exists.`);
    console.log(`   Use --force to overwrite.`);
    return;
  }
  
  const stats = fs.statSync(sourcePath);
  if (stats.isDirectory()) {
    copyDirectory(sourcePath, targetPath, options);
    console.log(`✅ Added global skill: ${skillName}/ (directory)`);
  } else {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✅ Added global skill: ${skillName}`);
  }
  console.log(`📍 Location: ${targetPath}\n`);
}

function installGlobalSkill(skillName, targetTool) {
  ensureGlobalSkillsDir();
  
  const globalSkillPath = path.join(GLOBAL_SKILLS_DIR, skillName);
  
  if (!fs.existsSync(globalSkillPath)) {
    console.error(`❌ Global skill "${skillName}" not found.`);
    console.log('\n📦 Available global skills:');
    listGlobalSkills();
    process.exit(1);
  }
  
  const detected = detectTools();
  const tools = targetTool ? [targetTool] : Object.keys(detected);
  
  if (tools.length === 0) {
    console.error('❌ No AI tools detected in current directory.');
    console.log('   Run: skill-sync setup');
    process.exit(1);
  }
  
  console.log(`\n📦 Installing global skill "${skillName}"...\n`);
  
  for (const tool of tools) {
    if (!detected[tool]) {
      console.log(`⚠️  Tool "${tool}" not found, skipping...`);
      continue;
    }
    
    const targetPath = path.join(detected[tool].path, AI_TOOLS[tool].skillsDir, skillName);
    
    if (fs.existsSync(targetPath)) {
      console.log(`  ⚠️  ${tool}: Already exists, skipping`);
      continue;
    }
    
    const stats = fs.statSync(globalSkillPath);
    if (stats.isDirectory()) {
      copyDirectory(globalSkillPath, targetPath, {});
      console.log(`  ✅ ${tool}: Installed ${skillName}/`);
    } else {
      fs.copyFileSync(globalSkillPath, targetPath);
      console.log(`  ✅ ${tool}: Installed ${skillName}`);
    }
  }
  
  console.log('\n✅ Installation complete!');
}

function listTools() {
  const detected = detectTools();
  
  console.log('\nDetected AI Tool Directories:\n');
  
  if (Object.keys(detected).length === 0) {
    console.log('  No AI tool directories found in current directory.');
    console.log('  Run "ai-skills-mirror init <tool>" to create one.\n');
    return;
  }
  
  for (const [name, info] of Object.entries(detected)) {
    console.log(`  ${name}:`);
    console.log(`    Path: ${info.path}`);
    console.log(`    Skills: ${info.skills.length} files`);
    if (info.skills.length > 0) {
      for (const skill of info.skills) {
        const skillName = path.basename(skill);
        console.log(`      - ${skillName}`);
      }
    }
    console.log(`    Subagents: ${info.subagents.length} files`);
    if (info.subagents.length > 0) {
      for (const subagent of info.subagents) {
        const subagentName = path.basename(subagent);
        console.log(`      - ${subagentName}`);
      }
    }
    console.log();
  }
}
