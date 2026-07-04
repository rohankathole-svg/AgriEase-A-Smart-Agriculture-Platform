import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

export default function PremiumLoader({ label = "Loading dashboard", role = "farmer" }) {
  const { t } = useLanguage();

  return (
    <div className={`premium-loader premium-loader--${role}`} role="status" aria-live="polite">
      <motion.div
        className="premium-loader__orb"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      >
        <motion.div
          className="premium-loader__leaf"
          animate={{ scale: [1, 1.06, 1], rotate: [0, -4, 2, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          🌿
        </motion.div>
      </motion.div>
      <div className="premium-loader__copy">
        <strong>{label}</strong>
        <span>{t("loader.preparingWorkspace")}</span>
      </div>
    </div>
  );
}
