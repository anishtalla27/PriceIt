"use client";

import * as React from "react";
import { Sparkles, Send } from "lucide-react";
import { ChronicleButton } from "@/components/ui/chronicle-button";

interface Hero1Props {
  logoSrc: string;
  onBack: () => void;
  onContinue: () => void;
  continueDisabled: boolean;
  children: React.ReactNode;
  // Controlled input (chat mode)
  inputValue?: string;
  onInputChange?: (val: string) => void;
  onInputSubmit?: () => void;
  inputDisabled?: boolean;
  inputPlaceholder?: string;
  badgeText?: string;
  title?: string;
  description?: string;
}

const Hero1 = ({
  logoSrc,
  onBack,
  onContinue,
  continueDisabled,
  children,
  inputValue,
  onInputChange,
  onInputSubmit,
  inputDisabled = false,
  inputPlaceholder = "Tip: Be specific for more accurate AI results.",
  badgeText = "Product Info Setup",
  title = "Tell LaunchPad About Your Product",
  description = "Chat with our AI to describe your idea.",
}: Hero1Props) => {
  const [internalText, setInternalText] = React.useState("");
  const controlled = onInputChange !== undefined;
  const value = controlled ? (inputValue ?? "") : internalText;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const prevDisabled = React.useRef(inputDisabled);

  // Re-focus input when AI finishes responding (inputDisabled flips false)
  React.useEffect(() => {
    if (prevDisabled.current && !inputDisabled) {
      inputRef.current?.focus();
    }
    prevDisabled.current = inputDisabled;
  }, [inputDisabled]);

  const handleChange = (v: string) => {
    if (controlled) onInputChange(v);
    else setInternalText(v);
  };

  const handleSubmit = () => {
    if (controlled && onInputSubmit && value.trim() && !inputDisabled) {
      onInputSubmit();
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col priceit-fade-in"
      style={{
        background:
          "radial-gradient(ellipse 120% 80% at 50% 0%, #ffffff 30%, #fff0e8 65%, #ffd6bc 100%)",
      }}
    >
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#E0EFF1] bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <button
          onClick={onBack}
          className="min-h-11 px-3 text-[#5DB7C4] font-semibold text-sm hover:text-[#F36C3D] transition-colors"
        >
          Back
        </button>
        <div className="flex items-center gap-2">
          <img src={logoSrc} width={150} height={150} alt="LaunchPad logo" />
          <div className="font-bold text-md">LaunchPad</div>
        </div>
        <div className="flex items-center gap-2">
          <ChronicleButton
            text="Continue"
            onClick={onContinue}
            hoverColor="#F36C3D"
            customBackground="#5DB7C4"
            customForeground="#ffffff"
            hoverForeground="#ffffff"
            width="130px"
            borderRadius="999px"
            disabled={continueDisabled}
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-4 sm:py-5 text-center">
        <div className="max-w-6xl mx-auto space-y-3 w-full">
          <div className="flex justify-center mt-1">
            <div className="bg-white rounded-full px-3.5 py-1.5 flex items-center gap-2 w-fit border border-[#A9DDE3] shadow-sm">
              <span className="text-xs flex items-center gap-2 text-[#2B2B2B]">
                <span className="bg-[#F36C3D] p-1 rounded-full text-white">
                  <Sparkles className="w-3 h-3" />
                </span>
                {badgeText}
              </span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[0.97] tracking-tight">
            {title}
          </h1>

          <p className="text-base sm:text-xl text-[#5B7780]">
            {description}
          </p>

          <div className="w-full max-w-3xl mx-auto text-left rounded-3xl border border-[#DCEAED] bg-white/70 backdrop-blur-sm px-3 py-3 sm:px-4 sm:py-4 shadow-[0_12px_30px_rgba(93,183,196,0.09)]">
            {/* Chat messages area */}
            <div>{children}</div>

            {/* Input bar */}
            <div className="flex justify-center mt-3">
              <div className="relative w-full">
                <div
                  className={`bg-white rounded-2xl px-2.5 py-2.5 flex items-center border-2 border-[#D7E8EC] focus-within:border-[#5DB7C4] shadow-sm transition-all ${
                    inputDisabled ? "opacity-60" : ""
                  }`}
                >
                  <button
                    className="h-9 w-9 rounded-xl bg-[#FFF5F0] text-[#F36C3D] flex items-center justify-center transition-all flex-shrink-0"
                    type="button"
                    tabIndex={-1}
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                  <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !inputDisabled) handleSubmit();
                    }}
                    disabled={inputDisabled}
                    placeholder={inputPlaceholder}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="bg-transparent flex-1 outline-none text-[#2B2B2B] placeholder-[#7B9EA3] pl-3 pr-2 text-[15px]"
                  />
                  {controlled && (
                    <button
                      onClick={handleSubmit}
                      disabled={inputDisabled || !value.trim()}
                      className="h-9 w-9 rounded-xl bg-[#5DB7C4] text-white hover:bg-[#4aa5b2] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
                      type="button"
                    >
                      <Send className="w-4 h-4 mx-auto" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export { Hero1 };
