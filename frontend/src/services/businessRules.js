import { request } from "./api";

export async function uploadBusinessRulePdf(formId, formName, file) {
  const formData = new FormData();
  formData.append("formId", formId);
  formData.append("formName", formName);
  formData.append("file", file);

  return request("/business-rules/upload-pdf", {
    method: "POST",
    headers: {
      // Intentionally empty so request() in api.js won't override multipart/form-data boundary if deleted
    },
    body: formData,
  });
}

