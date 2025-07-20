#!/bin/bash

# CSS Selector Analyzer for Jeopardish Project
# This script analyzes all CSS files in the project and provides comprehensive statistics

echo "CSS Selector Analyzer for Jeopardish Project"
echo "==========================================="
echo ""

# Create output directory
OUTPUT_DIR="css-analysis"
mkdir -p "$OUTPUT_DIR"

# Find all CSS files (excluding node_modules)
echo "Finding all CSS files..."
find . -name "*.css" -type f -not -path "./node_modules/*" > "$OUTPUT_DIR/all_css_files.txt"
CSS_FILE_COUNT=$(wc -l < "$OUTPUT_DIR/all_css_files.txt")
echo "Found $CSS_FILE_COUNT CSS files"
echo ""

# Extract all selectors from all CSS files
echo "Extracting selectors from all CSS files..."
> "$OUTPUT_DIR/all_selectors_raw.txt"

while IFS= read -r css_file; do
    # Extract class selectors, id selectors, pseudo-selectors, attribute selectors
    grep -hEo '\.[a-zA-Z][a-zA-Z0-9_-]*|#[a-zA-Z][a-zA-Z0-9_-]*|\[[^\]]+\]|:[a-zA-Z][a-zA-Z0-9_-]+|[a-zA-Z]+\s*\{' "$css_file" | \
    sed 's/{$//' | \
    sed 's/^[[:space:]]*//' | \
    sed 's/[[:space:]]*$//' | \
    grep -v '^$' >> "$OUTPUT_DIR/all_selectors_raw.txt"
done < "$OUTPUT_DIR/all_css_files.txt"

# Create unique selector list with counts
echo "Analyzing selector usage frequency..."
sort "$OUTPUT_DIR/all_selectors_raw.txt" | uniq -c | sort -nr > "$OUTPUT_DIR/selector_frequency.txt"

# Separate selectors by type
echo "Categorizing selectors by type..."
grep '^\s*[0-9]\+\s\+\.' "$OUTPUT_DIR/selector_frequency.txt" > "$OUTPUT_DIR/class_selectors.txt"
grep '^\s*[0-9]\+\s\+#' "$OUTPUT_DIR/selector_frequency.txt" > "$OUTPUT_DIR/id_selectors.txt"
grep '^\s*[0-9]\+\s\+:' "$OUTPUT_DIR/selector_frequency.txt" > "$OUTPUT_DIR/pseudo_selectors.txt"
grep '^\s*[0-9]\+\s\+\[' "$OUTPUT_DIR/selector_frequency.txt" > "$OUTPUT_DIR/attribute_selectors.txt"
grep -v '^\s*[0-9]\+\s\+[\.\#:\[]' "$OUTPUT_DIR/selector_frequency.txt" > "$OUTPUT_DIR/element_selectors.txt"

# Generate summary statistics
echo "Generating summary statistics..."
TOTAL_SELECTORS=$(wc -l < "$OUTPUT_DIR/all_selectors_raw.txt")
UNIQUE_SELECTORS=$(wc -l < "$OUTPUT_DIR/selector_frequency.txt")
CLASS_COUNT=$(wc -l < "$OUTPUT_DIR/class_selectors.txt")
ID_COUNT=$(wc -l < "$OUTPUT_DIR/id_selectors.txt")
PSEUDO_COUNT=$(wc -l < "$OUTPUT_DIR/pseudo_selectors.txt")
ATTR_COUNT=$(wc -l < "$OUTPUT_DIR/attribute_selectors.txt")
ELEM_COUNT=$(wc -l < "$OUTPUT_DIR/element_selectors.txt")

# Find selectors used only once (potential candidates for removal)
awk '$1 == 1' "$OUTPUT_DIR/selector_frequency.txt" > "$OUTPUT_DIR/single_use_selectors.txt"
SINGLE_USE_COUNT=$(wc -l < "$OUTPUT_DIR/single_use_selectors.txt")

# Find most frequently used selectors
head -20 "$OUTPUT_DIR/selector_frequency.txt" > "$OUTPUT_DIR/top_20_selectors.txt"

# Create detailed report
cat > "$OUTPUT_DIR/analysis_report.txt" << EOF
CSS Selector Analysis Report
Generated: $(date)
==========================

OVERVIEW
--------
Total CSS files analyzed: $CSS_FILE_COUNT
Total selector occurrences: $TOTAL_SELECTORS
Unique selectors: $UNIQUE_SELECTORS
Selectors used only once: $SINGLE_USE_COUNT

SELECTOR TYPES
--------------
Class selectors (.class): $CLASS_COUNT
ID selectors (#id): $ID_COUNT
Pseudo selectors (:pseudo): $PSEUDO_COUNT
Attribute selectors ([attr]): $ATTR_COUNT
Element selectors: $ELEM_COUNT

TOP 20 MOST USED SELECTORS
--------------------------
$(cat "$OUTPUT_DIR/top_20_selectors.txt")

FILES ANALYZED
--------------
$(cat "$OUTPUT_DIR/all_css_files.txt")

RECOMMENDATIONS
---------------
1. Review single-use selectors in 'single_use_selectors.txt' for potential removal
2. Check for duplicate class names that could be consolidated
3. Consider creating a unified CSS architecture to reduce redundancy
4. Look for legacy/backup folders that might contain outdated CSS

For detailed lists, see the following files in the $OUTPUT_DIR directory:
- selector_frequency.txt: All selectors sorted by usage frequency
- class_selectors.txt: All class selectors
- id_selectors.txt: All ID selectors
- single_use_selectors.txt: Selectors used only once
EOF

# Find potential duplicates across different files
echo ""
echo "Finding selectors defined in multiple files..."
> "$OUTPUT_DIR/selector_locations.txt"

# For each unique selector, find which files it appears in
while IFS= read -r line; do
    count=$(echo "$line" | awk '{print $1}')
    selector=$(echo "$line" | awk '{$1=""; print $0}' | sed 's/^ //')
    
    if [ "$count" -gt 1 ]; then
        echo "Selector: $selector (used $count times)" >> "$OUTPUT_DIR/selector_locations.txt"
        echo "Found in:" >> "$OUTPUT_DIR/selector_locations.txt"
        
        # Escape special characters for grep
        escaped_selector=$(echo "$selector" | sed 's/\./\\./g' | sed 's/\[/\\[/g' | sed 's/\]/\\]/g')
        
        while IFS= read -r css_file; do
            if grep -q "$escaped_selector" "$css_file" 2>/dev/null; then
                echo "  - $css_file" >> "$OUTPUT_DIR/selector_locations.txt"
            fi
        done < "$OUTPUT_DIR/all_css_files.txt"
        
        echo "" >> "$OUTPUT_DIR/selector_locations.txt"
    fi
done < "$OUTPUT_DIR/selector_frequency.txt"

# Display summary
echo ""
echo "Analysis Complete!"
echo "=================="
echo ""
echo "Summary:"
echo "- Total CSS files: $CSS_FILE_COUNT"
echo "- Unique selectors: $UNIQUE_SELECTORS"
echo "- Single-use selectors: $SINGLE_USE_COUNT ($(( SINGLE_USE_COUNT * 100 / UNIQUE_SELECTORS ))%)"
echo ""
echo "Results saved in: $OUTPUT_DIR/"
echo ""
echo "Key files to review:"
echo "1. $OUTPUT_DIR/analysis_report.txt - Full analysis report"
echo "2. $OUTPUT_DIR/single_use_selectors.txt - Selectors used only once"
echo "3. $OUTPUT_DIR/selector_frequency.txt - All selectors by usage count"
echo "4. $OUTPUT_DIR/selector_locations.txt - Where duplicate selectors are defined"

# Create a visualization of CSS file distribution
echo ""
echo "CSS File Distribution by Directory:"
echo "-----------------------------------"
find . -name "*.css" -type f -not -path "./node_modules/*" | \
    sed 's|/[^/]*$||' | \
    sort | uniq -c | sort -nr
