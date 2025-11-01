import { GoogleGenAI, Type, type GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import type { Entity, Settings, StateUpdate } from '../types';

/**
 * Xáo trộn một mảng tại chỗ và trả về một mảng mới.
 * @param array Mảng cần xáo trộn.
 * @returns Mảng đã được xáo trộn.
 */
function shuffleArray<T>(array: T[]): T[] {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];


/**
 * Thực hiện một yêu cầu tới API Gemini với logic thử lại và phân phối tải mạnh mẽ.
 * Thử tất cả các khóa. Nếu tất cả đều bị giới hạn tốc độ, nó sẽ đợi theo cấp số nhân và thử lại.
 * @param apiKeys Mảng các khóa API để thử.
 * @param model Tên model Gemini để sử dụng.
 * @param params Các tham số cho yêu cầu `generateContent`.
 * @param signal Tín hiệu hủy bỏ để dừng yêu cầu sớm.
 * @returns Phản hồi từ API.
 */
async function makeRequestWithRetry(
    apiKeys: string[],
    model: string,
    params: any,
    signal?: AbortSignal
): Promise<GenerateContentResponse> {
    if (!apiKeys || apiKeys.length === 0) {
        throw new Error("Không có khóa API nào được cung cấp.");
    }
    
    if (signal?.aborted) throw new Error("Thao tác đã bị hủy.");

    const maxRetries = 5; // Tăng số lần thử lại cho chiến lược chờ theo cấp số nhân
    let lastError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (signal?.aborted) throw new Error("Thao tác đã bị hủy.");
        const shuffledKeys = shuffleArray(apiKeys);
        let allKeysRateLimitedInAttempt = true;

        for (const key of shuffledKeys) {
            if (signal?.aborted) throw new Error("Thao tác đã bị hủy.");
            try {
                const ai = new GoogleGenAI({ apiKey: key });
                console.log(`(Nỗ lực ${attempt + 1}/${maxRetries}) Đang thử yêu cầu với khóa ...${key.slice(-4)}`);
                const result = await ai.models.generateContent({ model, ...params });
                return result; // Thành công
            } catch (error: any) {
                lastError = error;
                const errorMessage = (error.toString() || '').toLowerCase();
                
                if (errorMessage.includes("api key not valid")) {
                    console.warn(`Khóa ...${key.slice(-4)} không hợp lệ. Bỏ qua.`);
                    continue; // Bỏ qua khóa không hợp lệ, không tính là lỗi giới hạn tốc độ
                }

                const isRateLimitError = errorMessage.includes("quota") || errorMessage.includes("rate limit") || errorMessage.includes("429") || errorMessage.includes("resource has been exhausted");

                if (isRateLimitError) {
                    console.warn(`Khóa ...${key.slice(-4)} đã gặp lỗi giới hạn.`);
                    // Tiếp tục thử các khóa khác
                } else {
                    allKeysRateLimitedInAttempt = false; // Đây là một lỗi khác, không thể thử lại
                    console.error(`Lỗi không thể thử lại với khóa ...${key.slice(-4)}:`, error);
                    throw error; // Đối với các lỗi khác (ví dụ: đối số không hợp lệ), thất bại ngay lập tức
                }
            }
        }

        if (allKeysRateLimitedInAttempt && attempt < maxRetries - 1) {
            // NÂNG CẤP: Chờ theo cấp số nhân với jitter
            const delayMs = (2 ** (attempt + 1)) * 1000 + Math.floor(Math.random() * 1000);
            console.warn(`Tất cả các khóa đều bị giới hạn. Đang đợi ${Math.round(delayMs / 1000)} giây trước khi thử lại...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
            break;
        }
    }

    const lastErrorMessage = (lastError?.message || lastError?.toString() || 'Lỗi không xác định').toLowerCase();
    const isQuotaError = lastErrorMessage.includes("quota") || lastErrorMessage.includes("resource_exhausted") || lastErrorMessage.includes("429");
    
    if (isQuotaError) {
        throw new Error(`Tất cả các khóa API của bạn đã đạt đến giới hạn tốc độ hoặc hết hạn ngạch sau nhiều lần thử. Điều này thường có nghĩa là bạn đã đạt đến giới hạn Yêu cầu mỗi phút (RPM). Công cụ đã đợi vài phút nhưng không thành công. \n\n**Hành động đề xuất:**\n1.  **Đợi một chút:** Hạn ngạch RPM thường được đặt lại sau một phút.\n2.  **Thêm nhiều khóa API hơn:** Phân phối tải trên nhiều khóa làm giảm khả năng đạt đến giới hạn.\n3.  **Kiểm tra Trang tổng quan Google AI của bạn:** Xác minh xem bạn có đạt đến giới hạn sử dụng hàng ngày không.`);
    }

    throw new Error(`Tất cả các khóa API đều thất bại sau nhiều lần thử. Lỗi cuối cùng: ${lastError?.message || 'Lỗi không xác định'}`);
}


interface AnalyzedScriptData {
  characters: Entity[];
  environments: Entity[];
}

export const analyzeScript = async (
  script: string,
  apiKeys: string[],
  signal: AbortSignal
): Promise<AnalyzedScriptData> => {
  if (!script) return { characters: [], environments: [] };
  if (signal.aborted) throw new Error("Thao tác đã bị hủy.");

  const jsonSchema = {
    type: Type.OBJECT,
    properties: {
      characters: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Tên gốc của nhân vật bằng tiếng Việt." },
            description: { type: Type.STRING, description: "Mô tả hình ảnh chi tiết, sống động bằng TIẾNG ANH, được tối ưu hóa cho các mô hình tạo ảnh AI." },
          },
          required: ["name", "description"],
        },
      },
      environments: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Tên gốc của môi trường bằng tiếng Việt." },
            description: { type: Type.STRING, description: "Mô tả hình ảnh chi tiết, sống động bằng TIẾNG ANH, được tối ưu hóa cho các mô hình tạo ảnh AI." },
          },
          required: ["name", "description"],
        },
      },
    },
    required: ["characters", "environments"],
  };

  // NÂNG CẤP: Sử dụng systemInstruction
  const systemInstruction = `
  You are an expert concept artist and prompt engineer for AI image generation models. Your task is to analyze the following Vietnamese script, identify all characters and environments, and create rich, detailed, visual descriptions in ENGLISH for them.

  **CRITICAL INSTRUCTIONS:**
  1.  **Identify Entities:** Read the entire script to identify all unique characters and environments.
  2.  **Keep Original Name:** For each entity, use its original Vietnamese name for the "name" field.
  3.  **Create ENGLISH Descriptions:** For the "description" field, write a highly detailed, vivid, and imaginative description IN ENGLISH. This description MUST be optimized for AI image generators (like Midjourney, DALL-E).
      *   **For Characters:** Do not just say "a man". Describe his key features. What is his approximate age, facial structure, hairstyle and color, eye color, clothing style and material, and emotional state? What makes him unique? Use descriptive adjectives.
      *   **For Environments:** Do not just say "a forest". Describe the atmosphere. What kind of trees are there? What is the lighting like (e.g., "dappled sunlight filtering through a dense canopy")? What is the mood (e.g., "eerie and misty" or "bright and vibrant")? What time of day is it?
  4.  **JSON Output:** Your final output must be ONLY a valid JSON object that strictly adheres to the provided schema.

  **EXAMPLE of what to do:**
  -   If the script mentions: "một công dân La Mã" (a Roman citizen)
  -   **BAD description:** "A roman citizen"
  -   **GOOD, prompt-optimized description:** "middle-aged Roman patrician, sharp jawline, short-cropped dark hair, intelligent brown eyes, wearing a clean, high-quality off-white toga with a purple border (toga praetexta), leather sandals, looks thoughtful and concerned, standing in a sunlit marble atrium"
  `;

  const content = `
  **Script to Analyze:**
  """
  ${script}
  """

  Now, generate the JSON object based on the script provided.
  `;

  try {
    console.log("Bắt đầu phân tích kịch bản nâng cao...");
    const response = await makeRequestWithRetry(apiKeys, "gemini-2.5-flash", {
      contents: content,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: jsonSchema,
        safetySettings,
      },
    }, signal);

    let analyzedData;
    try {
        const jsonText = response.text.trim();
        analyzedData = JSON.parse(jsonText);
    } catch(e: any) {
        console.error("Không thể phân tích phản hồi JSON từ AI:", response.text);
        throw new Error(`AI đã trả về một định dạng không hợp lệ. Điều này có thể xảy ra nếu kịch bản quá phức tạp. Vui lòng thử một kịch bản ngắn hơn. Lỗi: ${e.message}`);
    }

    const characters = (analyzedData.characters || []).map((e: any, index: number) => ({
      id: `Char-${index}-${Date.now()}`,
      name: e.name,
      description: e.description,
      aliases: [],
      isLocked: false,
    }));
    
    const environments = (analyzedData.environments || []).map((e: any, index: number) => ({
      id: `Env-${index}-${Date.now()}`,
      name: e.name,
      description: e.description,
      aliases: [],
      isLocked: false,
    }));

    return { characters, environments };

  } catch (error: any) {
    console.error(`Lỗi trong quá trình phân tích kịch bản nâng cao:`, error);
    if (signal.aborted) throw new Error("Thao tác phân tích đã bị hủy.");
    throw new Error(`Không thể phân tích kịch bản. ${error.message}`);
  }
};

interface PromptGenerationProgress {
    newPrompt: string;
    updates: StateUpdate[];
}

const MAX_SAFETY_INSTRUCTIONS = `
### NON-NEGOTIABLE SAFETY & COMPLIANCE PROTOCOL (APPLY TO EVERY SINGLE PROMPT):

Your identity is an AI Safety Guardian. Your PRIMARY, absolute, and most important purpose is to ensure every generated image prompt is 100% safe for all audiences (SFW) and fully compliant with content policies. Any failure in safety is a total failure of the task.

1.  **ZERO TOLERANCE POLICY:** You have a zero-tolerance policy for generating prompts that could be interpreted as:
    *   **Graphic Violence:** Depicting blood, gore, open wounds, death, suffering, or realistic weapons being used to injure.
    *   **Hate Speech:** Any content targeting protected groups.
    *   **Sexual Content:** Nudity, sexually suggestive acts, or explicit themes.
    *   **Self-Harm:** Any depiction of self-injury or suicide.
    This is not an exhaustive list. Use your judgment to block anything that is clearly unsafe.

2.  **MANDATORY ARTISTIC TRANSFORMATION (Your Core Safety Tool):**
    *   If a script segment contains or even *implies* potentially violating content, you MUST NOT describe it literally. Your only valid action is to artistically transform it into a safe, symbolic representation.
    *   **For Violence/Combat:** Focus on the *tension* and *action*, NEVER the injury.
        *   **Instead of:** "The sword cuts his arm, blood sprays."
        *   **Describe:** "A dynamic blur of motion as the hero parries a strike, sparks fly from clashing steel, a determined expression on his face, cinematic action pose."
    *   **For Sensitive Themes (e.g., despair, injury):** Focus on the *emotion* and *symbolism*, NEVER the harmful act.
        *   **Instead of:** "He lies bleeding on the ground."
        *   **Describe:** "A solitary figure crumpled on the rain-slicked cobblestones, face turned away, the oppressive atmosphere of the dark alley conveying a sense of defeat and despair, dramatic chiaroscuro lighting."

3.  **INTERNAL SAFETY CHECK (Perform this mental process for every segment):**
    *   A. "Does this script contain any elements from the prohibited list?"
    *   B. "If yes, what is my precise artistic transformation plan to make it 100% safe and symbolic?"
    *   C. "After creating my prompt, I will re-read it. Does it contain any forbidden words or descriptions? Could any part of it be misinterpreted by the image model?"
    *   Only after confirming the prompt is clean may you proceed.

4.  **THE FINAL SAFEGUARD - The Red Flag:**
    *   If a script segment is so extreme or unambiguous that NO safe artistic transformation is possible without losing all meaning, you MUST NOT attempt to create a prompt.
    *   Instead, for that specific segment, the value for the "prompt" field MUST be EXACTLY: \`//-- VIOLATION DETECTED --// The script segment contains content that cannot be safely visualized and has been skipped.\`

5.  **Final Output Rules:**
    *   Unless it is a Red Flag message, the final 'prompt' string MUST be a single, continuous line of text, using commas to separate ideas. No newlines.
    *   The prompt must describe the visual scene ONLY.
`;

const CINEMATIC_ACTION_INSTRUCTIONS = `
### CINEMATIC ACTION SAFETY & COMPLIANCE PROTOCOL (APPLY TO EVERY SINGLE PROMPT):

Your identity is an AI Safety Guardian, but with a focus on enabling dynamic, cinematic action sequences while maintaining a 'PG-13' level of safety. Your goal is to capture intensity and impact without resorting to graphic violence.

1.  **PROHIBITED CONTENT (ZERO TOLERANCE):** You are strictly forbidden from generating prompts that depict:
    *   **Graphic Injury:** NO blood, gore, open wounds, dismemberment, or visible death.
    *   **Hate Speech:** Any content targeting protected groups.
    *   **Sexual Content:** Nudity, sexually suggestive acts, or explicit themes.
    *   **Self-Harm:** Any depiction of self-injury or suicide.

2.  **PERMITTED CINEMATIC ACTION (Your Creative Tools):**
    *   You **ARE PERMITTED** to describe the *impact* and *effects* of action. The focus is on motion, energy, and consequence, not the injury itself.
    *   **Focus on these concepts:**
        *   **Impact & Force:** "a punch lands with a visible shockwave," "a figure is thrown back by the force of the blast," "the ground cracks under the impact of the landing."
        *   **Dynamic Motion & Effects:** "sparks fly from clashing steel," "a blur of motion as a kick is parried," "energy crackles around a fist," "muzzle flashes in a dark alley."
        *   **Environment Interaction:** "splinters fly as a table shatters," "a character crashes through a wall," "dust and debris fill the air after an explosion."
        *   **Character Expression:** "a determined grimace," "a look of shock and pain," "eyes wide with effort."

3.  **ARTISTIC TRANSFORMATION (Your Core Method):**
    *   **Instead of:** "The sword cuts his arm, blood sprays."
    *   **Describe:** "A dynamic blur of motion as the hero parries a strike, sparks fly from clashing steel, the hero stumbles back, clutching their arm with a pained expression, cinematic action pose." (This implies injury without showing it graphically).
    *   **Instead of:** "He is shot in the chest."
    *   **Describe:** "The hero reels backward from a sudden impact to their chest, a look of shock on their face, the force of the blow staggering them, set against a dark, gritty background."

4.  **THE FINAL SAFEGUARD - The Red Flag:**
    *   If a script segment is so extreme (e.g., explicitly describes gore or torture) that NO cinematic transformation is possible, you MUST fall back to the red flag.
    *   For that specific segment, the value for the "prompt" field MUST be EXACTLY: \`//-- VIOLATION DETECTED --// The script segment contains content that cannot be safely visualized and has been skipped.\`

5.  **Final Output Rules:**
    *   Unless it is a Red Flag message, the final 'prompt' string MUST be a single, continuous line of text, using commas to separate ideas. No newlines.
    *   The prompt must describe the visual scene ONLY.
`;

const INDIRECT_SUGGESTION_INSTRUCTIONS = `
### INDIRECT & EUPHEMISTIC VISUALIZATION PROTOCOL (APPLY TO EVERY PROMPT):

Your identity is an AI Prompt Artist specializing in Euphemism and Indirect Visualization. Your goal is to creatively interpret potentially sensitive script elements using metaphorical or suggestive language, allowing for artistic expression while avoiding direct depiction of graphic content.

1.  **ABSOLUTE PROHIBITIONS (ZERO TOLERANCE):** You are still strictly forbidden from generating prompts that depict:
    *   **Hate Speech:** Any content targeting protected groups.
    *   **Sexual Content:** Nudity, sexually suggestive acts, or explicit themes.
    *   **Self-Harm:** Any depiction of self-injury or suicide.

2.  **MANDATORY INDIRECT VISUALIZATION (Your Core Creative Method):**
    *   For scenes involving violence, injury, or combat, you MUST transform direct descriptions into artistic, euphemistic, or indirect ones. Do not show the graphic reality; suggest it.
    *   **Key Transformation Rules & Examples:**
        *   **Instead of:** "blood", "gore", "wound"
        *   **Describe:** "crimson liquid", "scarlet fluid", "a dark red stain spreading", "red water", "life essence".
        *   **Instead of:** "a sword stabs/cuts him"
        *   **Describe:** "a sharp pressure on his chest", "the cold steel makes contact", "he gasps as the blade finds its mark", "a thin red line appears on his clothing".
        *   **Instead of:** "he is shot"
        *   **Describe:** "a fast-moving projectile creates a dark hole in his shirt", "a sudden impact throws him backward, a dark stain blossoming on his chest", "the sound of the shot echoes as the character stumbles".
        *   **Instead of:** "a broken bone" or "a severe injury"
        *   **Describe:** "a limb bent at an unnatural angle", "the character cradles their arm, face contorted in pain", "a pained grimace as they try to stand".

3.  **INTERNAL CREATIVE CHECK (Perform this mental process for every segment):**
    *   A. "Does this script describe something sensitive, particularly violence?"
    *   B. "If yes, what is my creative, indirect, or euphemistic way to describe this visually without being graphic?"
    *   C. "Does my final prompt use suggestive language instead of direct, graphic terms?"

4.  **THE FINAL SAFEGUARD - The Red Flag:**
    *   If a script segment is so extreme (e.g., explicitly describes torture or gratuitous gore) that NO creative transformation is possible, you MUST fall back to the red flag.
    *   For that specific segment, the value for the "prompt" field MUST be EXACTLY: \`//-- VIOLATION DETECTED --// The script segment contains content that cannot be safely visualized and has been skipped.\`

5.  **Final Output Rules:**
    *   Unless it is a Red Flag message, the final 'prompt' string MUST be a single, continuous line of text, using commas to separate ideas. No newlines.
    *   The prompt must describe the visual scene ONLY.
`;

async function condenseContext(
    characters: Entity[],
    environments: Entity[],
    apiKeys: string[],
    signal: AbortSignal
): Promise<string> {
    if (characters.length === 0 && environments.length === 0) {
        return "No global context provided.";
    }
    if (signal.aborted) throw new Error("Thao tác đã bị hủy.");

    const fullContext = `
    **Available Characters:**
    ${characters.map((c, i) => `- CHARACTER_${i + 1} (Name: ${c.name}): ${c.description}`).join('\n') || 'None'}

    **Available Environments:**
    ${environments.map((e, i) => `- ENVIRONMENT_${i + 1} (Name: ${e.name}): ${e.description}`).join('\n') || 'None'}
    `;

    // NÂNG CẤP: Sử dụng systemInstruction
    const systemInstruction = `
    You are a highly efficient text compression AI. Your task is to summarize the following entity descriptions into a dense, keyword-heavy format. Preserve the most critical visual details. This summary will be used as context for another AI, so it must be clear and information-rich but as short as possible.

    - Retain the original reference IDs (e.g., CHARACTER_1).
    - Focus on unique visual traits.
    - Use comma-separated keywords and short phrases.
    `;

    const content = `
    **Full Descriptions to Condense:**
    """
    ${fullContext}
    """

    **Condensed Summary:**
    `;

    try {
        console.log("Đang nén bối cảnh để tối ưu hóa việc sử dụng token...");
        const response = await makeRequestWithRetry(apiKeys, 'gemini-2.5-flash', {
            contents: content,
            config: {
                systemInstruction,
                temperature: 0.1, // Thấp để tóm tắt một cách xác định
                safetySettings,
            },
        }, signal);
        const condensed = response.text.trim();
        console.log("Bối cảnh đã được nén:", condensed);
        return condensed;
    } catch (error) {
        console.warn("Không thể nén bối cảnh, sẽ sử dụng bối cảnh đầy đủ. Lỗi:", error);
        if (signal.aborted) throw new Error("Thao tác nén bối cảnh đã bị hủy.");
        return fullContext; // Trở lại bối cảnh đầy đủ nếu nén thất bại
    }
}

export const generatePrompts = async (
    fullScript: string,
    characters: Entity[],
    environments: Entity[],
    style: { name: string; tags: string },
    settings: Settings,
    apiKeys: string[],
    signal: AbortSignal,
    onProgress: (progress: PromptGenerationProgress) => void,
    onSetTotal: (total: number) => void
): Promise<void> => {
    if (apiKeys.length === 0) {
        throw new Error("Không có khóa API nào được cung cấp để tạo gợi ý.");
    }
     if (signal.aborted) throw new Error("Thao tác đã bị hủy.");
    
    const condensedContextBlock = await condenseContext(characters, environments, apiKeys, signal);
    
    let safetyInstructions;
    switch (settings.safetyLevel) {
        case 'cinematic_action':
            safetyInstructions = CINEMATIC_ACTION_INSTRUCTIONS;
            break;
        case 'indirect_suggestion':
            safetyInstructions = INDIRECT_SUGGESTION_INSTRUCTIONS;
            break;
        default: // 'maximum'
            safetyInstructions = MAX_SAFETY_INSTRUCTIONS;
    }

    // NÂNG CẤP: Kết hợp tất cả các chỉ thị vào systemInstruction
    const systemInstruction = `
    ${safetyInstructions}

    ### CORE CREATIVE INSTRUCTIONS (Apply AFTER safety check):

    1.  **Generate Prompts:** For each identified segment, create a single, detailed, English image prompt based on your safe transformation plan.
        *   **CRITICAL RULE - The Reference ID System:** This is the most important rule for visual accuracy. I have provided a list of characters and environments, each with a unique Reference ID (e.g., \`CHARACTER_1\`, \`ENVIRONMENT_1\`). When an entity appears in a scene, you MUST replace its Reference ID with its full visual description from the context I provided. The image model ONLY understands descriptions.
        *   **NEVER include the Reference ID (e.g., \`CHARACTER_1\`) or the original name (e.g., \`Nam\`) in the final prompt output.**
        *   **Example:**
            *   Script implies CHARACTER_1 is in ENVIRONMENT_1.
            *   Context: \`CHARACTER_1: a rugged man with a graying beard...\`, \`ENVIRONMENT_1: a dark, misty forest...\`
            *   **CORRECT PROMPT:** "A rugged man with a graying beard and a tired expression walks through a dark, misty forest of ancient, moss-covered trees."
            *   **INCORRECT PROMPT:** "CHARACTER_1 walks through ENVIRONMENT_1."
        *   The prompt language must be entirely in ENGLISH.
        *   Seamlessly incorporate this art style:
            - Art Style Name: ${style.name}
            - Core Tags: ${style.tags}
        *   **CRITICAL FORMATTING RULE:** Append a negative prompt to the end of every prompt to improve image quality. The final output for the 'prompt' field must follow this structure: \`[Your detailed creative prompt here]. --no text, watermark, signature, ugly, tiling, poorly drawn hands, poorly drawn feet, poorly drawn face, out of frame, extra limbs, disfigured, deformed, body out of frame, bad anatomy, blurred, grainy, cut off, draft\`
    2.  **Identify State Changes:** While analyzing a script segment, look for PERMANENT visual changes to an entity (e.g., "a new scar appears", "the forest is now on fire"). If you find one, add it to the "state_updates" array for that segment's result.
        *   For the "entityName" field, you MUST use the unique Reference ID (e.g., \`CHARACTER_1\`), not the original name.
        *   Only report a change ONCE when it first occurs.
    3.  **Output Format:** Your final output must ONLY be a valid JSON object. It must contain a single key, "results", which is an array of objects. Each object must have "prompt" (string) and "state_updates" (an array of state update objects, which can be empty). The number of objects in the "results" array MUST EXACTLY MATCH the number of segments provided.
    `;
    
    console.log("Bắt đầu tạo gợi ý dựa trên số từ.");
    const words = fullScript.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
        return;
    }

    const wordsPerChunk = settings.wordsPerSecond * settings.imageIntervalSeconds;
    const scriptChunks: string[] = [];
    for (let i = 0; i < words.length; i += wordsPerChunk) {
        const chunk = words.slice(i, i + wordsPerChunk).join(' ');
        if(chunk) scriptChunks.push(chunk);
    }
    const totalPrompts = scriptChunks.length;
    onSetTotal(totalPrompts);
    if (totalPrompts === 0) return;
    
    const BATCH_SIZE = settings.batchSize > 0 ? settings.batchSize : 5;

    for (let i = 0; i < totalPrompts; i += BATCH_SIZE) {
        if (signal.aborted) throw new Error("Thao tác tạo gợi ý đã bị hủy.");
        const batchChunks = scriptChunks.slice(i, i + BATCH_SIZE);
        const batchNumber = (i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(totalPrompts / BATCH_SIZE);

        console.log(`Đang xử lý lô ${batchNumber}/${totalBatches} với ${batchChunks.length} phân đoạn.`);
        
        const formattedSegments = batchChunks.map((chunk, index) => `
//--- SEGMENT ${i + index + 1} ---//
**Script Text:**
"""
${chunk}
"""
`).join('\n');

        const content = `
        ---
        **GLOBAL CONTEXT (Available for all segments):**
        ${condensedContextBlock}
        ---
        **SCRIPT SEGMENTS TO PROCESS:**
        ${formattedSegments}
        ---

        Now, generate exactly ${batchChunks.length} result objects based on these instructions.
        `;

        // NÂNG CẤP: Xử lý lỗi linh hoạt cho từng lô
        try {
            const response = await makeRequestWithRetry(apiKeys, 'gemini-2.5-flash', {
                contents: content,
                config: {
                    systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            results: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        prompt: { type: Type.STRING },
                                        state_updates: {
                                            type: Type.ARRAY,
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    entityName: { type: Type.STRING, description: "The unique reference ID of the entity that changed (e.g., 'CHARACTER_1')." },
                                                    entityType: { type: Type.STRING, enum: ['character', 'environment'] },
                                                    newDescriptionDetail: { type: Type.STRING, description: "A concise English phrase describing the visual change." }
                                                },
                                                required: ["entityName", "entityType", "newDescriptionDetail"]
                                            }
                                        }
                                    },
                                    required: ["prompt", "state_updates"]
                                }
                            }
                        },
                        required: ["results"]
                    },
                    safetySettings,
                }
            }, signal);

            let result;
            try {
                const jsonText = response.text.trim();
                result = JSON.parse(jsonText);
            } catch (e: any) {
                console.error(`Không thể phân tích phản hồi JSON từ lô ${batchNumber}:`, response.text);
                throw new Error(`AI đã trả về một định dạng không hợp lệ trong lô ${batchNumber}. Lỗi: ${e.message}`);
            }
            
            if (result && Array.isArray(result.results)) {
                const receivedResults = result.results as { prompt: string; state_updates: StateUpdate[] }[];
                
                if (receivedResults.length !== batchChunks.length) {
                    console.warn(`AI đã trả về một số lượng gợi ý không khớp trong lô ${batchNumber}! Đã nhận ${receivedResults.length}, dự kiến ${batchChunks.length}.`);
                }

                for(const res of receivedResults) {
                    const sanitizedPrompt = res.prompt
                      .replace(/\n\s*-\s*/g, ', ')
                      .replace(/[\n\r]/g, ' ')
                      .trim();

                    onProgress({ 
                        newPrompt: sanitizedPrompt,
                        updates: res.state_updates || []
                    });
                }
            } else {
                 throw new Error(`Phản hồi của AI cho lô ${batchNumber} không chứa một mảng 'results' hợp lệ.`);
            }

        } catch (error: any) {
            console.error(`Lỗi khi xử lý lô ${batchNumber}. Sẽ tiếp tục với lô tiếp theo.`, error);
            if (signal.aborted) {
                throw new Error("Thao tác tạo gợi ý đã bị hủy.");
            }
            // Tạo một thông báo lỗi cho mỗi phân đoạn trong lô bị lỗi và tiếp tục
            batchChunks.forEach(chunk => {
                onProgress({
                    newPrompt: `//-- LỖI TẠO GỢI Ý --// Không thể xử lý phân đoạn kịch bản bắt đầu bằng: "${chunk.slice(0, 70)}...". Lỗi: ${error.message}`,
                    updates: []
                });
            });
        }
        
        // Giữ lại một khoảng dừng nhỏ giữa các lô để tránh bị giới hạn tốc độ
        if (batchNumber < totalBatches && !signal.aborted) {
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }
};