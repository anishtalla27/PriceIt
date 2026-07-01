"use client";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FlaskConical, Lightbulb, TrendingUp } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import type { JourneyMode } from "@/context/AppStateContext";
import logo from "../../../logo.png";

function FloatingPaths({
    position,
    colorClass,
}: {
    position: number;
    colorClass: string;
}) {
    const paths = Array.from({ length: 36 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
            380 - i * 5 * position
        } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
            152 - i * 5 * position
        } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
            684 - i * 5 * position
        } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        width: 1 + i * 0.035,
    }));

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg
                className={`h-full w-full ${colorClass}`}
                viewBox="0 0 696 316"
                fill="none"
            >
                <title>Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke="currentColor"
                        strokeWidth={path.width}
                        strokeOpacity={0.28 + path.id * 0.012}
                        initial={{ pathLength: 0.25, opacity: 0.65 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.5, 0.9, 0.5],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            duration: 18 + (path.id % 8),
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

export function BackgroundPaths({ title = "LaunchPad" }: { title?: string }) {
    const words = title.split(" ");
    const navigate = useNavigate();
    const { beginJourney, loadTestProject } = useAppState();

    const start = (mode: JourneyMode) => {
        beginJourney(mode);
        navigate("/setup");
    };

    const startTestProject = () => {
        loadTestProject();
        navigate("/setup/pricing");
    };

    return (
        <div
            className="relative flex min-h-screen w-full items-center justify-center overflow-hidden"
            style={{
                background:
                    "radial-gradient(ellipse 120% 85% at 50% 0%, #ffffff 24%, #ffe8d8 52%, #ffc79f 78%, #f3a168 100%)",
            }}
        >
            <div className="absolute right-4 top-4 z-20 rounded-xl border border-[#9BD8E2] bg-white p-2 shadow-sm sm:right-8 sm:top-6">
                <img src={logo} alt="LaunchPad logo" className="h-10 w-auto sm:h-12" />
            </div>
            <div className="absolute inset-0">
                <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-[#A9DDE3]/35 blur-3xl" />
                <div className="absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-[#F36C3D]/15 blur-3xl" />
                <FloatingPaths position={1} colorClass="text-[#F36C3D]" />
                <FloatingPaths position={-1} colorClass="text-[#F36C3D]" />
            </div>

            <div className="relative z-10 container mx-auto px-4 text-center md:px-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="mx-auto max-w-4xl"
                >
                    <h1 className="mb-4 text-6xl font-bold leading-[0.9] tracking-tighter text-[#2B2B2B] sm:text-7xl md:text-8xl">
                        {words.map((word, wordIndex) => (
                            <span
                                key={wordIndex}
                                className="mr-4 inline-block last:mr-0"
                            >
                                {word.split("").map((letter, letterIndex) => (
                                    <motion.span
                                        key={`${wordIndex}-${letterIndex}`}
                                        initial={{ y: 90, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{
                                            delay:
                                                wordIndex * 0.1 +
                                                letterIndex * 0.03,
                                            type: "spring",
                                            stiffness: 150,
                                            damping: 24,
                                        }}
                                        className="inline-block text-[#2B2B2B]"
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </span>
                        ))}
                    </h1>

                    <p className="mx-auto mb-8 max-w-2xl text-base text-[#486B73] sm:text-lg">
                        Build the numbers behind a new idea or find the smartest next move for a product you already sell.
                    </p>

                    <div className="mx-auto grid max-w-3xl gap-4 text-left md:grid-cols-2">
                        <button
                            type="button"
                            onClick={() => start("create")}
                            className="group rounded-3xl border border-[#9BD8E2] bg-white p-6 shadow-[0_18px_40px_rgba(50,50,93,0.13)] transition hover:-translate-y-1 hover:border-[#0E92A3]"
                        >
                            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF8FA] text-[#0E92A3]">
                                <Lightbulb className="h-6 w-6" />
                            </span>
                            <span className="block text-xl font-extrabold text-[#2B2B2B]">Create a new product</span>
                            <span className="mt-2 block text-sm leading-relaxed text-[#4F747C]">
                                Turn an idea into a product plan, calculate costs, choose a price, and test it.
                            </span>
                            <span className="mt-5 flex items-center gap-2 text-sm font-bold text-[#0E92A3]">
                                Start creating <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => start("improve")}
                            className="group rounded-3xl border border-[#F0B39C] bg-white p-6 shadow-[0_18px_40px_rgba(50,50,93,0.13)] transition hover:-translate-y-1 hover:border-[#E1603F]"
                        >
                            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFEDE3] text-[#C94E32]">
                                <TrendingUp className="h-6 w-6" />
                            </span>
                            <span className="block text-xl font-extrabold text-[#2B2B2B]">Improve a current product</span>
                            <span className="mt-2 block text-sm leading-relaxed text-[#4F747C]">
                                Review what you sell today, identify the problem, rework costs and pricing, and compare improvements.
                            </span>
                            <span className="mt-5 flex items-center gap-2 text-sm font-bold text-[#C94E32]">
                                Start improving <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                            </span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={startTestProject}
                        className="priceit-feature-cta mx-auto mt-5 flex w-full max-w-3xl items-center justify-between gap-4 rounded-3xl bg-white px-5 py-4 text-left transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl border-2 border-[#9BD8E2] bg-white text-[#0E92A3] shadow-sm">
                                <FlaskConical className="h-6 w-6" />
                            </span>
                            <span>
                                <span className="priceit-cta-badge mb-1">Testing shortcut</span>
                                <span className="block text-lg font-extrabold text-[#2B2B2B]">
                                    Load sample business and jump to pricing
                                </span>
                                <span className="mt-1 block text-sm leading-relaxed text-[#486B73]">
                                    Fills product info, fixed costs, variable costs, and starter pricing with realistic bracelet data.
                                </span>
                            </span>
                        </div>
                        <span className="priceit-cta-arrow">Go →</span>
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
