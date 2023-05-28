const express = require("express");
const dotenv = require("dotenv");
const axios = require("axios");
const app = express();
const port = 3030;
const fs = require("fs");
const NodeCache = require("node-cache");

dotenv.config();

app.use(express.json());

app.use(express.static("public"));

const cache = new NodeCache();

app.post("/fetch-twitch-data", async (req, res) => {
  try {
    const twitchIdsData = fs.readFileSync("member_ids.json", "utf8");
    const twitchIds = JSON.parse(twitchIdsData).ids.map((entry) => entry.id);

    const twitchData = await Promise.all(
      twitchIds.map(async (id) => {
        try {
          const cacheKey = `twitchData:${id}`;
          const cachedData = cache.get(cacheKey);
          if (cachedData) {
            return cachedData;
          }

          const userResponse = await axios.get(
            `https://api.twitch.tv/helix/users?id=${id}`,
            {
              headers: {
                "Client-ID": process.env.TWITCH_CLIENT_ID,
                Authorization: `Bearer ${process.env.TWITCH_ACCESS_TOKEN}`,
              },
            }
          );

          const followerResponse = await axios.get(
            `https://api.twitch.tv/helix/users/follows?to_id=${id}`,
            {
              headers: {
                "Client-ID": process.env.TWITCH_CLIENT_ID,
                Authorization: `Bearer ${process.env.TWITCH_ACCESS_TOKEN}`,
              },
            }
          );

          const rateLimitRemaining = parseInt(
            userResponse.headers["ratelimit-remaining"]
          );
          if (rateLimitRemaining <= 0) {
            throw new Error("Twitch API rate limit exceeded");
          }

          const userData = userResponse.data;
          const followerData = followerResponse.data;
          const followerCount = followerData.total || 0;

          const user = userData.data[0];
          user.follower_count = followerCount;

          const ttl = 3600;
          cache.set(cacheKey, user, ttl);

          return user;
        } catch (error) {
          console.error(`Error fetching Twitch data for id ${id}:`, error);
          throw error;
        }
      })
    );

    res.json({ success: true, data: twitchData });
  } catch (error) {
    console.error("Error:", error);
    res.json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
