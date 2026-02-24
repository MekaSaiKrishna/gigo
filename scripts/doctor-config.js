const fs = require("fs");

const filesToValidate = [
  "package.json",
  "app.json",
  "babel.config.js",
  "metro.config.js",
  "tailwind.config.js",
  "global.css",
];

function hasNullBytes(buffer) {
  for (const byte of buffer) {
    if (byte === 0) return true;
  }
  return false;
}

function checkJson(path) {
  const text = fs.readFileSync(path, "utf8");
  JSON.parse(text);
}

function run() {
  const errors = [];

  for (const file of filesToValidate) {
    if (!fs.existsSync(file)) {
      errors.push(`Missing file: ${file}`);
      continue;
    }

    const raw = fs.readFileSync(file);
    if (hasNullBytes(raw)) {
      errors.push(`Null bytes found in ${file}`);
    }
  }

  try {
    checkJson("package.json");
  } catch (error) {
    errors.push(`Invalid JSON in package.json: ${error.message}`);
  }

  try {
    checkJson("app.json");
  } catch (error) {
    errors.push(`Invalid JSON in app.json: ${error.message}`);
  }

  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const deps = pkg.dependencies || {};

  if (!deps.expo) {
    errors.push("Missing dependency: expo");
  }
  if (!deps["expo-router"]) {
    errors.push("Missing dependency: expo-router");
  }
  if (deps["react-native-calendars"] === "^1.1319.0") {
    errors.push("Invalid react-native-calendars version (^1.1319.0) detected.");
  }

  if (errors.length > 0) {
    console.error("Config diagnostics failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("Config diagnostics passed.");
}

run();
