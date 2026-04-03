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
}: Hero1Props) => {
  const [internalText, setInternalText] = React.useState("");
  const controlled = onInputChange !== undefined;
  const value = controlled ? (inputValue ?? "") : internalText;

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
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#E0EFF1] bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <button
          onClick={onBack}
          className="min-h-11 px-3 text-[#5DB7C4] font-semibold text-sm hover:text-[#F36C3D] transition-colors"
        >
          Back
        </button>
        <div className="flex items-center gap-2">
          <img src={logoSrc} width={150} height={150} alt="PriceIt logo" />
          <div className="font-bold text-md">PriceIt</div>
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

      <main className="flex-1 flex flex-col items-center px-4 py-8 text-center">
        <div className="max-w-4xl mx-auto space-y-4 w-full">
          <div className="flex justify-center">
            <div className="bg-white rounded-full px-4 py-2 flex items-center gap-2 w-fit border border-[#A9DDE3]">
              <span className="text-xs flex items-center gap-2 text-[#2B2B2B]">
                <span className="bg-[#F36C3D] p-1 rounded-full text-white">
                  <Sparkles className="w-3 h-3" />
                </span>
                Product Info Setup
              </span>
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[0.95]">
            Tell PriceIt About Your Product
          </h1>

          <p className="text-xl sm:text-2xl text-[#5B7780]">
            Chat with our AI to describe your idea.
          </p>

          {/* Chat messages area */}
          <div className="w-full max-w-2xl mx-auto text-left">{children}</div>

          {/* Input bar */}
          <div className="flex justify-center">
            <div className="relative max-w-2xl w-full">
              <div
                className={`bg-white rounded-full p-3 flex items-center border border-[#A9DDE3] shadow-sm transition-opacity ${
                  inputDisabled ? "opacity-60" : ""
                }`}
              >
                <button
                  className="p-2 rounded-full hover:bg-[#F7F9FA] transition-all flex-shrink-0"
                  type="button"
                  tabIndex={-1}
                >
                  <Sparkles className="w-5 h-5 text-[#F36C3D]" />
                </button>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !inputDisabled) handleSubmit();
                  }}
                  disabled={inputDisabled}
                  placeholder={inputPlaceholder}
                  className="bg-transparent flex-1 outline-none text-[#2B2B2B] placeholder-[#7B9EA3] pl-4 pr-2 text-base"
                />
                {controlled && (
                  <button
                    onClick={handleSubmit}
                    disabled={inputDisabled || !value.trim()}
                    className="p-2 rounded-full bg-[#5DB7C4] text-white hover:bg-[#4aa5b2] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0 ml-1"
                    type="button"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export { Hero1 };
