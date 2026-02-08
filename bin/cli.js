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
  skill-sync [command] [options]
  ssync [command] [options]
  
  skill-sync                # Auto-detect and setup all installed tools

Commands:
  setup                     Auto-detect and setup all installed AI tools
  mirror <source> <target>  Mirror skills from source to target tool
  sync                      Sync all tools with each other (bidirectional)
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
  skill-sync                          # Auto-setup all installed tools
  skill-sync setup --dry-run          # Preview what would be setup
  skill-sync mirror cursor claude     # Mirror Cursor skills to Claude
  skill-sync sync --dry-run          # Preview sync across all tools
  skill-sync list                    # Show detected directories
  skill-sync init windsurf           # Create .windsurf structure

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
      
      // Detect skills
      const skillsPath = path.join(toolPath, config.skillsDir);
      if (fs.existsSync(skillsPath)) {
        detected[name].skills = fs.readdirSync(skillsPath)
          .filter(f => f.endsWith('.md') || f.endsWith('.json'))
          .map(f => path.join(skillsPath, f));
      }
      
      // Detect subagents
      const subagentsPath = path.join(toolPath, config.subagentsDir);
      if (fs.existsSync(subagentsPath)) {
        detected[name].subagents = fs.readdirSync(subagentsPath)
          .filter(f => f.endsWith('.md') || f.endsWith('.json'))
          .map(f => path.join(subagentsPath, f));
      }
    }
  }
  
  return detected;
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
    console.log(`    Subagents: ${info.subagents.length} files`);
    console.log();
  }
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
    
    // Ensure target directory exists
    const targetDir = path.dirname(file.target);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Copy file
    fs.copyFileSync(file.source, file.target);
    
    const action = exists ? 'Updated' : 'Created';
    console.log(`  ${action}: ${file.type}/${file.name}`);
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
const command = args[0];

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
    
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;

  default:
    // No command provided - run setup to detect and initialize all tools
    if (!command) {
      setup(options);
    } else {
      console.error(`Unknown command: ${command}`);
      console.error('Run "skill-sync help" for usage information.');
      process.exit(1);
    }
    break;
}
