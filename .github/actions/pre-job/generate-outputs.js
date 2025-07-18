module.exports = ({ core }) => {
  console.log('=== Pre-Job: Generating Final Outputs ===');

  try {
    const filtersList = core.getInput('filters-list');
    const skipForceLogic = core.getBooleanInput('skip-force-logic');

    const forceTriggered = core.getBooleanInput('force-triggered');
    const shouldSkip = core.getBooleanInput('should-skip');
    const needsPathFiltering = core.getBooleanInput('needs-path-filtering');

    let forcePathResults = {};
    let mainPathResults = {};

    try {
      const forcePathRaw = core.getInput('force-path-results');
      if (forcePathRaw && forcePathRaw !== '{}') {
        forcePathResults = JSON.parse(forcePathRaw);
      }
    } catch (e) {
      console.log('No force path results or parse error:', e.message);
    }

    try {
      const mainPathRaw = core.getInput('main-path-results');
      if (mainPathRaw && mainPathRaw !== '{}') {
        mainPathResults = JSON.parse(mainPathRaw);
      }
    } catch (e) {
      console.log('No main path results or parse error:', e.message);
    }

    // Parse filter names from comma-separated string
    let filterNames = [];
    try {
      if (!filtersList || !filtersList.trim()) {
        throw new Error('filters-list input is required and cannot be empty');
      }

      filterNames = filtersList
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (filterNames.length === 0) {
        throw new Error('No valid filter names found');
      }
    } catch (error) {
      core.setFailed(`Failed to parse filter names: ${error.message}`);
      return;
    }

    console.log('Processing filters:', filterNames);

    const results = {};

    // Handle early exit scenarios
    if (shouldSkip) {
      console.log('🚫 Generating SKIP results (all false)');
      for (const filterName of filterNames) {
        results[filterName] = false;
      }
    } else if (forceTriggered && !skipForceLogic) {
      console.log('🚀 Generating FORCE results (all true)');
      for (const filterName of filterNames) {
        results[filterName] = true;
      }
    } else if (!needsPathFiltering) {
      console.log('⚡ No path filtering needed, all false');
      for (const filterName of filterNames) {
        results[filterName] = false;
      }
    } else {
      console.log('📁 Generating PATH-BASED results');

      const forcePathsTriggered = forcePathResults['force-paths'] === 'true';

      if (forcePathsTriggered && !skipForceLogic) {
        console.log('🚀 FORCE-PATHS triggered - all filters true');
        for (const filterName of filterNames) {
          results[filterName] = true;
        }
      } else {
        console.log('📋 Using individual path results');
        for (const filterName of filterNames) {
          const pathResult = mainPathResults[filterName] === 'true';
          results[filterName] = pathResult;

          console.log(`Filter ${filterName}: ${pathResult}`);
        }
      }
    }

    core.setOutput('should_run', JSON.stringify(results));

    console.log('✅ Final results:', results);
  } catch (error) {
    core.setFailed(`Failed to generate outputs: ${error.message}`);
  }
};
