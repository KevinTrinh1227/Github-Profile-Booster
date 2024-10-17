const fs = require("fs").promises; // Use the promise-based version of fs
const path = require("path");
const {
  addUserFollowersToQueue,
  getAllFollowersAndSaveToJson,
} = require("./followersList");

// Path to config file
const configPath = path.join(__dirname, "../config.json");

// Function to load and parse config.json asynchronously
async function loadConfig() {
  const data = await fs.readFile(configPath, "utf8");
  return JSON.parse(data);
}

// Function to save updated config.json asynchronously
async function saveConfig(config) {
  const data = JSON.stringify(config, null, 2);
  await fs.writeFile(configPath, data, "utf8");
}

// Function that performs the initial setup tasks
async function performInitialSetup() {
  console.log("Performing some initial setup tasks...");

  // Add actual setup code here
  await addUserFollowersToQueue("kevintrinh1227");

  const config = await loadConfig();
  config.initialStartup.completed = true;
  await saveConfig(config);

  console.log("Initial setup completed. Config updated.");
}

module.exports = { performInitialSetup };
