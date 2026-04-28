// 理念區塊 — Silk & Shadow（容器化白卡 + 左右交替 + 偏移邊框圖片）
"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const sections = [
  {
    image: "/images/philosophy/philosophy-1.webp",
    alt: "林間小路",
    quote: true,
    text: `我們不會停止探索，而我們一切探索的終點，\n就是要抵達我們的起點，並第一次認識那裡。`,
    attribution: "T.S. Eliot, Four Quartets",
    imagePosition: "right" as const,
  },
  {
    image: "/images/philosophy/philosophy-2.webp",
    alt: "溪水漫步",
    text: `練習，是回到本來的過程，與失聯的渴望重新聯繫。\n專注於內心的和平，讓呼吸成為心靈的開關。`,
    imagePosition: "left" as const,
  },
  {
    image: "/images/philosophy/philosophy-3.webp",
    alt: "自然中靜觀",
    text: `你會有那麼多想法，是因為你真的熱愛生命。\n那一閃一閃的靈感、那些跳動不已的念頭，\n是內在能量，正在流動的證明。`,
    imagePosition: "right" as const,
  },
  {
    image: "/images/philosophy/philosophy-4.webp",
    alt: "赤足大地",
    text: `在自在中修習平靜，讓喧囂的思緒慢慢安靜。\n當此刻來臨，創造與安寧不再矛盾，兩者都是你的一部分。`,
    imagePosition: "left" as const,
  },
  {
    image: "/images/philosophy/philosophy-5.webp",
    alt: "山嵐雲光",
    text: `靜默，讓人與人之間，有了不需言語的親密。\n只要在場，只要相遇，就已經足夠了。\n自由，其實一直都在心裡。\n而創造力，是你靈魂在自由中跳舞的樣子。`,
    imagePosition: "right" as const,
  },
];

function PhilosophyBlock({
  section,
}: {
  section: (typeof sections)[0];
}) {
  const isImageRight = section.imagePosition === "right";

  return (
    <div className="mx-6 md:mx-12 lg:mx-16 mb-1">
      <div className="bg-background overflow-hidden">
        <div
          className={`flex flex-col ${
            isImageRight ? "md:flex-row" : "md:flex-row-reverse"
          } min-h-[60vh]`}
        >
          {/* 文字側 */}
          <div className="w-full md:w-1/2 p-8 md:p-16 lg:p-20 flex flex-col justify-center">
            <motion.div
              className="space-y-6 max-w-lg"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, amount: 0.4 }}
            >
              <span className="text-[10px] tracking-[0.3em] text-muted-fg uppercase font-sans">
                Reflection
              </span>

              {section.quote && (
                <span className="block text-3xl text-foreground/10 font-serif leading-none">
                  ❝
                </span>
              )}

              <p className="text-xl md:text-2xl font-serif font-light leading-[1.9] whitespace-pre-line text-foreground/80">
                {section.text}
              </p>

              {section.attribution && (
                <p className="text-xs tracking-[0.2em] text-muted-fg font-sans pt-2">
                  —— {section.attribution}
                </p>
              )}

              <div className="w-10 h-px bg-foreground/15" />
            </motion.div>
          </div>

          {/* 圖片側 — 偏移邊框裝飾 */}
          <div className="w-full md:w-1/2 relative bg-mist/30">
            <motion.div
              className="relative h-full min-h-[50vh] md:min-h-0"
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              {/* 偏移邊框 */}
              <div className="absolute inset-8 md:inset-12 border border-foreground/5 translate-x-3 translate-y-3 pointer-events-none" />

              {/* 圖片 */}
              <div className="absolute inset-8 md:inset-12 overflow-hidden bg-mist">
                <Image
                  src={section.image}
                  alt={section.alt}
                  fill
                  sizes="(min-width: 768px) 45vw, calc(100vw - 112px)"
                  loading="lazy"
                  className="w-full h-full object-cover mix-blend-multiply opacity-90 hover:opacity-100 transition-opacity duration-700"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PhilosophySection() {
  return (
    <section className="py-1">
      {sections.map((s, i) => (
        <PhilosophyBlock key={i} section={s} />
      ))}
    </section>
  );
}
