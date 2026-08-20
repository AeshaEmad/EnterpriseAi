import { post, get, setToken, clearToken, getToken } from "./api";

const USERS_KEY = "autofiller_users";
const SESSION_KEY = "autofiller_session";
const USER_KEY = "autofiller_user";

function getUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function saveLocalSession(user, token) {
  localStorage.setItem(SESSION_KEY, user.id || user.email);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (token) setToken(token);
}

function clearLocalSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USER_KEY);
  clearToken();
}

export async function register({ fullName, email, password }) {
  try {
    const data = await post("/auth/register", {
      fullName,
      email,
      password,
    });

    if (data.token) {
      saveLocalSession(data.user, data.token);
    }

    return { user: data.user };
  } catch {
    const users = getUsers();

    if (
      users.some(
        (u) =>
          u.email.toLowerCase() === email.toLowerCase()
      )
    ) {
      return { error: "This email is already registered." };
    }

    const user = {
      id: `user_${Date.now()}`,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: "user",
    };

    users.push(user);
    saveUsers(users);
    saveLocalSession(user, null);

    return { user };
  }
}

export async function login({ email, password }) {
  try {
    const data = await post("/auth/login", {
      email,
      password,
    });

    if (data.token) {
      saveLocalSession(data.user, data.token);
    }

    return { user: data.user };
  } catch {
    const users = getUsers();
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!user) {
      return { error: "No account found with this email." };
    }

    if (user.password !== password) {
      return { error: "Incorrect password." };
    }

    saveLocalSession(user, null);

    return { user };
  }
}

export async function getSessionUser() {
  try {
    const token = getToken();

    if (!token) {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    }

    const data = await get("/auth/me");
    return data.user;
  } catch {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}

export function logout() {
  clearLocalSession();
}
