import { buildFallbackQuestions, getAiClient, getConfiguredApiKey, getGeminiModel, methodNotAllowed, normalizeGeneratedQuestions, questionResponseSchema, readJsonBody, setJsonHeaders } from "../api-utils/shared";

export default async function handler(req: any, res: any) {
  setJsonHeaders(res);

  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  const body = readJsonBody(req);
  const reqCount = Math.min(Math.max(Number(body.count) || 3, 1), 10);
  const reqTopic = body.topic || "Tổng hợp Vật lí 8";
  const reqDifficulty = body.difficulty || "Trung bình";
  const fallbackQuestions = buildFallbackQuestions(reqTopic);

  if (!getConfiguredApiKey()) {
    return res.status(200).json({
      success: true,
      source: "fallback-key-missing",
      message: "Chưa cấu hình GEMINI_API_KEY nên hệ thống đang dùng câu hỏi mẫu dự phòng.",
      questions: fallbackQuestions.slice(0, reqCount)
    });
  }

  try {
    const aiClient = getAiClient();
    const prompt = `Hãy tạo ${reqCount} câu hỏi trắc nghiệm Vật lí lớp 8 THCS về chủ đề "${reqTopic}" với mức độ khó "${reqDifficulty}".
Mỗi câu hỏi phải bao gồm chính xác 4 đáp án lựa chọn bằng tiếng Việt và có lời giải thích dễ hiểu cho học sinh THCS.`;

    const response = await aiClient.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: {
        systemInstruction: "Bạn là chuyên gia biên soạn đề thi trắc nghiệm Vật lí lớp 8 THCS theo chương trình giáo dục Việt Nam.",
        responseMimeType: "application/json",
        responseSchema: questionResponseSchema,
        temperature: 0.7
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Received empty response from Gemini API");
    }

    return res.status(200).json({
      success: true,
      source: "gemini",
      questions: normalizeGeneratedQuestions(JSON.parse(responseText), reqCount, fallbackQuestions)
    });
  } catch (error: any) {
    console.error("Gemini question generation error:", error);
    return res.status(200).json({
      success: true,
      source: "fallback-error",
      message: `Đã xảy ra lỗi khi kết nối AI: ${error?.message || error}. Đang hiển thị câu hỏi mẫu dự phòng.`,
      questions: fallbackQuestions.slice(0, reqCount)
    });
  }
}
