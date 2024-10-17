const fs = require("fs").promises;
const path = require("path");
const cliProgress = require("cli-progress"); // Add the progress bar package

// Path to config file
const configPath = path.join(__dirname, "../config.json");

// Function to load the config file and read min and max wait times
async function loadConfig() {
  const data = await fs.readFile(configPath, "utf8");
  return JSON.parse(data);
}

// Function to generate a random number between low and high (in milliseconds)
function getRandomWaitTime(min, max) {
  const randomSeconds = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomSeconds * 1000; // Convert to milliseconds
}

// Function to wait for a random interval between min and max wait times
async function waitRandomInterval() {
  const config = await loadConfig();
  const minWaitTime = config.configValues.minWaitTimeSeconds;
  const maxWaitTime = config.configValues.maxWaitTimeSeconds;

  const waitTime = getRandomWaitTime(minWaitTime, maxWaitTime);
  const waitTimeInSeconds = waitTime / 1000;

  // Set up the progress bar
  const progressBar = new cliProgress.SingleBar({
    format: "Waiting [{bar}] {percentage}% | ETA: {eta}s",
    barCompleteChar: "#",
    barIncompleteChar: ".",
    hideCursor: true,
  });

  console.log(`Waiting for ${waitTimeInSeconds} seconds...`);

  // Start the progress bar with the total wait time (in seconds)
  progressBar.start(waitTimeInSeconds, 0);

  let intervalTime = 100; // Update every 100ms
  let elapsed = 0;

  // Update the progress bar every 100ms
  const interval = setInterval(() => {
    elapsed += intervalTime / 1000; // Convert ms to seconds
    progressBar.update(elapsed);

    if (elapsed >= waitTimeInSeconds) {
      clearInterval(interval);
      progressBar.stop(); // Stop the progress bar when complete
    }
  }, intervalTime);

  // Wait for the randomly generated time
  await new Promise((resolve) => setTimeout(resolve, waitTime));
}

module.exports = { waitRandomInterval };
