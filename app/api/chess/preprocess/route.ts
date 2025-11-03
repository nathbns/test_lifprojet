import { NextResponse } from "next/server";
import { preprocessChessImage } from "@/lib/gradio";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Accepter FormData (fichier binaire) ou JSON (data URL)
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      // Nouveau format: FormData avec fichier binaire
      const formData = await req.formData();
      const file = formData.get("image") as File;
      
      if (!file) {
        return NextResponse.json(
          { error: "Champ 'image' requis (fichier)" },
          { status: 400 }
        );
      }
      
      // Convertir File en data URL temporairement pour compatibilité
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      
      const preprocessedImageUrl = await preprocessChessImage(dataUrl);
      return NextResponse.json({ preprocessedImageUrl });
    } else {
      // Ancien format: JSON avec data URL (pour compatibilité)
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
    }
  } catch (error: unknown) {
    console.error("Erreur preprocessing:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur lors du preprocessing de l'image";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

