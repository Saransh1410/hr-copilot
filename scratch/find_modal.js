const fs = require('fs');
const lines = fs.readFileSync('c:\\Users\\ATM\\Desktop\\HR Copilot\\app.js', 'utf8').split('\n');
lines.forEach((line, idx) => {
  if (line.includes('int-date') || line.includes('Schedule Interview')) {
    console.log(`Line ${idx + 1}: ${line}`);
  }
});
