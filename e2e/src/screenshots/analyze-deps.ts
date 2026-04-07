/**
 * Reverse dependency analyzer for the Immich web app.
 *
 * Given a list of changed files, traces upward through the import graph
 * to find which +page.svelte routes are affected, then maps those to URL paths.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const WEB_SRC = resolve(import.meta.dirname, '../../../web/src');
const LIB_ALIAS = resolve(WEB_SRC, 'lib');

/** Collect all .svelte, .ts, .js files under web/src/ */
function collectFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.svelte-kit') {
        continue;
      }
      results.push(...collectFiles(full));
    } else if (/\.(svelte|ts|js)$/.test(entry)) {
      results.push(full);
    }
  }
  return results;
}

/** Extract import specifiers from a file's source text. */
function extractImports(source: string): string[] {
  const specifiers: string[] = [];

  // Match: import ... from '...'  /  import '...'  /  export ... from '...'
  const importRegex = /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  // Match dynamic imports: import('...')
  const dynamicRegex = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

/** Resolve an import specifier to an absolute file path (or null if external). */
function resolveImport(specifier: string, fromFile: string, allFiles: Set<string>): string | null {
  // Handle $lib alias
  let resolved: string;
  if (specifier.startsWith('$lib/') || specifier === '$lib') {
    resolved = specifier.replace('$lib', LIB_ALIAS);
  } else if (specifier.startsWith('./') || specifier.startsWith('../')) {
    resolved = resolve(dirname(fromFile), specifier);
  } else {
    // External package import — not relevant
    return null;
  }

  // Try exact match, then common extensions
  const extensions = ['', '.ts', '.js', '.svelte', '/index.ts', '/index.js', '/index.svelte'];
  for (const ext of extensions) {
    const candidate = resolved + ext;
    if (allFiles.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

/** Build the forward dependency graph: file → set of files it imports. */
function buildDependencyGraph(files: string[]): Map<string, Set<string>> {
  const fileSet = new Set(files);
  const graph = new Map<string, Set<string>>();

  for (const file of files) {
    const deps = new Set<string>();
    graph.set(file, deps);

    try {
      const source = readFileSync(file, 'utf8');
      for (const specifier of extractImports(source)) {
        const resolved = resolveImport(specifier, file, fileSet);
        if (resolved) {
          deps.add(resolved);
        }
      }
    } catch {
      // Skip files that can't be read
    }
  }

  return graph;
}

/** Invert the dependency graph: file → set of files that import it. */
function buildReverseDependencyGraph(forwardGraph: Map<string, Set<string>>): Map<string, Set<string>> {
  const reverse = new Map<string, Set<string>>();

  for (const [file, deps] of forwardGraph) {
    for (const dep of deps) {
      let importers = reverse.get(dep);
      if (!importers) {
        importers = new Set();
        reverse.set(dep, importers);
      }
      importers.add(file);
    }
  }

  return reverse;
}

/** BFS from changed files upward through reverse deps to find +page.svelte files. */
function findAffectedPages(changedFiles: string[], reverseGraph: Map<string, Set<string>>): Set<string> {
  const visited = new Set<string>();
  const pages = new Set<string>();
  const queue = [...changedFiles];

  while (queue.length > 0) {
    const file = queue.shift()!;
    if (visited.has(file)) {
      continue;
    }
    visited.add(file);

    if (file.endsWith('+page.svelte') || file.endsWith('+layout.svelte')) {
      pages.add(file);
      // If it's a layout, keep tracing upward because the layout itself
      // isn't a page — but the pages under it are affected.
      // If it's a +page.svelte, we still want to continue in case
      // this page is imported by others.
    }

    const importers = reverseGraph.get(file);
    if (importers) {
      for (const importer of importers) {
        if (!visited.has(importer)) {
          queue.push(importer);
        }
      }
    }
  }

  // For +layout.svelte hits, also find all +page.svelte under the same directory tree
  const layoutDirs: string[] = [];
  for (const page of pages) {
    if (page.endsWith('+layout.svelte')) {
      layoutDirs.push(dirname(page));
      pages.delete(page);
    }
  }

  if (layoutDirs.length > 0) {
    for (const file of reverseGraph.keys()) {
      if (file.endsWith('+page.svelte')) {
        for (const layoutDir of layoutDirs) {
          if (file.startsWith(layoutDir)) {
            pages.add(file);
          }
        }
      }
    }
    // Also check the forward graph keys for page files under layout dirs
    for (const layoutDir of layoutDirs) {
      const allFiles = collectFiles(layoutDir);
      for (const f of allFiles) {
        if (f.endsWith('+page.svelte')) {
          pages.add(f);
        }
      }
    }
  }

  return pages;
}

/** Convert a +page.svelte file path to its URL route. */
export function pageFileToRoute(pageFile: string): string {
  const routesDir = resolve(WEB_SRC, 'routes');
  let rel = relative(routesDir, dirname(pageFile));

  // Remove SvelteKit group markers: (user), (list), etc.
  rel = rel.replaceAll(/\([^)]+\)\/?/g, '');

  // Remove parameter segments: [albumId=id], [[photos=photos]], [[assetId=id]]
  rel = rel.replaceAll(/\[\[?[^\]]+\]\]?\/?/g, '');

  // Clean up trailing slashes and normalize
  rel = rel.replaceAll(/\/+/g, '/').replace(/\/$/, '');

  return '/' + rel;
}

export interface AnalysisResult {
  affectedPages: string[];
  affectedRoutes: string[];
}

/** Main entry: analyze which routes are affected by the given changed files. */
export function analyzeAffectedRoutes(changedFiles: string[]): AnalysisResult {
  // Resolve changed files to absolute paths relative to web/src
  const webRoot = resolve(WEB_SRC, '..');
  const resolvedChanged = changedFiles
    .filter((f) => f.startsWith('web/'))
    .map((f) => resolve(webRoot, '..', f))
    .filter((f) => statSync(f, { throwIfNoEntry: false })?.isFile());

  if (resolvedChanged.length === 0) {
    return { affectedPages: [], affectedRoutes: [] };
  }

  const allFiles = collectFiles(WEB_SRC);
  const forwardGraph = buildDependencyGraph(allFiles);
  const reverseGraph = buildReverseDependencyGraph(forwardGraph);

  const pages = findAffectedPages(resolvedChanged, reverseGraph);

  const affectedPages = [...pages].toSorted();
  const affectedRoutes = [...new Set(affectedPages.map((f) => pageFileToRoute(f)))].toSorted();

  return { affectedPages, affectedRoutes };
}

// CLI usage: node --import tsx analyze-deps.ts file1 file2 ...
if (process.argv[1]?.endsWith('analyze-deps.ts') || process.argv[1]?.endsWith('analyze-deps.js')) {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.log('Usage: analyze-deps.ts <changed-file1> <changed-file2> ...');
    console.log('Files should be relative to the repo root (e.g. web/src/lib/components/Button.svelte)');
    throw new Error('No files provided');
  }

  const result = analyzeAffectedRoutes(files);
  console.log('Affected pages:');
  for (const page of result.affectedPages) {
    console.log(`  ${page}`);
  }
  console.log('\nAffected routes:');
  for (const route of result.affectedRoutes) {
    console.log(`  ${route}`);
  }
}
