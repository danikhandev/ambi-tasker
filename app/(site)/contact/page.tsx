"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Globe, ArrowRight, CheckCircle2 } from "lucide-react";
import { unbounded } from "@/app/fonts";
import { useState } from "react";
import Link from "next/link";
import ConnectSection from "@/components/ConnectSection";

export default function ContactPage() {
    const [formStatus, setFormStatus] = useState<"idle" | "sending" | "success">("idle");
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "General Inquiry",
        message: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.name.trim()) {
            setError("Full Name is required");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError("Please enter a valid email address");
            return;
        }

        if (!formData.message.trim()) {
            setError("Message is required");
            return;
        }

        setFormStatus("sending");
        try {
            const res = await fetch("/api/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    subject: formData.subject,
                    message: formData.message,
                    category: formData.subject.toLowerCase().includes("support") ? "support" : "general"
                })
            });
            const json = await res.json();
            if (json.success) {
                setFormStatus("success");
                setFormData({ name: "", email: "", subject: "General Inquiry", message: "" });
            } else {
                throw new Error(json.error || "Failed to send message");
            }
        } catch (err: any) {
            setError(err.message);
            setFormStatus("idle");
        }
    };

    const contactInfos = [
        {
            icon: Phone,
            title: "Call Us",
            content: "+92 (300) 123-4567",
            description: "Mon-Fri from 8am to 6pm.",
            action: "tel:+923001234567",
            actionText: "Call now"
        },
        {
            icon: Mail,
            title: "Email Us",
            content: "ambitasker@gmail.com",
            description: "Our friendly team is here to help.",
            action: "mailto:ambitasker@gmail.com",
            actionText: "Send email"
        },
        {
            icon: MapPin,
            title: "Visit Us",
            content: "Blue Area, Islamabad",
            description: "Come say hello at our HQ.",
            action: "#",
            actionText: "Get directions"
        }
    ];

    return (
        <div className="bg-card selection:bg-primary selection:text-white">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden bg-muted/50">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-accent/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/4" />

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-black uppercase tracking-widest rounded-full mb-6">
                            Contact Us
                        </span>
                        <h1 className={`${unbounded.className} text-4xl md:text-6xl font-black text-foreground mb-8 leading-tight`}>
                            We're Here to <span className="text-primary italic">Help</span>.
                        </h1>
                        <p className="text-lg text-text-secondary font-medium max-w-2xl mx-auto leading-relaxed">
                            Have a question about our services or want to become a pro? Reach out and our team will get back to you within 24 hours.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-12 gap-16">
                        {/* Contact Info Sidebar */}
                        <div className="lg:col-span-4 space-y-8">
                            {contactInfos.map((info, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="p-8 bg-card rounded-[32px] border border-border shadow-sm hover:shadow-sm border border-border hover:shadow-md hover:border-primary/10 transition-all group"
                                >
                                    <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        <info.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className={`${unbounded.className} text-lg font-bold text-foreground mb-2`}>{info.title}</h3>
                                    <p className="text-foreground font-bold mb-1">{info.content}</p>
                                    <p className="text-text-secondary text-sm font-medium mb-6">{info.description}</p>
                                    <a href={info.action} className="text-primary font-bold text-sm flex items-center gap-2 group/link">
                                        {info.actionText} <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                                    </a>
                                </motion.div>
                            ))}

                            {/* Support Hours Card */}
                            <div className="p-8 bg-gray-900 rounded-[32px] text-white overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Clock className="w-5 h-5 text-primary" />
                                        <span className="text-xs font-black uppercase tracking-widest text-primary">Support Hours</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center pb-4 border-b border-white/10">
                                            <span className="text-text-hint font-medium">Monday - Friday</span>
                                            <span className="font-bold">8am - 8pm</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-4 border-b border-white/10">
                                            <span className="text-text-hint font-medium">Saturday</span>
                                            <span className="font-bold">9am - 5pm</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-text-hint font-medium">Sunday</span>
                                            <span className="text-primary font-bold">Priority Only</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-8">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="bg-card rounded-[48px] border border-border shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] p-8 md:p-6 md:p-8"
                            >
                                <div className="mb-10">
                                    <h2 className={`${unbounded.className} text-3xl font-black text-foreground mb-4`}>Send Us a Message</h2>
                                    <p className="text-text-secondary font-medium">Fill out the form below and we'll get back to you shortly.</p>
                                </div>

                                {formStatus === "success" ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="py-12 text-center"
                                    >
                                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-8 shadow-sm border border-border hover:shadow-md shadow-green-500/20">
                                            <CheckCircle2 className="w-10 h-10" />
                                        </div>
                                        <h3 className={`${unbounded.className} text-2xl font-black text-foreground mb-4`}>Message Sent!</h3>
                                        <p className="text-text-secondary font-medium max-w-sm mx-auto mb-10">
                                            Thank you for reaching out. We've received your inquiry and will contact you very soon.
                                        </p>
                                        <button
                                            onClick={() => setFormStatus("idle")}
                                            className="px-8 py-4 bg-gray-100 text-foreground font-bold rounded-2xl hover:bg-gray-200 transition-all"
                                        >
                                            Send another message
                                        </button>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-foreground ml-1">Full Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                    className="w-full px-6 py-4 rounded-2xl border border-border bg-muted focus:bg-card focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-medium"
                                                    placeholder="Ahmed Khan"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-foreground ml-1">Email Address</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                                    className="w-full px-6 py-4 rounded-2xl border border-border bg-muted focus:bg-card focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-medium"
                                                    placeholder="ahmed@gmail.com"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-foreground ml-1">Subject</label>
                                            <select
                                                value={formData.subject}
                                                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                                className="w-full px-6 py-4 rounded-2xl border border-border bg-muted focus:bg-card focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-medium appearance-none"
                                            >
                                                <option>General Inquiry</option>
                                                <option>Technical Support</option>
                                                <option>Business Partnership</option>
                                                <option>Become a Provider</option>
                                                <option>Other</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-foreground ml-1">Your Message</label>
                                            <textarea
                                                required
                                                rows={6}
                                                value={formData.message}
                                                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                                className="w-full px-6 py-4 rounded-2xl border border-border bg-muted focus:bg-card focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-medium resize-none"
                                                placeholder="Tell us how we can help..."
                                            />
                                        </div>

                                        {error && (
                                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-semibold flex items-center gap-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                                <span>{error}</span>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={formStatus === "sending"}
                                            className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg hover:bg-primary-dark hover:shadow-md border border-border/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {formStatus === "sending" ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    Send Message
                                                    <Send className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Map/Location Section */}
            <section className="py-24 bg-muted/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="h-[400px] bg-card rounded-[48px] border border-border overflow-hidden relative shadow-sm">
                        {/* Mock map representation */}
                        <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
                            <div className="text-center group cursor-pointer">
                                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white mb-4 animate-bounce shadow-md border border-border/50 hover:shadow-lg shadow-primary/40 relative z-10 mx-auto">
                                    <MapPin className="w-8 h-8" />
                                </div>
                                <div className="px-6 py-2 bg-card rounded-full shadow-lg border border-gray-50 font-black text-sm text-foreground group-hover:scale-105 transition-transform">
                                    AmbiTasker HQ, Islamabad
                                </div>
                            </div>
                        </div>
                        {/* Decorative grid */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(#2563EB 0.5px, transparent 0.5px)", backgroundSize: "24px 24px" }} />
                    </div>
                </div>
            </section>

            {/* Connect Section */}
            <section className="py-24 bg-card">
                <div className="max-w-7xl mx-auto px-6">
                    <ConnectSection />
                </div>
            </section>
        </div>
    );
}
