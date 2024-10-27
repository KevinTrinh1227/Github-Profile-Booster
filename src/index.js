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
  moveExpiredUsersToUnfollowQueue,
} = require("./queues");
const { getTotalFollowing } = require("./followingList");
const {
  addUserFollowersToQueue,
  getAllFollowersAndSaveToJson,
} = require("./followersList");
const {
  sendDiscordNotification,
  sendDiscordEmbed,
} = require("./discordWebhook");

const cron = require("node-cron");
const { sendDailyMetrics } = require("./metrics");
// Schedule to run every day at 12am
cron.schedule("0 0 * * *", async () => {
  await sendDailyMetrics();
  console.log("Daily metrics job executed at 12am");
});

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

// Helper function to get a random integer between min and max (inclusive)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Main function for the processing loop
async function processQueue() {
  const config = await loadConfig(); // Await loading of config file
  console.log("Starting the main processing loop...");
  await sendDailyMetrics();

  sendDiscordEmbed(
    "Application is now online!",
    "Note that this application may result in your account getting banned. Please proceed with caution and use appropriate config settings.\n\n**Github Repo Link ➜** [Github-Followers-Bot](https://github.com/KevinTrinh1227/Github-Followers-Bot)\n**Report issues ➜** [Github Support Ticket](https://github.com/KevinTrinh1227/Github-Followers-Bot/issues)\n**My Github Page ➜** [Visit My Profile](https://github.com/KevinTrinh1227)\n\nReport any and all issues on Github. Please support me by **starring** and/or **forking** my repositories! Thank you for using my product!",
    "#55FF55"
  );

  // await moveFollowBacksToUnfollowQueue();

  while (true) {
    try {
      const myTotalFollowing = await getTotalFollowing(MY_GITHUB_USERNAME);
      console.log(`\nMY TOTAL FOLLOWING IS AT: ${myTotalFollowing}`);

      // Follow random number of users
      if (myTotalFollowing < config.configValues.maxTotalFollowing) {
        const followCount = getRandomInt(
          config.configValues.minCycleFollowCount,
          config.configValues.maxCycleFollowCount
        ); // Random number of users to follow
        console.log(`Attempting to follow ${followCount} users...`);

        for (let i = 0; i < followCount; i++) {
          const nextFollower = await nextInFollowQueue(); // Get user object from the queue
          if (nextFollower) {
            const nextFollowerName = nextFollower.login;
            const nextFollowerUserID = nextFollower.id;
            console.log(
              `Next follower name to process: ${nextFollowerName} (${nextFollowerUserID})`
            );

            await addUserFollowersToQueue(nextFollowerName);
            await followUser(nextFollower); // Follow user using the entire object
            await removeUserFromFollowQueue(nextFollowerUserID);
          } else {
            console.log("No followers left in the queue.");
            break;
          }
          await waitRandomInterval(); // Wait before processing the next user
        }
      } else {
        console.log(
          `NOT FOLLOWING ANY NEW USERS BECAUSE YOUR FOLLOWING MAX IN CONFIG.JSON IS ${config.configValues.maxTotalFollowing} and your currently at ${myTotalFollowing}`
        );
      }

      // Unfollow random number of users
      const unfollowCount = getRandomInt(
        config.configValues.minCycleUnfollowCount,
        config.configValues.maxCycleUnfollowCount
      ); // Random number of users to unfollow
      console.log(`Attempting to unfollow ${unfollowCount} users...`);

      for (let i = 0; i < unfollowCount; i++) {
        const nextUnfollower = await nextInUnfollowQueue();
        if (nextUnfollower) {
          console.log(
            `Next user to unfollow is ${nextUnfollower.login} (${nextUnfollower.id})`
          );
          await unfollowUser(nextUnfollower);
        } else {
          console.log("No users to unfollow.");
          break;
        }
        await waitRandomInterval(); // Wait before processing the next unfollow
      }

      // Move expired users to the unfollow queue if none to unfollow
      await moveExpiredUsersToUnfollowQueue();
      // check to see who has followed us back then put them in unfollow queue
      await moveFollowBacksToUnfollowQueue();

      console.log("Waiting before the next cycle...\n\n\n");
      await waitRandomInterval(); // Wait for a random interval...
    } catch (error) {
      // Log errors and continue
      console.error("Error in the processing loop:", error);
      await waitRandomInterval(); // Wait for a random interval...
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
