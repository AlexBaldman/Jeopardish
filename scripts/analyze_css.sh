#!/bin/bash

# Script to analyze CSS files and find duplicates/unused styles
# Usage: ./analyze_css.sh

echo "🎨 CSS Analysis Tool for Jeopardish"
echo "==================================="

# Function to get file size in human readable format
get_size() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        stat -f%z "$1" | awk '{ split("B KB MB GB", v); s=1; while( $1>1024 ){ $1/=1024; s++ } printf "%.1f %s", $1, v[s] }'
    else
        stat -c%s "$1" | awk '{ split("B KB MB GB", v); s=1; while( $1>1024 ){ $1/=1024; s++ } printf "%.1f %s", $1, v[s] }'
    fi
}

# Find all CSS files
echo "📊 CSS File Statistics:"
echo ""

total_size=0
file_count=0

# Main CSS files
echo "Main CSS files:"
for file in styles.css styles-new.css; do
    if [[ -f "$file" ]]; then
        size=$(get_size "$file")
        lines=$(wc -l < "$file")
        echo "  - $file: $size ($lines lines)"
        ((file_count++))
    fi
done

# CSS directory files
if [[ -d "css" ]]; then
    echo ""
    echo "CSS directory files:"
    while IFS= read -r file; do
        size=$(get_size "$file")
        lines=$(wc -l < "$file")
        echo "  - ${file#./}: $size ($lines lines)"
        ((file_count++))
    done < <(find css -name "*.css" -type f | sort)
fi

echo ""
echo "📈 Total CSS files: $file_count"

# Find duplicate selectors across files
echo ""
echo "🔍 Analyzing for duplicate selectors..."

# Extract all CSS selectors
temp_file=$(mktemp)
find . -name "*.css" -not -path "./node_modules/*" -not -path "./dist/*" | while read -r file; do
    # Extract selectors (basic regex, won't catch everything)
    grep -Eo '^[^{]*{' "$file" | sed 's/{$//' | sed 's/^[[:space:]]*//' | sed '/^$/d' | while read -r selector; do
        echo "$selector|$file" >> "$temp_file"
    done
done

# Find duplicates
if [[ -s "$temp_file" ]]; then
    echo ""
    echo "Duplicate selectors found:"
    sort "$temp_file" | cut -d'|' -f1 | uniq -c | sort -rn | head -20 | while read -r count selector; do
        if [[ $count -gt 1 ]]; then
            echo "  - '$selector' appears $count times"
            grep "^$selector|" "$temp_file" | cut -d'|' -f2 | sed 's/^/      in: /' | sort -u
        fi
    done
fi

rm -f "$temp_file"

# Analyze CSS organization
echo ""
echo "📁 CSS Organization Analysis:"

# Check for component-specific styles
component_styles=$(find . -name "*.css" -path "*/components/*" 2>/dev/null | wc -l)
echo "  - Component-specific CSS files: $component_styles"

# Check for utility classes
echo ""
echo "🎯 Recommendations:"
echo ""

if [[ $file_count -gt 20 ]]; then
    echo "⚠️  You have $file_count CSS files. Consider consolidating them:"
    echo "   - Use CSS modules or styled-components"
    echo "   - Implement a CSS architecture (BEM, SMACSS, etc.)"
    echo "   - Use a CSS preprocessor (Sass, Less)"
fi

# Check for large files
large_files=$(find . -name "*.css" -not -path "./node_modules/*" -size +100k 2>/dev/null)
if [[ -n "$large_files" ]]; then
    echo ""
    echo "⚠️  Large CSS files detected (>100KB):"
    echo "$large_files" | while read -r file; do
        echo "   - $file ($(get_size "$file"))"
    done
    echo "   Consider splitting these files or removing unused styles"
fi

# Suggest CSS optimization
echo ""
echo "💡 CSS Optimization Tips:"
echo "   1. Run 'npm install -D postcss autoprefixer cssnano'"
echo "   2. Configure PostCSS for production builds"
echo "   3. Use PurgeCSS to remove unused styles"
echo "   4. Consider CSS-in-JS for component isolation"

# Generate consolidation script
echo ""
echo "📝 To consolidate CSS files, run:"
echo "   cat css/*.css > css/combined.css"
echo "   Then update your imports to use the combined file"
