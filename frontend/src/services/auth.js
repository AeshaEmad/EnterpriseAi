import { post, setToken, clearToken, getToken } from "./api";

const USER_KEY = "autofiller_user";

function normalizeUser(user) {
  return user
    ? { ...user, role: String(user.role || "user").toLowerCase() }
    : null;
}

function saveLocalSession(user, token) {
  const normalized = normalizeUser(user);
  localStorage.setItem(USER_KEY, JSON.stringify(normalized));
  if (token) setToken(token);
  return normalized;
}

function clearLocalSession() {
  localStorage.removeItem(USER_KEY);
  clearToken();
}

export async function login({ email, password }) {
  try {
    const data = await post("/auth/login", {
      email,
      password,
    });

    return { user: saveLocalSession(data.user, data.token) };
  } catch (error) {
    return { error: error.message };
  }
}

export function getSessionUser() {
  try {
    if (!getToken()) return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? normalizeUser(JSON.parse(raw)) : null;
  } catch {
    clearLocalSession();
    return null;
  }
}

export function logout() {
  clearLocalSession();
}
