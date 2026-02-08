# Skill Sync

A CLI tool to mirror and sync skills and subagents between different AI coding assistant directories (.cursor, .claude, .codex, etc.)

## Installation

### Global Installation
```bash
npm install -g skill-sync
```

### Using npx (no installation)
```bash
npx skill-sync <command>
```

## Usage

### Commands

#### `mirror <source> <target>`
Mirror skills and subagents from one tool to another.

```bash
# Mirror Cursor skills to Claude
skill-sync mirror cursor claude

# Mirror with options
skill-sync mirror cursor claude --skills-only --force
```

#### `sync`
Sync all detected tools bidirectionally.

```bash
# Sync all tools
skill-sync sync

# Dry run to preview changes
skill-sync sync --dry-run
```

#### `list`
List all detected AI tool directories and their contents.

```bash
skill-sync list
```

#### `init <tool>`
Initialize a new AI tool directory structure.

```bash
# Initialize .cursor directory
skill-sync init cursor

# Initialize .claude directory
skill-sync init claude
```

### Options

- `--skills-only` - Only sync skills (not subagents)
- `--subagents-only` - Only sync subagents (not skills)
- `--dry-run` - Show what would be synced without making changes
- `--force` - Overwrite existing files without prompting
- `-v, --verbose` - Show detailed output

## Supported Tools

- **Cursor** (`.cursor/`) - Cursor IDE
- **Claude** (`.claude/`) - Claude Code
- **Codex** (`.codex/`) - OpenAI Codex CLI
- **Windsurf** (`.windsurf/`) - Windsurf IDE
- **Aider** (`.aider/`) - Aider coding assistant
- **Opencode** (`.opencode/`) - Opencode CLI

## Directory Structure

Each AI tool follows this structure:

```
.<tool>/
├── skills/           # Skill definitions
│   ├── skill1.md
│   └── skill2.json
├── subagents/        # Subagent configurations
│   ├── agent1.md
│   └── agent2.json
└── config.json       # Tool-specific settings
```

## Examples

### Example 1: Mirror Cursor to Claude

```bash
# First, initialize both directories
skill-sync init cursor
skill-sync init claude

# Add some skills to Cursor
# (manually create .cursor/skills/my-skill.md)

# Mirror to Claude
skill-sync mirror cursor claude
```

### Example 2: Sync All Tools

```bash
# Preview what would be synced
skill-sync sync --dry-run

# Actually sync all tools
skill-sync sync
```

### Example 3: List Current Setup

```bash
skill-sync list
```

Output:
```
Detected AI Tool Directories:

  cursor:
    Path: /project/.cursor
    Skills: 5 files
    Subagents: 2 files

  claude:
    Path: /project/.claude
    Skills: 3 files
    Subagents: 1 file
```

## License

MIT
