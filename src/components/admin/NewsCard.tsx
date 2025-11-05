import Image from "next/image";

export type NewsCardProps = {
  heading: string;
  date?: string;
  description?: string;
  imageUrl?: string;
  className?: string;
  onReadMore?: () => void;
};

export default function NewsCard({ 
  heading, 
  date, 
  description, 
  imageUrl,
  className = "",
  onReadMore
}: NewsCardProps) {
  return (
    <div className={`bg-gradient-to-br from-[#8B5A9E] to-[#6B4A7E] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow ${className}`}>
      {imageUrl && (
        <div className="w-full h-48 bg-gray-200 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={heading}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-5">
        <h3 className="text-lg font-bold text-white mb-2">
          {heading}
        </h3>
        {date && (
          <p className="text-sm text-gray-200 mb-3 italic">Date: {date}</p>
        )}
        {description && (
          <div className="mb-4">
            <p className="text-sm text-white leading-relaxed h-20 overflow-hidden">
              {description}
            </p>
          </div>
        )}
        {onReadMore && (
          <button
            onClick={onReadMore}
            className="text-sm text-[#4DD4AC] hover:text-[#3bc799] font-medium transition-colors"
          >
            [Read more]
          </button>
        )}
      </div>
    </div>
  );
}
