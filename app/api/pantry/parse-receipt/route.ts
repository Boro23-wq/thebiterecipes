import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const RECEIPT_PARSE_PROMPT = `You are a grocery receipt parser. Analyze the receipt image and extract every food/grocery item.

For each item return:
- name: the common, human-readable grocery item name in lowercase. ALWAYS normalize:
  - Store abbreviations: "BNLS CHKN BRST" → "chicken breast", "ORG BNS" → "organic bananas", "GRK YGRT" → "greek yogurt", "XVRGN OLV OIL" → "extra-virgin olive oil"
  - Brand + product: "CHOBANI VNLA" → "vanilla greek yogurt", "DRISCOLL STRWB" → "strawberries"
  - Remove brand names unless they ARE the product (e.g. keep "Coca-Cola")
  - Remove size descriptors that aren't useful (e.g. "16OZ" from the name — put in amount/unit instead)
- amount: quantity if visible (e.g. "2", "1.5", "16")
- unit: unit if applicable (e.g. "lb", "oz", "kg", "pack", "bunch", "ct"). Leave empty for single countable items.
- category: one of "produce", "meat", "dairy", "pantry", "frozen", "other"

IMPORTANT:
- Skip non-food items (bags, taxes, discounts, store cards, coupons, bottle deposits, loyalty savings)
- Skip subtotals, totals, payment lines, change lines
- Skip duplicate lines (some receipts show item + price on separate lines)
- Normalize ALL store-specific codes and abbreviations to plain English
- Names should be lowercase, readable, and how a person would say the item
- If quantity is unclear, omit amount/unit
- Return ONLY valid JSON array, no markdown fences, no explanation

Return format:
[
  { "name": "chicken breast", "amount": "2", "unit": "lb", "category": "meat" },
  { "name": "bananas", "amount": "1", "unit": "bunch", "category": "produce" },
  { "name": "greek yogurt", "amount": "32", "unit": "oz", "category": "dairy" }
]

If the image is not a receipt or contains no food items, return: []`;

export async function POST(request: Request) {
  try {
    const { image, mimeType } = await request.json();

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: "Image data required" },
        { status: 400 },
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const result = await model.generateContent([
      { text: RECEIPT_PARSE_PROMPT },
      {
        inlineData: {
          mimeType,
          data: image,
        },
      },
    ]);

    const text = result.response.text().trim();

    // Strip markdown fences if present
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const items = JSON.parse(cleaned);

    if (!Array.isArray(items)) {
      return NextResponse.json({ items: [] });
    }

    // Validate and clean each item
    const validItems = items
      .filter(
        (item: { name?: string }) =>
          item && typeof item.name === "string" && item.name.trim().length > 0,
      )
      .map(
        (item: {
          name: string;
          amount?: string;
          unit?: string;
          category?: string;
        }) => ({
          name: item.name.trim(),
          amount: item.amount?.toString().trim() || undefined,
          unit: item.unit?.trim() || undefined,
          category: [
            "produce",
            "meat",
            "dairy",
            "pantry",
            "frozen",
            "other",
          ].includes(item.category || "")
            ? item.category
            : "other",
        }),
      );

    return NextResponse.json({ items: validItems });
  } catch (error) {
    console.error("Receipt parsing failed:", error);
    return NextResponse.json(
      { error: "Failed to parse receipt" },
      { status: 500 },
    );
  }
}
