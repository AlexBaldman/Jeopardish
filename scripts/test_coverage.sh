#!/bin/bash

# Enhanced test coverage script with detailed reporting
# Usage: ./test_coverage.sh [--watch] [--open]

WATCH_MODE=false
OPEN_REPORT=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --watch)
            WATCH_MODE=true
            ;;
        --open)
            OPEN_REPORT=true
            ;;
    esac
done

echo "🧪 Jeopardish Test Coverage Report"
echo "================================="

# Check if tests exist
test_count=$(find src -name "*.test.js" -o -name "*.spec.js" | wc -l)
echo "📊 Found $test_count test files"

# Run tests with coverage
if [[ "$WATCH_MODE" == true ]]; then
    echo "👀 Running tests in watch mode..."
    npm run test:watch
else
    echo "🚀 Running all tests with coverage..."
    npm run test:coverage
    
    # Parse coverage results if available
    if [[ -f "coverage/coverage-summary.json" ]]; then
        echo ""
        echo "📈 Coverage Summary:"
        echo "==================="
        
        # Extract coverage percentages using Node.js
        node -e "
        const coverage = require('./coverage/coverage-summary.json');
        const total = coverage.total;
        
        console.log('  Statements: ' + total.statements.pct + '%');
        console.log('  Branches:   ' + total.branches.pct + '%');
        console.log('  Functions:  ' + total.functions.pct + '%');
        console.log('  Lines:      ' + total.lines.pct + '%');
        
        // Check thresholds
        const threshold = 70;
        if (total.statements.pct < threshold || 
            total.branches.pct < threshold || 
            total.functions.pct < threshold || 
            total.lines.pct < threshold) {
            console.log('');
            console.log('⚠️  Warning: Coverage below ' + threshold + '% threshold');
        }
        " 2>/dev/null || echo "  Unable to parse coverage data"
    fi
    
    # List uncovered files
    echo ""
    echo "📁 Files with low coverage (<70%):"
    echo "================================="
    
    if [[ -f "coverage/lcov-report/index.html" ]]; then
        # Extract from lcov report
        grep -E "low|medium" coverage/lcov-report/index.html | grep -oE 'href="[^"]+\.html' | sed 's/href="//;s/\.html//' | while read -r file; do
            echo "  - $file"
        done 2>/dev/null || echo "  Run tests to see coverage details"
    fi
    
    # Suggest missing tests
    echo ""
    echo "🔍 Files without tests:"
    echo "======================"
    
    # Find JS files without corresponding test files
    find src -name "*.js" -not -name "*.test.js" -not -name "*.spec.js" -not -path "*/tests/*" | while read -r file; do
        base_name="${file%.js}"
        if [[ ! -f "${base_name}.test.js" && ! -f "${base_name}.spec.js" && ! -f "${base_name%/*}/__tests__/${file##*/}" ]]; then
            echo "  - $file"
        fi
    done
    
    # Generate test templates
    echo ""
    echo "💡 Quick Test Template Generator:"
    echo "================================"
    echo "To create a test for a file, run:"
    echo "  node scripts/generate_test.js src/path/to/file.js"
    
    # Open coverage report
    if [[ "$OPEN_REPORT" == true && -f "coverage/lcov-report/index.html" ]]; then
        echo ""
        echo "📊 Opening coverage report in browser..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open coverage/lcov-report/index.html
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            xdg-open coverage/lcov-report/index.html
        fi
    else
        echo ""
        echo "📊 View detailed coverage report:"
        echo "   open coverage/lcov-report/index.html"
    fi
fi

# Testing tips
echo ""
echo "✅ Testing Best Practices:"
echo "========================"
echo "1. Aim for >80% coverage on critical paths"
echo "2. Test edge cases and error conditions"
echo "3. Use descriptive test names"
echo "4. Mock external dependencies"
echo "5. Keep tests focused and isolated"

# Show next steps
echo ""
echo "🎯 Next Steps:"
echo "============="
echo "- Add tests for uncovered files"
echo "- Improve coverage on critical components"
echo "- Set up pre-commit hooks for tests"
echo "- Configure CI/CD to enforce coverage thresholds"
