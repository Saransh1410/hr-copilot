const fs = require('fs');
const lines = fs.readFileSync('c:\\Users\\ATM\\Desktop\\HR Copilot\\pages.js', 'utf8').split('\n');
lines.forEach((line, idx) => {
  if (line.includes('resetAll') || line.includes('resetAllData') || line.includes('Reset All Data')) {
    console.log(`Line ${idx + 1}: ${line}`);
  }
});
