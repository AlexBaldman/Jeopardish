#!/usr/bin/env node

/**
 * Test File Generator
 * Usage: node scripts/generate_test.js src/path/to/file.js
 */

const fs = require('fs');
const path = require('path');

// Get file path from command line
const filePath = process.argv[2];

if (!filePath) {
  console.error('❌ Please provide a file path');
  console.error('Usage: node scripts/generate_test.js src/path/to/file.js');
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

// Read the source file
const sourceCode = fs.readFileSync(filePath, 'utf8');

// Extract exported functions/classes
const exports = [];
const exportMatches = sourceCode.matchAll(/export\s+(function|class|const|let|var)\s+(\w+)/g);
for (const match of exportMatches) {
  exports.push({ type: match[1], name: match[2] });
}

// Also check for export { } syntax
const namedExportMatches = sourceCode.matchAll(/export\s*{\s*([^}]+)\s*}/g);
for (const match of namedExportMatches) {
  const names = match[1].split(',').map(n => n.trim());
  names.forEach(name => {
    if (!exports.find(e => e.name === name)) {
      exports.push({ type: 'function', name });
    }
  });
}

// Generate test file path
const dirName = path.dirname(filePath);
const baseName = path.basename(filePath, '.js');
const testDir = path.join(dirName, '__tests__');
const testFilePath = path.join(testDir, `${baseName}.test.js`);

// Create test directory if it doesn't exist
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// Generate import path
const importPath = path.relative(testDir, filePath).replace(/\\/g, '/').replace('.js', '');

// Generate test template
const testTemplate = `import { ${exports.map(e => e.name).join(', ')} } from '../${importPath}';

describe('${baseName}', () => {
${exports.map(exp => {
  if (exp.type === 'class') {
    return `  describe('${exp.name}', () => {
    let instance;
    
    beforeEach(() => {
      instance = new ${exp.name}();
    });
    
    test('should create an instance', () => {
      expect(instance).toBeDefined();
      expect(instance).toBeInstanceOf(${exp.name});
    });
    
    // TODO: Add more tests for ${exp.name} methods
  });`;
  } else {
    return `  describe('${exp.name}', () => {
    test('should be defined', () => {
      expect(${exp.name}).toBeDefined();
    });
    
    // TODO: Add more tests for ${exp.name}
    test.todo('should handle normal input');
    test.todo('should handle edge cases');
    test.todo('should handle errors');
  });`;
  }
}).join('\n\n')}
});
`;

// Check if test file already exists
if (fs.existsSync(testFilePath)) {
  console.log(`⚠️  Test file already exists: ${testFilePath}`);
  console.log('Do you want to overwrite it? (y/N)');
  
  process.stdin.once('data', (data) => {
    const answer = data.toString().trim().toLowerCase();
    if (answer === 'y' || answer === 'yes') {
      writeTestFile();
    } else {
      console.log('❌ Aborted');
      process.exit(0);
    }
  });
} else {
  writeTestFile();
}

function writeTestFile() {
  fs.writeFileSync(testFilePath, testTemplate);
  console.log(`✅ Test file created: ${testFilePath}`);
  console.log('');
  console.log('📝 Next steps:');
  console.log(`   1. Open ${testFilePath}`);
  console.log('   2. Replace TODO comments with actual tests');
  console.log('   3. Run: npm test');
  
  // Offer to open in editor
  console.log('');
  console.log('📝 Open in VS Code? (Y/n)');
  
  process.stdin.once('data', (data) => {
    const answer = data.toString().trim().toLowerCase();
    if (answer !== 'n' && answer !== 'no') {
      const { exec } = require('child_process');
      exec(`code "${testFilePath}"`);
    }
    process.exit(0);
  });
}
