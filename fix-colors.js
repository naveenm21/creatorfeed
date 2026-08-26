const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Backgrounds
  content = content.replace(/bg-\[#0A0A0A\]/g, 'bg-card');
  content = content.replace(/bg-\[#0a0a0a\]/g, 'bg-card');
  content = content.replace(/bg-\[#111\]/g, 'bg-background');
  content = content.replace(/bg-\[#111111\]/g, 'bg-background');
  content = content.replace(/bg-\[#222\]/g, 'bg-cardhover');

  // Borders
  content = content.replace(/border-\[#1F1F1F\]/g, 'border-borderdefault');
  content = content.replace(/border-\[#222\]/g, 'border-borderdefault');
  content = content.replace(/border-\[#2a2a2a\]/g, 'border-borderhover');

  // Verdict specifically has a text-white that needs changing to text-primary
  if (filePath.includes('Verdict.tsx')) {
    content = content.replace(/text-white/g, 'text-primary');
  }
  
  if (filePath.includes('Footer.tsx')) {
    content = content.replace(/text-white/g, 'text-primary');
  }

  // ConflictHeatmap
  if (filePath.includes('ConflictHeatmap.tsx')) {
    content = content.replace(/text-white/g, 'text-primary');
  }

  // ShareDialog
  if (filePath.includes('ShareDialog.tsx')) {
    content = content.replace(/text-white/g, 'text-primary');
  }
  
  // TrendingView
  if (filePath.includes('TrendingView.tsx')) {
    content = content.replace(/text-white/g, 'text-brandprimary'); 
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir('./app');
walkDir('./components');
