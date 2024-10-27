const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Load the config from the config.json file
const configPath = path.join(__dirname, "../config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// Check if Discord integration is enabled
const discordConfig = config.features.discordIntegration;
const webhookURL = discordConfig.webhookURL;
const isDiscordEnabled = discordConfig.enableFeature;

// Helper function to convert hex to decimal
function hexToDecimal(hex) {
  // Remove the leading '#' if present
  hex = hex.replace("#", "");
  return parseInt(hex, 16);
}

// Function to send a message to Discord
async function sendDiscordNotification(message) {
  if (!isDiscordEnabled) {
    console.log("Discord integration is disabled. Skipping notification.");
    return;
  }

  try {
    await axios.post(webhookURL, {
      content: message, // The message you want to send
    });
    console.log("Notification sent to Discord!");
  } catch (error) {
    console.error("Error sending Discord notification:", error);
  }
}

// Function to send an embed to Discord
async function sendDiscordEmbed(title, description, hexColor = "#FF0000") {
  if (!isDiscordEnabled) {
    console.log(
      "Discord integration is disabled. Skipping embed notification."
    );
    return;
  }

  const colorDecimal = hexToDecimal(hexColor); // Convert hex color to decimal

  try {
    await axios.post(webhookURL, {
      embeds: [
        {
          title: title,
          description: description,
          color: colorDecimal, // Use the decimal color value
          footer: {
            text: "Built by www.kevintrinh.dev", // Add footer text
          },
          timestamp: new Date().toISOString(),
        },
      ],
    });
    console.log("Embed notification sent to Discord!");
  } catch (error) {
    console.error("Error sending Discord embed notification:", error);
  }
}

// Function to send an embed for a followed user object
async function sendFollowedUserDiscordEmbed(user) {
  if (!isDiscordEnabled) {
    console.log(
      "Discord integration is disabled. Skipping user embed notification."
    );
    return;
  }

  const colorDecimal = hexToDecimal("#55FF55"); // Green color in decimal

  try {
    await axios.post(webhookURL, {
      embeds: [
        {
          title: `Successfully followed ${user.login} (${user.id})`,
          description: `[[Github Profile]](${user.html_url}) [[Repositories]](https://github.com/${user.login}?tab=repositories) [[Starred Repos]](https://github.com/${user.login}?tab=stars)`,
          thumbnail: {
            url: user.avatar_url, // Set the user's avatar as the embed thumbnail
          },
          fields: [
            {
              name: "Username",
              value: user.login, // Embed the link to the user's profile
              inline: true, // Keep fields on the same line
            },
            {
              name: "User ID",
              value: user.id.toString(), // Display user ID
              inline: true, // Keep fields on the same line
            },
            {
              name: "Followed On",
              value: new Date().toLocaleString(), // Display current time and date
              inline: true, // Keep fields on the same line
            },
          ],
          color: colorDecimal, // Use the green color
          footer: {
            text: "Built by www.kevintrinh.dev", // Add footer text
          },
          timestamp: new Date().toISOString(),
        },
      ],
    });
    //console.log(`Embed notification sent to Discord for user ${user.login}!`);
  } catch (error) {
    console.error("Error sending Discord embed notification:", error);
  }
}

// Function to send an embed for daily metrics
async function sendDailyMetricsDiscordEmbed(metrics) {
  if (!isDiscordEnabled) {
    console.log(
      "Discord integration is disabled. Skipping daily metrics notification."
    );
    return;
  }

  const colorDecimal = hexToDecimal("#55FF55"); // Green color in decimal
  const today = new Date().toLocaleDateString();

  try {
    await axios.post(webhookURL, {
      embeds: [
        {
          title: `📊 Daily Metrics - ${today}`,
          fields: [
            {
              name: "Total Follows (24 Hours)",
              value:
                metrics.follow_unfollow_stats.total_follows_last_day.toString(),
              inline: true,
            },
            {
              name: "Total Follows (Week)",
              value:
                metrics.follow_unfollow_stats.total_follows_last_week.toString(),
              inline: true,
            },
            {
              name: "Total Follows (Month)",
              value:
                metrics.follow_unfollow_stats.total_follows_last_month.toString(),
              inline: true,
            },
            {
              name: "Total Unfollows (24 Hours)",
              value:
                metrics.follow_unfollow_stats.total_unfollows_last_day.toString(),
              inline: true,
            },
            {
              name: "Unfollows - Followed Back (24 Hours)",
              value:
                metrics.follow_unfollow_stats.unfollowed_followed_back_last_day.toString(),
              inline: true,
            },
            {
              name: "Unfollows - Expired (24 Hours)",
              value:
                metrics.follow_unfollow_stats.unfollowed_expired_last_day.toString(),
              inline: true,
            },
            {
              name: "Total Unfollows (Week)",
              value:
                metrics.follow_unfollow_stats.total_unfollows_last_week.toString(),
              inline: true,
            },
            {
              name: "Unfollows - Followed Back (Week)",
              value:
                metrics.follow_unfollow_stats.unfollowed_followed_back_last_week.toString(),
              inline: true,
            },
            {
              name: "Unfollows - Expired (Week)",
              value:
                metrics.follow_unfollow_stats.unfollowed_expired_last_week.toString(),
              inline: true,
            },
            {
              name: "Total Unfollows (Month)",
              value:
                metrics.follow_unfollow_stats.total_unfollows_last_month.toString(),
              inline: true,
            },
            {
              name: "Unfollows - Followed Back (Month)",
              value:
                metrics.follow_unfollow_stats.unfollowed_followed_back_last_month.toString(),
              inline: true,
            },
            {
              name: "Unfollows - Expired (Month)",
              value:
                metrics.follow_unfollow_stats.unfollowed_expired_last_month.toString(),
              inline: true,
            },
            {
              name: "Total in Unfollow Queue",
              value: metrics.general_metrics.total_unfollow_queue.toString(),
              inline: true,
            },
            {
              name: "Total in Follow Queue",
              value: metrics.general_metrics.total_follow_queue.toString(),
              inline: true,
            },
            {
              name: "Total Pending Follow Back",
              value:
                metrics.general_metrics.total_pending_follow_back.toString(),
              inline: true,
            },
            {
              name: "Total Users Followed",
              value: metrics.general_metrics.total_users_followed.toString(),
              inline: true,
            },
            {
              name: "Total Followers",
              value: metrics.general_metrics.total_current_followers.toString(),
              inline: true,
            },
          ],
          color: colorDecimal,
          footer: {
            text: "Built by www.kevintrinh.dev",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    });
    console.log("Daily metrics embed sent to Discord!");
  } catch (error) {
    console.error("Error sending Discord embed notification:", error);
  }
}

// Function to send an embed for an unfollowed user object
async function sendUnfollowedUserDiscordEmbed(user) {
  if (!isDiscordEnabled) {
    console.log(
      "Discord integration is disabled. Skipping unfollowed user embed notification."
    );
    return;
  }

  const colorDecimal = hexToDecimal("#FF5555"); // Custom color in decimal

  try {
    await axios.post(webhookURL, {
      embeds: [
        {
          title: `Successfully unfollowed ${user.login} (${user.id})`,
          description: `[[Github Profile]](${user.html_url}) [[Repositories]](https://github.com/${user.login}?tab=repositories) [[Starred Repos]](https://github.com/${user.login}?tab=stars)`,
          thumbnail: {
            url: user.avatar_url, // Set the user's avatar as the embed thumbnail
          },
          fields: [
            {
              name: "Followed On",
              value: new Date(user.followed_on).toLocaleString(),
              inline: true,
            },
            {
              name: "Unfollow Queue Timestamp",
              value: new Date(user.added_to_queue_on).toLocaleString(),
              inline: true,
            },
            // Empty field to ensure a new line starts after two fields
            { name: "\u200B", value: "\u200B", inline: true },

            {
              name: "Unfollowed On",
              value: new Date().toLocaleString(),
              inline: true,
            },
            {
              name: "Reason",
              value: user.unfollow_reason || "N/A",
              inline: true,
            },
            // Another empty field to force two fields per line
            { name: "\u200B", value: "\u200B", inline: true },
          ],
          color: colorDecimal,
          footer: {
            text: "Built by www.kevintrinh.dev",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    });
    //console.log(`Embed notification sent to Discord for unfollowed user ${user.login}!`);
  } catch (error) {
    console.error("Error sending Discord embed notification:", error);
  }
}

// Function to send an embed for an unfollowed user object
async function sendMovedUserToUnfollowQueueDiscordEmbed(user) {
  if (!isDiscordEnabled) {
    console.log(
      "Discord integration is disabled. Skipping unfollowed user embed notification."
    );
    return;
  }

  const colorDecimal = hexToDecimal("#FFFF55"); // Custom color in decimal

  try {
    await axios.post(webhookURL, {
      embeds: [
        {
          title: `Added user to unfollow queue: ${user.login} (${user.id})`,
          description: `[[Github Profile]](${user.html_url}) [[Repositories]](https://github.com/${user.login}?tab=repositories) [[Starred Repos]](https://github.com/${user.login}?tab=stars)`,
          thumbnail: {
            url: user.avatar_url, // Set the user's avatar as the embed thumbnail
          },
          fields: [
            {
              name: "Followed On",
              value: new Date(user.followed_on).toLocaleString(), // Format the followed_on date
              inline: true, // Single line for followed date
            },
            {
              name: "Moved to Queue",
              value: new Date().toLocaleString(), // Display current time and date
              inline: true, // Single line for unfollowed date
            },
            {
              name: "Reason",
              value: user.unfollow_reason, // Display current time and date
              inline: true, // Single line for unfollowed date
            },
          ],
          color: colorDecimal, // Use the custom color
          footer: {
            text: "Built by www.kevintrinh.dev", // Add footer text
          },
          timestamp: new Date().toISOString(),
        },
      ],
    });
    //console.log(`Embed notification sent to Discord for unfollowed user ${user.login}!`);
  } catch (error) {
    console.error("Error sending Discord embed notification:", error);
  }
}

module.exports = {
  sendDiscordNotification,
  sendDiscordEmbed,
  sendFollowedUserDiscordEmbed,
  sendUnfollowedUserDiscordEmbed,
  sendMovedUserToUnfollowQueueDiscordEmbed,
  sendDailyMetricsDiscordEmbed,
};
