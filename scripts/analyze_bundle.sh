#!/bin/bash

# Script to analyze build bundle size and dependencies
# Usage: ./analyze_bundle.sh

echo "📦 Bundle Analysis for Jeopardish"
echo "================================="

# Check if we need to install bundle analyzer
if ! npm list vite-bundle-visualizer &>/dev/null; then
    echo "📥 Installing bundle analyzer..."
    npm install -D vite-bundle-visualizer rollup-plugin-visualizer
fi

# Create temporary vite config for analysis
cat > vite.config.analyze.js << 'EOF'
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  root: './',
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          'vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'ai': ['@genkit-ai/googleai'],
        },
      },
      plugins: [
        visualizer({
          open: true,
          filename: 'dist/stats.html',
          gzipSize: true,
          brotliSize: true,
        })
      ]
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@services': resolve(__dirname, './src/services'),
      '@store': resolve(__dirname, './src/store'),
      '@utils': resolve(__dirname, './src/utils'),
      '@ai': resolve(__dirname, './src/ai'),
      '@auth': resolve(__dirname, './src/auth'),
    },
  },
});
EOF

echo "🔨 Building production bundle..."
npx vite build --config vite.config.analyze.js

# Get bundle sizes
echo ""
echo "📊 Bundle Size Report:"
echo "====================="

if [[ -d "dist" ]]; then
    # JavaScript files
    echo ""
    echo "JavaScript bundles:"
    find dist -name "*.js" -type f | while read -r file; do
        size=$(du -h "$file" | cut -f1)
        gzip_size=$(gzip -c "$file" | wc -c | awk '{ split("B KB MB", v); s=1; while( $1>1024 ){ $1/=1024; s++ } printf "%.1f%s", $1, v[s] }')
        echo "  - ${file#dist/}: $size (gzipped: $gzip_size)"
    done
    
    # CSS files
    echo ""
    echo "CSS bundles:"
    find dist -name "*.css" -type f | while read -r file; do
        size=$(du -h "$file" | cut -f1)
        gzip_size=$(gzip -c "$file" | wc -c | awk '{ split("B KB MB", v); s=1; while( $1>1024 ){ $1/=1024; s++ } printf "%.1f%s", $1, v[s] }')
        echo "  - ${file#dist/}: $size (gzipped: $gzip_size)"
    done
    
    # Total size
    echo ""
    total_size=$(du -sh dist | cut -f1)
    echo "Total build size: $total_size"
fi

# Analyze dependencies
echo ""
echo "📦 Dependency Analysis:"
echo "====================="

# Check for large dependencies
echo ""
echo "Large dependencies (>1MB):"
npx size-limit --json 2>/dev/null | jq -r '.[] | select(.size > 1000000) | "\(.name): \(.size | . / 1024 / 1024 | floor)MB"' 2>/dev/null || {
    # Fallback if size-limit not available
    du -sh node_modules/* 2>/dev/null | sort -hr | head -10 | while read -r size dir; do
        echo "  - ${dir#node_modules/}: $size"
    done
}

# Find unused dependencies
echo ""
echo "🔍 Checking for potentially unused dependencies..."
npx depcheck --json 2>/dev/null | jq -r '.dependencies[]' 2>/dev/null | while read -r dep; do
    echo "  - $dep (unused?)"
done || echo "  Install 'depcheck' for unused dependency analysis: npm install -g depcheck"

# Performance tips
echo ""
echo "⚡ Performance Optimization Tips:"
echo "================================"
echo "1. Enable code splitting for routes"
echo "2. Lazy load heavy components (AI, Firebase)"
echo "3. Use dynamic imports for optional features"
echo "4. Consider CDN for large libraries"
echo "5. Enable compression in production"

# Clean up
rm -f vite.config.analyze.js

echo ""
echo "📈 Bundle visualization available at: dist/stats.html"
echo "   Open this file in your browser for interactive analysis"
