const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api")
  .replace(/\/$/, "");

const TOKEN_KEY = "autofiller_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const token = getToken();

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(url, { ...options, headers });
  } catch {
    throw new Error("Cannot connect to the server. Make sure the backend is running.");
  }

  if (response.status === 401) {
    clearToken();
    window.dispatchEvent(new Event("auth:expired"));
    throw new Error("Session expired. Please log in again.");
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const validationMessage = data?.errors
      ? Object.values(data.errors).flat().find(Boolean)
      : null;

    if (response.status === 403) {
      throw new Error("You do not have permission to perform this action.");
    }

    throw new Error(
      data?.error?.message ||
        data?.message ||
        validationMessage ||
        (typeof data?.error === "string" ? data.error : null) ||
        `Request failed (${response.status})`
    );
  }

  return data;
}

export function get(endpoint) {
  return request(endpoint, { method: "GET" });
}

export function post(endpoint, body) {
  return request(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function put(endpoint, body) {
  return request(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function del(endpoint, body) {
  return request(endpoint, {
    method: "DELETE",
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
