// LocalStorage-backed store for listings the user adds in the browser before
// they're committed to the seed file or wired to a live backend.

export const USER_LISTINGS_KEY = 'dealscore.userListings.v1';

export function loadUserListings() {
  try {
    const raw = localStorage.getItem(USER_LISTINGS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveUserListings(list) {
  localStorage.setItem(USER_LISTINGS_KEY, JSON.stringify(list));
}

export function addUserListing(listing) {
  const list = loadUserListings();
  list.push(listing);
  saveUserListings(list);
  return list;
}

export function removeUserListing(id) {
  const list = loadUserListings().filter((l) => l.id !== id);
  saveUserListings(list);
  return list;
}

export function clearUserListings() {
  localStorage.removeItem(USER_LISTINGS_KEY);
}
