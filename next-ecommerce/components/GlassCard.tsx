import { motion } from 'framer-motion';

export function GlassCard({ title, description }: { title: string; description: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_35px_120px_-45px_rgba(56,189,248,0.6)] backdrop-blur-xl"
    >
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mt-4 text-sm leading-7 text-slate-300">{description}</p>
    </motion.div>
  );
}
