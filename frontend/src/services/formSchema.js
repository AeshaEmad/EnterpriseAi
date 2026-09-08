import { get, post } from "./api";

export const formVersionStatus = {
  Draft: "Draft",
  PendingApproval: "PendingApproval",
  Published: "Published",
  Rejected: "Rejected",
};

const normalizeField = (field) => {
  const validation = field.validationRules || field.validation || null;
  return {
    name: field.fieldName || field.name,
    label: field.fieldLabel || field.label,
    type: field.fieldType || field.type,
    required: Boolean(field.isRequired ?? field.required),
    placeholder: field.defaultValue || "",
    options: Array.isArray(field.options) ? field.options : [],
    validation: validation,
    description: field.description || "",
    min: validation?.min ?? field.min ?? "",
    max: validation?.max ?? field.max ?? "",
  };
};

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
    { Comment: comment }
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
    let validationRules = field.validation ? { ...field.validation } : {};

    if (field.type === "number") {
      if (field.min !== "" && field.min !== null && field.min !== undefined) {
        validationRules.min = Number(field.min);
      }
      if (field.max !== "" && field.max !== null && field.max !== undefined) {
        validationRules.max = Number(field.max);
      }
    }

    const hasRules = Object.keys(validationRules).length > 0;

    await post(
      `/forms/${encodeURIComponent(formId)}/versions/${encodeURIComponent(version.id)}/fields`,
      {
        fieldName: field.name,
        fieldLabel: field.label,
        fieldType: field.type,
        isRequired: Boolean(field.required),
        defaultValue: field.placeholder || null,
        options: field.type === "select" ? field.options : null,
        validationRules: hasRules ? validationRules : null,
        description: field.description || "",
        min: field.min !== "" && field.min !== null ? Number(field.min) : null,
        max: field.max !== "" && field.max !== null ? Number(field.max) : null,
        displayOrder: index,
      }
    );
  }

  await post(
    `/forms/${encodeURIComponent(formId)}/versions/${encodeURIComponent(version.id)}/submit-for-approval`
  );

  return version;
}
