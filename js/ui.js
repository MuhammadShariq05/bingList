/* =====================================================================
   UI REDESIGN — ui.js  (NEW, additive file)

   What this is: a small helper script for the new interface. It does NOT
   modify, replace or override anything in script.js, storage.js, details.js,
   watchlist.js or watchedList.js. It only *reads* their globals
   (fetchFromAPI, handleMediaClick, trendingMoviesThisWeek,
   trendingSeriesThisWeek, getWatchlist, getWatched) and always checks that
   they exist first, so a missing function can never throw an error.

   It must be loaded AFTER script.js (every page already does this).

   What it does
     1. Scroll arrows for horizontal poster rows
     2. Placeholder for posters that fail to load
     3. Home: fills the two NEW rows (Trending Movies / Trending Series)
        by calling the EXISTING functions that already fetch that data
     4. Movies: "Upcoming" row   |   Series: "Airing Today" row
        (landscape cards, shown only if the data loads)
     5. Search page: loading / empty / "searching" state + results heading
     6. My List pages: item counts on the Watchlist / Watched tabs
   ===================================================================== */
(function () {
  "use strict";

  const page = document.body.dataset.page;

  /* -------------------------------------------------------------------
     1. SCROLL ARROWS
     Why: the design has arrows at the edge of each row. They only call
     scrollBy() on the row and toggle is-start / is-end so the arrow that
     has nowhere to go is hidden (see .row-scroller in style.css).
     Affects existing functionality: no.
  ------------------------------------------------------------------- */
  function initScroller(scroller) {
    const track = scroller.querySelector(".media-container");
    const prev = scroller.querySelector(".scroll-btn.prev");
    const next = scroller.querySelector(".scroll-btn.next");
    if (!track || !prev || !next) return;

    const update = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      scroller.classList.toggle("is-start", track.scrollLeft <= 4);
      scroller.classList.toggle("is-end", track.scrollLeft >= maxScroll - 4);
    };
    const step = () => Math.max(track.clientWidth * 0.85, 200);

    prev.addEventListener("click", () =>
      track.scrollBy({ left: -step(), behavior: "smooth" }),
    );
    next.addEventListener("click", () =>
      track.scrollBy({ left: step(), behavior: "smooth" }),
    );

    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // cards are added later by the API calls, so re-measure when they arrive
    new MutationObserver(update).observe(track, { childList: true });
    if ("ResizeObserver" in window) new ResizeObserver(update).observe(track);
    update();
  }
  document.querySelectorAll("[data-scroller]").forEach(initScroller);

  /* -------------------------------------------------------------------
     2. BROKEN POSTERS
     Why: renderMedia() builds the <img> even when TMDB has no poster, which
     leaves a broken-image icon. The error event doesn't bubble, so it is
     caught in the capture phase; CSS (.is-broken) swaps in a placeholder.
     Affects existing functionality: no.
  ------------------------------------------------------------------- */
  document.addEventListener(
    "error",
    (event) => {
      const el = event.target;
      if (el instanceof HTMLImageElement && el.closest(".item-card")) {
        el.classList.add("is-broken");
      }
    },
    true,
  );

  /* -------------------------------------------------------------------
     3. HOME: Trending Movies + Trending Series rows
     Why: the home page now has these two rows. The containers use the same
     IDs script.js already looks up on the Movies/Series pages, so we simply
     call the existing functions that fetch and render them.
     Affects existing functionality: no (same endpoints, same renderer).
  ------------------------------------------------------------------- */
  if (page === "home") {
    if (typeof trendingMoviesThisWeek === "function") trendingMoviesThisWeek();
    if (typeof trendingSeriesThisWeek === "function") trendingSeriesThisWeek();
  }

  /* -------------------------------------------------------------------
     4. LANDSCAPE ROWS (Movies: Upcoming | Series: Airing Today)
     Why: the design uses wide cards with a badge. renderMedia() only draws
     poster cards, so these cards are built here instead (same .item-card
     markup + data attributes, so the existing click-to-details behaviour
     is reused through handleMediaClick()).
     The section is hidden in the HTML and only revealed if data arrives,
     so there is never an empty or non-working section on screen.
     Affects existing functionality: no.
  ------------------------------------------------------------------- */
  function formatDate(value, yearOnly) {
    if (!value) return "";
    if (yearOnly) return value.split("-")[0];
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  }

  function buildLandscapeCard(item, mediaType, badgeText, yearOnly) {
    const name = item.title ?? item.name ?? "Untitled";
    const imagePath = item.backdrop_path ?? item.poster_path;

    const card = document.createElement("div");
    card.className = "item-card landscape";
    card.dataset.mediaType = mediaType;
    card.dataset.mediaId = item.id;

    const img = document.createElement("img");
    img.src = `https://image.tmdb.org/t/p/w780${imagePath}`;
    img.alt = name;
    img.loading = "lazy";
    card.appendChild(img);

    const badge = document.createElement("span");
    badge.className = "card-badge";
    badge.textContent = badgeText;
    card.appendChild(badge);

    const title = document.createElement("h3");
    title.textContent = name;
    card.appendChild(title);

    const date = document.createElement("p");
    date.textContent = formatDate(
      item.release_date ?? item.first_air_date,
      yearOnly,
    );
    card.appendChild(date);

    const rating = Math.round(item.vote_average * 10) / 10;
    if (rating > 0) {
      const ratingEl = document.createElement("p");
      ratingEl.textContent = rating;
      card.appendChild(ratingEl);
    } else {
      // unreleased titles often have no rating yet — CSS drops the leading dot
      card.classList.add("no-rating");
    }
    return card;
  }

  async function loadLandscapeRow(options) {
    const section = document.getElementById(options.sectionId);
    const container = document.getElementById(options.containerId);
    if (!section || !container || typeof fetchFromAPI !== "function") return;

    try {
      const data = await fetchFromAPI(options.endpoint);
      let items = (data.results || []).filter(
        (item) => item.backdrop_path || item.poster_path,
      );
      if (options.filter) items = items.filter(options.filter);
      if (options.sort) items.sort(options.sort);
      if (!items.length) return; // nothing to show → section stays hidden

      const fragment = document.createDocumentFragment();
      items.forEach((item) =>
        fragment.appendChild(
          buildLandscapeCard(
            item,
            options.mediaType,
            options.badge,
            options.yearOnly,
          ),
        ),
      );
      section.hidden = false; // reveal first so the arrows can measure the row
      container.appendChild(fragment);
      if (typeof handleMediaClick === "function") handleMediaClick(container);
    } catch (error) {
      // e.g. the endpoint doesn't exist on the Worker → keep the section hidden
      console.warn(`Could not load ${options.endpoint}:`, error);
    }
  }

  if (page === "movies") {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    loadLandscapeRow({
      sectionId: "movies-upcoming-section",
      containerId: "upcoming-movies-container",
      endpoint: "/api/movies/upcoming",
      mediaType: "movie",
      badge: "Coming Soon",
      // only titles that haven't been released yet may carry a "Coming Soon" badge
      filter: (item) => (item.release_date || "") >= today,
      sort: (a, b) =>
        (a.release_date || "").localeCompare(b.release_date || ""),
    });
  }

  if (page === "series") {
    loadLandscapeRow({
      sectionId: "airing-series-section",
      containerId: "airing-series-container",
      endpoint: "/api/tv/airing-today",
      mediaType: "tv",
      badge: "Airing Today",
      yearOnly: true,
    });
  }

  /* -------------------------------------------------------------------
     5. SEARCH PAGE STATES
     Why: the design needs a loading spinner and an empty state. A
     MutationObserver watches #search-results (filled by script.js) and
     writes data-state="loading|ready|empty|searching" which the CSS reads.
     The existing search input handler is untouched; this is a second,
     independent 'input' listener.
     Affects existing functionality: no.
  ------------------------------------------------------------------- */
  if (page === "search") {
    const results = document.getElementById("search-results");
    const input = document.getElementById("search-input");
    const heading = document.getElementById("results-title");

    if (results && input) {
      let safetyTimer = setTimeout(() => {
        // if the first request never answers, don't spin forever
        if (results.dataset.state === "loading")
          results.dataset.state = "empty";
      }, 12000);

      const syncState = () => {
        clearTimeout(safetyTimer);
        results.dataset.state = results.children.length ? "ready" : "empty";
      };
      new MutationObserver(syncState).observe(results, { childList: true });

      input.addEventListener("input", () => {
        const query = input.value.trim();
        if (heading) {
          heading.textContent =
            query.length >= 2 ? `Results for “${query}”` : "Trending This Week";
        }
        // dim the old results while the debounced request is in flight
        if (query.length >= 2 && results.children.length) {
          results.dataset.state = "searching";
          clearTimeout(safetyTimer);
          safetyTimer = setTimeout(syncState, 8000);
        }
      });
    }
  }

  /* -------------------------------------------------------------------
     6. MY LIST TAB COUNTS
     Why: the Watchlist / Watched tabs show how many items each list has.
     Only reads localStorage through the existing getWatchlist()/getWatched().
     Re-counts whenever the list on screen changes (e.g. after Remove).
     Affects existing functionality: no.
  ------------------------------------------------------------------- */
  function updateTabCounts() {
    if (typeof getWatchlist !== "function" || typeof getWatched !== "function")
      return;
    const counts = {
      watchlist: getWatchlist().length,
      watched: getWatched().length,
    };
    document.querySelectorAll("[data-count]").forEach((el) => {
      const total = counts[el.dataset.count];
      el.textContent = total > 0 ? String(total) : "";
    });
  }

  if (page === "watchlist" || page === "watched") {
    updateTabCounts();
    const list = document.getElementById(
      page === "watchlist" ? "watchlist-container" : "watched-container",
    );
    if (list)
      new MutationObserver(updateTabCounts).observe(list, { childList: true });
  }
})();
