const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const featureFolder = './features';
const progressFile = './.feature-progress.json';
const srcFolder = './src';

function getFeatureFiles() {
  return fs.readdirSync(featureFolder)
    .filter(f => f.endsWith('.md'))
    .sort();
}

function getProgress() {
  if (fs.existsSync(progressFile)) {
    return JSON.parse(fs.readFileSync(progressFile));
  }
  return { completed: [] };
}

function saveProgress(progress) {
  fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));
}

function markFeatureDone(featureFile) {
  const progress = getProgress();
  if (!progress.completed.includes(featureFile)) {
    progress.completed.push(featureFile);
    saveProgress(progress);
    console.log(`Marked ${featureFile} as done.`);
  }
}

function createImplementationFile(featureFile) {
  const baseName = path.basename(featureFile, '.md');
  const implFile = `${srcFolder}/${baseName}.js`;

  if (!fs.existsSync(implFile)) {
    const featureSpec = fs.readFileSync(`${featureFolder}/${featureFile}`, 'utf-8');
    const template = `/*\nAuto-generated for ${featureFile}\n\n${featureSpec}\n\nImplementation starts below:\n*/\n\n// TODO: Implement feature here\n`;
    fs.writeFileSync(implFile, template);
    console.log(`Created implementation file: ${implFile}`);
  }
  return implFile;
}

function openNextFeature() {
  const features = getFeatureFiles();
  const progress = getProgress();

  const nextFeature = features.find(f => !progress.completed.includes(f));
  if (!nextFeature) {
    console.log('All features completed!');
    return;
  }

  console.log(`Opening next feature: ${nextFeature}`);

  const implFile = createImplementationFile(nextFeature);

  exec(`code ${featureFolder}/${nextFeature} ${implFile}`, (err) => {
    if (err) {
      console.error('Failed to open files:', err);
    }
  });
}

// CLI options: mark done or open next
const arg = process.argv[2];
const targetFeature = process.argv[3];

if (arg === 'done' && targetFeature) {
  markFeatureDone(targetFeature);
} else {
  openNextFeature();
}
