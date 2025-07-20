#!/usr/bin/env node

/**
 * Performance Profiler
 * 
 * Carmack: "Measure, don't guess"
 * Profile code execution, memory usage, and rendering performance
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Configuration
const PROFILE_URL = process.argv[2] || 'http://localhost:3000';
const ITERATIONS = 5;
const OUTPUT_DIR = './performance-reports';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Metrics to collect
const metrics = {
  pageLoad: [],
  firstPaint: [],
  firstContentfulPaint: [],
  largestContentfulPaint: [],
  domContentLoaded: [],
  memoryUsage: [],
  jsHeapSize: [],
  layoutDuration: [],
  scriptDuration: [],
  renderDuration: []
};

async function profilePage() {
  console.log('🚀 Starting performance profiling...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  for (let i = 0; i < ITERATIONS; i++) {
    console.log(`📊 Iteration ${i + 1}/${ITERATIONS}`);
    
    const page = await browser.newPage();
    
    // Enable performance monitoring
    await page.evaluateOnNewDocument(() => {
      window.__PERF_DATA__ = {
        marks: {},
        measures: {}
      };
      
      // Override performance.mark
      const originalMark = performance.mark.bind(performance);
      performance.mark = function(name) {
        window.__PERF_DATA__.marks[name] = performance.now();
        return originalMark(name);
      };
      
      // Override performance.measure
      const originalMeasure = performance.measure.bind(performance);
      performance.measure = function(name, startMark, endMark) {
        const measure = originalMeasure(name, startMark, endMark);
        window.__PERF_DATA__.measures[name] = {
          duration: measure.duration,
          startTime: measure.startTime
        };
        return measure;
      };
    });
    
    // Collect performance timeline
    await page.tracing.start({ 
      path: path.join(OUTPUT_DIR, `trace-${i}.json`),
      categories: ['devtools.timeline', 'v8.execute', 'blink.user_timing']
    });
    
    // Navigate and wait for load
    const startTime = performance.now();
    await page.goto(PROFILE_URL, { waitUntil: 'networkidle0' });
    const loadTime = performance.now() - startTime;
    
    // Get performance metrics
    const perfMetrics = await page.metrics();
    const performanceTiming = await page.evaluate(() => {
      const timing = performance.timing;
      const paintEntries = performance.getEntriesByType('paint');
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        firstPaint: paintEntries.find(e => e.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || 0,
        largestContentfulPaint: lcpEntries[lcpEntries.length - 1]?.startTime || 0,
        customMarks: window.__PERF_DATA__ || {}
      };
    });
    
    // Simulate user interactions
    await profileUserInteractions(page);
    
    // Collect runtime performance
    const coverage = await page.coverage.startJSCoverage();
    await page.evaluate(() => {
      // Trigger some game actions
      if (window.gameController) {
        window.gameController.getNewQuestion();
      }
    });
    const jsCoverage = await page.coverage.stopJSCoverage();
    
    // Calculate unused JS
    let totalBytes = 0;
    let usedBytes = 0;
    for (const entry of jsCoverage) {
      totalBytes += entry.text.length;
      for (const range of entry.ranges) {
        usedBytes += range.end - range.start - 1;
      }
    }
    const unusedJS = ((totalBytes - usedBytes) / totalBytes * 100).toFixed(2);
    
    // Stop tracing
    await page.tracing.stop();
    
    // Store metrics
    metrics.pageLoad.push(loadTime);
    metrics.firstPaint.push(performanceTiming.firstPaint);
    metrics.firstContentfulPaint.push(performanceTiming.firstContentfulPaint);
    metrics.largestContentfulPaint.push(performanceTiming.largestContentfulPaint);
    metrics.domContentLoaded.push(performanceTiming.domContentLoaded);
    metrics.memoryUsage.push(perfMetrics.JSHeapTotalSize);
    metrics.jsHeapSize.push(perfMetrics.JSHeapUsedSize);
    
    console.log(`  ✅ Page load: ${loadTime.toFixed(2)}ms`);
    console.log(`  ✅ FCP: ${performanceTiming.firstContentfulPaint.toFixed(2)}ms`);
    console.log(`  ✅ LCP: ${performanceTiming.largestContentfulPaint.toFixed(2)}ms`);
    console.log(`  ✅ Unused JS: ${unusedJS}%\n`);
    
    await page.close();
  }
  
  await browser.close();
  
  // Generate report
  generateReport();
}

async function profileUserInteractions(page) {
  // Profile common user actions
  const interactions = [
    {
      name: 'Get New Question',
      action: async () => {
        await page.evaluate(() => {
          performance.mark('question-start');
          document.getElementById('questionButton')?.click();
        });
        await page.waitForTimeout(500);
        await page.evaluate(() => {
          performance.mark('question-end');
          performance.measure('question-load', 'question-start', 'question-end');
        });
      }
    },
    {
      name: 'Submit Answer',
      action: async () => {
        await page.evaluate(() => {
          performance.mark('answer-start');
          const input = document.getElementById('inputBox');
          if (input) {
            input.value = 'test answer';
            document.getElementById('checkButton')?.click();
          }
        });
        await page.waitForTimeout(300);
        await page.evaluate(() => {
          performance.mark('answer-end');
          performance.measure('answer-check', 'answer-start', 'answer-end');
        });
      }
    }
  ];
  
  for (const interaction of interactions) {
    await interaction.action();
  }
  
  // Get custom measurements
  const customMetrics = await page.evaluate(() => window.__PERF_DATA__);
  return customMetrics;
}

function generateReport() {
  console.log('\n📈 Performance Report\n' + '='.repeat(50));
  
  // Calculate statistics
  const stats = {};
  for (const [metric, values] of Object.entries(metrics)) {
    if (values.length > 0) {
      const sorted = [...values].sort((a, b) => a - b);
      stats[metric] = {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.floor(sorted.length * 0.95)]
      };
    }
  }
  
  // Display results
  console.log('📊 Page Load Metrics:');
  console.log(`  First Paint:     ${formatMetric(stats.firstPaint)}`);
  console.log(`  FCP:             ${formatMetric(stats.firstContentfulPaint)}`);
  console.log(`  LCP:             ${formatMetric(stats.largestContentfulPaint)}`);
  console.log(`  DOM Loaded:      ${formatMetric(stats.domContentLoaded)}`);
  console.log(`  Total Load:      ${formatMetric(stats.pageLoad)}`);
  
  console.log('\n💾 Memory Usage:');
  console.log(`  JS Heap Size:    ${formatBytes(stats.jsHeapSize)}`);
  console.log(`  Total Memory:    ${formatBytes(stats.memoryUsage)}`);
  
  // Performance recommendations
  console.log('\n🎯 Recommendations:');
  const recommendations = [];
  
  if (stats.firstContentfulPaint?.avg > 1800) {
    recommendations.push('⚠️  FCP is above 1.8s. Consider:');
    recommendations.push('   - Reducing initial bundle size');
    recommendations.push('   - Implementing code splitting');
    recommendations.push('   - Optimizing critical rendering path');
  }
  
  if (stats.largestContentfulPaint?.avg > 2500) {
    recommendations.push('⚠️  LCP is above 2.5s. Consider:');
    recommendations.push('   - Optimizing largest images');
    recommendations.push('   - Preloading critical resources');
    recommendations.push('   - Using image formats like WebP');
  }
  
  if (stats.jsHeapSize?.avg > 50 * 1024 * 1024) {
    recommendations.push('⚠️  High memory usage detected. Consider:');
    recommendations.push('   - Removing memory leaks');
    recommendations.push('   - Implementing object pooling');
    recommendations.push('   - Cleaning up event listeners');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ Performance is within acceptable ranges!');
  }
  
  recommendations.forEach(r => console.log(r));
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    url: PROFILE_URL,
    iterations: ITERATIONS,
    metrics: stats,
    recommendations
  };
  
  const reportPath = path.join(OUTPUT_DIR, `report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  console.log('🔍 Chrome DevTools traces saved in: ' + OUTPUT_DIR);
}

function formatMetric(stat) {
  if (!stat) return 'N/A';
  return `avg: ${stat.avg.toFixed(0)}ms, p95: ${stat.p95.toFixed(0)}ms`;
}

function formatBytes(stat) {
  if (!stat) return 'N/A';
  const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);
  return `avg: ${mb(stat.avg)}MB, max: ${mb(stat.max)}MB`;
}

// Check dependencies
async function checkDependencies() {
  try {
    require.resolve('puppeteer');
  } catch (e) {
    console.log('📦 Installing Puppeteer...');
    const { execSync } = require('child_process');
    execSync('npm install --save-dev puppeteer', { stdio: 'inherit' });
  }
}

// Main execution
(async () => {
  await checkDependencies();
  await profilePage();
})().catch(console.error);
