import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      aria-label="Toggle Theme"
      className={`relative flex items-center justify-center p-2 rounded-xl transition-colors duration-200 border ${
        isDark
          ? "bg-slate-800/80 border-slate-700/60 text-amber-300 hover:bg-slate-700/80 hover:text-amber-200"
          : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800 shadow-sm"
      } ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 180, scale: [0.8, 1] }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-1.5 text-xs font-semibold"
      >
        {isDark ? (
          <>
            <Sun className="size-4 text-amber-400 fill-amber-400/20" />
            <span className="hidden sm:inline text-slate-200">Light</span>
          </>
        ) : (
          <>
            <Moon className="size-4 text-indigo-600 fill-indigo-600/20" />
            <span className="hidden sm:inline text-slate-700">Dark</span>
          </>
        )}
      </motion.div>
    </motion.button>
  );
}
