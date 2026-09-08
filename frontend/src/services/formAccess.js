import { del, get, post } from "./api";

export function getUserFormAccess(userId) {
  return get(`/users/${encodeURIComponent(userId)}/forms`);
}

export function grantFormAccess(userId, formId) {
  return post(`/users/${encodeURIComponent(userId)}/forms`, { formId });
}

export function revokeFormAccess(userId, formId) {
  return del(`/users/${encodeURIComponent(userId)}/forms`, { formId });
}