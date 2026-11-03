const API_BASE_URL = "https://tmbd-movie-api.mohassanahmed09.workers.dev";
// Detect which page we're on
const isMoviesPage = document.body.dataset.page === "movies";
const isSeriesPage = document.body.dataset.page === "series";
const isSearchPage = document.body.dataset.page === "search";

// homepage containers
const currentMovieContainer = document.getElementById(
  "current-movies-container",
);
const popularContainer = document.getElementById("popular-movies-container");
const topRatedContainer = document.getElementById("top-rated-movies-container");
const upcomingContainerTvshow = document.getElementById(
  "upcoming-tvshows-container",
);
const trendingThisWeek = document.getElementById("trending-container");
const genreSelect = document.getElementById("genre-filter");
const yearSelect = document.getElementById("yearSelect");
// movies page containers
const trendingMovieThisWeekContainer = document.getElementById(
  "trending-movies-week-container",
);
const movieDiscoverContainer = document.getElementById(
  "movies-discover-container",
);

// series page containers
const trendingSeriesContainer = document.getElementById(
  "trending-series-week-container",
);
const popularSeriesContainer = document.getElementById(
  "popular-series-container",
);
const topRatedSeriesContainer = document.getElementById(
  "top-rated-series-container",
); 
const seriesDiscoverContainer = document.getElementById(
  "series-discover-container",
);
const seriesLoader = document.getElementById("series-loader");

// search page
const searchResultsContainer = document.getElementById("search-results");
const searchInput = document.getElementById("search-input");

// sentinel element that the browser will watch. When it enters the viewport, we'll trigger allMovies().
const movieLoader = document.getElementById("movies-loader");
// request id to keep in track of movies request order
let movieRequestId = 0;
let tvRequestId = 0;
let timerId = 0;
// For pagination
const moviePagination = {
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
};

const tvPagination = {
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
};

let selectedGenre = "";
let selectedYear = "";

function resetMoviePagination() {
  moviePagination.currentPage = 1;
  moviePagination.totalPages = 1;
  moviePagination.isLoading = false;
}

function resetTvPagination() {
  tvPagination.currentPage = 1;
  tvPagination.totalPages = 1;
  tvPagination.isLoading = false;
}

/*---------------------------------------------------------------------HOMEPAGE--------------------------------------------------------------------------------------------------*/
// FOR HOMEPAGE
// Fetch data from the API will be the comman fuction where ill make it to fetch onces for all the other functions to use it and get the data from the API to follow DRY
async function fetchFromAPI(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

// Made the render function into one, there were 2 functions to render movies and series seperatly now its rendering in one function
function renderMedia(container, items, append = false) {
  if (!container) return;
  if (!append) {
    container.innerHTML = "";
  }

  items.forEach((item) => {
    // changed the way to get the year from the release date which was a string in the format "YYYY-MM-DD" to just get the year part by splitting the string and taking the first element of the resulting array

    const name = item.title ? item.title : item.name;
    // ?? picks the first non-nullish value (unlike ||, it won't discard an empty string if that's intentional).
    const date =
      (item.release_date ?? item.first_air_date)?.split("-")[0] ?? "";
    const posterPath = item.poster_path ?? "";
    const itemElement = document.createElement("div");
    itemElement.dataset.mediaType =
      item.media_type ?? (item.title ? "movie" : "tv");
    itemElement.dataset.mediaId = item.id;
    itemElement.classList.add("item-card");
    itemElement.id = `item-${item.id}`;
    itemElement.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w500${posterPath}" alt="${name}" />
      <h3>${name}</h3>
      <p>${date}</p>
      <p>${Math.round(item.vote_average * 10) / 10}</p>
    `;
    container.appendChild(itemElement);
  });
  container.addEventListener("click", (event) => {
    const itemCard = event.target.closest(".item-card");
    if (!itemCard) return;
    if (event.target.closest(".remove-from-list")) return;
    const id = itemCard.dataset.mediaId;
    const type = itemCard.dataset.mediaType;
    window.location.href = `details.html?id=${id}&type=${type}`;
  });
}

function handleMediaClick(container) {
  container.addEventListener("click", (event) => {
    const itemCard = event.target.closest(".item-card");

    if (!itemCard || !container.contains(itemCard)) return;

    const id = itemCard.dataset.mediaId;
    const type = itemCard.dataset.mediaType;

    window.location.href = `details.html?id=${id}&type=${type}`;
  });
}

async function nowPlaying() {
  try {
    const data = await fetchFromAPI(`/api/movies/now-playing`);
    renderMedia(currentMovieContainer, data.results);
  } catch (error) {
    console.error("Failed to fetch movies:", error);
  }
}

async function trendingWeek() {
  try {
    const data = await fetchFromAPI(`/api/trending/all/week`);
    const filteredResults = data.results.filter(
      (item) => item.media_type === "movie" || item.media_type === "tv",
    );
    renderMedia(trendingThisWeek, filteredResults);
  } catch (error) {
    console.error("Failed to fetch trending this week", error);
  }
}

async function popular() {
  try {
    const data = await fetchFromAPI(`/api/movies/popular?page=2`);
    renderMedia(popularContainer, data.results);
  } catch (error) {
    console.error("Failed to fetch popular movies:", error);
  }
}

async function topRated() {
  try {
    const data = await fetchFromAPI("/api/movies/top-rated");
    renderMedia(topRatedContainer, data.results);
  } catch (error) {
    console.error("Failed to fetch top-rated movies:", error);
  }
}

async function upcomingTvShows() {
  try {
    const data = await fetchFromAPI(`/api/tv/airing-today`);
    renderMedia(upcomingContainerTvshow, data.results);
  } catch (error) {
    console.error("Failed to fetch upcoming tv shows:", error);
  }
}

/*----------------------------------------------------------------------------MOVIES PAGE-----------------------------------------------------------------------------------------*/
// FOR MOVIES PAGE (movies.html)

// Movies rendering section in movies.html
async function trendingMoviesThisWeek() {
  try {
    const data = await fetchFromAPI(`/api/trending/movies/week`);
    renderMedia(trendingMovieThisWeekContainer, data.results);
  } catch (error) {
    console.error("Error in trending movies this week", error);
  }
}

// Movie rendering from discovery api

async function allMovies(
  genre = null,
  append = true,
  requestId = movieRequestId, // 1
  year = null,
) {
  let endpoint = `/api/movies/discover?page=${moviePagination.currentPage}`;
  if (genre) {
    endpoint += `&with_genres=${genre}`;
  }
  if (year) {
    endpoint += `&primary_release_year=${year}`;
  }

  try {
    if (
      !moviePagination.isLoading &&
      moviePagination.currentPage <= moviePagination.totalPages
    ) {
      moviePagination.isLoading = true;
      const data = await fetchFromAPI(endpoint);
      if (requestId !== movieRequestId) return;
      moviePagination.currentPage = data.page + 1;
      moviePagination.totalPages = data.total_pages;
      renderMedia(movieDiscoverContainer, data.results, append);
    }
  } catch (error) {
    console.error("Error from all movies load", error);
  } finally {
    if (requestId === movieRequestId) {
      moviePagination.isLoading = false; // true ran
    }
  }
}

// Function to create a dynamic dropdown section for filtering movies
async function genreDropdown() {
  if (!genreSelect) return;
  try {
    const data = await fetchFromAPI(`/api/genres/movies`);
    data.genres.forEach((genre) => {
      const optionElement = document.createElement("option");
      optionElement.id = genre.id;
      optionElement.value = genre.id;
      optionElement.textContent = genre.name;
      genreSelect.appendChild(optionElement);
    });
  } catch (error) {
    console.error("Error in dropdown", error);
  }
}

// When it(movieLoader) enters the viewport, we'll trigger allMovies().
if (movieLoader) {
  const movieObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          allMovies(selectedGenre, true, movieRequestId, selectedYear);
        }
      });
    },
    /**
     * root: null — observes relative to the browser viewport.
     * rootMargin: "0px" — no extra margin around the viewport.
     * threshold: 0.1 — callback triggers when roughly 10% of the sentinel is visible.
     */
    {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    },
  );
  movieObserver.observe(movieLoader);
}

/*----------------------------------------------------------------------------SERIES PAGE-----------------------------------------------------------------------------------------*/
// FOR SERIES PAGE (series.html)

async function trendingSeriesThisWeek() {
  try {
    const data = await fetchFromAPI("/api/trending/series/week");

    renderMedia(trendingSeriesContainer, data.results);
  } catch (error) {
    console.error("Error fetching trending series:", error);
  }
}

async function popularSeries() {
  try {
    const data = await fetchFromAPI("/api/tv/popular");

    renderMedia(popularSeriesContainer, data.results);
  } catch (error) {
    console.error("Error fetching popular series:", error);
  }
}

async function topRatedSeries() {
  try {
    const data = await fetchFromAPI("/api/tv/top-rated");

    renderMedia(topRatedSeriesContainer, data.results);
  } catch (error) {
    console.error("Error fetching top rated series:", error);
  }
}

async function allSeries(
  genre = null,
  append = true,
  requestId = tvRequestId,
  year = null
) {
  let endpoint = `/api/tv/discover?page=${tvPagination.currentPage}`;

  if (genre) {
    endpoint += `&with_genres=${genre}`;
  }

  if (year) {
    endpoint += `&first_air_date_year=${year}`;
  }

  try {
    if (
      !tvPagination.isLoading &&
      tvPagination.currentPage <= tvPagination.totalPages
    ) {
      tvPagination.isLoading = true;

      const data = await fetchFromAPI(endpoint);

      // Prevent outdated requests from rendering
      if (requestId !== tvRequestId) return;

      tvPagination.currentPage = data.page + 1;
      tvPagination.totalPages = data.total_pages;

      renderMedia(seriesDiscoverContainer, data.results, append);
    }
  } catch (error) {
    console.error("Error loading series:", error);
  } finally {
    if (requestId === tvRequestId) {
      tvPagination.isLoading = false;
    }
  }
}

async function seriesGenreDropdown() {
  if (!genreSelect) return;

  try {
    const data = await fetchFromAPI("/api/genres/tv");

    data.genres.forEach((genre) => {
      const optionElement = document.createElement("option");

      optionElement.value = genre.id;
      optionElement.textContent = genre.name;

      genreSelect.appendChild(optionElement);
    });
  } catch (error) {
    console.error("Error fetching series genres:", error);
  }
}

if (seriesLoader) {
  const seriesObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          allSeries(
            selectedGenre,
            true,
            tvRequestId,
            selectedYear
          );
        }
      });
    },
    {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    }
  );

  seriesObserver.observe(seriesLoader);
}

/*------------------------------------------------------------------------SEARCH PAGE----------------------------------------------------------------------------------------*/
async function trendingSearchPage() {
  try {
    const data = await fetchFromAPI(`/api/trending/all/week`);
    // i have to filter out the results to only include movies and tv shows, excluding people
    const filteredResults = data.results.filter(
      (item) => item.media_type === "movie" || item.media_type === "tv",
    );
    renderMedia(searchResultsContainer, filteredResults);
  } catch (error) {
    console.error("Error in trending search page", error);
  }
}

async function searchMedia(query) {
  try {
    const data = await fetchFromAPI(
      `/api/search/multi?query=${encodeURIComponent(query)}`,
    );
    const filteredResults = data.results.filter(
      (item) => item.media_type === "movie" || item.media_type === "tv",
    );
    renderMedia(searchResultsContainer, filteredResults);
  } catch (error) {
    console.error("Error in search media", error);
  }
}
/*------------------------------------------------------------------------FUNCTION CALLING----------------------------------------------------------------------------------------*/
// FUNCTION CALLING DONE HERE

// HOMEPAGE
if (!isMoviesPage) {
  nowPlaying();
  trendingWeek();
  popular();
  topRated();
  upcomingTvShows();
}

// SEARCH PAGE
if (isSearchPage) {
  trendingSearchPage();

  searchInput?.addEventListener("input", (event) => {
    const query = event.target.value.trim();
    if (query.length >= 2) {
      // Perform search logic here
      clearTimeout(timerId);
      timerId = setTimeout(() => {
        searchMedia(query);
      }, 400);
    }
    if (query.length === 0) {
      clearTimeout(timerId);
      trendingSearchPage();
    }
  });
}

// MOVIES PAGE
if (isMoviesPage) {
  genreDropdown();
  trendingMoviesThisWeek();
  allMovies();

  // Only add the listener if the element exists
  // LISTENING TO THE CHANGES IN DROPDOWN
  genreSelect?.addEventListener("change", () => {
    selectedGenre = genreSelect.value;
    // Call back function
    movieRequestId++;
    resetMoviePagination();
    allMovies(selectedGenre, false, movieRequestId, selectedYear);
  });
  yearSelect?.addEventListener("change", () => {
    selectedYear = yearSelect.value;
    // Call back function
    movieRequestId++;
    resetMoviePagination();
    allMovies(selectedGenre, false, movieRequestId, selectedYear);
  });
}


// SERIES PAGE
if (isSeriesPage) {
  seriesGenreDropdown();
  trendingSeriesThisWeek();
  popularSeries();
  topRatedSeries();
  allSeries();

  genreSelect?.addEventListener("change", () => {
    selectedGenre = genreSelect.value;

    tvRequestId++;
    resetTvPagination();

    allSeries(
      selectedGenre,
      false,
      tvRequestId,
      selectedYear
    );
  });

  yearSelect?.addEventListener("change", () => {
    selectedYear = yearSelect.value;

    tvRequestId++;
    resetTvPagination();

    allSeries(
      selectedGenre,
      false,
      tvRequestId,
      selectedYear
    );
  });
}