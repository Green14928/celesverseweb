// 課程商品卡片 — Silk & Shadow
import Link from "next/link";
import Image from "next/image";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  totalSlots: number;
  soldCount: number;
  category: { name: string } | null;
  startDate: Date | null;
  location?: string | null;
  index?: number;
}

export function CourseCard({
  id,
  title,
  description,
  price,
  imageUrl,
  category,
  startDate,
  location,
  index = 0,
}: CourseCardProps) {
  return (
    <Link
      href={`/experiences/${id}`}
      className="group block space-y-6"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* 課程圖片 — 方正無圓角 */}
      <div className="relative aspect-[4/5] bg-mist overflow-hidden shadow-soft">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, calc(100vw - 48px)"
            unoptimized
            className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 group-hover:opacity-100 group-hover:mix-blend-normal transition-all duration-1000"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-mist via-background to-gold-dust/20 flex items-center justify-center">
            <span className="text-6xl font-serif font-light text-muted-fg/20">
              {title.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* 課程資訊 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] tracking-[0.3em] uppercase text-muted-fg font-sans">
            {category?.name}
            {startDate && (
              <> · {new Date(startDate).toLocaleDateString("zh-TW")}</>
            )}
          </span>
        </div>

        <h3 className="text-2xl font-serif font-light group-hover:text-gold-dust transition-colors duration-500">
          {title}
        </h3>

        <p className="text-sm font-light text-muted-fg leading-relaxed line-clamp-2 font-sans">
          {description}
        </p>

        {location && (
          <p className="text-xs text-foreground/70 font-sans">
            {location}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <span className="text-lg font-light font-sans">
            NT$ {price.toLocaleString()}
          </span>
        </div>

        <div className="h-px w-10 bg-gold-dust" />
      </div>
    </Link>
  );
}
