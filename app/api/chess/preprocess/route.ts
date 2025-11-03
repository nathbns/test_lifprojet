import { NextResponse } from "next/server";
import { preprocessChessImage } from "@/lib/gradio";

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

    // preprocessChessImage accepte les data URLs ou les URLs HTTP
    const preprocessedImageUrl = await preprocessChessImage(imageInput);
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

