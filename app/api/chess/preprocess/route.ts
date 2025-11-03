import { NextResponse } from "next/server";
import { preprocessChessImage } from "@/lib/gradio";

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

    const preprocessedImageUrl = await preprocessChessImage(imageDataUrl);
    return NextResponse.json({ preprocessedImageUrl });
  } catch (error: unknown) {
    console.error("Erreur preprocessing:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur lors du preprocessing de l'image";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

