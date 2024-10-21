const fs = require("fs").promises;
const path = require("path");

// Path to the follow queue JSON file
const followQueuePath = path.join(__dirname, "../data/follow_queue.json");
const pendingFollowBackPath = path.join(
  __dirname,
  "../data/pending_follow_back.json"
);
const unfollowQueuePath = path.join(__dirname, "../data/unfollow_queue.json");
const configPath = path.join(__dirname, "../config.json");

// Function to remove users from follow_queue.json if they are present in the followedUsersSet
async function cleanFollowQueue(followedUsersSet) {
  try {
    // Load the follow queue from the file
    const data = await fs.readFile(followQueuePath, "utf8");
    let followQueue = JSON.parse(data);

    // Iterate over the follow queue and remove users present in the followedUsersSet
    let removalCount = 0;
    for (const userID in followQueue) {
      if (followedUsersSet.has(parseInt(userID))) {
        // Check if the user ID is in the Set
        delete followQueue[userID]; // Remove the user from the follow queue
        removalCount++;
      }
    }

    // Save the updated follow queue back to the file
    await fs.writeFile(
      followQueuePath,
      JSON.stringify(followQueue, null, 4),
      "utf8"
    );
    console.log(`REMOVED: ${removalCount} users from the follow queue.`);
  } catch (error) {
    console.error("Error cleaning follow queue:", error);
  }
}

// Function to return the next follower object from the queue
async function nextInFollowQueue() {
  try {
    // Read the follow queue file
    const data = await fs.readFile(followQueuePath, "utf8");
    const followQueue = JSON.parse(data);

    // Get the first follower from the queue
    const firstKey = Object.keys(followQueue)[0]; // Get the first key in the queue

    if (firstKey) {
      const follower = followQueue[firstKey];
      //console.log(follower);
      return follower; // Return the entire follower object
    } else {
      console.log("The follow queue is empty.");
      return null;
    }
  } catch (error) {
    console.error("Error reading the follow queue:", error);
    return null;
  }
}

// Function to check if the user's follow back period has expired and move them to unfollow queue
async function moveExpiredUsersToUnfollowQueue() {
  try {
    // Read and parse pending_follow_back.json
    const pendingFollowBackData = await fs.readFile(
      pendingFollowBackPath,
      "utf8"
    );
    const pendingFollowBack = JSON.parse(pendingFollowBackData);

    // Read and parse config.json
    const configData = await fs.readFile(configPath, "utf8");
    const config = JSON.parse(configData);
    const pendingFollowBackWaitTimeDays =
      config.configValues.pendingFollowBackWaitTimeDays;

    // Read or initialize unfollow_queue.json
    let unfollowQueue = {};
    try {
      const unfollowQueueData = await fs.readFile(unfollowQueuePath, "utf8");
      unfollowQueue = JSON.parse(unfollowQueueData);
    } catch (error) {
      console.log("Unfollow queue file not found, starting a new one.");
    }

    // Get the current date
    const currentDate = new Date();

    // Loop through pending_follow_back.json and check expiration
    for (const userId in pendingFollowBack) {
      if (pendingFollowBack.hasOwnProperty(userId)) {
        const user = pendingFollowBack[userId];

        // Calculate the expiration date based on the followed_on date
        const followedOnDate = new Date(user.followed_on);
        const expirationDate = new Date(followedOnDate);
        expirationDate.setDate(
          followedOnDate.getDate() + pendingFollowBackWaitTimeDays
        );

        // Check if the user has exceeded the expiration date
        if (currentDate > expirationDate) {
          console.log(
            `User ${user.login} exceeded the follow back period, moving to unfollow queue.`
          );

          // Add the user to the unfollow queue with a timestamp
          unfollowQueue[user.id] = {
            ...user,
            added_to_queue_on: new Date().toISOString(), // Add a timestamp for when the user was added
          };

          // Remove the user from pending_follow_back.json
          delete pendingFollowBack[userId];
        }
      }
    }

    // Write the updated unfollow_queue.json
    await fs.writeFile(
      unfollowQueuePath,
      JSON.stringify(unfollowQueue, null, 4),
      "utf8"
    );
    // Write the updated pending_follow_back.json
    await fs.writeFile(
      pendingFollowBackPath,
      JSON.stringify(pendingFollowBack, null, 4),
      "utf8"
    );

    console.log(
      "Users successfully moved to the unfollow queue and pending follow back list updated."
    );
  } catch (error) {
    console.error("Error moving expired users to unfollow queue:", error);
  }
}

// Function to return the next user object from the unfollow queue
async function nextInUnfollowQueue() {
  try {
    // Check if the file exists, if not, create an empty unfollow queue
    try {
      await fs.access(unfollowQueuePath); // This will throw if the file doesn't exist
    } catch (error) {
      // If file doesn't exist, create it with an empty object
      await fs.writeFile(
        unfollowQueuePath,
        JSON.stringify({}, null, 4),
        "utf8"
      );
      console.log("Unfollow queue file created.");
    }

    // Read the unfollow queue file
    const data = await fs.readFile(unfollowQueuePath, "utf8");
    const unfollowQueue = JSON.parse(data);

    // Get the first user from the queue
    const firstKey = Object.keys(unfollowQueue)[0]; // Get the first key in the queue

    if (firstKey) {
      const user = unfollowQueue[firstKey];
      return user; // Return the entire user object
    } else {
      console.log("The unfollow queue is empty.");
      return null;
    }
  } catch (error) {
    console.error("Error reading the unfollow queue:", error);
    return null;
  }
}

// Function to add a user to the PENDING follow back json with a timestamp
async function addUserToPendingFollowBack(userObj) {
  try {
    // Load the current unfollow queue (or start a new one if the file doesn't exist)
    let pendingFollowBack = {};
    try {
      const data = await fs.readFile(pendingFollowBackPath, "utf8");
      pendingFollowBack = JSON.parse(data);
    } catch (error) {
      console.log("Unfollow queue file not found, starting a new one.");
    }

    // Add the user object to the queue with a timestamp
    pendingFollowBack[userObj.id] = {
      ...userObj,
      followed_on: new Date().toISOString(), // Add a timestamp for when the user was added
    };

    // Save the updated unfollow queue to the file
    await fs.writeFile(
      pendingFollowBackPath,
      JSON.stringify(pendingFollowBack, null, 4),
      "utf8"
    );

    console.log(`User ${userObj.login} has been added to the unfollow queue.`);
  } catch (error) {
    console.error("Error adding user to unfollow queue:", error);
  }
}

// Function to add a user to the unfollow queue with a timestamp
async function addUserToUnfollowQueue(userObj) {
  try {
    // Load the current unfollow queue (or start a new one if the file doesn't exist)
    let unfollowQueue = {};
    try {
      const data = await fs.readFile(unfollowQueuePath, "utf8");
      unfollowQueue = JSON.parse(data);
    } catch (error) {
      console.log("Unfollow queue file not found, starting a new one.");
    }

    // Add the user object to the queue with a timestamp
    unfollowQueue[userObj.id] = {
      ...userObj,
      added_to_queue_on: new Date().toISOString(), // Add a timestamp for when the user was added
    };

    // Save the updated unfollow queue to the file
    await fs.writeFile(
      unfollowQueuePath,
      JSON.stringify(unfollowQueue, null, 4),
      "utf8"
    );

    console.log(`User ${userObj.login} has been added to the unfollow queue.`);
  } catch (error) {
    console.error("Error adding user to unfollow queue:", error);
  }
}

async function removeUserFromFollowQueue(userID) {
  try {
    // Load the follow queue
    const data = await fs.readFile(followQueuePath, "utf8");
    const followQueue = JSON.parse(data);

    // Check if the user exists in the queue
    if (followQueue[userID]) {
      // Delete the user from the queue
      delete followQueue[userID];

      // Save the updated queue back to the file
      await fs.writeFile(
        followQueuePath,
        JSON.stringify(followQueue, null, 4),
        "utf8"
      );

      console.log(
        `User with ID ${userID} has been removed from the follow queue.`
      );
    } else {
      console.log(`User with ID ${userID} was not found in the follow queue.`);
    }
  } catch (error) {
    console.error("Error removing user from follow queue:", error);
  }
}

module.exports = {
  nextInFollowQueue,
  nextInUnfollowQueue,
  addUserToUnfollowQueue,
  removeUserFromFollowQueue,
  addUserToPendingFollowBack,
  cleanFollowQueue,
  moveExpiredUsersToUnfollowQueue,
};
// Example usage
// nextInQueue().then(follower => console.log("Next follower to process:", follower));
