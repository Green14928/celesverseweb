// 導師卡片 — Silk & Shadow
import Link from "next/link";
import Image from "next/image";

interface TeacherCardProps {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  photo: string | null;
  index?: number;
}

export function TeacherCard({
  id,
  name,
  title,
  bio,
  photo,
  index = 0,
}: TeacherCardProps) {
  return (
    <Link
      href={`/Guides/${id}`}
      className="group block space-y-6"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* 照片 — 方正無圓角 */}
      <div className="relative aspect-[3/4] bg-mist overflow-hidden shadow-soft">
        {photo ? (
          <Image
            src={photo}
            alt={name}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, calc(100vw - 48px)"
            className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 group-hover:opacity-100 group-hover:mix-blend-normal transition-all duration-1000"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-mist via-background to-gold-dust/20 flex items-center justify-center">
            <span className="text-6xl font-serif font-light text-muted-fg/20">
              {name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* 資訊 */}
      <div className="space-y-3">
        <h3 className="text-2xl font-serif font-light group-hover:text-gold-dust transition-colors duration-500">
          {name}
        </h3>
        {title && (
          <p className="text-[10px] tracking-[0.3em] uppercase text-gold-dust font-sans">
            {title}
          </p>
        )}
        {bio && (
          <p className="text-sm font-light text-muted-fg leading-relaxed line-clamp-3 font-sans">
            {bio}
          </p>
        )}
        <div className="h-px w-10 bg-gold-dust" />
      </div>
    </Link>
  );
}
