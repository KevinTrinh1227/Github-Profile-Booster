require("dotenv").config(); // Load environment variables from .env file
const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const {
  nextInQueue,
  addUserToUnfollowQueue,
  removeUserFromFollowQueue,
  addUserToPendingFollowBack,
} = require("./queues");

// Load the GitHub token from environment variables
const YOUR_GITHUB_PERSONAL_ACCESS_TOKEN = process.env.GITHUB_TOKEN;

// this is the function to save the userID
// Path to the JSON file
const usersFollowedPath = path.join(__dirname, "../data/users_followed.json");

// Function to save the userID to the JSON file
async function saveUserIDToFollowed(userID) {
  try {
    // Load the existing followed users from the file
    let followedUsersArray = [];
    try {
      const data = await fs.readFile(usersFollowedPath, "utf8");
      followedUsersArray = JSON.parse(data); // Parse existing data
    } catch (error) {
      console.log("No existing followed users list. Creating a new one.");
    }

    // Check if the userID already exists in the array
    if (!followedUsersArray.includes(userID)) {
      followedUsersArray.push(userID); // Add userID to the array
      await fs.writeFile(
        usersFollowedPath,
        JSON.stringify(followedUsersArray, null, 4),
        "utf8"
      ); // Save the updated array
      console.log(`User ${userID} has been added to the followed users list.`);
    } else {
      console.log(`User ${userID} is already in the followed users list.`);
    }
  } catch (error) {
    console.error("Error saving userID to followed users list:", error);
  }
}

// Function to load all user IDs from the JSON file into a Set
async function loadFollowedUsersSet() {
  try {
    // Load the existing followed users from the file
    const data = await fs.readFile(usersFollowedPath, "utf8");
    const followedUsersArray = JSON.parse(data); // Parse the JSON file into an array

    // Convert the array to a Set for fast lookups
    const followedUsersSet = new Set(followedUsersArray);
    console.log("Followed users loaded into memory.");

    return followedUsersSet;
  } catch (error) {
    console.log(
      "No existing followed users list found, starting with an empty Set."
    );
    return new Set(); // Return an empty Set if the file doesn't exist
  }
}

// ======================================
// this is a regular follow function that will
// follow a user given their username
// ======================================
async function followUser(userObject) {
  const token = YOUR_GITHUB_PERSONAL_ACCESS_TOKEN; // Using the token from .env
  const username = userObject.login;
  const userID = userObject.id;

  try {
    const response = await axios.put(
      `https://api.github.com/user/following/${username}`,
      null, // Body content is null since we need Content-Length to be 0
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          accept: "application/vnd.github+json",
          "Content-Length": "0",
        },
      }
    );

    if (response.status === 204) {
      console.log(`Successfully followed ${username}.`);
      await addUserToPendingFollowBack(userObject);
      await saveUserIDToFollowed(userID);
    } else {
      console.log(`Failed to follow ${username}. Status: ${response.status}`);
    }
  } catch (error) {
    console.error(
      `Error following ${username}:`,
      error.response ? error.response.status : error.message
    );
  }
}

module.exports = { followUser, saveUserIDToFollowed, loadFollowedUsersSet };
