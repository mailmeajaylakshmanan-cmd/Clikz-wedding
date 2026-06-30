const fs = require('fs');
const path = 'c:\\\\Our-project\\\\clikz-wedding-bills\\\\clikz-wedding-billing\\\\server\\\\routes\\\\services.js';
let content = fs.readFileSync(path, 'utf8');

// Replace populate categories with category
content = content.replaceAll(".populate('categories', 'name showTerms')", ".populate('category', 'name showTerms')");
// Replace query.categories = req.query.category
content = content.replace('query.categories = req.query.category;', 'query.category = req.query.category;');

fs.writeFileSync(path, content);
console.log('Updated services routes');
