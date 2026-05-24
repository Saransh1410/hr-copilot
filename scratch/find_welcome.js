const fs = require('fs');
['app.js', 'pages.js', 'index.html'].forEach(file => {
  const code = fs.readFileSync(`c:\\Users\\ATM\\Desktop\\HR Copilot\\${file}`, 'utf8');
  if (code.includes('Welcome Back') || code.includes('welcome back') || code.includes('Welcome back')) {
    console.log(`Found in ${file}`);
    const lines = code.split('\n');
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes('welcome back')) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
      }
    });
  }
});
