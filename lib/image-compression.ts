/**
 * Compresse et redimensionne une image pour réduire sa taille
 * @param file Le fichier image à compresser
 * @param maxWidth Largeur maximale en pixels (défaut: 2560)
 * @param maxHeight Hauteur maximale en pixels (défaut: 2560)
 * @param quality Qualité JPEG (0-1, défaut: 0.92)
 * @param maxSizeMB Taille maximale en MB (défaut: 3.5)
 * @returns Promise<string> Data URL compressée
 */
export async function compressImage(
  file: File,
  maxWidth: number = 2560,
  maxHeight: number = 2560,
  quality: number = 0.92,
  maxSizeMB: number = 3.5
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
        
        // Améliorer la qualité de rendu du canvas
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        
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
              // Essayer de réduire progressivement la qualité jusqu'à atteindre la taille cible
              let currentQuality = quality
              let attempts = 0
              const maxAttempts = 5
              
              const tryCompress = () => {
                canvas.toBlob(
                  (compressedBlob) => {
                    if (!compressedBlob) {
                      reject(new Error('Impossible de compresser l\'image'))
                      return
                    }
                    
                    const compressedSizeMB = compressedBlob.size / (1024 * 1024)
                    
                    // Si la taille est acceptable ou qu'on a fait trop d'essais, accepter
                    if (compressedSizeMB <= maxSizeMB || attempts >= maxAttempts) {
                      const compressedReader = new FileReader()
                      compressedReader.onload = () => {
                        resolve(compressedReader.result as string)
                      }
                      compressedReader.onerror = () => {
                        reject(new Error('Erreur lors de la lecture du blob compressé'))
                      }
                      compressedReader.readAsDataURL(compressedBlob)
                    } else {
                      // Réduire la qualité progressivement mais garder un minimum élevé
                      attempts++
                      currentQuality = Math.max(0.7, currentQuality - 0.03) // Minimum 0.7 pour préserver la qualité
                      tryCompress()
                    }
                  },
                  'image/jpeg',
                  currentQuality
                )
              }
              
              tryCompress()
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

