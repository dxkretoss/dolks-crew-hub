import heic2any from 'heic2any';

export const isHeicImage = (url: string): boolean => {
  return url.toLowerCase().endsWith('.heic') || url.toLowerCase().endsWith('.heif');
};

export const convertHeicToJpg = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    const convertedBlob = await heic2any({
      blob,
      toType: 'image/jpeg',
      quality: 0.9
    });
    
    const convertedBlobSingle = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    return URL.createObjectURL(convertedBlobSingle);
  } catch (error) {
    console.error('Error converting HEIC image:', error);
    return url;
  }
};
