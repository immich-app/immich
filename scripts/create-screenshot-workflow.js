#!/usr/bin/env node

/**
 * Script to create an Immich workflow that:
 * 1. Filters assets with "screenshot" in the filename
 * 2. Adds them to a specified album
 * 3. Archives the asset
 *
 * Usage:
 *   node create-screenshot-workflow.js
 *
 * Configuration:
 *   Update the variables below with your API key and album ID
 */

// ============= CONFIGURATION =============
const API_URL = 'http://localhost:2283/api'; // Your Immich API URL
const API_KEY = 'VmD7pJoAV0NLVRRb00CfVB810XQMtqMIxNebNh1Weg'; // Your Immich API key
const ALBUM_ID = '0d08bdca-5866-4ecf-bc96-6a738537ff9b'; // Target album ID for screenshots
// =========================================

async function makeApiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  // Handle NO_CONTENT responses
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function getPluginFiltersAndActions() {
  console.log('Fetching available plugins...');
  const plugins = await makeApiRequest('/plugins');

  // Extract all filters and actions from all plugins
  const filters = [];
  const actions = [];

  for (const plugin of plugins) {
    if (plugin.filters) {
      filters.push(...plugin.filters);
    }
    if (plugin.actions) {
      actions.push(...plugin.actions);
    }
  }

  return { filters, actions };
}

async function getCurrentUser() {
  console.log('Fetching current user info...');
  const user = await makeApiRequest('/users/me');
  return user;
}
async function createWorkflow() {
  console.log('\n📋 Creating Screenshot Workflow...\n');

  // Step 0: Get current user info for debugging
  const user = await getCurrentUser();
  console.log(`✓ Authenticated as: ${user.name} (${user.email})`);
  console.log(`  User ID: ${user.id}\n`);

  // Step 1: Get available filters and actions
  const { filters, actions } = await getPluginFiltersAndActions();

  // Find the file_name filter
  const fileNameFilter = filters.find((f) => f.name === 'filterFileName');
  if (!fileNameFilter) {
    throw new Error(
      'file_name filter not found. Make sure plugins are loaded.'
    );
  }
  console.log(`✓ Found file_name filter (ID: ${fileNameFilter.id})`);

  // Find the add_to_album action
  const addToAlbumAction = actions.find((a) => a.name === 'actionAddToAlbum');
  if (!addToAlbumAction) {
    throw new Error(
      'add_to_album action not found. Make sure plugins are loaded.'
    );
  }
  console.log(`✓ Found add_to_album action (ID: ${addToAlbumAction.id})`);

  // Find the archive action
  const archiveAction = actions.find((a) => a.name === 'actionArchive');
  if (!archiveAction) {
    throw new Error('archive action not found. Make sure plugins are loaded.');
  }
  console.log(`✓ Found archive action (ID: ${archiveAction.id})`);

  // Step 2: Create the workflow with filters and actions in a single request
  console.log('\n📝 Creating workflow with filters and actions...');
  const workflowData = {
    triggerType: 'AssetCreate',
    name: 'screenshot_organizer',
    displayName: 'Screenshot Organizer',
    description:
      'Automatically organize screenshots into an album and archive them',
    enabled: true,
    triggerConfig: {
      assetType: 'All',
    },
    filters: [
      {
        filterId: fileNameFilter.id,
        filterConfig: {
          pattern: 'screenshot',
          matchType: 'contains',
          caseSensitive: false,
        },
      },
    ],
    actions: [
      {
        actionId: addToAlbumAction.id,
        actionConfig: {
          albumId: ALBUM_ID,
        },
      },
      {
        actionId: archiveAction.id,
        actionConfig: {},
      },
    ],
  };

  const workflow = await makeApiRequest('/workflows', 'POST', workflowData);
  console.log(
    `✓ Created workflow: ${workflow.displayName} (ID: ${workflow.id})`
  );
  console.log(`  Owner ID: ${workflow.ownerId}`);
  console.log(`  Filters: ${workflow.filters.length}`);
  console.log(`  Actions: ${workflow.actions.length}`);

  // Step 3: Show workflow summary
  console.log('\n✅ Workflow created successfully!\n');
  console.log('==========================================');
  console.log('Workflow Summary:');
  console.log('==========================================');
  console.log(`Name: ${workflow.displayName}`);
  console.log(`Description: ${workflow.description}`);
  console.log(`Enabled: ${workflow.enabled}`);
  console.log(`Trigger: ${workflow.triggerType}`);
  console.log(`\nFilters (${workflow.filters.length}):`);
  workflow.filters.forEach((filter, idx) => {
    console.log(`  ${idx + 1}. Filter ID: ${filter.filterId}`);
    console.log(`     Config: ${JSON.stringify(filter.filterConfig)}`);
  });
  console.log(`\nActions (${workflow.actions.length}):`);
  workflow.actions.forEach((action, idx) => {
    console.log(`  ${idx + 1}. Action ID: ${action.actionId}`);
    console.log(`     Config: ${JSON.stringify(action.actionConfig)}`);
  });
  console.log('==========================================\n');

  return workflow;
}

// Main execution
async function main() {
  console.log('🚀 Screenshot Workflow Creator for Immich\n');

  // Validate configuration
  if (API_KEY === 'YOUR_API_KEY_HERE') {
    console.error(
      '❌ Error: Please set your API_KEY in the script configuration'
    );
    process.exit(1);
  }

  if (ALBUM_ID === 'YOUR_ALBUM_ID_HERE') {
    console.error(
      '❌ Error: Please set your ALBUM_ID in the script configuration'
    );
    process.exit(1);
  }

  try {
    await createWorkflow();
    console.log('✅ All done! Your screenshot workflow is now active.');
    console.log('💡 Any new assets with "screenshot" in the name will be:');
    console.log('   1. Added to the specified album');
    console.log('   2. Automatically archived');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { createWorkflow, makeApiRequest };
