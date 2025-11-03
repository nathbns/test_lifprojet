import { NextResponse } from "next/server";
import { analyzeChessImage } from "@/lib/gradio";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageDataUrl } = body || {};
    
    if (!imageDataUrl || typeof imageDataUrl !== "string") {
      return NextResponse.json(
        { error: "Champ 'imageDataUrl' requis (data URL base64)" },
        { status: 400 }
      );
    }

    const result = await analyzeChessImage(imageDataUrl);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Erreur analyse:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'analyse de l'échiquier";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

