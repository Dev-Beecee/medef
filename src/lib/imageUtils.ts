// Utilitaire pour convertir une image en base64
// Cette fonction peut être utilisée côté client pour convertir l'image header-pdf.png

export const convertImageToBase64 = async (imagePath: string): Promise<string> => {
  try {
    const response = await fetch(imagePath)
    const blob = await response.blob()
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Erreur lors de la conversion de l\'image en base64:', error)
    throw error
  }
}

// Fonction spéciale pour convertir les images S3 en base64
// Utilise une approche différente pour contourner les problèmes CORS
export const convertS3ImageToBase64 = async (s3Url: string): Promise<string> => {
  try {
    // Pour les URLs S3, on peut essayer de les utiliser directement comme src dans une image
    // et capturer le contenu via un canvas
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous' // Essayer de contourner CORS
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            reject(new Error('Impossible de créer le contexte canvas'))
            return
          }
          
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
          
          const dataURL = canvas.toDataURL('image/png')
          resolve(dataURL)
        } catch (error) {
          console.warn('Erreur lors de la conversion canvas:', error)
          reject(error)
        }
      }
      
      img.onerror = () => {
        console.warn('Impossible de charger l\'image S3:', s3Url)
        reject(new Error('Impossible de charger l\'image S3'))
      }
      
      img.src = s3Url
    })
  } catch (error) {
    console.error('Erreur lors de la conversion de l\'image S3 en base64:', error)
    throw error
  }
}

// Fonction pour obtenir l'URL complète de l'image
export const getImageUrl = (imagePath: string): string => {
  // En développement, utilisez l'URL complète
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${imagePath}`
  }
  
  // En production ou côté serveur, utilisez l'URL relative
  // Le serveur Next.js servira les fichiers statiques depuis /public
  return imagePath
}
