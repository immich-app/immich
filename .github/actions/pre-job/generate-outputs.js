// No longer need YAML parser - using JSON from Python conversion
module.exports = ({ core }) => {
  console.log('=== Pre-Job: Generating Final Outputs ===');

  try {
    // Get inputs directly from core
    const filtersJson = core.getInput('filters-json');
    const skipForceLogic = core.getInput('skip-force-logic') === 'true';

    // Get step outputs
    const forceTriggered = core.getInput('force-triggered') === 'true';
    const shouldSkip = core.getInput('should-skip') === 'true';
    const needsPathFiltering = core.getInput('needs-path-filtering') === 'true';

    // Parse path results from separate steps
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
      if (!filtersJson || !filtersJson.trim()) {
        throw new Error('filters-json input is required and cannot be empty');
      }

      filterNames = filtersJson
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

      // Check if force paths triggered (this forces ALL filters to true)
      const forcePathsTriggered = forcePathResults['force-paths'] === 'true';

      if (forcePathsTriggered && !skipForceLogic) {
        console.log('🚀 FORCE-PATHS triggered - all filters true');
        for (const filterName of filterNames) {
          results[filterName] = true;
        }
      } else {
        console.log('📋 Using individual path results');
        // Process each filter based on main path results
        for (const filterName of filterNames) {
          const pathResult = mainPathResults[filterName] === 'true';
          results[filterName] = pathResult;

          console.log(`Filter ${filterName}: ${pathResult}`);
        }
      }
    }

    // Output as JSON object that can be accessed with fromJSON()
    core.setOutput('should_run', JSON.stringify(results));

    console.log('✅ Final results:', results);
  } catch (error) {
    core.setFailed(`Failed to generate outputs: ${error.message}`);
  }
};
