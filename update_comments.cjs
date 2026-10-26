const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/services/dataService.js');
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/export async function (\w+)\(([^)]*)\) \{(\r?\n)(?!\s*\/\/ TODO: replace with DB call)/g, (match, name, params, nl) => {
  return `export async function ${name}(${params}) {${nl}  // TODO: replace with DB call${nl}`;
});

fs.writeFileSync(file, code);
console.log('Updated dataService.js with DB call comments on every function.');
