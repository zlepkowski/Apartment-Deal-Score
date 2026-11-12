// LocalStorage-backed store for listings the user adds in the browser before
// they're committed to the seed file or wired to a live backend.

const KEY = 'dealscore.userListings.v1';

export function loadUserListings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveUserListings(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
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
  localStorage.removeItem(KEY);
}
