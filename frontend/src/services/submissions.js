import { get, post, put } from "./api";

export const createSubmission = (formId) =>
  post("/submissions", { formId, initialValues: [] });

export const getSubmission = (id) =>
  get(`/submissions/${encodeURIComponent(id)}`);

export const extractSubmission = (id, userInput) =>
  post(`/submissions/${encodeURIComponent(id)}/extract`, { userInput });

export const updateSubmissionFields = (id, formData, sources = {}) =>
  put(`/submissions/${encodeURIComponent(id)}/fields`, {
    values: Object.entries(formData).map(([name, value]) => ({
      name,
      value: value === "" ? null : value,
      source: sources[name] || "user",
    })),
  });

export const validateSubmission = (id) =>
  post(`/submissions/${encodeURIComponent(id)}/validate`);

export const confirmSubmission = (id) =>
  post(`/submissions/${encodeURIComponent(id)}/confirm`);
