const fs = require('fs');
['index.html', 'app.js', 'pages.js'].forEach(file => {
  const code = fs.readFileSync(`c:\\Users\\ATM\\Desktop\\HR Copilot\\${file}`, 'utf8');
  if (code.includes('sidebar')) {
    console.log(`Found in ${file}`);
  }
});
