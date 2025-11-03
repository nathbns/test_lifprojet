import { NextResponse } from "next/server";
import { predictYoloFromSpace } from "@/lib/gradio";
import { Client } from "@gradio/client";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageUrl, confidence_threshold, iou_threshold, show_confidence, model } = body || {};
    
    // Accepter soit imageUrl (depuis Blob Storage) soit imageDataUrl (data URL, pour compatibilité)
    const imageInput = imageUrl || body.imageDataUrl;
    
    if (!imageInput || typeof imageInput !== "string") {
      return NextResponse.json(
        { error: "Champ 'imageUrl' ou 'imageDataUrl' requis" },
        { status: 400 }
      );
    }

    // predictYoloFromSpace accepte les data URLs ou les URLs HTTP
    const result = await predictYoloFromSpace(imageInput, {
      confidence_threshold,
      iou_threshold,
      show_confidence,
      model,
    });
    return NextResponse.json({ result });
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


