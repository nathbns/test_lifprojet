import { NextResponse } from "next/server";
import { predictYoloFromSpace } from "@/lib/gradio";
import { Client } from "@gradio/client";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Accepter FormData (fichier binaire) ou JSON (data URL)
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      // Nouveau format: FormData avec fichier binaire
      const formData = await req.formData();
      const file = formData.get("image") as File;
      const confidence_threshold = formData.get("confidence_threshold") ? parseFloat(formData.get("confidence_threshold") as string) : undefined;
      const iou_threshold = formData.get("iou_threshold") ? parseFloat(formData.get("iou_threshold") as string) : undefined;
      const show_confidence = formData.get("show_confidence") === "true" || formData.get("show_confidence") === "1";
      const model = formData.get("model") as string | undefined;
      
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
      
      const result = await predictYoloFromSpace(dataUrl, {
        confidence_threshold,
        iou_threshold,
        show_confidence,
        model: model as "yolov1" | "yolov3" | undefined,
      });
      return NextResponse.json({ result });
    } else {
      // Ancien format: JSON avec data URL (pour compatibilité)
      const body = await req.json();
      const { imageDataUrl, confidence_threshold, iou_threshold, show_confidence, model } = body || {};
      if (!imageDataUrl || typeof imageDataUrl !== "string") {
        return NextResponse.json(
          { error: "Champ 'imageDataUrl' requis (data URL base64)" },
          { status: 400 }
        );
      }

      const result = await predictYoloFromSpace(imageDataUrl, {
        confidence_threshold,
        iou_threshold,
        show_confidence,
        model,
      });
      return NextResponse.json({ result });
    }
  } catch (error: unknown) {
    console.error("Erreur YOLO:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur interne";
    
    // Mode debug en développement uniquement
    if (process.env.NODE_ENV === "development") {
      try {
        const client = await Client.connect("nathbns/yolo1_from_scratch");
        const api = await client.view_api();
        const config: unknown = (client as unknown as Record<string, unknown>).config || null;
        const namedEndpoints: unknown = (client as unknown as Record<string, unknown>).endpoints || null;
        return NextResponse.json(
          {
            error: errorMessage,
            debug: true,
            endpoints: Array.isArray((api as unknown as Record<string, unknown>)?.apis)
              ? (api as unknown as Record<string, unknown>).apis
              : Object.values(((api as unknown as Record<string, unknown>)?.apis) || {}).map((a: unknown) => ({
                  endpoint: (a as Record<string, unknown>)?.endpoint || (a as Record<string, unknown>)?.path,
                  inputs: ((a as Record<string, unknown>)?.inputs as unknown[])?.map((i: unknown) => ({
                    label: (i as Record<string, unknown>)?.label,
                    name: (i as Record<string, unknown>)?.name,
                    type: (i as Record<string, unknown>)?.type || (i as Record<string, unknown>)?.component,
                  })),
                })),
            apiRaw: api,
            config,
            namedEndpoints,
          },
          { status: 500 }
        );
      } catch {
        // Si le debug échoue aussi, retourner juste l'erreur principale
        return NextResponse.json(
          { error: errorMessage },
          { status: 500 }
        );
      }
    }
    
    // En production, retourner juste l'erreur
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


