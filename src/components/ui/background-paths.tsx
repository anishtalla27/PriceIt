"use client";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChronicleButton } from "@/components/ui/chronicle-button";
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

export function BackgroundPaths({ title = "PriceIt!" }: { title?: string }) {
    const words = title.split(" ");
    const navigate = useNavigate();

    return (
        <div
            className="relative flex min-h-screen w-full items-center justify-center overflow-hidden"
            style={{
                background:
                    "radial-gradient(ellipse 120% 85% at 50% 0%, #ffffff 24%, #ffe8d8 52%, #ffc79f 78%, #f3a168 100%)",
            }}
        >
            <div className="absolute right-4 top-4 z-20 rounded-xl border border-[#A9DDE3] bg-white/90 p-2 shadow-sm sm:right-8 sm:top-6">
                <img src={logo} alt="PriceIt logo" className="h-10 w-auto sm:h-12" />
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
                    <h1 className="mb-14 text-7xl font-bold leading-[0.9] tracking-tighter text-[#2B2B2B] sm:text-8xl md:text-[11rem]">
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
                                        className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#2B2B2B] to-[#5DB7C4]"
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </span>
                        ))}
                    </h1>

                    <div className="mt-2 inline-block rounded-2xl border border-[#A9DDE3] bg-white/90 p-1 shadow-sm">
                        <ChronicleButton
                            text="Let's Start →"
                            onClick={() => navigate("/setup")}
                            hoverColor="#F36C3D"
                            customBackground="#5DB7C4"
                            customForeground="#ffffff"
                            hoverForeground="#ffffff"
                            width="220px"
                            borderRadius="18px"
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
