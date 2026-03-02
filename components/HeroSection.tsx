import Image from "next/image";
import Link from "next/link";

const HeroSection = () => {
  return (
    <section className="max-w-7xl px-5 mx-auto w-full mb-10 md:mb-16">
      <div className="bg-[#f3e4c7] rounded-[14px] p-5 md:p-6 lg:py-6 lg:px-10 relative overflow-hidden flex items-center">
        <div className="flex flex-col items-center text-center lg:items-center lg:text-left lg:flex-row lg:justify-between gap-4 lg:gap-6 w-full">
          {/* Left Part */}
          <div className="flex-1 max-w-full lg:max-w-100 flex flex-col gap-3 lg:gap-4 items-center lg:items-start justify-center z-10">
            <h1 className="text-[26px] md:text-3xl lg:text-4xl font-semibold text-black tracking-[-0.02em] leading-8 md:leading-10.5 font-serif text-4xl">
              Your Library
            </h1>
            <p className="text-sm md:text-base text-[#3d485e] leading-5 md:leading-6">
              Convert your books into interactive AI conversations.{" "}
              <br className="hidden md:block" />
              Listen, learn, and discuss your favorite reads.
            </p>
            <Link
              href="/books/new"
              className="inline-flex items-center justify-center gap-2 bg-white text-(--text-primary) px-5 py-3 rounded-[10px] font-bold text-base md:text-xl transition-all w-full lg:w-fit mt-4 hover:shadow-md/10"
            >
              <span className="text-3xl font-light mb-1 mr-2">+</span>
              <span className="text-[#212a3b]">Add new book</span>
            </Link>
          </div>

          {/* Center Part - Desktop */}
          <div className="hidden lg:flex items-center justify-center flex-1 max-w-100">
            <Image
              src="/assets/hero-illustration.png"
              alt="Vintage books and a globe"
              width={400}
              height={400}
              className="object-contain"
            />
          </div>

          {/* Center Part - Mobile (Hidden on Desktop) */}
          <div className="flex items-center justify-center mt-2 lg:hidden">
            <Image
              src="/assets/hero-illustration.png"
              alt="Vintage books and a globe"
              width={300}
              height={300}
              className="object-contain"
            />
          </div>

          {/* Right Part */}
          <div className="bg-white p-4 rounded-[10px] min-w-65 max-w-70 z-10 shadow-soft-md list-none">
            <ul className="space-y-6">
              <li className="flex items-start gap-3 list-none">
                <div className="w-10 h-10 min-w-10 min-h-10 rounded-full border border-gray-300 flex items-center justify-center font-medium text-lg list-none">
                  1
                </div>
                <div className="flex flex-col">
                  <h3 className="font-semibold text-base text-[#222c37] leading-6">
                    Upload PDF
                  </h3>
                  <p className="font-normal text-sm text-[#222c37] leading-5">
                    Add your book file
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 list-none">
                <div className="w-10 h-10 min-w-10 min-h-10 rounded-full border border-gray-300 flex items-center justify-center font-medium text-lg">
                  2
                </div>
                <div className="flex flex-col">
                  <h3 className="font-semibold text-base text-[#222c37] leading-6">
                    AI Processing
                  </h3>
                  <p className="font-normal text-sm text-[#222c37] leading-5">
                    We analyze the content
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 list-none">
                <div className="w-10 h-10 min-w-10 min-h-10 rounded-full border border-gray-300 flex items-center justify-center font-medium text-lg">
                  3
                </div>
                <div className="flex flex-col">
                  <h3 className="font-semibold text-base text-[#222c37] leading-6">
                    Voice Chat
                  </h3>
                  <p className="font-normal text-sm text-[#222c37] leading-5">
                    Discuss with AI
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
