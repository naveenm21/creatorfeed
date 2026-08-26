const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Verdict and Heatmap
  content = content.replace(/bg-\[#1A1A1B\]/g, 'bg-card');
  content = content.replace(/border-\[#343536\]/g, 'border-borderdefault');
  content = content.replace(/bg-\[#343536\]/g, 'bg-borderdefault');
  content = content.replace(/text-\[#D7DADC\]/g, 'text-primary');
  content = content.replace(/text-\[#818384\]/g, 'text-tertiary');
  content = content.replace(/text-\[#888\]/g, 'text-tertiary');
  content = content.replace(/bg-\[#1F1F1F\]/g, 'bg-background');
  content = content.replace(/border-\[#1F1F1F\]/g, 'border-borderdefault');
  content = content.replace(/text-\[#666\]/g, 'text-secondary');

  // Badges in TrendingView and my-debates
  content = content.replace(/let badgeStyle = ['"]bg-\[#FFFFFF15\] text-\[#FFFFFF\]['"];/g, 'let badgeStyle = "bg-primary/10 text-primary border border-primary/20";');
  content = content.replace(/if \(platform === ['"]YouTube['"]\) badgeStyle = ['"]bg-\[#FF000015\] text-\[#FF4444\]['"];/g, 'if (platform === "YouTube") badgeStyle = "bg-red-soft text-red border border-red/20";');
  content = content.replace(/if \(platform\.includes\(['"]Instagram['"]\)\) badgeStyle = ['"]bg-\[#E1306C15\] text-\[#E1306C\]['"];/g, 'if (platform.includes("Instagram")) badgeStyle = "bg-pink-soft text-brandprimary border border-brandprimarysubtle";');
  content = content.replace(/if \(platform\.includes\(['"]TikTok['"]\)\) badgeStyle = ['"]bg-\[#00F2FE15\] text-\[#00F2FE\]['"];/g, 'if (platform.includes("TikTok")) badgeStyle = "bg-primary/10 text-primary border border-primary/20";');
  content = content.replace(/if \(platform === ['"]Twitch['"]\) badgeStyle = ['"]bg-\[#9146FF15\] text-\[#9146FF\]['"];/g, 'if (platform === "Twitch") badgeStyle = "bg-purple-100 text-purple-600 border border-purple-200";');

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
