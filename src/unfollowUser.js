const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

// Paths to JSON files
const pendingFollowBackPath = path.join(
  __dirname,
  "../data/pending_follow_back.json"
);
const currentFollowersPath = path.join(
  __dirname,
  "../data/current_followers.json"
);
const unfollowQueuePath = path.join(__dirname, "../data/unfollow_queue.json");

const { sendUnfollowedUserDiscordEmbed } = require("./discordWebhook");

// Path to the JSON file storing past followed and unfollowed users
const pastFollowsUnfollowsPath = path.join(
  __dirname,
  "../data/past_follows_unfollows.json"
);

// Function to unfollow a user (taking the entire user object as parameter)
async function unfollowUser(user) {
  const YOUR_GITHUB_PERSONAL_ACCESS_TOKEN = process.env.GITHUB_TOKEN;
  console.log("UNFOLLOWING...");

  try {
    const response = await axios({
      method: "delete",
      url: `https://api.github.com/user/following/${user.login}`, // Use the 'login' field from the user object
      headers: {
        Authorization: `Bearer ${YOUR_GITHUB_PERSONAL_ACCESS_TOKEN}`, // Use 'Bearer' for authentication
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28", // Optional version header
      },
    });

    if (response.status === 204) {
      console.log(`Successfully unfollowed ${user.login}`);

      sendUnfollowedUserDiscordEmbed(user);

      // Add the unfollowedAt timestamp to the user object
      user.unfollowedAt = new Date().toISOString();

      // Log the unfollowed user object to the file
      await logUnfollowedUser(user);

      // Remove the user from the unfollow queue
      await removeFromUnfollowQueue(user.id);
    } else {
      console.log(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    console.error(
      `Error unfollowing ${user.login}: ${
        error.response ? error.response.data.message : error.message
      }`
    );
  }
}

// Function to log the unfollowed user to a JSON file
async function logUnfollowedUser(user) {
  try {
    let pastFollowsUnfollows = [];

    // Load the existing data from the file (if it exists)
    try {
      const data = await fs.readFile(pastFollowsUnfollowsPath, "utf8");
      pastFollowsUnfollows = JSON.parse(data);
    } catch (error) {
      console.log("No previous follow/unfollow log found, creating a new one.");
    }

    // Add the unfollowed user to the list
    pastFollowsUnfollows.push(user);

    // Save the updated list to the file
    await fs.writeFile(
      pastFollowsUnfollowsPath,
      JSON.stringify(pastFollowsUnfollows, null, 4),
      "utf8"
    );
    console.log(`Logged unfollowed user: ${user.login}`);
  } catch (error) {
    console.error("Error logging unfollowed user:", error.message);
  }
}

// Function to remove a user from the unfollow queue based on their ID
async function removeFromUnfollowQueue(userId) {
  try {
    let unfollowQueue = {};

    // Load the unfollow queue
    try {
      const data = await fs.readFile(unfollowQueuePath, "utf8");
      unfollowQueue = JSON.parse(data);
    } catch (error) {
      console.log("No unfollow queue found, creating a new one.");
    }

    // Remove the user by their ID from the unfollow queue
    if (unfollowQueue[userId]) {
      delete unfollowQueue[userId];
      console.log(`Removed user ID ${userId} from unfollow queue.`);
    } else {
      console.log(`User ID ${userId} not found in the unfollow queue.`);
    }

    // Save the updated unfollow queue back to the file
    await fs.writeFile(
      unfollowQueuePath,
      JSON.stringify(unfollowQueue, null, 4),
      "utf8"
    );
  } catch (error) {
    console.error("Error removing user from unfollow queue:", error.message);
  }
}

// Function to move users from pending follow-back to unfollow queue if they followed back
async function moveFollowBacksToUnfollowQueue() {
  try {
    // Load pending follow-back list
    const pendingFollowBackData = await fs.readFile(
      pendingFollowBackPath,
      "utf8"
    );
    let pendingFollowBack = JSON.parse(pendingFollowBackData);

    // Load current followers list
    const currentFollowersData = await fs.readFile(
      currentFollowersPath,
      "utf8"
    );
    const currentFollowers = JSON.parse(currentFollowersData);

    // Load or initialize unfollow queue
    let unfollowQueue = {};
    try {
      const unfollowQueueData = await fs.readFile(unfollowQueuePath, "utf8");
      unfollowQueue = JSON.parse(unfollowQueueData);
    } catch (error) {
      console.log("No unfollow queue found, starting a new one.");
    }

    // Create a Set of current followers' user IDs for quick lookup
    const currentFollowerIds = new Set(
      currentFollowers.map((follower) => follower.id)
    );

    // Check for users in pending follow-back who are now following back
    for (const userID in pendingFollowBack) {
      if (currentFollowerIds.has(parseInt(userID))) {
        // If the user is following back, move them to the unfollow queue
        unfollowQueue[userID] = {
          ...pendingFollowBack[userID],
          movedToUnfollowAt: new Date().toISOString(),
        };

        // Remove the user from the pending follow-back list
        delete pendingFollowBack[userID];
      }
    }

    // Save updated pending follow-back and unfollow queue lists
    await fs.writeFile(
      unfollowQueuePath,
      JSON.stringify(unfollowQueue, null, 4),
      "utf8"
    );
    await fs.writeFile(
      pendingFollowBackPath,
      JSON.stringify(pendingFollowBack, null, 4),
      "utf8"
    );

    console.log("Processed follow-backs and updated the unfollow queue.");
  } catch (error) {
    console.error("Error processing follow-backs:", error);
  }
}

module.exports = { unfollowUser, moveFollowBacksToUnfollowQueue };
