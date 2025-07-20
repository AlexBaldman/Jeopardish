#!/bin/bash

# Script to clean up legacy files and organize the codebase
# Usage: ./cleanup_legacy.sh [--dry-run]

DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    echo "🔍 DRY RUN MODE - No files will be moved"
fi

ARCHIVE_DIR="archive/legacy-$(date +%Y%m%d)"

echo "🧹 Cleaning up legacy files..."

# Create archive directory
if [[ "$DRY_RUN" == false ]]; then
    mkdir -p "$ARCHIVE_DIR"
fi

# Define legacy files to move
LEGACY_FILES=(
    "gemini-trebek.js"
    "gemini-trebek-enhanced.js"
    "gemini-game-integration.js"
    "gemini-setup-guide.html"
    "test-*.js"
    "ai-trebek-ui.js"
    "*-original.*"
    "*-old.*"
    "*-backup.*"
)

# Count files to be moved
count=0
for pattern in "${LEGACY_FILES[@]}"; do
    for file in $pattern; do
        if [[ -f "$file" ]]; then
            ((count++))
        fi
    done
done

echo "📊 Found $count legacy files to archive"

# Move files
for pattern in "${LEGACY_FILES[@]}"; do
    for file in $pattern; do
        if [[ -f "$file" ]]; then
            if [[ "$DRY_RUN" == true ]]; then
                echo "   Would move: $file → $ARCHIVE_DIR/"
            else
                echo "   Moving: $file → $ARCHIVE_DIR/"
                mv "$file" "$ARCHIVE_DIR/"
            fi
        fi
    done
done

# Find duplicate CSS files
echo ""
echo "🎨 Analyzing CSS files for potential consolidation..."
css_files=$(find ./css -name "*.css" 2>/dev/null | wc -l)
echo "   Found $css_files CSS files in ./css directory"

# Find empty directories
echo ""
echo "📁 Finding empty directories..."
empty_dirs=$(find . -type d -empty -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null)
if [[ -n "$empty_dirs" ]]; then
    echo "$empty_dirs" | while read -r dir; do
        if [[ "$DRY_RUN" == true ]]; then
            echo "   Would remove empty directory: $dir"
        else
            echo "   Removing empty directory: $dir"
            rmdir "$dir"
        fi
    done
else
    echo "   No empty directories found"
fi

if [[ "$DRY_RUN" == false ]]; then
    echo ""
    echo "✅ Cleanup complete! Legacy files archived to: $ARCHIVE_DIR"
else
    echo ""
    echo "🔍 Dry run complete. Run without --dry-run to perform cleanup."
fi
