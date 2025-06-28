module.exports = {
  // Lint & format TypeScript and JavaScript files
  '**/*.(ts|tsx|js|jsx)': (filenames) => [
    `eslint --fix ${filenames.join(' ')}`,
    `prettier --write ${filenames.join(' ')}`,
  ],
  
  // Format JSON, CSS, SCSS, and Markdown files
  '**/*.(json|css|scss|md)': (filenames) => `prettier --write ${filenames.join(' ')}`,
  
  // Lint Python files
  '**/*.py': (filenames) => `flake8 ${filenames.join(' ')}`,
}
