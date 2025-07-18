module.exports = ({ core, context }) => {
  console.log('=== Pre-Job: Checking Conditions ===');

  // Get inputs directly from core
  const forceEvents = core
    .getInput('force-events')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const forceBranches = core
    .getInput('force-branches')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const excludeBranches = core
    .getInput('exclude-branches')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const skipForceLogic = core.getInput('skip-force-logic') === 'true';
  const filtersJson = core.getInput('filters-json');

  // Parse JSON filters (much more reliable than YAML parsing)
  let filterNames = [];
  try {
    const filters = JSON.parse(filtersJson);
    filterNames = Object.keys(filters);
  } catch (error) {
    core.setFailed(`Failed to parse filters JSON: ${error.message}`);
    return;
  }

  // Get GitHub context
  const currentEvent = context.eventName;
  // Fix: Handle different ref types safely
  const currentBranch = context.ref?.startsWith('refs/heads/')
    ? context.ref.replace('refs/heads/', '')
    : context.ref || '';
  const currentHeadRef = context.payload.pull_request?.head?.ref || '';

  console.log('Context:', {
    event: currentEvent,
    branch: currentBranch,
    headRef: currentHeadRef,
    filterCount: filterNames.length,
  });

  console.log('Configuration:', {
    forceEvents,
    forceBranches,
    excludeBranches,
    skipForceLogic,
  });

  // Validate inputs
  if (!filtersJson || !filtersJson.trim()) {
    core.setFailed('filters-json input is required and cannot be empty');
    return;
  }

  if (filterNames.length === 0) {
    core.setFailed('No valid filters found in filters-json input');
    return;
  }

  // Step 1: Check exclusion conditions (fastest short-circuit)
  const shouldSkip = excludeBranches.some(
    (branch) => currentHeadRef === branch,
  );

  if (shouldSkip) {
    console.log(`🚫 EXCLUDED: Branch ${currentHeadRef} is in exclude list`);
    core.setOutput('should_skip', true);
    core.setOutput('force_triggered', false);
    core.setOutput('needs_path_filtering', false);
    return;
  }

  // Step 2: Check force conditions (no checkout needed)
  let forceTriggered = false;
  if (!skipForceLogic) {
    const eventForce = forceEvents.includes(currentEvent);
    const branchForce = forceBranches.includes(currentBranch);
    forceTriggered = eventForce || branchForce;

    if (forceTriggered) {
      const reason = eventForce
        ? `event: ${currentEvent}`
        : `branch: ${currentBranch}`;
      console.log(`🚀 FORCED: Triggered by ${reason}`);
      core.setOutput('should_skip', false);
      core.setOutput('force_triggered', true);
      core.setOutput('needs_path_filtering', false);
      return;
    }
  }

  // Step 3: Need to do path filtering
  console.log(
    '📁 PATH FILTERING: No force conditions met, need to check changed paths',
  );
  core.setOutput('should_skip', false);
  core.setOutput('force_triggered', false);
  core.setOutput('needs_path_filtering', true);
};
