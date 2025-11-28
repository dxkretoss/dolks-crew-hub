import { useState, useEffect } from 'react';
import { isHeicImage, convertHeicToJpg } from '@/lib/heicConverter';

interface ConvertibleImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export const ConvertibleImage = ({ src, alt, className, onClick }: ConvertibleImageProps) => {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadImage = async () => {
      if (isHeicImage(src)) {
        setLoading(true);
        const convertedSrc = await convertHeicToJpg(src);
        setImageSrc(convertedSrc);
        setLoading(false);
      } else {
        setImageSrc(src);
      }
    };

    loadImage();
  }, [src]);

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-full bg-muted animate-pulse">
          <p className="text-sm text-muted-foreground">Converting...</p>
        </div>
      </div>
    );
  }

  return <img src={imageSrc} alt={alt} className={className} onClick={onClick} />;
};
