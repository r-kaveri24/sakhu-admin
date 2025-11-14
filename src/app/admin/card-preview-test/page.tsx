import CardPreview from '@/components/ui/CardPreview';

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-6">CardPreview Test</h1>
      <div className="flex flex-wrap gap-6">
        <CardPreview />
        <CardPreview
          title="Inauguration of Sakhu Cancer Foundation"
          imageSrc="/uploads/1762259362948-1000034509.jpeg"
          contentHtml="We proudly announce the inauguration."
          actions={[{ label: '[Read more]' }, { label: '[Details]' }]}
        />
      </div>
    </div>
  );
}