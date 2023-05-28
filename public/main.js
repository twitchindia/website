document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const cardsContainer = document.getElementById("cards");
  const twitchData = [];

  fetch("/fetch-twitch-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ids: [],
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        twitchData.push(...data.data);
        displaySortedStreamerCards(twitchData);
      } else {
        console.error("Error:", data.error);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });

  const displaySortedStreamerCards = (streamers) => {
    const sortedStreamers = streamers.sort((a, b) => {
      const broadcasterTypeOrder = {
        partner: 0,
        affiliate: 1,
        streamer: 2,
      };

      const aType = a.broadcaster_type || "streamer";
      const bType = b.broadcaster_type || "streamer";

      if (aType !== bType) {
        return broadcasterTypeOrder[aType] - broadcasterTypeOrder[bType];
      }

      return b.follower_count - a.follower_count;
    });

    displayStreamerCards(sortedStreamers);
  };

  const displayStreamerCards = (streamers) => {
    cardsContainer.innerHTML = "";

    streamers.forEach((user) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
  <img src="${user.profile_image_url}" alt="profile picture">
  <p>ID: ${user.id}</p>
  <h3>${user.display_name}</h3>
  <p>twitch ${user.broadcaster_type || "streamer"}</p>
  <p>followers: ${user.follower_count || 0}</p>
  <a href="https://www.twitch.tv/${
    user.login
  }" target="_blank" rel="twitchindia.com" class="visit-channel-btn">visit channel</a>
`;

      cardsContainer.appendChild(card);
    });
  };

  const filterStreamers = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredStreamers = twitchData.filter((user) =>
      user.display_name.toLowerCase().includes(searchTerm)
    );
    displayStreamerCards(filteredStreamers);
  };

  searchButton.addEventListener("click", filterStreamers);

  searchInput.addEventListener("keyup", filterStreamers);

  window.addEventListener(
    "resize",
    displaySortedStreamerCards.bind(null, twitchData)
  );
});
