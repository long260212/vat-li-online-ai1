import { buildFallbackChatReply, getAiClient, getConfiguredApiKey, getGeminiModel, methodNotAllowed, readJsonBody, setJsonHeaders } from "../api-utils/shared";

export default async function handler(req: any, res: any) {
  setJsonHeaders(res);

  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  const body = readJsonBody(req);
  const { messages, systemInstruction, lessonTitle, lessonSummary, lessonTheory } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Messages array is required and cannot be empty."
    });
  }

  const lastUserMsg = messages[messages.length - 1]?.content || "";

  if (!getConfiguredApiKey()) {
    return res.status(200).json({
      success: true,
      source: "fallback-key-missing",
      reply: buildFallbackChatReply(lastUserMsg)
    });
  }

  try {
    let finalSystemInstruction = systemInstruction || "Bạn là một giáo viên dạy Vật lí lớp 8 trung học cơ sở thân thiện, uy tín, chuyên nghiệp. Bạn trả lời bằng tiếng Việt, hướng dẫn học sinh một cách dễ hiểu, có ví dụ thực tế và giải thích chi tiết.";

    if (lessonTitle) {
      finalSystemInstruction += `\n\n[Bối cảnh bài học hiện tại]: Học sinh đang xem bài học "${lessonTitle}".
Tóm tắt bài học: ${lessonSummary || "Chưa có"}
Lý thuyết chính: ${lessonTheory || "Chưa có"}.
Khi học sinh đặt câu hỏi, hãy liên hệ câu trả lời với bài học hiện tại.`;
    }

    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content || "") }]
    }));

    const aiClient = getAiClient();
    const response = await aiClient.models.generateContent({
      model: getGeminiModel(),
      contents,
      config: {
        systemInstruction: finalSystemInstruction,
        temperature: 0.8
      }
    });

    return res.status(200).json({
      success: true,
      source: "gemini",
      reply: response.text || buildFallbackChatReply(lastUserMsg)
    });
  } catch (error: any) {
    console.error("Gemini Chat API Error:", error);
    return res.status(200).json({
      success: true,
      source: "fallback-error",
      message: error?.message || String(error),
      reply: buildFallbackChatReply(lastUserMsg)
    });
  }
}
