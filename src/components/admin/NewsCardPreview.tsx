import { formatNewsDate } from "@/lib/dateFormat";

export type NewsCardPreviewProps = {
  heading: string;
  description?: string;
  imageUrl?: string;
  day?: number | null;
  month?: number | null;
  year?: number | null;
  fallbackISO?: string | null;
  className?: string;
};

export default function NewsCardPreview({ heading, description, imageUrl, day, month, year, fallbackISO, className = "" }: NewsCardPreviewProps) {
  const dateStr = formatNewsDate({ day, month, year, fallbackISO }) || undefined;

  return (
    <article className={`bg-gradient-to-br from-[#8B5A9E] to-[#6B4A7E] p-2 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow w-[265px] h-[320px] ${className}`} aria-label="News card preview ">
      <div className="w-full h-28 overflow-hidden mb-2">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={heading} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#808080] flex items-center justify-center" aria-label="Image placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="#ffffff" strokeWidth="2"/>
              <path d="M8.5 9.5a2 2 0 100-4 2 2 0 000 4z" stroke="#ffffff" strokeWidth="2"/>
              <path d="M21 16l-5-5-4 4-3-3-6 6" stroke="#ffffff" strokeWidth="2"/>
            </svg>
          </div>
        )}
      </div>
     
        <h3 className="text-sm font-bold text-white mb-2">{heading}</h3>
        {dateStr && (
          <p className="text-xs text-[#858383] mb-2 italic" aria-label="Publication date">Date: {dateStr}</p>
        )}
        {description && (
          <p
            className="text-sm text-white leading-relaxed overflow-hidden whitespace-nowrap text-ellipsis mb-2 h-[75px]"
            style={{ textOverflow: 'ellipsis' }}
            aria-label="Description"
            title={stripHtml(description)}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}
        <button
          type="button"
          className="text-sm text-[#36C3F1] font-medium transition-colors mt-2"
          aria-label="Read more"
        >
          [Read more]
        </button>
    </article>
  );
}

function stripHtml(html?: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}