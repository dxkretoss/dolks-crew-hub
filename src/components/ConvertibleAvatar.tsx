import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { isHeicImage, convertHeicToJpg } from '@/lib/heicConverter';

interface ConvertibleAvatarProps {
  src: string | null | undefined;
  alt: string;
  fallback: string;
  className?: string;
}

export const ConvertibleAvatar = ({ src, alt, fallback, className }: ConvertibleAvatarProps) => {
  const [imageSrc, setImageSrc] = useState<string>(src || '');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadImage = async () => {
      if (src && isHeicImage(src)) {
        setLoading(true);
        const convertedSrc = await convertHeicToJpg(src);
        setImageSrc(convertedSrc);
        setLoading(false);
      } else {
        setImageSrc(src || '');
      }
    };

    loadImage();
  }, [src]);

  return (
    <Avatar className={className}>
      {loading ? (
        <AvatarFallback className="text-2xl animate-pulse">{fallback}</AvatarFallback>
      ) : (
        <>
          <AvatarImage src={imageSrc} alt={alt} />
          <AvatarFallback className="text-2xl">{fallback}</AvatarFallback>
        </>
      )}
    </Avatar>
  );
};
