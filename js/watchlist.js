
const watchlistContainer = document.getElementById("watchlist-container");
const watchlistEmpty = document.getElementById("watchlist-empty");

function renderWatchlist() {
  const watchlist = getWatchlist();

  watchlistEmpty.hidden = watchlist.length !== 0;

  renderMedia(watchlistContainer, watchlist);

  // Add a remove button to every card
  const cards = watchlistContainer.querySelectorAll(".item-card");

  cards.forEach((card) => {
    const removeButton = document.createElement("button");

    removeButton.textContent = "Remove from Watchlist";
    removeButton.classList.add("remove-from-list");

    card.appendChild(removeButton);
  });
}

// Handle removal using event delegation
watchlistContainer.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".remove-from-list");

  if (!removeButton) return;

  const card = removeButton.closest(".item-card");

  const item = {
    id: card.dataset.mediaId,
    media_type: card.dataset.mediaType,
  };

  removeFromWatchlist(item);

  // Refresh the displayed Watchlist
  renderWatchlist();
});

renderWatchlist();
