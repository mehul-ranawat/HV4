const fs = require('fs');
const file = 'c:/Users/mehul/OneDrive/Desktop/HV4/src/components/DashboardLayout.css';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /\.dash-quick-actions\s*{\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(4,\s*1fr\);\s*gap:\s*16px;\s*margin-top:\s*22px;\s*}/g,
  `.dash-quick-actions {\n  display: flex;\n  gap: 16px;\n  margin-top: 22px;\n}`
);

content = content.replace(
  /\.dash-quick-card\s*{\s*background:\s*#fff;/g,
  `.dash-quick-card {\n  flex: 1;\n  background: #fff;`
);

content = content.replace(
  /@media\s*\(max-width:\s*1024px\)\s*{\s*\.dash-stats\s*{\s*grid-template-columns:\s*repeat\(2,\s*1fr\);\s*}\s*\.dash-content-grid\s*{\s*grid-template-columns:\s*1fr;\s*}\s*\.dash-quick-actions\s*{\s*grid-template-columns:\s*repeat\(2,\s*1fr\);\s*}/g,
  `@media (max-width: 1024px) {\n  .dash-stats {\n    grid-template-columns: repeat(2, 1fr);\n  }\n\n  .dash-content-grid {\n    grid-template-columns: 1fr;\n  }\n\n  .dash-quick-actions {\n    display: grid;\n    grid-template-columns: repeat(2, 1fr);\n  }`
);

content = content.replace(
  /\.dash-quick-actions\s*{\s*grid-template-columns:\s*1fr;\s*}/g,
  `.dash-quick-actions {\n    display: grid;\n    grid-template-columns: 1fr;\n  }`
);

fs.writeFileSync(file, content);
console.log('CSS updated');
