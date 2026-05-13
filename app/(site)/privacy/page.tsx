"use client";

import { motion } from "framer-motion";
import { unbounded } from "@/app/fonts";
import Link from "next/link";
import { Lock, ChevronLeft } from "lucide-react";
import ConnectSection from "@/components/ConnectSection";

export default function PrivacyPage() {
    return (
        <div className="bg-card selection:bg-primary selection:text-white">
            <section className="relative pt-32 pb-16 overflow-hidden bg-muted/50">
                <div className="absolute top-0 left-0 w-1/3 h-full bg-accent/5 blur-[120px] rounded-full -translate-y-1/2 -translate-x-1/4" />
                <div className="max-w-4xl mx-auto px-6 relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-primary mb-6 transition-colors text-sm font-bold">
                        <ChevronLeft className="w-4 h-4" /> Back to Home
                    </Link>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary text-xs font-black uppercase tracking-widest rounded-full mb-6">
                            <Lock className="w-4 h-4" /> Privacy
                        </span>
                        <h1 className={`${unbounded.className} text-4xl md:text-5xl font-black text-foreground mb-4`}>
                            Privacy Policy
                        </h1>
                        <p className="text-text-secondary font-medium">Last updated: March 1, 2026</p>
                    </motion.div>
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-4xl mx-auto px-6 prose prose-gray prose-headings:font-bold prose-headings:text-foreground prose-p:text-text-secondary prose-p:leading-relaxed prose-li:text-text-secondary">
                    <h2>1. Information We Collect</h2>
                    <p>We collect information you provide directly, including your name, email address, phone number, location, and CNIC (for providers). We also collect usage data, device information, and location data when you use our services.</p>

                    <h2>2. How We Use Your Information</h2>
                    <p>Your information is used to provide and improve our services, process bookings and payments, verify identities, communicate with you about your bookings, and ensure platform safety. We may use aggregated data for analytics.</p>

                    <h2>3. Information Sharing</h2>
                    <p>We share your information only as necessary: with service providers to fulfill bookings, with payment processors for transactions, and with legal authorities when required by law. We never sell your personal data to third parties.</p>

                    <h2>4. Data Security</h2>
                    <p>We implement industry-standard security measures including 256-bit SSL encryption, secure server infrastructure, and regular security audits. Payment information is processed through PCI-compliant payment gateways and never stored on our servers.</p>

                    <h2>5. Location Data</h2>
                    <p>With your permission, we collect location data to match you with nearby service providers, enable live tracking during service delivery, and improve our service coverage. You can disable location services at any time through your device settings.</p>

                    <h2>6. Camera & Biometric Data</h2>
                    <p>Our live image capture feature for provider verification uses your camera with explicit permission. Photos captured are used solely for identity verification purposes and are processed securely. We do not use facial recognition technology.</p>

                    <h2>7. Cookies</h2>
                    <p>We use cookies and similar technologies to enhance your browsing experience, remember your preferences, and analyze platform usage. You can manage cookie preferences through your browser settings.</p>

                    <h2>8. Your Rights</h2>
                    <p>You have the right to access, correct, or delete your personal data. You can request a copy of your data or ask for account deletion by contacting our support team. Some data may be retained for legal or operational purposes.</p>

                    <h2>9. Children's Privacy</h2>
                    <p>Our services are not intended for children under 18 years of age. We do not knowingly collect personal information from children.</p>

                    <h2>10. Changes to This Policy</h2>
                    <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a notice on our platform.</p>

                    <h2>11. Contact Us</h2>
                    <p>For privacy-related inquiries, contact our Data Protection Officer at <a href="mailto:ambitasker@gmail.com" className="text-primary font-bold hover:underline">ambitasker@gmail.com</a> or visit our <Link href="/contact" className="text-primary font-bold hover:underline">Contact Page</Link>.</p>
                </div>
            </section>

            {/* Connect Section */}
            <section className="py-24 bg-muted/50">
                <div className="max-w-4xl mx-auto px-6">
                    <ConnectSection />
                </div>
            </section>
        </div>
    );
}
