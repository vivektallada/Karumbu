import { motion } from "framer-motion";

export const MaskedLines = ({ lines, className = "", delay = 0 }) => (
  <span className={className}>
    {lines.map((line, i) => (
      <span key={i} className="block overflow-hidden pb-[0.08em]">
        <motion.span
          className="block"
          initial={{ y: "115%" }}
          animate={{ y: "0%" }}
          transition={{ duration: 0.9, delay: delay + i * 0.14, ease: [0.16, 1, 0.3, 1] }}
        >
          {line}
        </motion.span>
      </span>
    ))}
  </span>
);
