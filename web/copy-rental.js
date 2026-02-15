const fs = require("fs");
const path = require("path");

const sourceDir =
  "c:\\Users\\merce\\Desktop\\desarrollo\\DivancoSaas\\web\\src\\modules\\rental";
const targetDir =
  "c:\\Users\\merce\\Desktop\\desarrollo\\DivancoSaas\\web\\src\\verticals\\rental";

function copyDirectorySync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);

  files.forEach((file) => {
    // Skip module.ts as we have rental.vertical.ts instead
    if (file === "module.ts") {
      console.log(`Skipping ${file}`);
      return;
    }

    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      copyDirectorySync(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Copied: ${file}`);
    }
  });
}

console.log("Starting copy...");
copyDirectorySync(sourceDir, targetDir);
console.log("Copy completed!");
