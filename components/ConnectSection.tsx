import { motion } from "framer-motion";
import { unbounded } from "@/app/fonts";
import { useTranslation } from "@/hooks/useTranslation";
import SocialMediaIcons from "./SocialMediaIcons";
import { ShieldCheck } from "lucide-react";

export default function ConnectSection({ className = "" }: { className?: string }) {
    const { t } = useTranslation();

    return (
        <div className={`w-full ${className}`}>
            <div className="flex flex-col gap-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                    <div className="space-y-3">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex items-center gap-3"
                        >
                            <div className="w-10 h-1 bg-primary rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{t("connect.staySynced")}</span>
                        </motion.div>
                        <motion.h3
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className={`text-2xl md:text-4xl font-black text-foreground dark:text-white leading-tight`}
                        >
                            {t("connect.connectWith")} <span className={`text-primary italic ${unbounded.className} tracking-normal inline-block`} dir="ltr">AmbiTasker</span>
                        </motion.h3>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-6 text-[11px] font-bold text-text-hint uppercase tracking-widest bg-muted dark:bg-gray-900/50 px-6 py-3 rounded-2xl border border-border dark:border-gray-800"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            {t("connect.verifiedAccounts")}
                        </div>
                        <div className="w-px h-4 bg-gray-200 dark:bg-gray-800" />
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={14} className="text-primary" />
                            {t("connect.enterpriseSupport")}
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-center md:justify-start py-8"
                >
                    <SocialMediaIcons />
                </motion.div>
            </div>
        </div>
    );
}
