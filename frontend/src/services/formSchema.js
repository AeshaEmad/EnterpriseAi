import { get, put } from "./api";
import localSchema from "../config/formSchema";

let cachedSchema = null;

export async function getFormSchema() {
  if (cachedSchema) return cachedSchema;

  try {
    const data = await get("/form-schema");
    cachedSchema = data.fields;
    return cachedSchema;
  } catch {
    cachedSchema = localSchema;
    return cachedSchema;
  }
}

export async function saveFormSchema(fields) {
  try {
    const data = await put("/form-schema", { fields });
    cachedSchema = data.fields;
    return { success: true, fields: data.fields };
  } catch {
    return { error: "Could not save to server. Try again later." };
  }
}

export function clearSchemaCache() {
  cachedSchema = null;
}
