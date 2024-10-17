const axios = require("axios");
const fs = require("fs").promises; // Use promise-based fs operations
const path = require("path");
require("dotenv").config(); // Ensure that environment variables are loaded
const { followUser, loadFollowedUsersSet } = require("./followUser");

const { cleanFollowQueue } = require("./queues");

const YOUR_GITHUB_PERSONAL_ACCESS_TOKEN = process.env.GITHUB_TOKEN;

// Path to the follow queue JSON file
const queuePath = path.join(__dirname, "../data/follow_queue.json");

// Path to save the followers to a JSON file
const followersFilePath = path.join(
  __dirname,
  "../data/current_followers.json"
);

// Path to config file
const configPath = path.join(__dirname, "../config.json");

// Function to load the follow queue from file asynchronously
async function loadFollowQueue() {
  try {
    // Check if the file exists
    await fs.access(queuePath);

    // Read the file and parse the follow queue
    const data = await fs.readFile(queuePath, "utf8");
    return JSON.parse(data) || {}; // Return the parsed data, or an empty object if data is null
  } catch (error) {
    // If the file doesn't exist or there is an error, return an empty object
    console.log("No follow queue found, starting a new one.");
    return {}; // Return an empty object to avoid null/undefined issues
  }
}

// Function to save the follow queue to file asynchronously
async function saveFollowQueue(followQueue) {
  await fs.writeFile(queuePath, JSON.stringify(followQueue, null, 4), "utf8");
}

// Function to load config
async function loadConfig() {
  const data = await fs.readFile(configPath, "utf8");
  return JSON.parse(data);
}

// Function to fetch followers and add to the follow queue
async function addUserFollowersToQueue(username) {
  // Load the current follow queue and config
  console.log("Fetching followers for:", username);

  let followQueue = await loadFollowQueue(); // This should now always be an object

  const config = await loadConfig(); // Assuming loadConfig() returns a valid config

  // Get the maximum number of users allowed in the queue from config
  const maxQueueSize = config.configValues.queueListMaxUsers;

  // Get the current number of users in the queue
  const currentQueueSize = Object.keys(followQueue).length;

  // Calculate how many more users can be added
  const availableSpace = maxQueueSize - currentQueueSize;

  // Check if the queue has reached or exceeded the maximum size
  if (availableSpace <= 0) {
    console.log("Queue has reached its maximum limit. Ignoring the request.");
    return;
  } else if (availableSpace <= 100) {
    console.log(
      `Queue is close to its maximum limit. Can only add ${availableSpace} more users.`
    );
  }

  try {
    // Fetch up to 100 followers from GitHub API
    const response = await axios.get(
      `https://api.github.com/users/${username}/followers`,
      {
        headers: {
          Authorization: `Bearer ${YOUR_GITHUB_PERSONAL_ACCESS_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
        params: {
          per_page: 100, // Fetch up to 100 followers
          page: 1, // Only fetch the first page for now
        },
      }
    );

    const followers = response.data;

    // Only add as many followers as we have space for in the queue
    let followersAdded = 0;
    for (const follower of followers) {
      if (followersAdded >= availableSpace) {
        break; // Stop adding once we reach the available space
      }

      if (!followQueue[follower.id]) {
        followQueue[follower.id] = {
          ...follower, // Store the follower's full details
          fetchedAt: new Date().toISOString(), // Add a timestamp
        };
        followersAdded++;
      }
    }

    // Save updated follow queue to file
    await saveFollowQueue(followQueue);

    console.log(
      `Added ${followersAdded} followers of ${username} to the follow queue. Total in queue: ${
        Object.keys(followQueue).length
      }`
    );

    // Clean the follow queue by removing already followed users
    const followedUsersSet = await loadFollowedUsersSet();
    await cleanFollowQueue(followedUsersSet);
  } catch (error) {
    // More detailed error logging
    if (error.response) {
      console.error(
        `Error fetching followers for ${username}: ${error.response.status} - ${error.response.data.message}`
      );
    } else {
      console.error(
        `Error fetching followers for ${username}: ${error.message}`
      );
    }
  }
}

// Function to get all followers of a GitHub user and save them to a JSON file
async function getAllFollowersAndSaveToJson(username) {
  const YOUR_GITHUB_PERSONAL_ACCESS_TOKEN = process.env.GITHUB_TOKEN; // Assuming token is in .env file
  let allFollowers = []; // To store all followers
  let page = 1; // Start from page 1
  const perPage = 100; // Fetch 100 followers per page

  try {
    // Loop to get all pages of followers
    while (true) {
      const response = await axios.get(
        `https://api.github.com/users/${username}/followers`,
        {
          headers: {
            Authorization: `Bearer ${YOUR_GITHUB_PERSONAL_ACCESS_TOKEN}`,
            Accept: "application/vnd.github+json",
          },
          params: {
            per_page: perPage, // Fetch up to 100 followers per page
            page: page, // Pagination page number
          },
        }
      );

      const followers = response.data;

      // Break out of the loop if no more followers are returned
      if (followers.length === 0) {
        break;
      }

      // Add followers from this page to the allFollowers array
      allFollowers = allFollowers.concat(followers);

      // Log progress
      console.log(`Fetched ${followers.length} followers from page ${page}.`);

      // Increment the page for the next request
      page++;
    }

    // Save the followers to a JSON file
    await fs.writeFile(
      followersFilePath,
      JSON.stringify(allFollowers, null, 4),
      "utf8"
    );
    console.log(
      `Saved ${allFollowers.length} followers to ${followersFilePath}`
    );
  } catch (error) {
    console.error(`Error fetching followers for ${username}:`, error.message);
  }
}

module.exports = { addUserFollowersToQueue, getAllFollowersAndSaveToJson };
