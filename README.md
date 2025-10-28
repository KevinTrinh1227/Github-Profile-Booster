<div align="center">
  <h1>
    Github-Profile-Booster
  </h1>
</div>
<p align="center">
  A Github Bot that automatically follows and unfollows users, to boost your profile growth, presence, and interactions.
</p>

<div align="center">
  <img src="https://img.shields.io/badge/maintenance-experimental-blue.svg" alt="Maintained status" />
  <img src="https://img.shields.io/github/v/release/KevinTrinh1227/Github-Followers-Bot.svg" alt="Release badge" />
</div>

## 📌 Important Info (Please Read)
This project is **experimental** and was developed for **educational purposes** only. Please be aware that using automated tools on GitHub, including this application, may violate GitHub’s [Terms of Service](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies#4-spam-and-inauthentic-activity-on-github), which prohibit activities such as:
* Automated excessive bulk activity (e.g., mass following or starring)
* Coordinated inauthentic interactions, such as fake accounts or bots
* Rank abuse through automated following or starring
* Spamming or cryptocurrency mining
* Excessive burden on GitHub servers through automated requests
  
**By using this tool, you acknowledge the risk** of your account being flagged or banned for violating GitHub's policies. Proceed with caution, and use at your own risk. This tool is intended solely for learning purposes, and the developer is not responsible for any misuse or potential consequences.

## 👥 What is this project?
This project is a Node.js application that automates following and unfollowing users on GitHub at random intervals, simulating human-like behavior. It uses a queue system to manage actions, integrates logging for tracking activity, and includes a Discord webhook feature for real-time notifications of follow and unfollow events. The app ensures compliance with GitHub’s API rate limits and helps boost your profile growth, presence, and interactions by automatically engaging with users. Designed for long-term, 24/7 operation, it efficiently handles large volumes of users by optimizing API calls and minimizing redundant actions, ensuring smooth and resource-effective performance.

This project was built using Node 16.20.2 on Ubuntu (Linux)

## 💭 How does it work?
This project is designed to mimic human-like behavior when interacting with GitHub. It follows and unfollows users at randomized intervals, simulating how a real person might interact with the platform. Instead of using a fixed schedule, the app randomizes both the timing and the number of users followed or unfollowed in each cycle, so the actions don't follow a predictable pattern.

Additionally, the program carefully limits the number of API calls it makes to avoid overwhelming GitHub’s servers or exceeding the API rate limits. It keeps track of users who have already been followed, ensuring no unnecessary actions are taken, making the process efficient and resource-friendly.

The table below uses estimated values for each MIN and MAX time frame (in seconds) between each API request. 

| **Wait Time Range**        | **Follows + Unfollows per Hour** | **Estimated API Requests per Hour** | **Follows + Unfollows per Day** | **Followers per Day** | **Unfollowers per Day** |
|----------------------------|----------------------------------|-------------------------------------|---------------------------------|-----------------------|-------------------------|
| **30-60 seconds**           | 60 to 120                       | 300 to 600                          | 1,440 to 2,880                  | 720 to 1,440          | 720 to 1,440            |
| **60-120 seconds**          | 30 to 60                        | 150 to 300                          | 720 to 1,440                    | 360 to 720            | 360 to 720              |
| **500-900 seconds**         | ~4 to 7.2                       | ~20 to 36                           | ~96 to 172                      | 48 to 86              | 48 to 86                |
| **600-1200 seconds**        | ~3 to 6                         | ~15 to 30                           | ~72 to 144                      | 36 to 72              | 36 to 72                |
| **700-1500 seconds**        | ~2.4 to 5.1                     | ~12 to 25.5                         | ~57.6 to 122.4                  | 28.8 to 61.2          | 28.8 to 61.2            |
| **800-1800 seconds**        | ~2 to 4.5                       | ~10 to 22.5                         | ~48 to 108                      | 24 to 54              | 24 to 54                |
| **900-2000 seconds**        | ~1.8 to 4                       | ~9 to 20                            | ~43.2 to 96                     | 21.6 to 48            | 21.6 to 48              |
| **1000-2400 seconds**       | ~1.5 to 3.6                     | ~7.5 to 18                          | ~36 to 86.4                     | 18 to 43.2            | 18 to 43.2              |


## 🛠 Installation & setup

1. Clone repository OR download the [latest release](https://github.com/KevinTrinh1227/Github-Auto-Followers-Bot/releases)

   ```sh
   git clone https://github.com/KevinTrinh1227/Github-Followers-Bot
   ```

   ```sh
   cd Github-Auto-Followers-Bot
   ```

2. **OPTIONAL**: Use the correct Node version using [NVM](https://github.com/nvm-sh/nvm) (Node v16.20.2)

   ```sh
   nvm install 16
   ```

   ```sh
   nvm alias default 16
   ```

3. Install the dependencies using npm or yarn

   ```sh
   npm install
   ```

   ```sh
   yarn install
   ```

## 🚀 Start the application

1. Now run the application

   ```sh
   npm start
   ```

   ```sh
   yarn run start
   ```
