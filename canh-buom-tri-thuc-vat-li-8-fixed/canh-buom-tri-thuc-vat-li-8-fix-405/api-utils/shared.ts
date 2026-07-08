import { GoogleGenAI, Type } from "@google/genai";

export function getConfiguredApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
    return null;
  }
  return key.trim();
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

export function getAiClient(): GoogleGenAI {
  const apiKey = getConfiguredApiKey();
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY on server");
  }
  return new GoogleGenAI({ apiKey });
}

export function readJsonBody(req: any): any {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export function setJsonHeaders(res: any) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
}

export function methodNotAllowed(res: any, allowed: string[]) {
  res.setHeader("Allow", allowed.join(", "));
  return res.status(405).json({
    success: false,
    error: "Method Not Allowed",
    allowed
  });
}

export const questionResponseSchema = {
  type: Type.ARRAY,
  description: "Danh sách các câu hỏi vật lí được tạo ra.",
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      questionText: { type: Type.STRING },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      correctAnswerIndex: { type: Type.INTEGER },
      explanation: { type: Type.STRING },
      points: { type: Type.INTEGER }
    },
    required: ["id", "questionText", "options", "correctAnswerIndex", "explanation", "points"]
  }
};

export function normalizeGeneratedQuestions(rawQuestions: any, reqCount: number, fallbackQuestions: any[]) {
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    return fallbackQuestions.slice(0, reqCount);
  }

  const validQuestions = rawQuestions
    .slice(0, reqCount)
    .map((q: any, index: number) => {
      const options = Array.isArray(q?.options) ? q.options.filter(Boolean).slice(0, 4) : [];
      const correctAnswerIndex = Number(q?.correctAnswerIndex);

      if (
        !q?.questionText ||
        options.length !== 4 ||
        !Number.isInteger(correctAnswerIndex) ||
        correctAnswerIndex < 0 ||
        correctAnswerIndex > 3
      ) {
        return null;
      }

      return {
        id: q.id || `ai-q-${Date.now()}-${index}`,
        questionText: String(q.questionText),
        options: options.map(String),
        correctAnswerIndex,
        explanation: q.explanation ? String(q.explanation) : "Giải thích khoa học chuẩn.",
        points: Number(q.points) || 2
      };
    })
    .filter(Boolean);

  return validQuestions.length > 0 ? validQuestions : fallbackQuestions.slice(0, reqCount);
}

export function buildFallbackQuestions(reqTopic = "Tổng hợp Vật lí 8") {
  return [
    {
      id: `fallback-${Date.now()}-1`,
      questionText: `Khi xe phanh gấp, hành khách trên xe bị xô về phía trước là do hiện tượng nào liên quan đến ${reqTopic}?`,
      options: [
        "Quán tính của cơ thể giữ trạng thái chuyển động cũ.",
        "Trọng lực tác dụng lên hành khách.",
        "Lực ma sát giữa lốp xe và mặt đường.",
        "Sự cản trở của không khí bên trong xe."
      ],
      correctAnswerIndex: 0,
      explanation: "Theo quán tính, khi xe phanh gấp, phần thân dưới dừng lại cùng xe nhưng phần thân trên vẫn tiếp tục chuyển động về phía trước theo vận tốc cũ.",
      points: 2
    },
    {
      id: `fallback-${Date.now()}-2`,
      questionText: "Công thức tính áp suất chất lỏng tại một điểm ở độ sâu h là gì?",
      options: ["p = F / S", "p = d × h", "p = d × V", "p = P / S"],
      correctAnswerIndex: 1,
      explanation: "Áp suất chất lỏng ở độ sâu h so với mặt thoáng được tính bằng p = d × h, trong đó d là trọng lượng riêng của chất lỏng.",
      points: 2
    },
    {
      id: `fallback-${Date.now()}-3`,
      questionText: "Nhiệt năng của một vật tăng lên khi vật thực hiện hành động nào sau đây?",
      options: [
        "Đặt vật vào tủ lạnh.",
        "Cọ xát vật lên một bề mặt khác.",
        "Để vật yên lặng trên bàn.",
        "Mang vật lên độ cao lớn hơn."
      ],
      correctAnswerIndex: 1,
      explanation: "Cọ xát là cách thực hiện công làm biến đổi nhiệt năng, khiến nhiệt độ của vật tăng lên và nhiệt năng tăng.",
      points: 2
    }
  ];
}

export function buildFallbackChatReply(lastUserMsg: string) {
  const lowerMsg = (lastUserMsg || "").toLowerCase();

  if (lowerMsg.includes("chuyển động đều") || lowerMsg.includes("chuyen dong deu") || lowerMsg.includes("chuyển động không đều")) {
    return `**Chuyển động đều** là chuyển động mà vật đi được những quãng đường bằng nhau trong những khoảng thời gian bằng nhau. Khi đó vận tốc không đổi. Ví dụ: đầu kim đồng hồ quay đều.

**Chuyển động không đều** là chuyển động mà vật đi được những quãng đường không bằng nhau trong những khoảng thời gian bằng nhau. Khi đó vận tốc thay đổi. Ví dụ: xe máy đi trong phố lúc nhanh, lúc chậm, lúc dừng đèn đỏ.

Công thức hay dùng cho chuyển động không đều là vận tốc trung bình: **v_tb = s / t**, trong đó **s** là tổng quãng đường và **t** là tổng thời gian.`;
  }

  if (lowerMsg.includes("lực đẩy") || lowerMsg.includes("ác-si-mét") || lowerMsg.includes("acsimet") || lowerMsg.includes("archimedes")) {
    return `Lực đẩy Ác-si-mét là lực do chất lỏng hoặc chất khí tác dụng lên vật nhúng trong nó, có phương thẳng đứng và chiều từ dưới lên.

Công thức: **F_A = d × V**

Trong đó:
- **F_A** là lực đẩy Ác-si-mét, đơn vị N.
- **d** là trọng lượng riêng của chất lỏng, đơn vị N/m³.
- **V** là thể tích phần chất lỏng bị vật chiếm chỗ, đơn vị m³.

Khi vật nổi ổn định trên mặt chất lỏng thì **F_A = P**.`;
  }

  if (lowerMsg.includes("công") || lowerMsg.includes("công suất") || lowerMsg.includes("cong co hoc")) {
    return `Công cơ học xuất hiện khi có lực tác dụng vào vật và làm vật dịch chuyển theo phương không vuông góc với lực.

Công thức: **A = F × s**

Trong đó **A** là công cơ học, **F** là lực tác dụng, **s** là quãng đường dịch chuyển.

Công suất cho biết tốc độ thực hiện công: **P = A / t**.`;
  }

  if (lowerMsg.includes("nhiệt") || lowerMsg.includes("nhiệt lượng") || lowerMsg.includes("nhiệt năng")) {
    return `**Nhiệt năng** là tổng động năng của các phân tử cấu tạo nên vật. Nhiệt độ càng cao thì các phân tử chuyển động càng nhanh, nên nhiệt năng càng lớn.

**Nhiệt lượng** là phần nhiệt năng mà vật nhận thêm hoặc mất bớt trong quá trình truyền nhiệt.

Công thức tính nhiệt lượng: **Q = m × c × Δt**.`;
  }

  return `Thầy/Cô đã nhận được câu hỏi của em. Hiện hệ thống AI thật có thể đang gặp sự cố tạm thời hoặc API key chưa hoạt động đúng, nên đang dùng phản hồi dự phòng để app không bị lỗi.

Với Vật lí 8, em có thể hỏi rõ theo từng chủ đề như: chuyển động, vận tốc, áp suất, lực đẩy Ác-si-mét, công cơ học, công suất, nhiệt năng hoặc nhiệt lượng. Nếu em gửi câu hỏi cụ thể hơn, Thầy/Cô sẽ giải thích từng bước.`;
}
