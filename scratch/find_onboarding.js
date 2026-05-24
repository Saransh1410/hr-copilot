const fs = require('fs');
['app.js', 'pages.js', 'data.js'].forEach(file => {
  const lines = fs.readFileSync(`c:\\Users\\ATM\\Desktop\\HR Copilot\\${file}`, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('onboarding') || line.toLowerCase().includes('tour') || line.toLowerCase().includes('tutorial')) {
      console.log(`${file} Line ${idx + 1}: ${line.trim()}`);
    }
  });
});
