type CardPreviewProps = {
  title?: string;
  imageSrc?: string;
  contentHtml?: string;
  actions?: { label: string; onClick?: () => void }[];
  className?: string;
};

export default function CardPreview({
  title = 'Card Title',
  imageSrc,
  contentHtml = '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>',
  actions = [{ label: '[Read more]' }],
  className = '',
}: CardPreviewProps) {
  return (
    <article
      className={`w-[320px] h-[270px] rounded-md border border-white/10 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden bg-gradient-to-br from-[#8B5A9E] to-[#6B4A7E] ${className}`}
      aria-label="Card preview"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="h-[48px] px-4 pt-3 pb-2">
          <h3
            className="text-white font-semibold text-sm overflow-hidden whitespace-nowrap text-ellipsis"
            aria-label="Card title"
            title={title}
          >
            {title}
          </h3>
        </header>

        {/* Main / Image area */}
        <div className="flex-1 px-4">
          {imageSrc ? (
            <div className="h-full w-full rounded-sm overflow-hidden bg-black/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="h-full w-full rounded-sm bg-white/10 border border-white/20 flex items-center justify-center text-white/70 text-xs"
              aria-label="Image placeholder"
            >
              Image Placeholder
            </div>
          )}
        </div>

        {/* Footer / Actions */}
        <footer className="h-[44px] px-4 py-2 flex items-center gap-3">
          <div
            className="flex-1 text-[12px] text-white/90 overflow-hidden whitespace-nowrap text-ellipsis"
            aria-label="Content"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
          <div className="flex items-center gap-2">
            {actions.map((a, idx) => (
              <button
                key={idx}
                type="button"
                className="text-[#4DD4AC] hover:text-[#3bc799] text-xs font-medium"
                aria-label={a.label}
                onClick={a.onClick}
              >
                {a.label}
              </button>
            ))}
          </div>
        </footer>
      </div>
    </article>
  );
}