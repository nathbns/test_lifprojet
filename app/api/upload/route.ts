import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Champ \'image\' requis (fichier)' },
        { status: 400 }
      );
    }

    // Upload vers Vercel Blob Storage (public, accessible temporairement)
    const blob = await put(file.name, file, {
      access: 'public',
    });

    return NextResponse.json({ url: blob.url });
  } catch (error: unknown) {
    console.error("Erreur upload:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'upload de l'image";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

