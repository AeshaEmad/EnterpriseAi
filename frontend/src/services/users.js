import { get, post } from "./api";

export function getUsers() {
  return get("/users");
}

export function createUser({ fullName, email, password, role }) {
  return post("/users", {
    fullName: fullName.trim(),
    email: email.trim(),
    password,
    role,
  });
}
