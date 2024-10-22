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
          thumbnail: {
            url: user.avatar_url, // Set the user's avatar as the embed thumbnail
          },
          fields: [
            {
              name: "Profile URL",
              value: `[${user.login}](${user.html_url})`, // Embed the link to the user's profile
              inline: true, // Keep fields on the same line
            },
            {
              name: "User ID",
              value: user.id.toString(), // Display user ID
              inline: true, // Keep fields on the same line
            },
            {
              name: "Followed At",
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
          thumbnail: {
            url: user.avatar_url, // Set the user's avatar as the embed thumbnail
          },
          fields: [
            {
              name: "Profile URL",
              value: `[${user.login}](${user.html_url})`, // Embed the link to the user's profile
              inline: true, // Single line for link
            },
            {
              name: "Followed On",
              value: new Date(user.followed_on).toLocaleString(), // Format the followed_on date
              inline: true, // Single line for followed date
            },
            {
              name: "Unfollowed On",
              value: new Date().toLocaleString(), // Display current time and date
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
};
