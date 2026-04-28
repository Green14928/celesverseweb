// 課程圖片組圖展示 — Silk & Shadow（方正無圓角 + 燈箱）
"use client";

import { useState } from "react";
import Image from "next/image";

interface CourseGalleryProps {
  images: string[];
  title: string;
}

export function CourseGallery({ images, title }: CourseGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // 沒有圖片時顯示 placeholder
  if (images.length === 0) {
    return (
      <div className="aspect-[4/5] bg-mist overflow-hidden shadow-soft sticky top-32">
        <div className="w-full h-full bg-gradient-to-br from-mist via-background to-gold-dust/20 flex items-center justify-center">
          <span className="text-8xl font-serif font-light text-muted-fg/20">
            {title.charAt(0)}
          </span>
        </div>
      </div>
    );
  }

  // 單張圖片
  if (images.length === 1) {
    return (
      <div className="sticky top-32">
        <div
          className="relative aspect-[4/5] bg-mist overflow-hidden shadow-soft cursor-zoom-in"
          onClick={() => setLightboxOpen(true)}
        >
          <Image
            src={images[0]}
            alt={title}
            fill
            sizes="(min-width: 1024px) 40vw, calc(100vw - 48px)"
            className="w-full h-full object-cover"
          />
        </div>

        {lightboxOpen && (
          <Lightbox
            images={images}
            activeIndex={0}
            onClose={() => setLightboxOpen(false)}
            onChangeIndex={() => {}}
          />
        )}
      </div>
    );
  }

  // 多張圖片
  return (
    <div className="sticky top-32 space-y-3">
      {/* 主圖 */}
      <div
        className="relative aspect-[4/5] bg-mist overflow-hidden shadow-soft cursor-zoom-in"
        onClick={() => setLightboxOpen(true)}
      >
        <Image
          src={images[activeIndex]}
          alt={`${title} - ${activeIndex + 1}`}
          fill
          sizes="(min-width: 1024px) 40vw, calc(100vw - 48px)"
          className="w-full h-full object-cover transition-opacity duration-500"
        />
      </div>

      {/* 縮圖列 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((url, i) => (
          <button
            key={`${url}-${i}`}
            onClick={() => setActiveIndex(i)}
            className={`flex-shrink-0 w-16 h-16 overflow-hidden border-2 transition-all duration-300 ${
              i === activeIndex
                ? "border-gold-dust shadow-sm"
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <Image
              src={url}
              alt={`${title} - 縮圖 ${i + 1}`}
              width={64}
              height={64}
              sizes="64px"
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {lightboxOpen && (
        <Lightbox
          images={images}
          activeIndex={activeIndex}
          onClose={() => setLightboxOpen(false)}
          onChangeIndex={setActiveIndex}
        />
      )}
    </div>
  );
}

/** 全螢幕燈箱 */
function Lightbox({
  images,
  activeIndex,
  onClose,
  onChangeIndex,
}: {
  images: string[];
  activeIndex: number;
  onClose: () => void;
  onChangeIndex: (i: number) => void;
}) {
  function goPrev() {
    onChangeIndex(activeIndex <= 0 ? images.length - 1 : activeIndex - 1);
  }
  function goNext() {
    onChangeIndex(activeIndex >= images.length - 1 ? 0 : activeIndex + 1);
  }

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 關閉按鈕 */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white/70 hover:text-white text-3xl leading-none z-10"
      >
        ✕
      </button>

      {/* 計數 */}
      <span className="absolute top-6 left-6 text-white/50 text-sm font-sans">
        {activeIndex + 1} / {images.length}
      </span>

      {/* 上一張 */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-4 md:left-8 text-white/50 hover:text-white text-4xl leading-none"
        >
          ‹
        </button>
      )}

      {/* 圖片 */}
      <Image
        src={images[activeIndex]}
        alt=""
        width={1600}
        height={1200}
        sizes="90vw"
        className="max-h-[85vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* 下一張 */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-4 md:right-8 text-white/50 hover:text-white text-4xl leading-none"
        >
          ›
        </button>
      )}
    </div>
  );
}
