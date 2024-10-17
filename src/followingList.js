const axios = require("axios");

// Function to get the total number of users a specific person is following
async function getTotalFollowing(username) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Assuming your token is stored in .env
  let totalFollowing = 0;
  let page = 1;
  const perPage = 100; // Set 100 results per page

  try {
    while (true) {
      // Make an API request to get the user's following list for the current page
      const response = await axios.get(
        `https://api.github.com/users/${username}/following`,
        {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github+json",
          },
          params: {
            per_page: perPage, // Get 100 results per page
            page: page, // Specify the page number
          },
        }
      );

      // Get the number of followers returned in the current page
      const followersOnThisPage = response.data.length;

      // If no more followers are found on the current page, we are done
      if (followersOnThisPage === 0) {
        break;
      }

      // Add the number of followers on this page to the total count
      totalFollowing += followersOnThisPage;

      // Increment the page number to fetch the next batch of results
      page += 1;
    }

    console.log(`${username} is following ${totalFollowing} users.`);
    return totalFollowing;
  } catch (error) {
    console.error(
      `Error fetching following count for ${username}:`,
      error.message
    );
    return null;
  }
}

module.exports = { getTotalFollowing };

// Example usage
// getTotalFollowing('octocat').then(count => console.log(`Total following: ${count}`));
