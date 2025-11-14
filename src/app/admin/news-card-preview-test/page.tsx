"use client";
import NewsCardPreview from "@/components/admin/NewsCardPreview";

export default function NewsCardPreviewTestPage() {
  const heading = "Inauguration of Sakhu Cancer Foundation";
  const description = `We proudly announce the inauguration of Sakhu Cancer Foundation, officially launching our mission to provide direct financial support to cancer patients.`;
  const imageUrl = "https://via.placeholder.com/400x300.png?text=Sample+Image";
  const day = 2;
  const month = 10;
  const year = 2024;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-sm">
        <NewsCardPreview
          heading={heading}
          description={description}
          imageUrl={imageUrl}
          day={day}
          month={month}
          year={year}
        />
      </div>
    </div>
  );
}