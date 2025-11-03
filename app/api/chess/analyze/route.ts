import { NextResponse } from "next/server";
import { analyzeChessImage } from "@/lib/gradio";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageUrl } = body || {};
    
    // Accepter imageUrl (depuis Blob Storage) ou imageDataUrl (data URL, pour compatibilité)
    const imageInput = imageUrl || body.imageDataUrl;
    
    if (!imageInput || typeof imageInput !== "string") {
      return NextResponse.json(
        { error: "Champ 'imageUrl' ou 'imageDataUrl' requis" },
        { status: 400 }
      );
    }

    // analyzeChessImage accepte les data URLs ou les URLs HTTP
    const result = await analyzeChessImage(imageInput);
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

