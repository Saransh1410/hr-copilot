const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\ATM\\.gemini\\antigravity\\brain\\b4e04552-8736-467f-8e7b-f2787bc9e8a6\\.system_generated\\logs\\transcript.jsonl';

const fileStream = fs.createReadStream(logPath);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

let lineNum = 0;
rl.on('line', (line) => {
  lineNum++;
  if (line.includes('png') || line.includes('jpg') || line.includes('emailjs') || line.includes('Template') || line.includes('vojci9b') || line.includes('6erl8j5')) {
    if (line.includes('USER_INPUT')) {
      const obj = JSON.parse(line);
      console.log(`Line ${lineNum}: User message: ${obj.content ? obj.content.substring(0, 500) : ''}`);
    }
  }
});
