import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { transcript } = await req.json();

  if (!transcript || typeof transcript !== "string") {
    return NextResponse.json({ error: "Missing transcript" }, { status: 400 });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `You are a pantry inventory assistant. Parse the following voice transcript into a list of grocery/pantry items.

Voice transcript: "${transcript}"

Return ONLY a valid JSON array of objects with these fields:
- name: string (the item name, cleaned up and properly capitalized)
- amount: string | null (quantity if mentioned, e.g. "2", "1.5")
- unit: string | null (unit if mentioned, e.g. "lbs", "cups", "dozen")

Examples:
Input: "I bought two pounds of chicken breast, a dozen eggs, and some milk"
Output: [{"name":"Chicken Breast","amount":"2","unit":"lbs"},{"name":"Eggs","amount":"1","unit":"dozen"},{"name":"Milk","amount":null,"unit":null}]

Input: "rice, pasta, olive oil, three cans of tomatoes"
Output: [{"name":"Rice","amount":null,"unit":null},{"name":"Pasta","amount":null,"unit":null},{"name":"Olive Oil","amount":null,"unit":null},{"name":"Canned Tomatoes","amount":"3","unit":"cans"}]

Return ONLY the JSON array, no other text, no markdown backticks.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Clean up potential markdown fences
    const cleaned = text.replace(/```json\s*|```\s*/g, "").trim();
    const items = JSON.parse(cleaned);

    if (!Array.isArray(items)) {
      throw new Error("Expected array response");
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Voice parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse voice input" },
      { status: 500 },
    );
  }
}
