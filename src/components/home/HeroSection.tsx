// 首頁 Hero 區塊 — Silk & Shadow（左文右圖分欄 + 偏移邊框裝飾）
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="pt-24 md:pt-32">
      <div className="mx-6 md:mx-12 lg:mx-16 bg-background shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[80vh]">
          {/* 左側文字 */}
          <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center relative z-10">
            <motion.div
              className="mb-8 flex items-center gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="w-12 h-px bg-foreground/20" />
              <span className="text-xs tracking-[0.3em] text-foreground/60 font-medium uppercase font-sans">
                CELESVERSE · 靈性探索
              </span>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-serif font-light leading-[1.1] mb-8 text-balance"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              神仙部落
            </motion.h1>

            <motion.p
              className="max-w-[45ch] text-lg text-muted-fg leading-relaxed font-light mb-12 font-sans"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              練習，是回到本來的過程
              <br />
              與失聯的渴望重新聯繫
              <br /><br />
              在自在中修習平靜
              <br />
              讓呼吸成為心靈的開關
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link href="/experiences" className="group inline-flex items-center gap-4">
                <span className="size-12 border border-foreground/20 flex items-center justify-center group-hover:bg-foreground group-hover:border-foreground transition-all duration-500">
                  <span className="w-2 h-2 bg-foreground group-hover:bg-background transition-colors duration-500" />
                </span>
                <span className="text-sm tracking-widest border-b border-foreground/10 pb-1 font-sans">
                  Begin Your Journey
                </span>
              </Link>
            </motion.div>
          </div>

          {/* 右側圖片 */}
          <div className="w-full md:w-1/2 relative bg-mist/30 flex items-center justify-center p-8 md:p-12">
            {/* 垂直裝飾文字 */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-[-30%] writing-vertical text-foreground/[0.06] font-serif text-8xl lg:text-9xl pointer-events-none select-none tracking-[0.3em] hidden md:block leading-none">
              自在
            </div>

            <motion.div
              className="relative w-full max-w-md aspect-[4/5]"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.3 }}
            >
              {/* 偏移邊框裝飾 */}
              <div className="absolute -inset-4 border border-foreground/5 translate-x-4 translate-y-4" />

              {/* 圖片 */}
              <div className="absolute inset-0 bg-mist overflow-hidden">
                <Image
                  src="/images/hero-forest.png"
                  alt="Hero"
                  fill
                  sizes="(min-width: 768px) 40vw, calc(100vw - 112px)"
                  className="w-full h-full object-cover mix-blend-multiply opacity-90"
                />
              </div>

            </motion.div>
          </div>
        </div>

        {/* 底部三欄 */}
        <div className="border-t border-border grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {[
            { num: "01", label: "Inner Stillness", title: "內在寧靜", desc: "你的念頭不是敵人，它們是生命力的證明。只需要，讓它們慢慢安靜。\nYour thoughts aren't the enemy. They're alive. Let them settle." },
            { num: "02", label: "Conscious Breathing", title: "有意識呼吸", desc: "專注於內心的和平，讓呼吸成為心靈的開關。\nFocus on the peace within. Let breath be the switch to your soul." },
            { num: "03", label: "Mindful Awareness", title: "身心覺察", desc: "自由，其實一直都在心裡。創造力，是你靈魂在自由中跳舞的樣子。\nFreedom has always been within you. Creativity is your soul, dancing in that freedom." },
          ].map((item) => (
            <motion.div
              key={item.num}
              className="p-8 space-y-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: parseInt(item.num) * 0.1 }}
              viewport={{ once: true }}
            >
              <span className="text-[10px] text-muted-fg tracking-[0.3em] uppercase font-sans">
                {item.num} / {item.label}
              </span>
              <h3 className="font-serif text-lg">{item.title}</h3>
              <p className="text-sm text-muted-fg leading-relaxed font-sans whitespace-pre-line">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
