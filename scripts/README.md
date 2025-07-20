# Jeopardish Development Scripts

This directory contains useful scripts to aid in development and maintenance of the Jeopardish project.

## Available Scripts

### 🧹 `cleanup_legacy.sh`
Clean up legacy files and organize the codebase.
```bash
./scripts/cleanup_legacy.sh           # Move legacy files to archive
./scripts/cleanup_legacy.sh --dry-run # Preview what would be moved
```

### 🚀 `dev_server.sh`
Enhanced development server with environment checking.
```bash
./scripts/dev_server.sh  # Start dev server with automatic checks
```
- Checks Node.js version
- Creates .env.local if missing
- Installs dependencies if needed
- Opens browser automatically

### 🎨 `analyze_css.sh`
Analyze CSS files for duplicates and optimization opportunities.
```bash
./scripts/analyze_css.sh  # Show CSS statistics and recommendations
```

### 📦 `analyze_bundle.sh`
Analyze production bundle size and dependencies.
```bash
./scripts/analyze_bundle.sh  # Build and analyze bundle size
```
- Creates interactive bundle visualization
- Shows gzipped sizes
- Identifies large dependencies

### 🧪 `test_coverage.sh`
Generate detailed test coverage reports.
```bash
./scripts/test_coverage.sh         # Run tests with coverage
./scripts/test_coverage.sh --watch # Run in watch mode
./scripts/test_coverage.sh --open  # Open coverage report in browser
```

### 🔧 `setup_env.sh`
Interactive environment setup helper.
```bash
./scripts/setup_env.sh  # Set up API keys and features
```
- Creates .env.example
- Guides through API key setup
- Configures feature flags

### 📝 `generate_test.js`
Automatically generate test file templates.
```bash
node scripts/generate_test.js src/path/to/file.js
```
- Creates test file with proper structure
- Imports all exports from source file
- Generates test scaffolding

### 🎤 `download_trebek_audio.sh`
Download Alex Trebek audio files from soundboard.
```bash
./scripts/download_trebek_audio.sh  # Downloads 262 audio files
```

## Usage Tips

1. **First Time Setup**: Run these in order:
   ```bash
   ./scripts/setup_env.sh      # Configure environment
   ./scripts/cleanup_legacy.sh # Clean up old files
   ./scripts/dev_server.sh     # Start developing
   ```

2. **Before Committing**: Check your code quality:
   ```bash
   ./scripts/test_coverage.sh  # Ensure tests pass
   ./scripts/analyze_css.sh    # Check for CSS issues
   ./scripts/analyze_bundle.sh # Check bundle size
   ```

3. **Adding New Features**: Use generators:
   ```bash
   node scripts/generate_test.js src/new-feature.js
   ```

## Adding New Scripts

When adding new scripts:
1. Make them executable: `chmod +x scripts/new-script.sh`
2. Add clear usage comments at the top
3. Include error handling
4. Update this README

## Script Conventions

- Use `.sh` extension for bash scripts
- Use `.js` extension for Node.js scripts
- Start with a shebang (`#!/bin/bash` or `#!/usr/bin/env node`)
- Include usage instructions in comments
- Use emoji for visual feedback 🚀
- Handle errors gracefully
- Provide dry-run options where appropriate
