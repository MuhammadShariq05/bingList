
const watchedContainer = document.getElementById("watched-container");
const watchedEmpty = document.getElementById("watched-empty");

function renderWatchedList() {
  const watched = getWatched();

  watchedEmpty.hidden = watched.length !== 0;

  renderMedia(watchedContainer, watched);

  // Add a remove button to every card
  const cards = watchedContainer.querySelectorAll(".item-card");

  cards.forEach((card) => {
    const removeButton = document.createElement("button");

    removeButton.textContent = "Remove from Watched";
    removeButton.classList.add("remove-from-list");

    card.appendChild(removeButton);
  });
}

// Handle removal using event delegation
watchedContainer.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".remove-from-list");

  if (!removeButton) return;

  const card = removeButton.closest(".item-card");

  const item = {
    id: card.dataset.mediaId,
    media_type: card.dataset.mediaType,
  };

  removeFromWatched(item);

  // Refresh the displayed Watched list
  renderWatchedList();
});

renderWatchedList();
