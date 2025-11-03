/**
 * Compresse et redimensionne une image pour réduire sa taille
 * @param file Le fichier image à compresser
 * @param maxWidth Largeur maximale en pixels (défaut: 1920)
 * @param maxHeight Hauteur maximale en pixels (défaut: 1920)
 * @param quality Qualité JPEG (0-1, défaut: 0.85)
 * @param maxSizeMB Taille maximale en MB (défaut: 3)
 * @returns Promise<string> Data URL compressée
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.85,
  maxSizeMB: number = 3
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        // Calculer les nouvelles dimensions
        let { width, height } = img
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = width * ratio
          height = height * ratio
        }
        
        // Créer un canvas pour redimensionner et compresser
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'))
          return
        }
        
        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convertir en blob avec compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Impossible de créer le blob'))
              return
            }
            
            // Vérifier si la taille est acceptable
            const sizeMB = blob.size / (1024 * 1024)
            if (sizeMB > maxSizeMB) {
              // Réessayer avec une qualité plus faible
              canvas.toBlob(
                (compressedBlob) => {
                  if (!compressedBlob) {
                    reject(new Error('Impossible de compresser l\'image'))
                    return
                  }
                  
                  const compressedReader = new FileReader()
                  compressedReader.onload = () => {
                    resolve(compressedReader.result as string)
                  }
                  compressedReader.onerror = () => {
                    reject(new Error('Erreur lors de la lecture du blob compressé'))
                  }
                  compressedReader.readAsDataURL(compressedBlob)
                },
                'image/jpeg',
                Math.max(0.5, quality - 0.15) // Réduire la qualité
              )
            } else {
              // Taille acceptable, convertir en data URL
              const resultReader = new FileReader()
              resultReader.onload = () => {
                resolve(resultReader.result as string)
              }
              resultReader.onerror = () => {
                reject(new Error('Erreur lors de la lecture du blob'))
              }
              resultReader.readAsDataURL(blob)
            }
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => {
        reject(new Error('Erreur lors du chargement de l\'image'))
      }
      
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'))
    }
    
    reader.readAsDataURL(file)
  })
}

