require("dotenv").config();
const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;

const data = JSON.parse(fs.readFileSync("member_ids.json", "utf8"));

app.post("/submit", (req, res) => {
  const { id, name } = req.body;

  if (data[id]) {
    res.send(`
      <script>
        alert('ID already exists.');
        window.location.href = '/';
      </script>
    `);
  } else {
    const discordPayload = {
      content: `new entry for ${name}`,
      embeds: [
        {
          title: "new streamer submission",
          description: `**twitch ID:** ${id}\n**twitch username:** ${name}`,
          color: 0x7289da,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    axios
      .post(discordWebhookUrl, discordPayload)
      .then((response) => {
        res.send(`
          <script>
            alert('form submitted successfully!');
            window.location.href = '/';
          </script>
        `);
      })
      .catch((error) => {
        res.status(500).send("failed to send form. please try again later");
        console.error(error);
      });
  }
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/add.html");
});

const port = 3040;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
