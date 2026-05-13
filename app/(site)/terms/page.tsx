"use client";

import { motion } from "framer-motion";
import { unbounded } from "@/app/fonts";
import Link from "next/link";
import { ShieldCheck, ChevronLeft } from "lucide-react";
import ConnectSection from "@/components/ConnectSection";

export default function TermsPage() {
    return (
        <div className="bg-card selection:bg-primary selection:text-white">
            <section className="relative pt-32 pb-16 overflow-hidden bg-muted/50">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4" />
                <div className="max-w-4xl mx-auto px-6 relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-primary mb-6 transition-colors text-sm font-bold">
                        <ChevronLeft className="w-4 h-4" /> Back to Home
                    </Link>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary text-xs font-black uppercase tracking-widest rounded-full mb-6">
                            <ShieldCheck className="w-4 h-4" /> Legal
                        </span>
                        <h1 className={`${unbounded.className} text-4xl md:text-5xl font-black text-foreground mb-4`}>
                            Terms of Service
                        </h1>
                        <p className="text-text-secondary font-medium">Last updated: March 1, 2026</p>
                    </motion.div>
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-4xl mx-auto px-6 prose prose-gray prose-headings:font-bold prose-headings:text-foreground prose-p:text-text-secondary prose-p:leading-relaxed prose-li:text-text-secondary">
                    <h2>1. Acceptance of Terms</h2>
                    <p>By accessing and using AmbiTasker (&ldquo;the Platform&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. These terms apply to all visitors, users, service providers, and others who access the platform.</p>

                    <h2>2. Description of Service</h2>
                    <p>AmbiTasker is a platform that connects customers with verified service providers for home and professional services across Pakistan. We facilitate bookings, payments, and communication between customers and providers. AmbiTasker does not itself perform any services but acts as an intermediary.</p>

                    <h2>3. User Registration</h2>
                    <p>To use certain features of the platform, you must register and create an account. You agree to provide accurate, current, and complete information during the registration process, and to update such information as necessary. You are responsible for maintaining the confidentiality of your password and account.</p>

                    <h2>4. Service Provider Terms</h2>
                    <p>Service providers on our platform must complete identity verification including CNIC verification, skill assessment, and live image capture. Providers are independent contractors and not employees of AmbiTasker. They are responsible for the quality of their work and compliance with local regulations.</p>

                    <h2>5. Booking & Payment</h2>
                    <p>All bookings made through the platform are subject to provider availability. Prices displayed are indicative and may vary based on the scope of work. We accept cash payments and online payments via JazzCash, Easypaisa, and debit/credit cards. Cancellation policies apply as specified at the time of booking.</p>

                    <h2>6. User Conduct</h2>
                    <p>Users agree not to misuse the platform, harass service providers, provide false information, or engage in any illegal activity. AmbiTasker reserves the right to suspend or terminate accounts that violate these terms.</p>

                    <h2>7. Limitation of Liability</h2>
                    <p>AmbiTasker acts as a marketplace and is not liable for the quality of services provided by third-party providers. We do not guarantee the accuracy of provider information. Our liability is limited to the fees paid through our platform.</p>

                    <h2>8. Dispute Resolution</h2>
                    <p>In case of disputes between customers and providers, AmbiTasker will act as a mediator. Users can raise disputes within 24 hours of service completion through the support section. Our decision on disputes is final.</p>

                    <h2>9. Changes to Terms</h2>
                    <p>AmbiTasker reserves the right to modify these terms at any time. Changes will be communicated via email or platform notifications. Continued use after changes constitutes acceptance of the new terms.</p>

                    <h2>10. Contact</h2>
                    <p>For questions about these Terms of Service, please contact us at <a href="mailto:ambitasker@gmail.com" className="text-primary font-bold hover:underline">ambitasker@gmail.com</a> or visit our <Link href="/contact" className="text-primary font-bold hover:underline">Contact Page</Link>.</p>
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
