import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "在部落裡",
};

const introParagraphs = [
  "Celesverse 來自「Celestial」與「Universe」，代表著神聖的輕盈與無限可能。",
  "神仙部落是一座跨越時空的遊樂場，人人都能在其中玩得愉快。我們在這裡放鬆練功，玩味所有的「也許可以」。",
  "整趟旅程，都是一場與心的對話。聊著聊著，會恍然大悟，人生中最聊得來的朋友，竟然是自己。",
  "無論你正尋覓著靈感，還是只想在日子裡伸個長長的懶腰，Celesverse 都是你輕鬆 Reset、重新連線的所在。",
  "放下壓力，來神仙部落開心玩耍吧。這裡，永遠都有你的位置。今天，也歡迎你來！",
];

const playfulParagraphs = [
  "我們想讓「人生」這場遊戲好玩一點。",
  "在神仙部落，沒有高深難懂的學問及語言，只有用身體去體會，用心去感受。",
  "一堂課程，就像一次發現自己的機會。有時大笑，有時靜心，有時呼吸，然後，那些藏在肺腑之間且難以講述的感覺，竟開始悄悄地鬆動。",
];

const welcomeParagraphs = [
  "無論你是初訪的人客，或是練功許久的靈性前輩，都很開心能夠見到你。",
  "check-in 這裡最重要行囊，就是你本身。只是為了放開心，熱熱鬧鬧玩一次、信一次、練一次，讓內在的小孩們晃出大門，開一場好玩的派對。",
  "畫一張沒人看得懂的圖，跳一段只有你知道節奏的舞，或是，發明專屬你的咒語，都行。",
  "你的玩心，足以變出真心的魔法。有沒有可能，這就是「創造」的意義呢。",
];

export default function AboutPage() {
  return (
    <main className="pt-28 md:pt-36">
      <section className="mx-6 md:mx-12 lg:mx-16 bg-background shadow-2xl">
        <div className="grid min-h-[78vh] grid-cols-1 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="relative min-h-[48vh] bg-mist lg:min-h-full">
            <Image
              src="/images/about-5511.webp"
              alt="在部落裡"
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover mix-blend-multiply opacity-90"
            />
          </div>
          <div className="flex flex-col justify-center px-6 py-16 md:px-14 lg:px-20">
            <p className="text-[10px] uppercase tracking-[0.35em] text-muted-fg font-sans">
              About Celesverse
            </p>
            <h1 className="mt-5 text-4xl font-serif font-light leading-tight md:text-6xl">
              在部落裡
            </h1>
            <div className="mt-8 h-px w-14 bg-gold-dust" />
            <div className="mt-8 space-y-5 text-base font-light leading-[2] text-muted-fg md:text-lg">
              {introParagraphs.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-6 mt-1 bg-background px-6 py-20 shadow-2xl md:mx-12 md:px-12 md:py-28 lg:mx-16">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-muted-fg font-sans">
              Playful Heart
            </p>
            <h2 className="mt-5 text-3xl font-serif font-light leading-tight md:text-5xl">
              玩心，才是真心
            </h2>
          </div>
          <div className="space-y-6 text-base font-light leading-[2] text-muted-fg md:text-lg">
            {playfulParagraphs.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-6 mt-1 bg-background shadow-2xl md:mx-12 lg:mx-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.06fr_0.94fr]">
          <div className="flex flex-col justify-center px-6 py-20 md:px-12 md:py-28 lg:px-20">
            <p className="text-[10px] uppercase tracking-[0.35em] text-muted-fg font-sans">
              Welcome
            </p>
            <h2 className="mt-5 text-3xl font-serif font-light leading-tight md:text-5xl">
              用自己的方式走進來，或跳進來
            </h2>
            <div className="mt-8 h-px w-12 bg-gold-dust" />
            <div className="mt-10 space-y-6 text-base font-light leading-[2] text-muted-fg md:text-lg">
              {welcomeParagraphs.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </div>
            <Link
              href="/experiences"
              className="mt-12 inline-block self-start border border-border px-10 py-4 text-sm uppercase tracking-widest text-foreground transition-colors duration-500 hover:bg-mist font-sans"
            >
              看看體驗課程
            </Link>
          </div>
          <div className="relative min-h-[46vh] bg-mist lg:min-h-full">
            <Image
              src="/images/about-5617.webp"
              alt="玩心與真心"
              fill
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="object-cover mix-blend-multiply opacity-90"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
