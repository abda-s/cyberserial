import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlitchButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: 'cyan' | 'pink' | 'green';
    disabled?: boolean;
}

export const GlitchButton: React.FC<GlitchButtonProps> = ({
    children,
    onClick,
    className = "",
    variant = 'cyan',
    disabled = false
}) => {
    const [isHovered, setIsHovered] = useState(false);

    const colors = {
        cyan: { text: 'text-cyber-neon-cyan', border: 'border-cyber-neon-cyan', shadow: 'shadow-neon-cyan', bg: 'bg-cyber-neon-cyan/10' },
        pink: { text: 'text-cyber-neon-pink', border: 'border-cyber-neon-pink', shadow: 'shadow-neon-pink', bg: 'bg-cyber-neon-pink/10' },
        green: { text: 'text-cyber-neon-green', border: 'border-cyber-neon-green', shadow: 'shadow-neon-green', bg: 'bg-cyber-neon-green/10' },
    };

    const currentColors = colors[variant];

    return (
        <motion.button
            className={`relative px-6 py-3 font-bold tracking-widest uppercase border ${currentColors.border} ${currentColors.text} bg-transparent overflow-hidden ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''} ${className}`}
            onClick={!disabled ? onClick : undefined}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileTap={{ scale: 0.95 }}
        >
            <span className="relative z-10 block">
                {children}
            </span>

            {/* Background Hover Effect */}
            <motion.div
                className={`absolute inset-0 ${currentColors.bg}`}
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3, ease: "circOut" }}
            />

            {/* Glitch Overlay Text (Red Channel) */}
            <AnimatePresence>
                {isHovered && (
                    <motion.span
                        className="absolute inset-0 flex items-center justify-center text-red-500 opacity-70 z-0 pointer-events-none"
                        initial={{ x: 0, opacity: 0 }}
                        animate={{
                            x: [-2, 2, -2, 0],
                            opacity: [0, 0.8, 0],
                            clipPath: [
                                "inset(0 0 0 0)",
                                "inset(20% 0 80% 0)",
                                "inset(80% 0 5% 0)",
                                "inset(0 0 0 0)"
                            ]
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 0.2,
                            repeat: Infinity,
                            repeatType: "mirror"
                        }}
                    >
                        {children}
                    </motion.span>
                )}
            </AnimatePresence>

            {/* Glitch Overlay Text (Cyan Channel offset) */}
            <AnimatePresence>
                {isHovered && (
                    <motion.span
                        className={`absolute inset-0 flex items-center justify-center ${currentColors.text} opacity-70 z-0 pointer-events-none mix-blend-screen`}
                        initial={{ x: 0, opacity: 0 }}
                        animate={{
                            x: [2, -2, 2, 0],
                            opacity: [0, 0.8, 0],
                            clipPath: [
                                "inset(0 0 0 0)",
                                "inset(10% 0 60% 0)",
                                "inset(40% 0 10% 0)",
                                "inset(0 0 0 0)"
                            ]
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 0.15,
                            repeat: Infinity,
                            repeatType: "mirror"
                        }}
                    >
                        {children}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    );
};
