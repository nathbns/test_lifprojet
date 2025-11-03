import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = "nodejs";

// Route pour upload via API (POST)
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

    // Récupérer le token depuis les variables d'environnement
    // Supporte plusieurs noms de variables possibles
    const token = 
      process.env.BLOB_READ_WRITE_TOKEN || 
      process.env.testBlob_READ_WRITE_TOKEN ||
      process.env.VERCEL_BLOB_READ_WRITE_TOKEN ||
      (process.env as Record<string, string>)[Object.keys(process.env).find(k => k.includes('BLOB') && k.includes('TOKEN')) || ''];

    if (!token) {
      console.error("Token Blob Storage non trouvé. Variables disponibles:", Object.keys(process.env).filter(k => k.includes('BLOB')));
      return NextResponse.json(
        { error: 'Configuration Blob Storage manquante. Vérifiez que la variable d\'environnement BLOB_READ_WRITE_TOKEN (ou testBlob_READ_WRITE_TOKEN) est configurée.' },
        { status: 500 }
      );
    }

    // Upload vers Vercel Blob Storage avec le token explicite
    const blob = await put(file.name, file, {
      access: 'public',
      token,
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
