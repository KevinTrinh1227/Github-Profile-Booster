const fs = require("fs").promises;
const path = require("path");

const { sendDailyMetricsDiscordEmbed } = require("./discordWebhook");

// File paths
const pastFollowsUnfollowsPath = path.join(
  __dirname,
  "../data/past_follows_unfollows.json"
);
const pendingFollowBackPath = path.join(
  __dirname,
  "../data/pending_follow_back.json"
);
const unfollowQueuePath = path.join(__dirname, "../data/unfollow_queue.json");
const followQueuePath = path.join(__dirname, "../data/follow_queue.json");
const usersFollowedPath = path.join(__dirname, "../data/users_followed.json");
const currentFollowersPath = path.join(
  __dirname,
  "../data/current_followers.json"
);
const metricsPath = path.join(__dirname, "../data/metrics.json");

async function countEntriesWithinDateRange(
  jsonPath,
  dateField,
  fromDate,
  reason = null
) {
  try {
    const data = await fs.readFile(jsonPath, "utf-8");
    let entries = JSON.parse(data);

    // Convert object to array of values if `entries` is an object
    if (!Array.isArray(entries)) {
      entries = Object.values(entries);
    }

    // Filter entries by date range and reason (if provided)
    return entries.filter((entry) => {
      const entryDate = new Date(entry[dateField]);
      const meetsDateCondition = entryDate >= fromDate;
      const meetsReasonCondition = reason
        ? entry.unfollow_reason === reason
        : true;
      return meetsDateCondition && meetsReasonCondition;
    }).length;
  } catch (error) {
    console.error(`Error reading ${jsonPath}:`, error);
    return 0;
  }
}

// General function to count all entries in a JSON array or object
async function countEntries(jsonPath) {
  try {
    const data = await fs.readFile(jsonPath, "utf-8");
    const entries = JSON.parse(data);
    return Array.isArray(entries)
      ? entries.length
      : Object.keys(entries).length;
  } catch (error) {
    console.error(`Error reading ${jsonPath}:`, error);
    return 0;
  }
}

// Get time-based stats for follows and unfollows
async function getFollowUnfollowStats() {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Follows counts
  const followsLastDay = await countEntriesWithinDateRange(
    pendingFollowBackPath,
    "followed_on",
    dayAgo
  );
  const followsLastWeek = await countEntriesWithinDateRange(
    pendingFollowBackPath,
    "followed_on",
    weekAgo
  );
  const followsLastMonth = await countEntriesWithinDateRange(
    pendingFollowBackPath,
    "followed_on",
    monthAgo
  );

  const pastFollowsLastDay = await countEntriesWithinDateRange(
    pastFollowsUnfollowsPath,
    "followed_on",
    dayAgo
  );
  const pastFollowsLastWeek = await countEntriesWithinDateRange(
    pastFollowsUnfollowsPath,
    "followed_on",
    weekAgo
  );
  const pastFollowsLastMonth = await countEntriesWithinDateRange(
    pastFollowsUnfollowsPath,
    "followed_on",
    monthAgo
  );

  // Unfollows counts with reasons
  const unfollowsLastDay = await countEntriesWithinDateRange(
    pastFollowsUnfollowsPath,
    "unfollowedAt",
    dayAgo
  );
  const unfollowsLastWeek = await countEntriesWithinDateRange(
    pastFollowsUnfollowsPath,
    "unfollowedAt",
    weekAgo
  );
  const unfollowsLastMonth = await countEntriesWithinDateRange(
    pastFollowsUnfollowsPath,
    "unfollowedAt",
    monthAgo
  );

  const unfollowedFollowedBackLastDay = await countEntriesWithinDateRange(
    pastFollowsUnfollowsPath,
    "unfollowedAt",
    dayAgo,
    "User followed back"
  );
  const unfollowedFollowedBackLastWeek = await countEntriesWithinDateRange(
    pastFollowsUnfollowsPath,
    "unfollowedAt",
    weekAgo,
    "User followed back"
  );
  const unfollowedFollowedBackLastMonth = await countEntriesWithinDateRange(
    pastFollowsUnfollowsPath,
    "unfollowedAt",
    monthAgo,
    "User followed back"
  );

  const unfollowedExpiredLastDay = await countEntriesWithinDateRange(
    pastFollowsUnfollowsPath,
    "unfollowedAt",
    dayAgo,
    "Given time for user to follow back has expired"
  );
  const unfollowedExpiredLastWeek = await countEntriesWithinDateRange(
    pastFollowsUnfollowsPath,
    "unfollowedAt",
    weekAgo,
    "Given time for user to follow back has expired"
  );
  const unfollowedExpiredLastMonth = await countEntriesWithinDateRange(
    pastFollowsUnfollowsPath,
    "unfollowedAt",
    monthAgo,
    "Given time for user to follow back has expired"
  );

  return {
    total_follows_last_day: followsLastDay + pastFollowsLastDay,
    total_follows_last_week: followsLastWeek + pastFollowsLastWeek,
    total_follows_last_month: followsLastMonth + pastFollowsLastMonth,
    total_unfollows_last_day: unfollowsLastDay,
    total_unfollows_last_week: unfollowsLastWeek,
    total_unfollows_last_month: unfollowsLastMonth,
    unfollowed_followed_back_last_day: unfollowedFollowedBackLastDay,
    unfollowed_followed_back_last_week: unfollowedFollowedBackLastWeek,
    unfollowed_followed_back_last_month: unfollowedFollowedBackLastMonth,
    unfollowed_expired_last_day: unfollowedExpiredLastDay,
    unfollowed_expired_last_week: unfollowedExpiredLastWeek,
    unfollowed_expired_last_month: unfollowedExpiredLastMonth,
  };
}

// Get general counts for queues and followed/followers
async function getGeneralMetrics() {
  const total_unfollow_queue = await countEntries(unfollowQueuePath);
  const total_follow_queue = await countEntries(followQueuePath);
  const total_pending_follow_back = await countEntries(pendingFollowBackPath);
  const total_users_followed = await countEntries(usersFollowedPath);
  const total_current_followers = await countEntries(currentFollowersPath);

  return {
    total_unfollow_queue,
    total_follow_queue,
    total_pending_follow_back,
    total_users_followed,
    total_current_followers,
  };
}

// Main function to gather all metrics and save them to metrics.json
async function sendDailyMetrics() {
  try {
    const followUnfollowStats = await getFollowUnfollowStats();
    const generalMetrics = await getGeneralMetrics();

    const dailyMetrics = {
      date: new Date().toISOString(),
      follow_unfollow_stats: followUnfollowStats,
      general_metrics: generalMetrics,
    };

    let metricsLog = [];

    try {
      const data = await fs.readFile(metricsPath, "utf-8");
      metricsLog = JSON.parse(data);
      if (!Array.isArray(metricsLog)) {
        metricsLog = [];
      }
    } catch (error) {
      console.log("Creating new metrics log file.");
    }

    metricsLog.push(dailyMetrics);
    await fs.writeFile(metricsPath, JSON.stringify(metricsLog, null, 4));

    console.log("Daily metrics have been saved to metrics.json");

    // Call to send metrics to Discord
    await sendDailyMetricsDiscordEmbed(dailyMetrics);
  } catch (error) {
    console.error("Error sending daily metrics:", error);
  }
}

module.exports = { sendDailyMetrics };
