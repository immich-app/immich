/**
 * Pixel-level comparison of base vs PR screenshots.
 *
 * Uses pixelmatch to generate diff images and calculate change percentages.
 *
 * Usage:
 *   npx tsx e2e/src/screenshots/compare.ts <base-dir> <pr-dir> <output-dir>
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { PNG } from 'pngjs';

// pixelmatch is a lightweight dependency — use a simple inline implementation
// based on the approach from the pixelmatch library to avoid adding a new dependency.
// The e2e package already has pngjs.

function pixelMatch(img1Data: Uint8Array, img2Data: Uint8Array, diffData: Uint8Array): number {
  let diffCount = 0;

  for (let i = 0; i < img1Data.length; i += 4) {
    const r1 = img1Data[i];
    const g1 = img1Data[i + 1];
    const b1 = img1Data[i + 2];

    const r2 = img2Data[i];
    const g2 = img2Data[i + 1];
    const b2 = img2Data[i + 2];

    const dr = Math.abs(r1 - r2);
    const dg = Math.abs(g1 - g2);
    const db = Math.abs(b1 - b2);

    // Threshold: if any channel differs by more than 25, mark as different
    const isDiff = dr > 25 || dg > 25 || db > 25;

    if (isDiff) {
      // Red highlight for diff pixels
      diffData[i] = 255;
      diffData[i + 1] = 0;
      diffData[i + 2] = 0;
      diffData[i + 3] = 255;
      diffCount++;
    } else {
      // Dimmed original for unchanged pixels
      const gray = Math.round(0.299 * r1 + 0.587 * g1 + 0.114 * b1);
      diffData[i] = gray;
      diffData[i + 1] = gray;
      diffData[i + 2] = gray;
      diffData[i + 3] = 128;
    }
  }

  return diffCount;
}

export interface ComparisonResult {
  name: string;
  baseExists: boolean;
  prExists: boolean;
  diffPixels: number;
  totalPixels: number;
  changePercent: number;
  diffImagePath: string | null;
  baseImagePath: string | null;
  prImagePath: string | null;
}

export function compareScreenshots(baseDir: string, prDir: string, outputDir: string): ComparisonResult[] {
  mkdirSync(outputDir, { recursive: true });

  // Collect all screenshot names from both directories
  const baseFiles = existsSync(baseDir)
    ? new Set(readdirSync(baseDir).filter((f) => f.endsWith('.png')))
    : new Set<string>();
  const prFiles = existsSync(prDir) ? new Set(readdirSync(prDir).filter((f) => f.endsWith('.png'))) : new Set<string>();

  const allNames = new Set([...baseFiles, ...prFiles]);
  const results: ComparisonResult[] = [];

  for (const fileName of [...allNames].toSorted()) {
    const name = basename(fileName, '.png');
    const basePath = join(baseDir, fileName);
    const prPath = join(prDir, fileName);
    const baseExists = baseFiles.has(fileName);
    const prExists = prFiles.has(fileName);

    if (!baseExists || !prExists) {
      // New or removed page
      results.push({
        name,
        baseExists,
        prExists,
        diffPixels: -1,
        totalPixels: -1,
        changePercent: 100,
        diffImagePath: null,
        baseImagePath: baseExists ? basePath : null,
        prImagePath: prExists ? prPath : null,
      });
      continue;
    }

    // Load both PNGs
    const basePng = PNG.sync.read(readFileSync(basePath));
    const prPng = PNG.sync.read(readFileSync(prPath));

    // Handle size mismatches by comparing the overlapping region
    const width = Math.max(basePng.width, prPng.width);
    const height = Math.max(basePng.height, prPng.height);

    // Resize images to the same dimensions (pad with transparent)
    const normalizedBase = normalizeImage(basePng, width, height);
    const normalizedPr = normalizeImage(prPng, width, height);

    const diffPng = new PNG({ width, height });
    const totalPixels = width * height;
    const diffPixels = pixelMatch(normalizedBase, normalizedPr, diffPng.data as unknown as Uint8Array);

    const diffImagePath = join(outputDir, `${name}-diff.png`);
    writeFileSync(diffImagePath, PNG.sync.write(diffPng));

    results.push({
      name,
      baseExists,
      prExists,
      diffPixels,
      totalPixels,
      changePercent: totalPixels > 0 ? (diffPixels / totalPixels) * 100 : 0,
      diffImagePath,
      baseImagePath: basePath,
      prImagePath: prPath,
    });
  }

  return results;
}

function normalizeImage(png: PNG, targetWidth: number, targetHeight: number): Uint8Array {
  if (png.width === targetWidth && png.height === targetHeight) {
    return png.data as unknown as Uint8Array;
  }

  const data = new Uint8Array(targetWidth * targetHeight * 4);
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const targetIdx = (y * targetWidth + x) * 4;
      if (x < png.width && y < png.height) {
        const sourceIdx = (y * png.width + x) * 4;
        data[targetIdx] = png.data[sourceIdx];
        data[targetIdx + 1] = png.data[sourceIdx + 1];
        data[targetIdx + 2] = png.data[sourceIdx + 2];
        data[targetIdx + 3] = png.data[sourceIdx + 3];
      } else {
        // Transparent padding
        data[targetIdx + 3] = 0;
      }
    }
  }
  return data;
}

/** Generate a text-only markdown summary for the PR comment. */
export function generateMarkdownReport(results: ComparisonResult[]): string {
  const changed = results.filter((r) => r.changePercent > 0.1);
  const unchanged = results.filter((r) => r.changePercent <= 0.1);

  if (changed.length === 0) {
    return '## Visual Review\n\nNo visual changes detected in the affected pages.';
  }

  let md = '## Visual Review\n\n';
  md += `Found **${changed.length}** page(s) with visual changes`;
  if (unchanged.length > 0) {
    md += ` (${unchanged.length} unchanged)`;
  }
  md += '.\n\n';

  md += '| Page | Status | Change |\n';
  md += '|------|--------|--------|\n';

  for (const result of changed) {
    if (result.baseExists && result.prExists) {
      md += `| ${result.name} | Changed | ${result.changePercent.toFixed(1)}% |\n`;
    } else if (result.prExists) {
      md += `| ${result.name} | New | - |\n`;
    } else {
      md += `| ${result.name} | Removed | - |\n`;
    }
  }

  md += '\n';

  if (unchanged.length > 0) {
    md += '<details>\n<summary>Unchanged pages</summary>\n\n';
    for (const result of unchanged) {
      md += `- ${result.name}\n`;
    }
    md += '\n</details>\n';
  }

  return md;
}

function imgTag(filePath: string | null, alt: string): string {
  if (!filePath || !existsSync(filePath)) {
    return `<div class="no-image">${alt} not available</div>`;
  }
  const data = readFileSync(filePath);
  return `<img src="data:image/png;base64,${data.toString('base64')}" alt="${alt}" loading="lazy" />`;
}

/** Generate an HTML report with embedded base64 images for the artifact. */
export function generateHtmlReport(results: ComparisonResult[]): string {
  const changed = results.filter((r) => r.changePercent > 0.1);
  const unchanged = results.filter((r) => r.changePercent <= 0.1);

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Visual Review</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
         background: #0d1117; color: #e6edf3; padding: 32px; line-height: 1.5; }
  .container { max-width: 1800px; margin: 0 auto; }
  h1 { font-size: 24px; border-bottom: 1px solid #30363d; padding-bottom: 12px; margin-bottom: 24px; }
  .summary { color: #8b949e; margin-bottom: 32px; font-size: 16px; }
  .scenario { margin-bottom: 40px; border: 1px solid #30363d; border-radius: 8px; overflow: hidden; }
  .scenario-header { background: #161b22; padding: 12px 16px; display: flex; align-items: center; gap: 12px; }
  .scenario-header h2 { font-size: 16px; font-weight: 600; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
  .badge-changed { background: #da363380; color: #f85149; }
  .badge-new { background: #1f6feb80; color: #58a6ff; }
  .badge-removed { background: #6e767e80; color: #8b949e; }
  .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; background: #30363d; }
  .grid-cell { background: #0d1117; }
  .grid-label { text-align: center; padding: 8px; font-size: 13px; color: #8b949e; font-weight: 600;
                background: #161b22; text-transform: uppercase; letter-spacing: 0.5px; }
  .grid-cell img { width: 100%; display: block; }
  .no-image { padding: 40px; text-align: center; color: #484f58; font-style: italic; }
  .unchanged-section { margin-top: 32px; color: #8b949e; }
  .unchanged-section summary { cursor: pointer; font-size: 14px; }
  .unchanged-section ul { margin-top: 8px; padding-left: 24px; }
  .unchanged-section li { font-size: 14px; margin: 4px 0; }
</style>
</head>
<body>
<div class="container">
<h1>Visual Review</h1>
`;

  if (changed.length === 0) {
    html += '<p class="summary">No visual changes detected in the affected pages.</p>';
  } else {
    html += `<p class="summary">Found <strong>${changed.length}</strong> page(s) with visual changes`;
    if (unchanged.length > 0) {
      html += ` (${unchanged.length} unchanged)`;
    }
    html += '.</p>\n';

    for (const result of changed) {
      html += '<div class="scenario">\n<div class="scenario-header">\n';
      html += `<h2>${result.name}</h2>\n`;

      if (!result.baseExists) {
        html += '<span class="badge badge-new">New</span>\n';
        html += '</div>\n';
        html += `<div style="padding: 16px;">${imgTag(result.prImagePath, 'PR')}</div>\n`;
        html += '</div>\n';
        continue;
      }

      if (!result.prExists) {
        html += '<span class="badge badge-removed">Removed</span>\n';
        html += '</div>\n</div>\n';
        continue;
      }

      html += `<span class="badge badge-changed">${result.changePercent.toFixed(1)}% changed</span>\n`;
      html += '</div>\n';
      html += '<div class="grid">\n';
      html += `<div class="grid-cell"><div class="grid-label">Base</div>${imgTag(result.baseImagePath, 'Base')}</div>\n`;
      html += `<div class="grid-cell"><div class="grid-label">PR</div>${imgTag(result.prImagePath, 'PR')}</div>\n`;
      html += `<div class="grid-cell"><div class="grid-label">Diff</div>${imgTag(result.diffImagePath, 'Diff')}</div>\n`;
      html += '</div>\n</div>\n';
    }
  }

  if (unchanged.length > 0) {
    html += '<div class="unchanged-section">\n<details>\n<summary>Unchanged pages</summary>\n<ul>\n';
    for (const result of unchanged) {
      html += `<li>${result.name}</li>\n`;
    }
    html += '</ul>\n</details>\n</div>\n';
  }

  html += '</div>\n</body>\n</html>';
  return html;
}

// CLI usage
if (process.argv[1]?.endsWith('compare.ts') || process.argv[1]?.endsWith('compare.js')) {
  const [baseDir, prDir, outputDir] = process.argv.slice(2);

  if (!baseDir || !prDir || !outputDir) {
    throw new Error('Usage: compare.ts <base-dir> <pr-dir> <output-dir>');
  }

  const resolvedOutputDir = resolve(outputDir);
  const results = compareScreenshots(resolve(baseDir), resolve(prDir), resolvedOutputDir);

  console.log('\nComparison Results:');
  console.log('==================');
  for (const r of results) {
    const status = r.changePercent > 0.1 ? 'CHANGED' : 'unchanged';
    console.log(`  ${r.name}: ${status} (${r.changePercent.toFixed(1)}%)`);
  }

  const report = generateMarkdownReport(results);
  const reportPath = join(resolvedOutputDir, 'report.md');
  writeFileSync(reportPath, report);
  console.log(`\nMarkdown report written to: ${reportPath}`);

  const htmlReport = generateHtmlReport(results);
  const htmlPath = join(resolvedOutputDir, 'visual-review.html');
  writeFileSync(htmlPath, htmlReport);
  console.log(`HTML report written to: ${htmlPath}`);

  const jsonPath = join(resolvedOutputDir, 'results.json');
  writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`Results JSON written to: ${jsonPath}`);
}
