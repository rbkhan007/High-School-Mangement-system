import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const translateNotice = async (text: string, targetLang: 'English' | 'Bangla') => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `Translate the following school notice to ${targetLang}. Only return the translated text without any explanations or formatting: "${text}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error('Translation error:', error);
        return null;
    }
};
