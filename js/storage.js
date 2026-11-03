
/* =================================
   WATCHLIST STORAGE
================================= */

// Save Watchlist
function saveWatchlist(watchlist) {
  localStorage.setItem("watchlist", JSON.stringify(watchlist));
}

// Get Watchlist
function getWatchlist() {
  const watchlist = localStorage.getItem("watchlist");
  return watchlist ? JSON.parse(watchlist) : [];
}

/* =================================
   WATCHED LIST STORAGE
================================= */

// Save Watched List
function saveWatchedList(watched) {
  localStorage.setItem("watched", JSON.stringify(watched));
}

// Get Watched List
function getWatched() {
  const watched = localStorage.getItem("watched");
  return watched ? JSON.parse(watched) : [];
}

/* =================================
   ADD TO WATCHLIST
================================= */

function addToWatchlist(item) {
  const watchlist = getWatchlist();

  // Check for duplicates using ID and media type
  const exists = watchlist.some((watchedItem) => {
    return (
      watchedItem.id === item.id &&
      watchedItem.media_type === item.media_type
    );
  });

  if (exists) return false;

  watchlist.push(item);
  saveWatchlist(watchlist);

  return true;
}

/* =================================
   ADD TO WATCHED
================================= */

function addToWatched(item) {
  const watchedList = getWatched();

  // Check whether item already exists in Watched
  const exists = watchedList.some((watchedItem) => {
    return (
      watchedItem.id === item.id &&
      watchedItem.media_type === item.media_type
    );
  });

  if (exists) return false;

  // Add item to Watched
  watchedList.push(item);
  saveWatchedList(watchedList);

  // Remove the same item from Watchlist
  const watchlist = getWatchlist();

  const updatedWatchlist = watchlist.filter((watchedItem) => {
    return !(
      watchedItem.id === item.id &&
      watchedItem.media_type === item.media_type
    );
  });

  saveWatchlist(updatedWatchlist);

  return true;
}


/* =================================
   REMOVE FROM WATCHLIST
================================= */

function removeFromWatchlist(item) {
  const watchlist = getWatchlist();

  const updatedWatchlist = watchlist.filter((watchlistedItem) => {
    return !(
      Number(watchlistedItem.id) === Number(item.id) &&
      watchlistedItem.media_type === item.media_type
    );
  });

  saveWatchlist(updatedWatchlist);
  return true;
}

/* =================================
   REMOVE FROM WATCHED
================================= */

function removeFromWatched(item) {
  const watched = getWatched();

  const updatedWatched = watched.filter((watchedItem) => {
    return !(
      Number(watchedItem.id) === Number(item.id) &&
      watchedItem.media_type === item.media_type
    );
  });

  saveWatchedList(updatedWatched);
  return true;
}
