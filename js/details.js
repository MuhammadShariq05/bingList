const API_BASE_URL = "https://tmbd-movie-api.mohassanahmed09.workers.dev";

const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const type = params.get("type");

// HTML elements
const backdrop = document.getElementById("backdrop");
const poster = document.getElementById("poster");
const title = document.getElementById("title");
const releaseDate = document.getElementById("release-date");
const rating = document.getElementById("rating");
const runtime = document.getElementById("runtime");
const genres = document.getElementById("genres");
const overview = document.getElementById("overview");

// Action buttons
const watchlistBtn = document.getElementById("watchlist-btn");
const watchedBtn = document.getElementById("watched-btn");

let currentMediaItem = null;

// Fetch movie or TV details
async function fetchDetails() {
  let endpoint = "";

  // Validate type
  if (type !== "movie" && type !== "tv") {
    throw new Error("Invalid media type.");
  }

  // Validate ID
  if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
    throw new Error("Invalid ID parameter.");
  }

  // Select endpoint
  if (type === "movie") {
    endpoint = `/api/movies/${id}`;
  } else {
    endpoint = `/api/tv/${id}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return await response.json();
}

// Render details
function renderDetails(data) {
  const mediaTitle = data.title ?? data.name;
  const date = data.release_date ?? data.first_air_date;

  // Images
  poster.src = data.poster_path
    ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
    : "";

  backdrop.src = data.backdrop_path
    ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
    : "";

  // Basic information
  title.textContent = mediaTitle ?? "Untitled";
  releaseDate.textContent = date || "N/A";
  rating.textContent = data.vote_average?.toFixed(1) ?? "N/A";
  overview.textContent = data.overview || "No overview available.";

  // Runtime
  if (type === "movie") {
    runtime.textContent = data.runtime
      ? `${data.runtime} minutes`
      : "N/A";
  } else {
    const episodeRuntime = data.episode_run_time?.[0];
    runtime.textContent = episodeRuntime
      ? `${episodeRuntime} minutes per episode`
      : "N/A";
  }

  // Genres
  genres.innerHTML = "";

  data.genres?.forEach((genre) => {
    const genreElement = document.createElement("span");

    genreElement.classList.add("genre-tag");
    genreElement.textContent = genre.name;

    genres.appendChild(genreElement);
  });
}


async function initDetailsPage() {
  try {
    const data = await fetchDetails();

    renderDetails(data);

    // Prepare media object for localStorage
    currentMediaItem = {
      id: data.id,
      media_type: type,
      title: data.title ?? data.name,
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      vote_average: data.vote_average,
      release_date: data.release_date ?? data.first_air_date
    };

    updateActionButtons();

    console.log("Details loaded:", data);

  } catch (error) {
    console.error("Unable to load details:", error);
    title.textContent = "Unable to load details";
  }
}



// Check current media status and update buttons
function updateActionButtons() {
  const watchlist = getWatchlist();
  const watched = getWatched();

  const isInWatchlist = watchlist.some((item) => {
    return (
      String(item.id) === String(currentMediaItem.id) &&
      item.media_type === type
    );
  });

  const isWatched = watched.some((item) => {
    return (
      String(item.id) === String(currentMediaItem.id) &&
      item.media_type === type
    );
  });

  watchlistBtn.textContent = isInWatchlist
    ? "Remove from Watchlist"
    : "Add to Watchlist";

  watchedBtn.textContent = isWatched
    ? "Remove from Watched"
    : "Mark as Watched";
}


// Watchlist button
watchlistBtn.addEventListener("click", () => {
  if (!currentMediaItem) return;

  const watchlist = getWatchlist();

  const exists = watchlist.some((item) => {
    return (
      String(item.id) === String(currentMediaItem.id) &&
      item.media_type === type
    );
  });

  if (exists) {
    removeFromWatchlist(currentMediaItem);
  } else {
    addToWatchlist(currentMediaItem);
  }

  updateActionButtons();
});


// Watched button
watchedBtn.addEventListener("click", () => {
  if (!currentMediaItem) return;

  const watched = getWatched();

  const exists = watched.some((item) => {
    return (
      String(item.id) === String(currentMediaItem.id) &&
      item.media_type === type
    );
  });

  if (exists) {
    removeFromWatched(currentMediaItem);
  } else {
    addToWatched(currentMediaItem);
  }

  updateActionButtons();
});


initDetailsPage();
