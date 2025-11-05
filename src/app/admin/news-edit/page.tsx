"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import upload from "@/assets/upload.png";
import { presignAndUpload } from "@/lib/uploadClient";
import NewsUnifiedCard from "@/components/admin/NewsUnifiedCard";

type NewsItem = {
  id: string;
  heading: string;
  date?: string;
  description?: string;
  content?: string;
  imageUrl?: string;
  createdAt: string;
};

export default function NewsEditPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const [heading, setHeading] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadNews = async () => {
      const res = await fetch("/api/news");
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.items || []).map((n: any) => ({
          id: n.id,
          heading: n.title,
          date: n.publishedAt || "",
          description: n.summary,
          content: n.content,
          imageUrl: n.heroImage,
          createdAt: n.createdAt,
        }));
        setItems(mapped);

        const newsId = searchParams.get("id");
        if (newsId) {
          const item = mapped.find((n: NewsItem) => n.id === newsId);
          if (item) {
            setSelectedItem(item);
            setHeading(item.heading);
            setDescription(item.description || "");
            setContent(item.content || "");
            if (item.imageUrl) {
              setExistingImages([item.imageUrl]);
            }
          }
        }
      }
    };
    loadNews();
  }, [searchParams]);

  const handleSelectNews = (item: NewsItem) => {
    setSelectedItem(item);
    setHeading(item.heading);
    setDescription(item.description || "");
    setContent(item.content || "");
    setImages([]);
    setExistingImages(item.imageUrl ? [item.imageUrl] : []);
    router.push(`/admin/news-edit?id=${item.id}`);
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    const newImages = Array.from(files);
    setImages([...images, ...newImages]);
  };

  // Rich text editor functions
  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    textareaRef.current?.focus();
  };

  const handleUndo = () => {
    document.execCommand('undo', false);
  };

  const handleRedo = () => {
    document.execCommand('redo', false);
  };

  const handleFormatBlock = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'p') {
      execCommand('formatBlock', '<p>');
    } else if (value === 'div') {
      execCommand('formatBlock', '<div>');
    } else {
      execCommand('formatBlock', `<${value}>`);
    }
    e.target.value = 'p'; // Reset dropdown
  };

  const handleBold = () => execCommand('bold');
  const handleItalic = () => execCommand('italic');
  const handleUnderline = () => execCommand('underline');
  const handleStrikethrough = () => execCommand('strikeThrough');
  
  // List functions
  const handleOrderedList = () => execCommand('insertOrderedList');
  const handleUnorderedList = () => execCommand('insertUnorderedList');
  
  // Additional formatting functions
  const handleIndent = () => execCommand('indent');
  const handleOutdent = () => execCommand('outdent');
  const handleJustifyLeft = () => execCommand('justifyLeft');
  const handleJustifyCenter = () => execCommand('justifyCenter');
  const handleJustifyRight = () => execCommand('justifyRight');
  const handleJustifyFull = () => execCommand('justifyFull');
  const handleRemoveFormat = () => execCommand('removeFormat');
  
  // Color and highlighting
  const handleTextColor = (color: string) => execCommand('foreColor', color);
  const handleHighlight = (color: string) => execCommand('hiliteColor', color);

  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedItem) return;

    setLoading(true);
    setError(null);

    try {
      let heroImageUrl: string | undefined;
      if (images.length > 0) {
        const slug = heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const { publicUrl } = await presignAndUpload(images[0], { feature: "news", slug });
        heroImageUrl = publicUrl;
      }

      const res = await fetch("/api/news", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem.id,
          title: heading,
          summary: description || undefined,
          content,
          heroImageUrl,
        }),
      });

      setLoading(false);
      if (res.ok) {
        alert("News updated successfully!");
        const newsRes = await fetch("/api/news");
        if (newsRes.ok) {
          const data = await newsRes.json();
          const mapped = (data.items || []).map((n: any) => ({
            id: n.id,
            heading: n.title,
            date: n.publishedAt || "",
            description: n.summary,
            content: n.content,
            imageUrl: n.heroImage,
            createdAt: n.createdAt,
          }));
          setItems(mapped);
          const updated = mapped.find((n: NewsItem) => n.id === selectedItem.id);
          if (updated) {
            setSelectedItem(updated);
            setExistingImages(updated.imageUrl ? [updated.imageUrl] : []);
            setImages([]);
          }
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Update failed");
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "Update failed");
    }
  };

  return (
    <div className="max-w-7xl h-full mx-auto bg-white shadow border p-6 overflow-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Edit News</h1>
      </div>

      <div className="grid  gap-6 mb-8">
        

        {/* Right: Edit Form */}
        <div>
          {selectedItem ? (
            <div className="space-y-6">
              <NewsUnifiedCard
                item={{ id: selectedItem.id, title: heading, summary: description || undefined, content: content || "", heroImage: (existingImages[0] || selectedItem.imageUrl) }}
                allowEdit
                onSave={async ({ id, title, summary, content, heroImageUrl }) => {
                  const res = await fetch("/api/news", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id, title, summary, content, heroImageUrl }),
                  });
                  if (res.ok) {
                    const newsRes = await fetch("/api/news");
                    if (newsRes.ok) {
                      const data = await newsRes.json();
                      const mapped = (data.items || []).map((n: any) => ({
                        id: n.id,
                        heading: n.title,
                        date: n.publishedAt || "",
                        description: n.summary,
                        content: n.content,
                        imageUrl: n.heroImage,
                        createdAt: n.createdAt,
                      }));
                      setItems(mapped);
                      const updated = mapped.find((n: NewsItem) => n.id === id);
                      if (updated) {
                        setSelectedItem(updated);
                        setHeading(updated.heading);
                        setDescription(updated.description || "");
                        setContent(updated.content || "");
                        setExistingImages(updated.imageUrl ? [updated.imageUrl] : []);
                      }
                    }
                  } else {
                    const data = await res.json().catch(() => ({}));
                    alert(data.error || "Update failed");
                  }
                }}
                onDelete={async (id) => {
                  const res = await fetch(`/api/news?id=${encodeURIComponent(id)}`, { method: "DELETE" });
                  if (res.ok) {
                    router.push("/admin/news");
                  }
                }}
              />
              {false && (<>
              {/* Heading */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Heading</label>
                <input
                  type="text"
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#804499]/20 focus:border-[#804499]"
                  required
                />
              </div>

              {/* Description with Toolbar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discription</label>
                <div className="border border-gray-300 rounded-md">
                  {/* Toolbar */}
                  <div className="bg-gray-50 border-b border-gray-300 px-3 py-2 flex items-center gap-2 flex-wrap text-xs text-black">
                    {/* Undo/Redo */}
                    <button type="button" onClick={handleUndo} className="p-1 hover:bg-gray-200 rounded" title="Undo">↶</button>
                    <button type="button" onClick={handleRedo} className="p-1 hover:bg-gray-200 rounded" title="Redo">↷</button>
                    <div className="w-px h-4 bg-gray-300"></div>
                    
                    {/* Format Dropdown */}
                    <select 
                      onChange={handleFormatBlock}
                      className="text-xs border-0 bg-transparent px-2 py-1 cursor-pointer"
                      defaultValue="p"
                    >
                      <option value="p">Paragraph</option>
                      <option value="h1">Heading 1</option>
                      <option value="h2">Heading 2</option>
                      <option value="h3">Heading 3</option>
                      <option value="div">Normal</option>
                    </select>
                    <div className="w-px h-4 bg-gray-300"></div>
                    
                    {/* Text Styling */}
                    <button type="button" onClick={handleBold} className="px-2 py-1 hover:bg-gray-200 rounded font-bold" title="Bold (Ctrl+B)">B</button>
                    <button type="button" onClick={handleItalic} className="px-2 py-1 hover:bg-gray-200 rounded italic" title="Italic (Ctrl+I)">I</button>
                    <button type="button" onClick={handleUnderline} className="px-2 py-1 hover:bg-gray-200 rounded underline" title="Underline (Ctrl+U)">U</button>
                    <button type="button" onClick={handleStrikethrough} className="px-2 py-1 hover:bg-gray-200 rounded line-through" title="Strikethrough">S</button>
                    <div className="w-px h-4 bg-gray-300"></div>
                    
                    {/* Text Color */}
                    <div className="relative group">
                      <button type="button" className="px-2 py-1 hover:bg-gray-200 rounded" title="Text Color">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <div className="hidden group-hover:block absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg p-2 z-10">
                        <div className="flex gap-1">
                          <button type="button" onClick={() => handleTextColor('#000000')} className="w-6 h-6 bg-black rounded" title="Black"></button>
                          <button type="button" onClick={() => handleTextColor('#FF0000')} className="w-6 h-6 bg-red-600 rounded" title="Red"></button>
                          <button type="button" onClick={() => handleTextColor('#0000FF')} className="w-6 h-6 bg-blue-600 rounded" title="Blue"></button>
                          <button type="button" onClick={() => handleTextColor('#008000')} className="w-6 h-6 bg-green-600 rounded" title="Green"></button>
                          <button type="button" onClick={() => handleTextColor('#FFA500')} className="w-6 h-6 bg-orange-500 rounded" title="Orange"></button>
                          <button type="button" onClick={() => handleTextColor('#800080')} className="w-6 h-6 bg-purple-600 rounded" title="Purple"></button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Highlight Color */}
                    <div className="relative group">
                      <button type="button" className="px-2 py-1 hover:bg-gray-200 rounded" title="Highlight">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <div className="hidden group-hover:block absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg p-2 z-10">
                        <div className="flex gap-1">
                          <button type="button" onClick={() => handleHighlight('transparent')} className="w-6 h-6 border border-gray-300 rounded" title="None"></button>
                          <button type="button" onClick={() => handleHighlight('#FFFF00')} className="w-6 h-6 bg-yellow-300 rounded" title="Yellow"></button>
                          <button type="button" onClick={() => handleHighlight('#00FF00')} className="w-6 h-6 bg-green-300 rounded" title="Green"></button>
                          <button type="button" onClick={() => handleHighlight('#00FFFF')} className="w-6 h-6 bg-cyan-300 rounded" title="Cyan"></button>
                          <button type="button" onClick={() => handleHighlight('#FFC0CB')} className="w-6 h-6 bg-pink-300 rounded" title="Pink"></button>
                        </div>
                      </div>
                    </div>
                    <div className="w-px h-4 bg-gray-300"></div>
                    
                    {/* Lists */}
                    <button 
                      type="button" 
                      onClick={handleUnorderedList} 
                      className="px-2 py-1 hover:bg-gray-200 rounded flex items-center gap-1" 
                      title="Bullet List"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button 
                      type="button" 
                      onClick={handleOrderedList} 
                      className="px-2 py-1 hover:bg-gray-200 rounded flex items-center gap-1" 
                      title="Numbered List"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        <circle cx="2" cy="4" r="1" fill="currentColor" />
                        <circle cx="2" cy="8" r="1" fill="currentColor" />
                        <circle cx="2" cy="12" r="1" fill="currentColor" />
                        <circle cx="2" cy="16" r="1" fill="currentColor" />
                      </svg>
                    </button>
                    <div className="w-px h-4 bg-gray-300"></div>
                    
                    {/* Indent */}
                    <button type="button" onClick={handleOutdent} className="px-2 py-1 hover:bg-gray-200 rounded" title="Decrease Indent">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button type="button" onClick={handleIndent} className="px-2 py-1 hover:bg-gray-200 rounded" title="Increase Indent">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm6 4a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1zm-6 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm6 4a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <div className="w-px h-4 bg-gray-300"></div>
                    
                    {/* Text Alignment */}
                    <button type="button" onClick={handleJustifyLeft} className="px-2 py-1 hover:bg-gray-200 rounded" title="Align Left">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button type="button" onClick={handleJustifyCenter} className="px-2 py-1 hover:bg-gray-200 rounded" title="Align Center">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm-3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button type="button" onClick={handleJustifyRight} className="px-2 py-1 hover:bg-gray-200 rounded" title="Align Right">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm6 4a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1zm-6 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm6 4a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button type="button" onClick={handleJustifyFull} className="px-2 py-1 hover:bg-gray-200 rounded" title="Justify">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <div className="w-px h-4 bg-gray-300"></div>
                    
                    {/* Remove Formatting */}
                    <button type="button" onClick={handleRemoveFormat} className="px-2 py-1 hover:bg-gray-200 rounded" title="Clear Formatting">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <div
                    ref={textareaRef as any}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => setDescription(e.currentTarget.innerHTML)}
                    dangerouslySetInnerHTML={{ __html: description }}
                    className="w-full px-3 py-2 min-h-[150px] text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#804499]/20 overflow-auto"
                    style={{ 
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.5'
                    }}
                  />
                </div>
              </div>

              {/* Upload Images with Grid */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Images</label>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left: Upload Area */}
                  <div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center">
                      <div 
                        className="cursor-pointer flex flex-col items-center"
                        onClick={() => inputRef.current?.click()}
                      >
                        <svg className="w-16 h-16 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <button
                          type="button"
                          className="rounded-md bg-[#2E3192] text-white px-6 py-2 text-sm font-medium hover:bg-[#2E3192]/90"
                        >
                          Upload File
                        </button>
                      </div>
                      <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleImageUpload(e.target.files)}
                      />
                    </div>
                  </div>

                  {/* Right: Image Grid */}
                  <div>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Existing Images */}
                      {existingImages.map((url, idx) => (
                        <div key={`existing-${idx}`} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="w-full h-24 object-cover rounded border border-gray-300" />
                        </div>
                      ))}
                      
                      {/* New Images Preview */}
                      {mounted && images.map((file, idx) => (
                        <div key={`new-${idx}`} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt="" 
                            className="w-full h-24 object-cover rounded border-2 border-green-500" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit and Preview Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={loading}
                  className="rounded-md bg-[#804499] px-6 py-2 text-sm text-white font-medium hover:bg-[#804499]/90 disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Submit"}
                </button>
                <button
                  type="button"
                  className="rounded-md bg-[#2E3192] px-6 py-2 text-sm text-white font-medium hover:bg-[#2E3192]/90 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* News Card List Table */}
              <div className="mt-8">
                <h2 className="text-base font-semibold text-gray-900 mb-3">News Card List</h2>
                <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-300">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Sr.No</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Heading</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Preview</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.heading}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100"
                            >
                              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100"
                                title="Edit"
                              >
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100"
                                title="Delete"
                              >
                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                            No news items yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>)}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Select a news item from the list to edit</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
