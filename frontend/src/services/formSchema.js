import { get, post } from "./api";

export const formVersionStatus = {
  Draft: "Draft",
  PendingApproval: "PendingApproval",
  Published: "Published",
  Rejected: "Rejected",
};

const normalizeField = (field) => ({
  name: field.name,
  label: field.label,
  type: field.type,
  required: Boolean(field.required),
  placeholder: field.defaultValue || "",
  options: Array.isArray(field.options) ? field.options : [],
  validation: field.validation || null,
});

export function getForms() {
  return get("/forms");
}

export function createForm(name, description) {
  return post("/forms", { name, description });
}

export function getForm(formId) {
  return get(`/forms/${encodeURIComponent(formId)}`);
}

export function approveFormVersion(formId, versionId) {
  return post(
    `/forms/${encodeURIComponent(formId)}/versions/${encodeURIComponent(versionId)}/approve`
  );
}

export function rejectFormVersion(formId, versionId, comment) {
  return post(
    `/forms/${encodeURIComponent(formId)}/versions/${encodeURIComponent(versionId)}/reject`,
    { comment }
  );
}

export async function getFormSchema(formId) {
  const data = await get(`/forms/${encodeURIComponent(formId)}/schema`);
  return { ...data, fields: data.fields.map(normalizeField) };
}

export async function createFormVersion(formId, versionNumber, fields) {
  const version = await post(`/forms/${encodeURIComponent(formId)}/versions`, {
    versionNumber,
    status: "Draft",
  });

  for (const [index, field] of fields.entries()) {
    await post(
      `/forms/${encodeURIComponent(formId)}/versions/${encodeURIComponent(version.id)}/fields`,
      {
        fieldName: field.name,
        fieldLabel: field.label,
        fieldType: field.type,
        isRequired: Boolean(field.required),
        defaultValue: field.placeholder || null,
        options: field.type === "select" ? field.options : null,
        validationRules: field.validation || null,
        displayOrder: index,
      }
    );
  }

  await post(
    `/forms/${encodeURIComponent(formId)}/versions/${encodeURIComponent(version.id)}/submit-for-approval`
  );

  return version;
}
