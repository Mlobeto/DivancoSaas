const fs = require("fs");
const path = require("path");

const filePath = path.join(
  __dirname,
  "src",
  "verticals",
  "rental",
  "components",
  "AssetSearchInput.tsx",
);
const dirPath = path.dirname(filePath);

// Delete the file if it exists
if (fs.existsSync(filePath)) {
  fs.unlinkSync(filePath);
  console.log("Deleted:", filePath);
}

// Try to remove the components directory if it's empty
try {
  fs.rmdirSync(dirPath);
  console.log("Deleted empty directory:", dirPath);
} catch (e) {
  console.log("Directory not empty or already deleted");
}

console.log("Cleanup complete");
