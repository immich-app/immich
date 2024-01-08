const fs = require('fs');
const path = require('path');

// Specify the directory
const dirPath = path.join(__dirname, '/FAQ');

// Read the directory
fs.readdir(dirPath, (err, files) => {
  if (err) {
    console.error('Could not list the directory.', err);
    process.exit(1);
  } 

  // Filter .md files
  const mdFiles = files.filter(file =>  path.extname(file) === '.md' &&  file !== "FAQ.md");

  // Generate import statements
  const importStatements = mdFiles.map((file,i) => {
    const componentName = path.basename(file, '.md').split("-")[0];
    return `import {toc as Toc_${componentName} ,metadata as Metadata_${componentName}} from './${file}';`;
  });

  // Combine toc and metadata under one key for each file
  const combinedStatements = mdFiles.map((file,i) => {
    const componentName = path.basename(file, '.md').split("-")[0];
    return `${componentName}: { toc: Toc_${componentName}, metadata: Metadata_${componentName} },`;
  });

  // Write to index.js
  fs.writeFile(path.join(dirPath, 'index.js'), [...importStatements, 'const combined = {', ...combinedStatements, '};'   ,`
// Convert the object to an array
const combinedArray = Object.keys(combined).map(key => ({
  key,
  toc: combined[key].toc,
  metadata: combined[key].metadata
}));

// Sort the array based on sidebar_position
combinedArray.sort((a, b) => a.metadata.frontMatter.sidebar_position - b.metadata.frontMatter.sidebar_position);

// Convert the array back to an object
export const sortedCombined = {};
combinedArray.forEach(item => {
  sortedCombined[item.key] = {
    toc: item.toc,
    metadata: item.metadata
  };
});`].join('\n'), (err) => {
    if (err) throw err;
    console.log('Index file has been saved!');
  });
});
