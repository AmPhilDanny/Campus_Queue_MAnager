import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    // 1. Fetch System Settings for Identity & API Key
    const settingsArray = await (prisma as any).setting.findMany();
    const settings = Object.fromEntries(settingsArray.map((s: any) => [s.key, s.value]));

    const apiKey = settings.google_ai_api_key || process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        error: "AI service not configured. Please add GOOGLE_AI_API_KEY to environment variables on the super admin panel." 
      }, { status: 500 });
    }

    // Initialize Gemini with the key
    const genAI = new GoogleGenerativeAI(apiKey);

    // 2. Fetch Knowledge Base for context (RAG)
    const kbEntries = await prisma.knowledgeBase.findMany({
      where: { isActive: true },
      select: { content: true, category: true }
    });

    const context = kbEntries
      .map(e => `[${e.category}]: ${e.content}`)
      .join("\n\n");

    const botName = settings.ai_bot_name || "Campus Assistant";
    const campusName = settings.campus_name || "the university";
    const systemPrompt = settings.ai_system_prompt || "You are a helpful campus assistant.";

    // 3. Prepare the Prompt
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const fullPrompt = `
      ${systemPrompt}
      You are speaking on behalf of ${campusName}. Your name is ${botName}.
      
      USE THE FOLLOWING ORGANIZATION DATA TO ANSWER THE USER. 
      If the information is not in the data, use your general knowledge but state that you are answering based on general information and the user should verify with the office.
      
      ORGANIZATION DATA:
      ${context}
      
      USER MESSAGE: ${message}
    `;

    // 4. Generate Response
    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessage(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Failed to process chat: " + error.message }, { status: 500 });
  }
}
