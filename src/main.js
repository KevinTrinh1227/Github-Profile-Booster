const { performInitialSetup } = require("./initialSetup");
const { followUser, loadFollowedUsersSet } = require("./followUser");
const {
  unfollowUser,
  moveFollowBacksToUnfollowQueue,
} = require("./unfollowUser");
const fs = require("fs").promises; // Use the promise-based fs module for async file operations
const path = require("path");
const { waitRandomInterval } = require("./waitInterval");
const {
  nextInFollowQueue,
  nextInUnfollowQueue,
  addUserToUnfollowQueue,
  removeUserFromFollowQueue,
} = require("./queues");
const { getTotalFollowing } = require("./followingList");
const {
  addUserFollowersToQueue,
  getAllFollowersAndSaveToJson,
} = require("./followersList");

const MY_GITHUB_USERNAME = process.env.MY_GITHUB_USERNAME;

// Path to config file
const configPath = path.join(__dirname, "../config.json");

// Function to load and parse config.json
async function loadConfig() {
  const data = await fs.readFile(configPath, "utf8"); // Now it's properly asynchronous
  return JSON.parse(data);
}

// Function to save config.json after updating
async function saveConfig(config) {
  const data = JSON.stringify(config, null, 2);
  await fs.writeFile(configPath, data, "utf8");
}

// Main function for the processing loop
async function processQueue() {
  const config = await loadConfig(); // Await loading of config file
  console.log("Starting the main processing loop...");

  while (true) {
    try {
      const myTotalFollowing = await getTotalFollowing(MY_GITHUB_USERNAME);

      console.log(`MY TOTAL FOLLOWING IS AT: ${myTotalFollowing}`);

      if (myTotalFollowing < config.configValues.maxTotalFollowing) {
        // getting the next in queue
        const nextFollower = await nextInFollowQueue(); // this gets user obj
        //console.log(nextFollower);
        if (nextFollower) {
          const nextFollowerName = nextFollower.login;
          const nextFollowerUserID = nextFollower.id;
          console.log(
            `Next follower name to process: ${nextFollowerName} (${nextFollowerUserID})`
          );

          await addUserFollowersToQueue(nextFollowerName);
          await followUser(nextFollower); // follow user using entire object
          await removeUserFromFollowQueue(nextFollowerUserID);
        } else {
          console.log("No followers left in the queue.");
        }
      } else {
        console.log(
          `NOT FOLLOWING ANY NEW USERS BECAUSE YOUR FOLLOWING MAX IN CONFIG.JSON IS ${config.configValues.maxTotalFollowing} and your currently at ${myTotalFollowing}`
        );
      }

      //await unfollowUser("example-username-to-unfollow");

      // Example: Fetch followers of a user and add them to the queue
      //await addUserFollowersToQueue("example-username-to-follow");
      await getAllFollowersAndSaveToJson(MY_GITHUB_USERNAME);
      await moveFollowBacksToUnfollowQueue(); // will see if we have user in both pending

      const nextUnfollower = await nextInUnfollowQueue();
      console.log("\nUNFOLLOWING NOW STARTING...");
      if (nextUnfollower) {
        //console.log("Next user to unfollow:", nextUnfollower);
        console.log(
          `Next user to unfollow is ${nextUnfollower.login} (${nextUnfollower.id})`
        );
        await unfollowUser(nextUnfollower);
      } else {
        console.log("No users to unfollow.");
      }

      console.log("Waiting before the next cycle...\n\n\n");
      await waitRandomInterval(); // this will wait for random interval...
    } catch (error) {
      // Log errors and continue
      console.error("Error in the processing loop:", error);
      await waitRandomInterval(); // this will wait for random interval...
    }
  }
}

// Main function to run code based on config settings
async function main() {
  const config = await loadConfig(); // Await loading of config file

  // await followUser("kevintrinh1227"); // Await the unfollow action

  if (config.initialStartup.completed === false) {
    console.log("Initial setup not completed. Running initial setup...");

    // Call the initial setup function and await if it returns a promise
    console.log("HELLO");
    await performInitialSetup();
    console.log("HELLO");

    // Mark initial setup as completed and save the updated config
    config.initialStartup.completed = true;
    await saveConfig(config); // Save the updated config
  } else {
    // this will run if this isnt the first time running
    console.log("Initial setup already completed.");
  }

  // Start the main processing loop after initial setup
  await processQueue();
}

// Run the main function
main().catch((error) => {
  console.error("Error in main function:", error); // Catch any errors from the main function
});
