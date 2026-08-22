import { useState } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { extractSubmission } from "../../services/submissions";
import localFormSchema from "../../config/formSchema";

const capitalize = (word) =>
  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

function extractAfterKeywords(message, keywords) {
  for (const kw of keywords) {
    const regex = new RegExp(`(?:^|\\s)${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|$)`, "ig");
    let match;
    while ((match = regex.exec(message)) !== null) {
      const startIdx = match.index + match[0].length;
      const after = message.slice(startIdx).trim();
      const words = after.split(/\s+/);
      const result = [];

      for (const w of words) {
        if (w.length === 0) continue;
        if (/^[,]+$/.test(w)) continue;
        if (/^\d+$/.test(w)) break;
        const lw = w.toLowerCase();
        if (lw === "and" || lw === "in" || lw === "with" || lw === "for") break;
        if (lw === "starting" || lw === "starts" || lw === "salary") break;
        if (lw === "email" || lw === "phone" || lw === "city") break;
        if (lw === "born" || lw === "birth" || lw === "dob") break;

        result.push(w.replace(/[,]/g, ""));
        if (result.length >= 4) break;
      }

      if (result.length > 0) {
        return result.join(" ");
      }
    }
  }
  return null;
}

function parseDate(str) {
  if (!str) return null;

  const isoMatch = str.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, "0");
    const d = isoMatch[3].padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const months = {
    january: "01", february: "02", march: "03", april: "04",
    may: "05", june: "06", july: "07", august: "08",
    september: "09", october: "10", november: "11", december: "12",
    jan: "01", feb: "02", mar: "03", apr: "04",
    jun: "06", jul: "07", aug: "08", sep: "09",
    oct: "10", nov: "11", dec: "12",
  };

  const writtenMatch = str.match(
    /([a-zA-Z]+)\s+(\d{1,2})\s*,?\s*(\d{2,4})/
  );
  if (writtenMatch) {
    const m = months[writtenMatch[1].toLowerCase()];
    const d = writtenMatch[2].padStart(2, "0");
    let y = writtenMatch[3];
    if (y.length === 2) y = "20" + y;
    if (m) return `${y}-${m}-${d}`;
  }

  return null;
}

function detectFormDataLocal(message, schema) {
  const data = {};
  const lower = message.toLowerCase();
  const fieldNames = new Set(schema.map((f) => f.name));

  const ignore = new Set([
    "add", "hello", "hi", "hey", "please", "create",
    "new", "employee", "hire", "the", "live", "demo",
    "name", "job", "work", "team", "role", "city",
    "salary", "email", "phone", "start", "date",
    "in", "as", "for", "with", "and", "or", "from",
    "to", "at", "on", "of", "a", "an", "is", "are",
    "put", "set", "make", "type", "position",
    "full", "part", "time", "contract",
    "starting", "starts", "born", "birth",
    "number", "mobile", "tel",
  ]);

  const allWords = message.split(/\s+/);
  const nameParts = [];
  let collectingName = false;

  const isIgnorableOrField = (word) => {
    const lw = word.toLowerCase();

    if (ignore.has(lw)) return true;
    if (lw.includes("@")) return true;
    if (/^\d+$/.test(lw)) return true;
    if (lw.endsWith(".com") || lw.endsWith(".org") || lw.endsWith(".net")) return true;

    if (
      fieldNames.has("department") &&
      schema.find((f) => f.name === "department")?.options
        ?.some((o) => o.toLowerCase() === lw)
    ) return true;

    if (
      fieldNames.has("employmentType") &&
      schema.find((f) => f.name === "employmentType")?.options
        ?.some((o) => o.toLowerCase() === lw)
    ) return true;

    return false;
  };

  for (const word of allWords) {
    const clean = word.replace(/[^a-zA-Z']/g, "");
    if (!clean || clean.length < 2) {
      if (collectingName && nameParts.length > 0) break;
      continue;
    }

    if (isIgnorableOrField(clean)) {
      if (collectingName && nameParts.length > 0) break;
      continue;
    }

    const isUpper =
      clean[0] === clean[0].toUpperCase() && clean[0] !== clean[0].toLowerCase();

    if (isUpper) {
      collectingName = true;
      nameParts.push(capitalize(clean));
    } else if (collectingName) {
      break;
    }
  }

  if (nameParts.length === 0) {
    for (const word of allWords) {
      const clean = word.replace(/[^a-zA-Z']/g, "");
      if (!clean || clean.length < 2) continue;
      if (isIgnorableOrField(clean)) break;
      nameParts.push(capitalize(clean));
    }
  }

  if (nameParts.length > 0 && fieldNames.has("fullName")) {
    data.fullName = nameParts.join(" ");
  }

  if (fieldNames.has("department")) {
    const deptOptions =
      schema.find((f) => f.name === "department")?.options || [];
    for (const dept of deptOptions) {
      if (lower.includes(dept.toLowerCase())) {
        data.department = dept;
        break;
      }
    }
  }

  if (fieldNames.has("employmentType")) {
    const empOptions =
      schema.find((f) => f.name === "employmentType")?.options || [];
    for (const emp of empOptions) {
      if (lower.includes(emp.toLowerCase())) {
        data.employmentType = emp;
        break;
      }
    }
  }

  if (fieldNames.has("jobTitle")) {
    const jobTitle = extractAfterKeywords(message, [
      "as", "role", "position", "title", "job title",
      "working as", "hired as", "role of",
    ]);
    if (jobTitle) {
      data.jobTitle = jobTitle;
    }
  }

  if (fieldNames.has("workEmail")) {
    const emailMatch = message.match(/[\w.+-]+@[\w-]+\.\w+/);
    if (emailMatch) {
      data.workEmail = emailMatch[0].toLowerCase();
    }
  }

  if (fieldNames.has("phoneNumber")) {
    const phoneMatch = message.match(
      /(?:phone|mobile|tel|number|call)\s*[:-]?\s*([\d\s+()-]{7,})/i
    ) || message.match(/(\+?\d{1,3}[\s-]?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4})/);
    if (phoneMatch) {
      const raw = phoneMatch[1] || phoneMatch[0];
      const digits = raw.replace(/[^\d+]/g, "");
      if (digits.length >= 7) {
        data.phoneNumber = raw.trim();
      }
    }
  }

  if (fieldNames.has("salary")) {
    const salaryMatch = message.match(
      /(?:salary|pay|wage|earning)\s*(?:of\s*|is\s*|:\s*)?(?:usd|egp|\$|£|€)?\s*(\d[\d,]*(?:\.\d+)?)/i
    ) || message.match(
      /(?:\$|£|€|usd|egp)\s*(\d[\d,]*(?:\.\d+)?)/i
    ) || message.match(
      /(\d[\d,]*(?:\.\d+)?)\s*(?:\/\s*month|\/\s*year|per\s*month|per\s*year|monthly|yearly)/i
    );
    if (salaryMatch) {
      data.salary = salaryMatch[1].replace(/,/g, "");
    }
  }

  if (fieldNames.has("city")) {
    const deptOpts = (schema.find((f) => f.name === "department")?.options || [])
      .map((o) => o.toLowerCase());
    const empOpts = (schema.find((f) => f.name === "employmentType")?.options || [])
      .map((o) => o.toLowerCase());
    const city = extractAfterKeywords(message, [
      "in", "from", "city", "located in", "based in",
    ]);
    if (city && !deptOpts.includes(city.toLowerCase()) && !empOpts.includes(city.toLowerCase())) {
      data.city = city;
    }
  }

  if (fieldNames.has("startDate")) {
    const dateStr = extractAfterKeywords(message, [
      "starting", "starts", "start date", "start",
      "joining", "joins", "on", "from",
    ]);
    const parsed = parseDate(dateStr) || parseDate(message);
    if (parsed) {
      data.startDate = parsed;
    }
  }

  if (fieldNames.has("dateOfBirth")) {
    const dobStr = extractAfterKeywords(message, [
      "born", "birth", "date of birth", "dob", "birthday",
    ]);
    const parsed = parseDate(dobStr);
    if (parsed) {
      data.dateOfBirth = parsed;
    }
  }

  return data;
}

function ChatPanel({ onFormUpdate, schema, submissionId }) {
  const currentSchema = schema || localFormSchema;

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "AI",
      message:
        "Hello! Describe the record you'd like to create, and I'll help you fill the form.",
    },
  ]);

  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (userMessage) => {
    if (loading) return;

    const newUserMessage = {
      id: Date.now(),
      sender: "You",
      message: userMessage,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setLoading(true);

    try {
      if (!submissionId) throw new Error("Submission is not ready yet.");
      const data = await extractSubmission(submissionId, userMessage);

      const detectedData = Object.fromEntries(
        (data.filledFields || []).map((field) => [field.name, field.value])
      );

      const fieldLabels = Object.fromEntries(
        currentSchema.map((f) => [f.name, f.label])
      );
      const filledLabels = Object.keys(detectedData).map(
        (key) => fieldLabels[key] || key
      );

      const clarificationText = (data.clarifications || [])
        .map((item) => item.question)
        .join(" ");
      const aiMessage = {
        id: Date.now() + 1,
        sender: "AI",
        message:
          filledLabels.length > 0
            ? `I've filled: ${filledLabels.join(", ")}. ${
                clarificationText || "Review the form and click Submit when ready."
              }`
            : clarificationText || "No fields were detected. Please add more details.",
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (
        Object.keys(detectedData).length > 0 &&
        onFormUpdate
      ) {
        onFormUpdate(detectedData);
      }
    } catch (error) {
      const detectedData = import.meta.env.VITE_ENABLE_LOCAL_AI_FALLBACK === "true"
        ? detectFormDataLocal(userMessage, currentSchema)
        : {};

      const fieldLabels = Object.fromEntries(
        currentSchema.map((f) => [f.name, f.label])
      );
      const filledLabels = Object.keys(detectedData).map(
        (key) => fieldLabels[key] || key
      );

      const aiMessage = {
        id: Date.now() + 1,
        sender: "AI",
        message:
          filledLabels.length > 0
            ? `I've filled: ${filledLabels.join(", ")}. Review the form and click Submit when ready.`
            : `I couldn't process that request: ${error.message}`,
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (
        Object.keys(detectedData).length > 0 &&
        onFormUpdate
      ) {
        onFormUpdate(detectedData);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="chat-panel">
      <div className="chat-header">
        <div>
          <span className="eyebrow">AI FORM ASSISTANT</span>
          <h2>AI Assistant</h2>
        </div>

        <span className="ai-badge">AI</span>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            sender={message.sender}
            message={message.message}
          />
        ))}

        {loading && (
          <div className="chat-typing">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}
      </div>

      <ChatInput onSend={handleSendMessage} disabled={loading} />
    </aside>
  );
}

export default ChatPanel;
