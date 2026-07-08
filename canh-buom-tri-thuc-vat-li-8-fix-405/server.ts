import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config({ path: [".env.local", ".env"], quiet: true });

// Global Fetch Interceptor to handle Google AI Studio access tokens (starting with 'AQ.')
const originalFetch = globalThis.fetch;
globalThis.fetch = async function (input: any, init: any) {
  let url = "";
  if (typeof input === "string") {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else if (input && typeof input === "object" && "url" in input) {
    url = input.url;
  }

  if (url.includes("generativelanguage.googleapis.com") || url.includes("googleapis.com")) {
    let headers: Headers | null = null;
    if (init && init.headers) {
      headers = new Headers(init.headers);
    } else if (input && typeof input === "object" && "headers" in input) {
      headers = new Headers(input.headers);
    }

    if (headers) {
      const apiKey = headers.get("x-goog-api-key");
      if (apiKey && apiKey.startsWith("AQ.")) {
        headers.delete("x-goog-api-key");
        headers.set("Authorization", `Bearer ${apiKey}`);
        if (init) {
          init.headers = headers;
        } else {
          init = { headers };
        }
        console.log(`[Fetch Interceptor] Converted AQ. token to Bearer Authorization for ${url}`);
      }
    }
  }
  return originalFetch(input, init);
};

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function getConfiguredApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
    return null;
  }
  return key.trim();
}

function normalizeGeneratedQuestions(rawQuestions: any, reqCount: number, fallbackQuestions: any[]) {
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    return fallbackQuestions.slice(0, reqCount);
  }

  const validQuestions = rawQuestions
    .slice(0, reqCount)
    .map((q: any, index: number) => {
      const options = Array.isArray(q?.options) ? q.options.filter(Boolean).slice(0, 4) : [];
      const correctAnswerIndex = Number(q?.correctAnswerIndex);

      if (!q?.questionText || options.length !== 4 || !Number.isInteger(correctAnswerIndex) || correctAnswerIndex < 0 || correctAnswerIndex > 3) {
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

// Initialize Gemini Client Lazily
let cachedAiClient: GoogleGenAI | null = null;
let lastUsedKey: string | null = null;

function getAiClient(): GoogleGenAI {
  const key = getConfiguredApiKey();
  if (!key) {
    throw new Error("Missing GEMINI_API_KEY on server");
  }
  
  if (!cachedAiClient || lastUsedKey !== key) {
    cachedAiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    lastUsedKey = key;
    console.log("Gemini Client initialized successfully on backend with latest API key.");
  }
  return cachedAiClient;
}

// API endpoint to generate high-quality physics questions
app.post(["/api/generate-questions", "/generate-questions"], async (req, res) => {
  const { topic, difficulty, count } = req.body;

  const reqCount = Math.min(Math.max(Number(count) || 3, 1), 10);
  const reqTopic = topic || "Tổng hợp Vật lí 8";
  const reqDifficulty = difficulty || "Trung bình";

  console.log(`Generating ${reqCount} questions for Topic: ${reqTopic}, Difficulty: ${reqDifficulty}`);

  // Fallback physics questions if Gemini is unavailable
  const fallbackQuestions = [
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
      questionText: `Công thức tính áp suất chất lỏng tại một điểm ở độ sâu h là gì?`,
      options: [
        "p = F / S",
        "p = d * h",
        "p = d * V",
        "p = P / S"
      ],
      correctAnswerIndex: 1,
      explanation: "Công thức tính áp suất chất lỏng ở độ sâu h so với mặt thoáng là p = d * h, trong đó d là trọng lượng riêng của chất lỏng.",
      points: 2
    },
    {
      id: `fallback-${Date.now()}-3`,
      questionText: `Nhiệt năng của một vật tăng lên khi vật thực hiện hành động nào sau đây?`,
      options: [
        "Đặt vật vào tủ lạnh.",
        "Cọ xát vật lên một bề mặt khác.",
        "Để vật yên lặng trên bàn.",
        "Mang vật lên độ cao lớn hơn."
      ],
      correctAnswerIndex: 1,
      explanation: "Cọ xát vật là cách thực hiện công làm biến đổi nhiệt năng của vật, khiến nhiệt độ của vật tăng lên và nhiệt năng tăng.",
      points: 2
    }
  ];

  try {
    const aiClient = getAiClient();
    const prompt = `Hãy tạo ${reqCount} câu hỏi trắc nghiệm Vật lí lớp 8 THCS về chủ đề "${reqTopic}" với mức độ khó "${reqDifficulty}".
    Mỗi câu hỏi phải bao gồm chính xác 4 đáp án lựa chọn (A, B, C, D) bằng tiếng Việt.
    Hãy đảm bảo các câu hỏi mang tính khoa học cao, sát thực tế, có hình thức chuẩn mực và đi kèm lời giải thích đầy đủ dễ hiểu cho học sinh THCS.`;

    const response = await aiClient.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "Bạn là một giáo sư Vật lí và là chuyên gia biên soạn đề thi trắc nghiệm Vật lí lớp 8 THCS theo chương trình giáo dục Việt Nam. Bạn luôn tạo ra các câu hỏi thông minh, sáng tạo, không lỗi khoa học và có giải thích đáp án cặn kẽ.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "Danh sách các câu hỏi vật lí được tạo ra.",
          items: {
            type: Type.OBJECT,
            properties: {
              id: {
                type: Type.STRING,
                description: "Mã định danh duy nhất ví dụ: ai-q-1, ai-q-2..."
              },
              questionText: {
                type: Type.STRING,
                description: "Nội dung câu hỏi trắc nghiệm Vật lí 8."
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Danh sách 4 lựa chọn đáp án."
              },
              correctAnswerIndex: {
                type: Type.INTEGER,
                description: "Chỉ số của đáp án đúng (từ 0 đến 3)."
              },
              explanation: {
                type: Type.STRING,
                description: "Lời giải thích khoa học chi tiết vì sao đáp án đó đúng."
              },
              points: {
                type: Type.INTEGER,
                description: "Số điểm cho câu hỏi này, thường là 2."
              }
            },
            required: ["id", "questionText", "options", "correctAnswerIndex", "explanation", "points"]
          }
        },
        temperature: 0.7
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Received empty response from Gemini API");
    }

    const generatedQuestions = normalizeGeneratedQuestions(JSON.parse(responseText), reqCount, fallbackQuestions);
    return res.json({
      success: true,
      source: "gemini",
      questions: generatedQuestions
    });

  } catch (error: any) {
    console.error("Gemini question generation error:", error);
    if (error.message && error.message.includes("Missing GEMINI_API_KEY")) {
      return res.json({
        success: true,
        source: "fallback-key-missing",
        message: "Chưa cấu hình GEMINI_API_KEY nên hệ thống đang dùng câu hỏi mẫu dự phòng.",
        questions: fallbackQuestions.slice(0, reqCount)
      });
    }
    return res.json({
      success: true,
      source: "fallback-error",
      message: `Đã xảy ra lỗi khi kết nối AI: ${error.message || error}. Đang hiển thị câu hỏi mẫu dự phòng.`,
      questions: fallbackQuestions.slice(0, reqCount)
    });
  }
});

// API endpoint to chat with AI to discuss physics lessons
app.post(["/api/chat-ai", "/chat-ai"], async (req, res) => {
  const { messages, systemInstruction, lessonTitle, lessonSummary, lessonTheory } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages array is required and cannot be empty." });
  }

  // Check if API key is available
  if (!getConfiguredApiKey()) {
    const lastUserMsg = messages[messages.length - 1]?.content || "";
    let mockReply = "";
    const lowerMsg = lastUserMsg.toLowerCase();

    if (lowerMsg.includes("lộ trình") || lowerMsg.includes("lo trinh") || lowerMsg.includes("kế hoạch") || lowerMsg.includes("roadmap")) {
      // Determine what type of roadmap based on keywords
      let goalTitle = "Bứt phá điểm 8+ học kỳ";
      let weeksDetail = "";

      if (lowerMsg.includes("học sinh giỏi") || lowerMsg.includes("hsg") || lowerMsg.includes("nâng cao") || lowerMsg.includes("advanced")) {
        goalTitle = "Chinh phục Học sinh giỏi & Chuyên Lý";
        weeksDetail = `### Tuần 1: Chuyển động cơ học nâng cao & Đồ thị vận tốc
- **Kiến thức**: Biểu diễn vận tốc bằng vectơ, bài toán gặp nhau của hai vật chuyển động ngược chiều/cùng chiều, đồ thị tọa độ - thời gian nâng cao.
- **Công thức cốt lõi**: v_tb = (s1 + s2) / (t1 + t2). Bài toán hai vật gặp nhau: s1 + s2 = S hoặc |s1 - s2| = S.
- **Bài tập điển hình**: Bài toán hai xe xuất phát lệch giờ, chuyển động tròn đều xung quanh hồ nước.
- **Mẹo nhớ**: Luôn chọn hệ quy chiếu và mốc thời gian rõ ràng trước khi lập phương trình chuyển động.

### Tuần 2: Áp suất chất lỏng & Bình thông nhau phức tạp
- **Kiến thức**: Sự cân bằng chất lỏng trong bình thông nhau chứa nhiều chất lỏng không hòa tan (nước, dầu, thủy ngân), áp suất khí quyển đo bằng cột thủy ngân Torricelli.
- **Công thức cốt lõi**: p = d1.h1 + d2.h2. Áp suất tại các điểm trên cùng mặt phẳng nằm ngang trong cùng một chất lỏng đứng yên thì bằng nhau.
- **Bài tập điển hình**: Tính độ chênh lệch mặt thoáng giữa hai nhánh bình thông nhau khi đổ thêm dầu vào một nhánh.
- **Mẹo nhớ**: Xác định mặt phẳng phân giới giữa các chất lỏng để áp dụng công thức bằng nhau của áp suất.

### Tuần 3: Lực đẩy Ác-si-mét nâng cao & Sự nổi của vật rỗng
- **Kiến thức**: Lực đẩy Ác-si-mét tác dụng lên vật có hình dạng phức tạp, điều kiện cân bằng của vật nổi, bài toán quả cầu rỗng hoặc vật liên kết (nối bằng dây).
- **Công thức cốt lõi**: F_A = d.V. Khi vật nổi: P = F_A => d_vat.V_vat = d_long.V_chim.
- **Bài tập điển hình**: Quả cầu kim loại rỗng nổi trên mặt nước, tính thể tích phần rỗng tối thiểu để vật nổi.
- **Mẹo nhớ**: Phân tích kỹ các lực tác dụng lên vật (Trọng lực, Lực đẩy Ác-si-mét, Lực căng dây) và lập phương trình cân bằng lực.

### Tuần 4: Công cơ học, Máy cơ đơn giản nâng cao & Hiệu suất
- **Kiến thức**: Quy tắc vàng về công áp dụng cho hệ thống palăng phức tạp, đòn bẩy không cân bằng, mặt phẳng nghiêng có ma sát, tính hiệu suất của máy cơ đơn giản.
- **Công thức cốt lõi**: H = A_ich / A_toanphan * 100%. A_ich = P.h, A_hao_phi = F_ms.s.
- **Bài tập điển hình**: Hệ thống ròng rọc động kết hợp ròng rọc cố định nâng vật nặng trong công trường, tính lực kéo thực tế khi có lực cản.
- **Mẹo nhớ**: Định luật về công: Không một máy cơ đơn giản nào cho ta lợi về công. Lợi bao nhiêu lần về lực thì thiệt bấy nhiêu lần về đường đi.`;
      } else if (lowerMsg.includes("mất gốc") || lowerMsg.includes("căn bản") || lowerMsg.includes("yếu") || lowerMsg.includes("recovery")) {
        goalTitle = "Lấy lại căn bản Vật lí 8 (Cực nhanh & Tinh gọn)";
        weeksDetail = `### Tuần 1: Chuyển động cơ học & Vận tốc cơ bản
- **Kiến thức**: Nhận biết chuyển động/đứng yên so với vật mốc. Tìm hiểu vận tốc biểu thị mức độ nhanh hay chậm của chuyển động.
- **Công thức cốt lõi**: v = s / t (vận tốc = quãng đường chia thời gian).
- **Bài tập điển hình**: Đổi đơn vị vận tốc từ km/h sang m/s (chia cho 3,6) và ngược lại (nhân cho 3,6). Tính thời gian đi học của học sinh.
- **Mẹo nhớ**: Đảm bảo quãng đường (s) và thời gian (t) phải cùng đơn vị đo trước khi chia (m tương ứng với giây, km tương ứng với giờ).

### Tuần 2: Áp suất & Áp suất chất lỏng cơ bản
- **Kiến thức**: Khái niệm áp lực là lực ép vuông góc lên bề mặt. Hiểu tại sao đinh phải nhọn, xẻng phải sắc. Áp suất chất lỏng tăng dần theo độ sâu.
- **Công thức cốt lõi**: p = F / S (áp suất bằng áp lực chia diện tích bị ép), p = d.h (áp suất chất lỏng).
- **Bài tập điển hình**: Tính áp suất của một người đứng bằng hai chân lên mặt đất. Tính áp suất nước tác dụng lên thợ lặn ở độ sâu 15m.
- **Mẹo nhớ**: Diện tích S phải đổi ra đơn vị mét vuông (m²). Hãy nhớ: 1 cm² = 0.0001 m².

### Tuần 3: Lực đẩy Ác-si-mét & Sự nổi cơ bản
- **Kiến thức**: Mọi vật nhúng trong chất lỏng đều chịu lực đẩy hướng từ dưới lên gọi là lực đẩy Ác-si-mét. Điều kiện vật nổi, vật lơ lửng, vật chìm.
- **Công thức cốt lõi**: F_A = d.V (d là trọng lượng riêng chất lỏng, V là thể tích phần chìm).
- **Bài tập điển hình**: Tính lực đẩy Ác-si-mét tác dụng lên khối gỗ chìm hoàn toàn trong nước. Giải thích tại sao tàu sắt nổi được còn cây đinh sắt lại chìm.
- **Mẹo nhớ**: Thể tích V trong công thức là thể tích của phần vật chìm trong chất lỏng, không phải luôn là thể tích toàn bộ vật.

### Tuần 4: Cơ năng & Sự chuyển hóa năng lượng cơ bản
- **Kiến thức**: Vật có khả năng sinh công thì vật đó có cơ năng. Phân biệt Động năng (do chuyển động mà có) và Thế năng (do độ cao hoặc biến dạng đàn hồi).
- **Bài tập điển hình**: Nhận biết các dạng cơ năng của vật đang rơi, con lắc đang dao động, cung tên đang giương.
- **Mẹo nhớ**: Vật ở vị trí càng cao thì thế năng càng lớn; vật chuyển động càng nhanh thì động năng càng lớn. Khi vật rơi, thế năng chuyển hóa dần thành động năng.`;
      } else if (lowerMsg.includes("cấp tốc") || lowerMsg.includes("ôn thi") || lowerMsg.includes("nhanh") || lowerMsg.includes("fast")) {
        goalTitle = "Ôn thi cấp tốc trước kỳ thi (Hệ thống hóa 1-2 tuần)";
        weeksDetail = `### Chặng 1: Hệ thống hóa toàn bộ công thức Cơ học (Ngày 1 - 3)
- **Công thức trọng tâm**:
  - Vận tốc trung bình: v_tb = S / t_tong
  - Áp suất rắn: p = F / S
  - Áp suất chất lỏng: p = d * h
  - Lực đẩy Ác-si-mét: F_A = d * V_chim
  - Công cơ học: A = F * s
  - Công suất: P = A / t
- **Bài tập rèn luyện**: Giải các câu hỏi lý thuyết trắc nghiệm nhanh để nhớ định nghĩa và đơn vị đo chuẩn của từng đại lượng (Pa, N, J, W).

### Chặng 2: Hệ thống hóa toàn bộ công thức Nhiệt học (Ngày 4 - 6)
- **Công thức trọng tâm**:
  - Công thức tính nhiệt lượng: Q = m * c * Δt
  - Phương trình cân bằng nhiệt: Q_toa = Q_thu
  - Năng suất tỏa nhiệt của nhiên liệu: Q = q * m
- **Bài tập rèn luyện**: Giải bài toán pha nước nóng lạnh, tìm nhiệt độ cân bằng cuối cùng của hỗn hợp.

### Chặng 3: Giải đề thi thử tổng hợp & Rà soát lỗ hổng (Ngày 7 - 10)
- **Phương pháp**: Làm 3-5 đề thi thử học kỳ có cấu trúc chuẩn (70% trắc nghiệm, 30% tự luận). Nhận diện các lỗi sai thường gặp về đổi đơn vị hoặc đọc sai đề bài.
- **Mẹo phòng thi**: Đọc kỹ câu hỏi, làm câu dễ trước, câu khó sau. Luôn viết công thức tổng quát trước khi thay số tính toán.`;
      } else {
        goalTitle = "Bứt phá điểm số 8+ học kỳ";
        weeksDetail = `### Tuần 1: Chuyển động cơ học & Biểu diễn lực
- **Kiến thức**: Chuyển động cơ học, vận tốc trung bình của chuyển động không đều, biểu diễn lực bằng mũi tên, sự cân bằng lực và quán tính.
- **Công thức cốt lõi**: v = s / t; v_tb = (s1 + s2) / (t1 + t2).
- **Bài tập điển hình**: Tính vận tốc trung bình trên cả quãng đường gồm hai chặng đi với vận tốc khác nhau. Biểu diễn trọng lực tác dụng lên vật nặng 5kg.
- **Mẹo nhớ**: Khi tính v_tb, tuyệt đối không lấy trung bình cộng hai vận tốc, mà phải tính tổng quãng đường chia cho tổng thời gian tương ứng.

### Tuần 2: Áp suất (Chất rắn & Chất lỏng)
- **Kiến thức**: Khái niệm áp suất, cách tăng/giảm áp suất trong thực tế. Áp suất chất lỏng và ứng dụng trong bình thông nhau, máy nén thủy lực.
- **Công thức cốt lõi**: p = F / S; p = d.h. Máy nén thủy lực: F / f = S / s.
- **Bài tập điển hình**: Tính áp suất tác dụng lên đáy bình chứa nước. Tính lực nâng của piston lớn khi tác dụng lực lên piston nhỏ.
- **Mẹo nhớ**: Đổi diện tích S từ cm², dm² ra m² một cách chính xác trước khi tính toán.

### Tuần 3: Lực đẩy Ác-si-mét & Công cơ học
- **Kiến thức**: Lực đẩy Ác-si-mét, sự nổi của các vật. Khái niệm công cơ học và công thức tính công khi lực cùng hướng chuyển động.
- **Công thức cốt lõi**: F_A = d.V; A = F.s.
- **Bài tập điển hình**: Tính lực đẩy Ác-si-mét tác dụng lên vật chìm hoàn toàn hoặc chìm một phần. Tính công của lực kéo kéo gạch lên cao.
- **Mẹo nhớ**: Chỉ có công cơ học khi có lực tác dụng và làm vật di chuyển theo phương không vuông góc với lực.

### Tuần 4: Công suất, Cơ năng & Ôn tập Nhiệt lượng
- **Kiến thức**: Ý nghĩa của công suất, phân biệt thế năng và động năng, công thức tính nhiệt lượng thu vào để nóng lên.
- **Công thức cốt lõi**: P = A / t; Q = m.c.Δt.
- **Bài tập điển hình**: Tính công suất của một động cơ nâng vật nặng. Tính nhiệt lượng cần truyền cho ấm nước nhôm nặng 0.5kg chứa 2 lít nước để sôi.
- **Mẹo nhớ**: Đảm bảo đổi thể tích nước sang khối lượng (1 lít nước tương đương 1 kg nước) trước khi tính Q.`;
      }

      mockReply = `Chào em! Thầy/Cô rất vui được đồng hành cùng em xây dựng lộ trình học tập hiệu quả.

Hiện tại hệ thống đang ở chế độ **Offline dự phòng** do chưa cấu hình API Key, tuy dưới đây là **Lộ trình học tập Vật lí 8 cá nhân hóa** được Thầy/Cô biên soạn vô cùng chi tiết nhằm giúp em đạt mục tiêu **${goalTitle}**:

---

## 🗺️ LỘ TRÌNH CHI TIẾT TRONG 4 TUẦN

${weeksDetail}

---

## 💡 LỜI KHUYÊN ĐỂ HỌC TỐT VẬT LÍ 8:
1. **Lý thuyết gắn liền thực tiễn**: Đừng học vẹt công thức. Hãy tự giải thích các hiện tượng đời thường (ví dụ: tại sao lốp xe đạp bơm căng để ngoài nắng lại dễ nổ? -> Áp suất khí quyển & giãn nở nhiệt).
2. **Luyện tập vẽ sơ đồ lực**: Khi làm bài tập lực đẩy Ác-si-mét hoặc sự nổi, luôn vẽ hình biểu diễn các lực (Trọng lực P hướng xuống, F_A hướng lên) để tránh bỏ sót lực.
3. **Thường xuyên làm bài tự luyện**: Hãy vào mục **Bài tập tự luyện** hoặc **Tạo đề thi trắc nghiệm bằng AI** trên ứng dụng này để kiểm tra ngay mức độ hiểu bài của mình nhé!`;
    } else if (lowerMsg.includes("áp suất") || lowerMsg.includes("ap suat")) {
      mockReply = "Chào em! Áp suất là đại lượng đặc trưng cho tác dụng của áp lực lên diện tích bị ép.\n\nCông thức tính áp suất chung là: **p = F / S**, trong đó F là áp lực (N), S là diện tích bị ép (m²), và p là áp suất (N/m² hoặc Pa).\n\nĐối với chất lỏng, áp suất tại độ sâu h được tính bằng: **p = d * h**, với d là trọng lượng riêng của chất lỏng. Em có câu hỏi hay bài tập cụ thể nào cần Thầy giải thích thêm không?";
    } else if (lowerMsg.includes("ác-si-mét") || lowerMsg.includes("ac-si-met") || lowerMsg.includes("lực đẩy") || lowerMsg.includes("luc day")) {
      mockReply = "Chào em! Lực đẩy Ác-si-mét là lực tác dụng bởi chất lỏng (hoặc chất khí) lên một vật nhúng trong nó, hướng thẳng đứng từ dưới lên trên.\n\nCông thức tính lực đẩy Ác-si-mét là: **F_A = d * V**, trong đó:\n- **d** là trọng lượng riêng của chất lỏng (N/m³)\n- **V** là thể tích phần chất lỏng bị vật chiếm chỗ (m³)\n\n*Lưu ý:* Khi vật nổi lơ lửng trên mặt thoáng, lực đẩy Ác-si-mét bằng đúng trọng lượng P của vật đó em nhé!";
    } else if (lowerMsg.includes("công") || lowerMsg.includes("cong co hoc") || lowerMsg.includes("công suất")) {
      mockReply = "Chào em! Trong Vật lí, ta chỉ có công cơ học khi có lực tác dụng vào vật và làm vật dịch chuyển theo phương không vuông góc với lực.\n\nCông thức tính công cơ học là: **A = F * s**.\n- **A**: Công cơ học (J)\n- **F**: Lực tác dụng (N)\n- **s**: Quãng đường dịch chuyển (m)\n\nCòn **Công suất** đặc trưng cho tốc độ thực hiện công, tính bằng: **P = A / t** (W hoặc HP).";
    } else if (lowerMsg.includes("nhiệt") || lowerMsg.includes("nhiệt lượng") || lowerMsg.includes("can bang nhiet") || lowerMsg.includes("cân bằng")) {
      mockReply = "Chào em! Về phần Nhiệt học Vật lí 8, chúng ta có công thức tính nhiệt lượng thu vào để nóng lên: **Q = m * c * Δt**.\n\nKhi có sự trao đổi nhiệt giữa hai vật, ta áp dụng **Phương trình cân bằng nhiệt**: **Q_tỏa = Q_thu**.\n- Vật có nhiệt độ cao hơn tỏa ra nhiệt lượng: Q_tỏa = m1 * c1 * (t1 - t_cb)\n- Vật có nhiệt độ thấp hơn thu vào nhiệt lượng: Q_thu = m2 * c2 * (t_cb - t2)\n\nEm có bài tập cân bằng nhiệt nào cần hỗ trợ không?";
    } else {
      mockReply = `Chào em! Thầy/Cô rất vui được đồng hành cùng em học tốt Vật lí 8.

Hiện tại hệ thống chưa cấu hình **GEMINI_API_KEY** trong phần **Settings > Secrets**, nên Thầy/Cô đang phản hồi ở chế độ offline dự phòng. 

Tuy nhiên, em vẫn có thể trao đổi về các bài học trọng tâm như:
- **Chuyển động cơ học, Vận tốc**
- **Áp suất chất lỏng & Áp suất khí quyển**
- **Lực đẩy Ác-si-mét & Sự nổi**
- **Công cơ học, Công suất, Cơ năng**
- **Nhiệt năng, Nhiệt lượng & Cân bằng nhiệt**

Ngoài ra, em có thể trải nghiệm **Tạo Lộ trình học tập AI** ở góc trái màn hình để Thầy/Cô phác thảo kế hoạch ôn luyện chuyên sâu cho em nhé!`;
    }

    return res.json({
      success: true,
      source: "mock",
      reply: mockReply
    });
  }

  let aiClient;
  try {
    aiClient = getAiClient();
  } catch (err: any) {
    console.error("Gemini API Key missing on server:", err);
    return res.status(400).json({
      error: "Missing GEMINI_API_KEY on server",
      message: "Missing GEMINI_API_KEY on server"
    });
  }

  try {
    // Formulate final system instruction, optionally including selected lesson context
    let finalSystemInstruction = systemInstruction || "Bạn là một giáo viên dạy Vật lí lớp 8 trung học cơ sở thân thiện, uy tín, chuyên nghiệp. Bạn trả lời bằng tiếng Việt, hướng dẫn học sinh một cách dễ hiểu, có ví dụ thực tế và giải thích chi tiết.";

    if (lessonTitle) {
      finalSystemInstruction += `\n\n[Bối cảnh bài học hiện tại]: Học sinh đang xem bài học "${lessonTitle}".
Tóm tắt bài học: ${lessonSummary || "Chưa có"}
Lý thuyết chính: ${lessonTheory || "Chưa có"}.
Khi học sinh đặt câu hỏi, hãy cố gắng liên hệ câu trả lời chặt chẽ với kiến thức và ví dụ của bài học này để giúp học sinh nắm vững bài học hiện tại tốt nhất.`;
    }

    // Convert message history format for @google/genai SDK
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const response = await aiClient.models.generateContent({
      model: GEMINI_MODEL,
      contents: contents,
      config: {
        systemInstruction: finalSystemInstruction,
        temperature: 0.8
      }
    });

    const reply = response.text || "Xin lỗi em, Thầy vừa gặp sự cố nhỏ trong việc xử lý thông tin. Em hỏi lại được không?";
    return res.json({
      success: true,
      source: "gemini",
      reply: reply
    });

  } catch (error: any) {
    console.error("Gemini Chat API Error:", error);
    if (error.message && error.message.includes("Missing GEMINI_API_KEY")) {
      return res.status(400).json({
        error: "Missing GEMINI_API_KEY on server",
        message: "Missing GEMINI_API_KEY on server"
      });
    }

    // Generate highly friendly offline fallback replies for robust student experience
    const lastUserMsg = messages[messages.length - 1]?.content || "";
    let mockReply = "";
    const lowerMsg = lastUserMsg.toLowerCase();

    let goalTitle = "Bứt phá điểm số 8+ học kỳ";
    let weeksDetail = "";

    if (lowerMsg.includes("học sinh giỏi") || lowerMsg.includes("hsg") || lowerMsg.includes("nâng cao") || lowerMsg.includes("advanced")) {
      goalTitle = "Chinh phục Học sinh giỏi & Chuyên Lý";
      weeksDetail = `### Tuần 1: Chuyển động cơ học nâng cao & Đồ thị vận tốc
- **Kiến thức**: Biểu diễn vận tốc bằng vectơ, bài toán gặp nhau của hai vật chuyển động ngược chiều/cùng chiều, đồ thị tọa độ - thời gian nâng cao.
- **Công thức cốt lõi**: v_tb = (s1 + s2) / (t1 + t2). Bài toán hai vật gặp nhau: s1 + s2 = S hoặc |s1 - s2| = S.
- **Bài tập điển hình**: Bài toán hai xe xuất phát lệch giờ, chuyển động tròn đều xung quanh hồ nước.
- **Mẹo nhớ**: Luôn chọn hệ quy chiếu và mốc thời gian rõ ràng trước khi lập phương trình chuyển động.

### Tuần 2: Áp suất chất lỏng & Bình thông nhau phức tạp
- **Kiến thức**: Sự cân bằng chất lỏng trong bình thông nhau chứa nhiều chất lỏng không hòa tan (nước, dầu, thủy ngân), áp suất khí quyển đo bằng cột thủy ngân Torricelli.
- **Công thức cốt lõi**: p = d1.h1 + d2.h2. Áp suất tại các điểm trên cùng mặt phẳng nằm ngang trong cùng một chất lỏng đứng yên thì bằng nhau.
- **Bài tập điển hình**: Tính độ chênh lệch mặt thoáng giữa hai nhánh bình thông nhau khi đổ thêm dầu vào một nhánh.
- **Mẹo nhớ**: Xác định mặt phẳng phân giới giữa các chất lỏng để áp dụng công thức bằng nhau của áp suất.

### Tuần 3: Lực đẩy Ác-si-mét nâng cao & Sự nổi của vật rỗng
- **Kiến thức**: Lực đẩy Ác-si-mét tác dụng lên vật có hình dạng phức tạp, điều kiện cân bằng của vật nổi, bài toán quả cầu rỗng hoặc vật liên kết (nối bằng dây).
- **Công thức cốt lõi**: F_A = d.V. Khi vật nổi: P = F_A => d_vat.V_vat = d_long.V_chim.
- **Bài tập điển hình**: Quả cầu kim loại rỗng nổi trên mặt nước, tính thể tích phần rỗng tối thiểu để vật nổi.
- **Mẹo nhớ**: Phân tích kỹ các lực tác dụng lên vật (Trọng lực, Lực đẩy Ác-si-mét, Lực căng dây) và lập phương trình cân bằng lực.

### Tuần 4: Công cơ học, Máy cơ đơn giản nâng cao & Hiệu suất
- **Kiến thức**: Quy tắc vàng về công áp dụng cho hệ thống palăng phức tạp, đòn bẩy không cân bằng, mặt phẳng nghiêng có ma sát, tính hiệu suất của máy cơ đơn giản.
- **Công thức cốt lõi**: H = A_ich / A_toanphan * 100%. A_ich = P.h, A_hao_phi = F_ms.s.
- **Bài tập điển hình**: Hệ thống ròng rọc động kết hợp ròng rọc cố định nâng vật nặng trong công trường, tính lực kéo thực tế khi có lực cản.
- **Mẹo nhớ**: Định luật về công: Không một máy cơ đơn giản nào cho ta lợi về công. Lợi bao nhiêu lần về lực thì thiệt bấy nhiêu lần về đường đi.`;
    } else if (lowerMsg.includes("mất gốc") || lowerMsg.includes("căn bản") || lowerMsg.includes("yếu") || lowerMsg.includes("recovery")) {
      goalTitle = "Lấy lại căn bản Vật lí 8 (Cực nhanh & Tinh gọn)";
      weeksDetail = `### Tuần 1: Chuyển động cơ học & Vận tốc cơ bản
- **Kiến thức**: Nhận biết chuyển động/đứng yên so với vật mốc. Tìm hiểu vận tốc biểu thị mức độ nhanh hay chậm của chuyển động.
- **Công thức cốt lõi**: v = s / t (vận tốc = quãng đường chia thời gian).
- **Bài tập điển hình**: Đổi đơn vị vận tốc từ km/h sang m/s (chia cho 3,6) và ngược lại (nhân cho 3,6). Tính thời gian đi học của học sinh.
- **Mẹo nhớ**: Đảm bảo quãng đường (s) và thời gian (t) phải cùng đơn vị đo trước khi chia (m tương ứng với giây, km tương ứng với giờ).

### Tuần 2: Áp suất & Áp suất chất lỏng cơ bản
- **Kiến thức**: Khái niệm áp lực là lực ép vuông góc lên bề mặt. Hiểu tại sao đinh phải nhọn, xẻng phải sắc. Áp suất chất lỏng tăng dần theo độ sâu.
- **Công thức cốt lõi**: p = F / S (áp suất bằng áp lực chia diện tích bị ép), p = d.h (áp suất chất lỏng).
- **Bài tập điển hình**: Tính áp suất của một người đứng bằng hai chân lên mặt đất. Tính áp suất nước tác dụng lên thợ lặn ở độ sâu 15m.
- **Mẹo nhớ**: Diện tích S phải đổi ra đơn vị mét vuông (m²). Hãy nhớ: 1 cm² = 0.0001 m².

### Tuần 3: Lực đẩy Ác-si-mét & Sự nổi cơ bản
- **Kiến thức**: Mọi vật nhúng trong chất lỏng đều chịu lực đẩy hướng từ dưới lên gọi là lực đẩy Ác-si-mét. Điều kiện vật nổi, vật lơ lửng, vật chìm.
- **Công thức cốt lõi**: F_A = d.V (d là trọng lượng riêng chất lỏng, V là thể tích phần chìm).
- **Bài tập điển hình**: Tính lực đẩy Ác-si-mét tác dụng lên khối gỗ chìm hoàn toàn trong nước. Giải thích tại sao tàu sắt nổi được còn cây đinh sắt lại chìm.
- **Mẹo nhớ**: Thể tích V trong công thức là thể tích của phần vật chìm trong chất lỏng, không phải luôn là thể tích toàn bộ vật.

### Tuần 4: Cơ năng & Sự chuyển hóa năng lượng cơ bản
- **Kiến thức**: Vật có khả năng sinh công thì vật đó có cơ năng. Phân biệt Động năng (do chuyển động mà có) và Thế năng (do độ cao hoặc biến dạng đàn hồi).
- **Bài tập điển hình**: Nhận biết các dạng cơ năng của vật đang rơi, con lắc đang dao động, cung tên đang giương.
- **Mẹo nhớ**: Vật ở vị trí càng cao thì thế năng càng lớn; vật chuyển động càng nhanh thì động năng càng lớn. Khi vật rơi, thế năng chuyển hóa dần thành động năng.`;
    } else if (lowerMsg.includes("cấp tốc") || lowerMsg.includes("ôn thi") || lowerMsg.includes("nhanh") || lowerMsg.includes("fast")) {
      goalTitle = "Ôn thi cấp tốc trước kỳ thi (Hệ thống hóa 1-2 tuần)";
      weeksDetail = `### Chặng 1: Hệ thống hóa toàn bộ công thức Cơ học (Ngày 1 - 3)
- **Công thức trọng tâm**:
  - Vận tốc trung bình: v_tb = S / t_tong
  - Áp suất rắn: p = F / S
  - Áp suất chất lỏng: p = d * h
  - Lực đẩy Ác-si-mét: F_A = d * V_chim
  - Công cơ học: A = F * s
  - Công suất: P = A / t
- **Bài tập rèn luyện**: Giải các câu hỏi lý thuyết trắc nghiệm nhanh để nhớ định nghĩa và đơn vị đo chuẩn của từng đại lượng (Pa, N, J, W).

### Chặng 2: Hệ thống hóa toàn bộ công thức Nhiệt học (Ngày 4 - 6)
- **Công thức trọng tâm**:
  - Công thức tính nhiệt lượng: Q = m * c * Δt
  - Phương trình cân bằng nhiệt: Q_toa = Q_thu
  - Năng suất tỏa nhiệt của nhiên liệu: Q = q * m
- **Bài tập rèn luyện**: Giải bài toán pha nước nóng lạnh, tìm nhiệt độ cân bằng cuối cùng của hỗn hợp.

### Chặng 3: Giải đề thi thử tổng hợp & Rà soát lỗ hổng (Ngày 7 - 10)
- **Phương pháp**: Làm 3-5 đề thi thử học kỳ có cấu trúc chuẩn (70% trắc nghiệm, 30% tự luận). Nhận diện các lỗi sai thường gặp về đổi đơn vị hoặc đọc sai đề bài.
- **Mẹo phòng thi**: Đọc kỹ câu hỏi, làm câu dễ trước, câu khó sau. Luôn viết công thức tổng quát trước khi thay số tính toán.`;
    } else {
      goalTitle = "Bứt phá điểm số 8+ học kỳ";
      weeksDetail = `### Tuần 1: Chuyển động cơ học & Biểu diễn lực
- **Kiến thức**: Chuyển động cơ học, vận tốc trung bình của chuyển động không đều, biểu diễn lực bằng mũi tên, sự cân bằng lực và quán tính.
- **Công thức cốt lõi**: v = s / t; v_tb = (s1 + s2) / (t1 + t2).
- **Bài tập điển hình**: Tính vận tốc trung bình trên cả quãng đường gồm hai chặng đi với vận tốc khác nhau. Biểu diễn trọng lực tác dụng lên vật nặng 5kg.
- **Mẹo nhớ**: Khi tính v_tb, tuyệt đối không lấy trung bình cộng hai vận tốc, mà phải tính tổng quãng đường chia cho tổng thời gian tương ứng.

### Tuần 2: Áp suất (Chất rắn & Chất lỏng)
- **Kiến thức**: Khái niệm áp suất, cách tăng/giảm áp suất trong thực tế. Áp suất chất lỏng và ứng dụng trong bình thông nhau, máy nén thủy lực.
- **Công thức cốt lõi**: p = F / S; p = d.h. Máy nén thủy lực: F / f = S / s.
- **Bài tập điển hình**: Tính áp suất tác dụng lên đáy bình chứa nước. Tính lực nâng của piston lớn khi tác dụng lực lên piston nhỏ.
- **Mẹo nhớ**: Đổi diện tích S từ cm², dm² ra m² một cách chính xác trước khi tính toán.

### Tuần 3: Lực đẩy Ác-si-mét & Công cơ học
- **Kiến thức**: Lực đẩy Ác-si-mét, sự nổi của các vật. Khái niệm công cơ học và công thức tính công khi lực cùng hướng chuyển động.
- **Công thức cốt lõi**: F_A = d.V; A = F.s.
- **Bài tập điển hình**: Tính lực đẩy Ác-si-mét tác dụng lên vật chìm hoàn toàn hoặc chìm một phần. Tính công của lực kéo kéo gạch lên cao.
- **Mẹo nhớ**: Chỉ có công cơ học khi có lực tác dụng và làm vật di chuyển theo phương không vuông góc với lực.

### Tuần 4: Công suất, Cơ năng & Ôn tập Nhiệt lượng
- **Kiến thức**: Ý nghĩa của công suất, phân biệt thế năng và động năng, công thức tính nhiệt lượng thu vào để nóng lên.
- **Công thức cốt lõi**: P = A / t; Q = m.c.Δt.
- **Bài tập điển hình**: Tính công suất của một động cơ nâng vật nặng. Tính nhiệt lượng cần truyền cho ấm nước nhôm nặng 0.5kg chứa 2 lít nước để sôi.
- **Mẹo nhớ**: Đảm bảo đổi thể tích nước sang khối lượng (1 lít nước tương đương 1 kg nước) trước khi tính Q.`;
    }

    mockReply = `Chào em! Thầy/Cô (Hệ thống dự phòng thông minh) xin phản hồi câu hỏi về **"${lastUserMsg}"** của em như sau:

---

`;

    if (lowerMsg.includes("lộ trình") || lowerMsg.includes("lo trinh") || lowerMsg.includes("kế hoạch") || lowerMsg.includes("roadmap")) {
      mockReply += `### 🗺️ LỘ TRÌNH CHI TIẾT TRONG 4 TUẦN (MỤC TIÊU: ${goalTitle})

${weeksDetail}

---

## 💡 LỜI KHUYÊN ĐỂ HỌC TỐT VẬT LÍ 8:
1. **Lý thuyết gắn liền thực tiễn**: Đừng học vẹt công thức. Hãy tự giải thích các hiện tượng đời thường (ví dụ: tại sao lốp xe đạp bơm căng để ngoài nắng lại dễ nổ? -> Áp suất khí quyển & giãn nở nhiệt).
2. **Luyện tập vẽ sơ đồ lực**: Khi làm bài tập lực đẩy Ác-si-mét hoặc sự nổi, luôn vẽ hình biểu diễn các lực (Trọng lực P hướng xuống, F_A hướng lên) để tránh bỏ sót lực.
3. **Thường xuyên làm bài tự luyện**: Hãy vào mục **Bài tập tự luyện** hoặc **Tạo đề thi trắc nghiệm bằng AI** trên ứng dụng này để kiểm tra ngay mức độ hiểu bài của mình nhé!`;
    } else if (lowerMsg.includes("áp suất") || lowerMsg.includes("ap suat")) {
      mockReply += `### 📚 ÁP SUẤT & ÁP SUẤT CHẤT LỎNG / KHÍ QUYỂN

1. **Áp suất chất rắn**:
   - Khái niệm: Là tác dụng của áp lực lên diện tích bị ép.
   - Công thức: **p = F / S**
     - $F$: Áp lực ($N$)
     - $S$: Diện tích bị ép ($m^2$)
     - $p$: Áp suất ($N/m^2$ hoặc $Pa$)

2. **Áp suất chất lỏng**:
   - Chất lỏng gây ra áp suất theo mọi phương lên đáy bình, thành bình và các vật nhúng trong lòng nó.
   - Công thức: **p = d * h**
     - $d$: Trọng lượng riêng của chất lỏng ($N/m^3$)
     - $h$: Độ sâu tính từ điểm cần tính áp suất đến mặt thoáng của chất lỏng ($m$)

3. **Bình thông nhau**: Trong bình thông nhau chứa cùng một chất lỏng đứng yên, các mực chất lỏng ở các nhánh luôn ở cùng một độ cao.`;
    } else if (lowerMsg.includes("ác-si-mét") || lowerMsg.includes("ac-si-met") || lowerMsg.includes("lực đẩy") || lowerMsg.includes("luc day")) {
      mockReply += `### 🌊 LỰC ĐẨY ÁC-SI-MÉT & SỰ NỔI CỦA VẬT

1. **Sự xuất hiện của lực đẩy Ác-si-mét**:
   - Một vật nhúng vào chất lỏng bị chất lỏng tác dụng một lực đẩy hướng thẳng đứng từ dưới lên. Lực này gọi là **Lực đẩy Ác-si-mét**.
   
2. **Công thức**: **F_A = d * V**
   - **$F_A$**: Lực đẩy Ác-si-mét ($N$).
   - **$d$**: Trọng lượng riêng của chất lỏng ($N/m^3$).
   - **$V$**: Thể tích của phần chất lỏng bị vật chiếm chỗ ($m^3$) (chính là thể tích phần chìm của vật).

3. **Điều kiện nổi, lơ lửng, chìm**: Nhúng một vật vào chất lỏng, vật sẽ:
   - **Chìm xuống** khi lực đẩy Ác-si-mét bé hơn trọng lượng của vật ($F_A < P \Leftrightarrow d_{chất lỏng} < d_{vật}$).
   - **Lơ lửng** trong chất lỏng khi $F_A = P \Leftrightarrow d_{chất lỏng} = d_{vật}$.
   - **Nổi lên** mặt thoáng khi $F_A > P \Leftrightarrow d_{chất lỏng} > d_{vật}$. Khi vật nổi ổn định trên mặt thoáng thì $F_A = P$.`;
    } else if (lowerMsg.includes("công") || lowerMsg.includes("cong co hoc") || lowerMsg.includes("công suất")) {
      mockReply += `### ⚙️ CÔNG CƠ HỌC & CÔNG SUẤT

1. **Công cơ học**:
   - Chỉ có công cơ học khi có **lực tác dụng** vào vật và làm vật **dịch chuyển** theo phương không vuông góc với lực.
   - Công thức: **A = F * s**
     - $A$: Công cơ học ($J$, với $1 J = 1 N.m$)
     - $F$: Lực tác dụng ($N$)
     - $s$: Quãng đường vật dịch chuyển ($m$)

2. **Công suất**:
   - Là đại lượng đặc trưng cho tốc độ thực hiện công, được tính bằng công thực hiện được trong một đơn vị thời gian.
   - Công thức: **P = A / t**
     - $P$: Công suất ($W$)
     - $A$: Công thực hiện ($J$)
     - $t$: Thời gian thực hiện công ($s$)`;
    } else if (lowerMsg.includes("nhiệt") || lowerMsg.includes("nhiệt lượng") || lowerMsg.includes("can bang nhiet") || lowerMsg.includes("cân bằng")) {
      mockReply += `### 🔥 NHIỆT NĂNG, NHIỆT LƯỢNG & PHƯƠNG TRÌNH CÂN BẰNG NHIỆT

1. **Nhiệt lượng thu vào để vật nóng lên**:
   - Công thức: **Q = m * c * Δt**
     - $Q$: Nhiệt lượng thu vào ($J$)
     - $m$: Khối lượng của vật ($kg$)
     - $c$: Nhiệt dung riêng của chất cấu tạo nên vật ($J/kg.K$)
     - $\Delta t = t_2 - t_1$: Độ tăng nhiệt độ của vật ($^oC$ hoặc $K$)

2. **Nguyên lý truyền nhiệt**:
   - Nhiệt truyền tự động từ vật có nhiệt độ cao hơn sang vật có nhiệt độ thấp hơn.
   - Sự truyền nhiệt xảy ra cho đến khi nhiệt độ hai vật bằng nhau thì dừng lại.
   - Nhiệt lượng do vật này tỏa ra bằng nhiệt lượng do vật kia thu vào.

3. **Phương trình cân bằng nhiệt**: **Q_tỏa = Q_thu**
   - $Q_{tỏa} = m_1 * c_1 * (t_1 - t_{cb})$ (với $t_1 > t_{cb}$)
   - $Q_{thu} = m_2 * c_2 * (t_{cb} - t_2)$ (với $t_{cb} > t_2$)`;
    } else {
      mockReply += `### 💡 KIẾN THỨC VẬT LÍ LỚP 8 TRỌNG TÂM

Vật lí 8 bao gồm 2 chương lớn rất thú vị:

1. **Chương I: Cơ học**
   - **Chuyển động cơ học & Vận tốc**: Vận tốc đặc trưng cho sự nhanh hay chậm ($v = s/t$). Vận tốc trung bình của chuyển động không đều: $v_{tb} = S_{tổng} / t_{tổng}$.
   - **Lực & Quán tính**: Biểu diễn lực bằng vectơ. Khi có lực tác dụng bất ngờ, vật không thể thay đổi vận tốc ngay lập tức do có **quán tính**.
   - **Áp suất**: Áp suất chất rắn ($p = F/S$), áp suất chất lỏng ($p = d.h$), áp suất khí quyển.
   - **Lực đẩy Ác-si-mét**: Xuất hiện khi vật nhúng vào chất lỏng ($F_A = d.V$).
   - **Sự nổi**: Điều kiện để vật nổi, chìm hoặc lơ lửng.
   - **Công cơ học & Công suất**: Công $A = F.s$, công suất $P = A/t$.
   - **Cơ năng**: Gồm Động năng (do chuyển động) và Thế năng (gồm thế năng trọng trường do độ cao và thế năng đàn hồi do biến dạng).

2. **Chương II: Nhiệt học**
   - **Cấu tạo chất**: Các chất được cấu tạo từ các nguyên tử, phân tử riêng biệt, giữa chúng có khoảng cách và chúng luôn chuyển động hỗn độn không ngừng. Nhiệt độ càng cao, phân tử chuyển động càng nhanh.
   - **Nhiệt năng**: Là tổng động năng của các phân tử cấu tạo nên vật. Có 2 cách làm biến đổi nhiệt năng: Thực hiện công và Truyền nhiệt (Dẫn nhiệt, Đối lưu, Bức xạ nhiệt).
   - **Nhiệt lượng & Cân bằng nhiệt**: Công thức $Q = m.c.\Delta t$ và phương trình cân bằng nhiệt $Q_{tỏa} = Q_{thu}$.

Em có thể nhập cụ thể tên bài học hoặc câu hỏi (ví dụ: *"Lực đẩy Ác-si-mét"*, *"Áp suất là gì"*, *"Phương trình cân bằng nhiệt"*) để Thầy/Cô hỗ trợ phân tích chi tiết hơn nhé!`;
    }

    return res.json({
      success: true,
      source: "fallback",
      reply: mockReply
    });
  }
});

// API endpoint to check if Gemini is configured on the server
app.get(["/api/ai-status", "/ai-status"], (req, res) => {
  const isAvailable = !!getConfiguredApiKey();
  res.json({
    success: true,
    isAvailable: isAvailable
  });
});

// Vite middleware configuration for full-stack App
async function initializeApp() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    const distPath = process.env.NODE_ENV === "production"
      ? path.resolve(__dirname)
      : path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      // Do not serve index.html for API routes or physical files
      if (req.path.startsWith("/api/") || req.path.includes(".")) {
        return next();
      }
      res.sendFile(path.join(distPath, "index.html"), (err) => {
        if (err) {
          console.error("Error sending index.html from path:", path.join(distPath, "index.html"), err);
          if (!res.headersSent) {
            res.status(500).send("Error loading application resources. Please check build configuration.");
          }
        }
      });
    });
    console.log("Production static file server integrated.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export { app };
export default app;

if (!process.env.VERCEL) {
  initializeApp().catch((err) => {
    console.error("Failed to start the Express-Vite server:", err);
  });
}
