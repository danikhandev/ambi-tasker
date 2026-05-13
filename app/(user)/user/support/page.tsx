"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft, ChevronDown, ChevronRight,
    MessageCircle, Phone, Mail, FileText,
    HelpCircle, ShieldCheck, AlertTriangle,
    Headphones, BookOpen, Send, CheckCircle2,
    Search, Zap, Star, Clock, ExternalLink,
} from "lucide-react";
import { unbounded } from "@/app/fonts";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ConnectSection from "@/components/ConnectSection";

const FAQ_ITEMS = [
    {
        q: "How do I book a service?",
        a: "Search for a service, select a provider, choose your preferred date/time, set your location, select payment method, and confirm your booking. It takes less than 2 minutes!",
        category: "booking",
    },
    {
        q: "How are service providers verified?",
        a: "All providers go through a comprehensive verification process including CNIC verification, skill assessment, background check, and live image capture before each service.",
        category: "safety",
    },
    {
        q: "What payment methods are accepted?",
        a: "We accept Cash on Service, JazzCash, Easypaisa, and debit/credit cards. All online transactions are secured with 256-bit encryption.",
        category: "payment",
    },
    {
        q: "Can I cancel my booking?",
        a: "Yes, you can cancel a booking before the provider starts the journey. Cancellation is free if done at least 30 minutes before the scheduled time.",
        category: "booking",
    },
    {
        q: "What if I'm not satisfied with the service?",
        a: "You can raise a dispute within 24 hours of service completion. Our support team will review your case and provide a resolution, including a possible refund or redo.",
        category: "safety",
    },
    {
        q: "How do I track my provider?",
        a: "After a provider accepts your booking, you can track them in real-time on the tracking screen. You'll see their live location, ETA, and contact options.",
        category: "booking",
    },
    {
        q: "Are prices negotiable?",
        a: "Standard prices are set by providers. However, you can send a custom price offer for custom requests. The provider may accept, counter, or decline.",
        category: "payment",
    },
    {
        q: "How do I become a service provider?",
        a: "Register as a provider through 'Become a Pro' on the homepage. Complete your profile, submit verification documents, and pass the review process.",
        category: "general",
    },
];

const TICKET_CATEGORIES = [
    { id: "booking", label: "Booking Issue", icon: FileText, color: "bg-blue-50 text-blue-600" },
    { id: "payment", label: "Payment Problem", icon: AlertTriangle, color: "bg-red-50 text-red-600" },
    { id: "provider", label: "Provider Complaint", icon: ShieldCheck, color: "bg-amber-50 text-amber-600" },
    { id: "general", label: "General Query", icon: HelpCircle, color: "bg-green-50 text-green-600" },
];

export default function SupportPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"faq" | "ticket">("faq");
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [faqFilter, setFaqFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Ticket form
    const [ticketCategory, setTicketCategory] = useState("");
    const [ticketSubject, setTicketSubject] = useState("");
    const [ticketMessage, setTicketMessage] = useState("");
    const [ticketStatus, setTicketStatus] = useState<"idle" | "sending" | "success">("idle");

    const filteredFaqs = FAQ_ITEMS.filter((item) => {
        const matchesFilter = faqFilter === "all" || item.category === faqFilter;
        const matchesSearch =
            item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.a.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const handleSubmitTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setTicketStatus("sending");
        try {
            const res = await fetch("/api/support/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: ticketCategory,
                    subject: ticketSubject,
                    message: ticketMessage
                })
            });
            const json = await res.json();
            if (json.success) {
                setTicketStatus("success");
                setTicketCategory("");
                setTicketSubject("");
                setTicketMessage("");
            } else {
                throw new Error(json.error);
            }
        } catch (err: any) {
            console.error("Ticket submission failed:", err);
            setTicketStatus("idle");
        }
    };

    return (
        <div className="min-h-screen bg-background p-6 lg:p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 bg-card rounded-xl border border-border flex items-center justify-center text-text-secondary hover:text-primary hover:bg-primary/5 transition-all group shadow-sm hover:shadow-md transition-all duration-300"
                    >
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div>
                        <h1 className={`${unbounded.className} text-3xl font-black text-foreground`}>Help & Support</h1>
                        <p className="text-text-secondary font-medium mt-1">Get help with your bookings, payments, and account</p>
                    </div>
                </div>

                {/* Quick Contact Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[
                        { icon: Phone, label: "Call Us", value: "+92 300 123 4567", action: "tel:+923001234567", color: "bg-green-50 text-green-600 border-green-100" },
                        { icon: Mail, label: "Email Us", value: "ambitasker@gmail.com", action: "mailto:ambitasker@gmail.com", color: "bg-blue-50 text-blue-600 border-blue-100" },
                        { icon: MessageCircle, label: "Live Chat", value: "Available 9AM-8PM", action: "#", color: "bg-purple-50 text-purple-600 border-purple-100" },
                    ].map((item, i) => (
                        <motion.a
                            key={i}
                            href={item.action}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`p-5 rounded-[24px] border ${item.color} flex items-center gap-4 hover:shadow-lg transition-all group`}
                        >
                            <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center group-hover:scale-110 transition-transform">
                                <item.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold text-foreground">{item.label}</p>
                                <p className="text-sm font-medium text-text-secondary">{item.value}</p>
                            </div>
                            <ExternalLink className="w-4 h-4 ml-auto text-text-disabled group-hover:text-text-secondary transition-colors" />
                        </motion.a>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 bg-card rounded-2xl p-1.5 border border-border w-fit shadow-sm hover:shadow-md transition-all duration-300">
                    {[
                        { key: "faq" as const, label: "FAQs", icon: BookOpen },
                        { key: "ticket" as const, label: "Submit Ticket", icon: Send },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.key
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "text-text-secondary hover:text-foreground hover:bg-muted"
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* FAQ Tab */}
                    {activeTab === "faq" && (
                        <motion.div
                            key="faq"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {/* Search & Filter */}
                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-hint" />
                                    <input
                                        type="text"
                                        placeholder="Search for help..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all font-medium shadow-sm hover:shadow-md transition-all duration-300"
                                    />
                                </div>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                    {[
                                        { key: "all", label: "All" },
                                        { key: "booking", label: "Booking" },
                                        { key: "payment", label: "Payment" },
                                        { key: "safety", label: "Safety" },
                                        { key: "general", label: "General" },
                                    ].map((f) => (
                                        <button
                                            key={f.key}
                                            onClick={() => setFaqFilter(f.key)}
                                            className={`px-4 py-3 text-sm font-bold rounded-xl whitespace-nowrap transition-all ${faqFilter === f.key
                                                ? "bg-gray-900 text-white"
                                                : "bg-card text-text-secondary border border-border hover:bg-muted"
                                                }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                {filteredFaqs.map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="bg-card rounded-[20px] border border-border overflow-hidden hover:shadow-md transition-all"
                                    >
                                        <button
                                            onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                                            className="w-full p-5 flex items-center justify-between text-left group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0">
                                                    <HelpCircle className="w-5 h-5" />
                                                </div>
                                                <span className="font-bold text-foreground group-hover:text-primary transition-colors">{item.q}</span>
                                            </div>
                                            <ChevronDown
                                                className={`w-5 h-5 text-text-hint flex-shrink-0 ml-4 transition-transform ${expandedFaq === i ? "rotate-180" : ""}`}
                                            />
                                        </button>
                                        <AnimatePresence>
                                            {expandedFaq === i && (
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: "auto" }}
                                                    exit={{ height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-5 pb-5 pl-19 ml-14">
                                                        <p className="text-text-secondary font-medium leading-relaxed">{item.a}</p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}

                                {filteredFaqs.length === 0 && (
                                    <div className="py-16 text-center bg-card rounded-[24px] border border-dashed border-border">
                                        <Search className="w-10 h-10 text-text-disabled mx-auto mb-3" />
                                        <p className="font-bold text-foreground">No results found</p>
                                        <p className="text-text-secondary text-sm mt-1">Try different keywords</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Submit Ticket Tab */}
                    {activeTab === "ticket" && (
                        <motion.div
                            key="ticket"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {ticketStatus === "success" ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-card rounded-[32px] border border-border p-6 md:p-8 text-center max-w-lg mx-auto"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", delay: 0.2 }}
                                        className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-border hover:shadow-md shadow-green-500/20"
                                    >
                                        <CheckCircle2 className="w-10 h-10 text-white" />
                                    </motion.div>
                                    <h3 className={`${unbounded.className} text-2xl font-black text-foreground mb-3`}>Ticket Submitted!</h3>
                                    <p className="text-text-secondary font-medium mb-2">
                                        Your support ticket has been created. Our team will respond within 24 hours.
                                    </p>
                                    <p className="text-primary font-bold text-sm mb-8">Ticket ID: TK-{Math.random().toString(36).substring(2, 8).toUpperCase()}</p>
                                    <button
                                        onClick={() => setTicketStatus("idle")}
                                        className="px-8 py-3 bg-gray-100 text-foreground font-bold rounded-xl hover:bg-gray-200 transition-all"
                                    >
                                        Submit Another Ticket
                                    </button>
                                </motion.div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2">
                                        <form onSubmit={handleSubmitTicket} className="bg-card rounded-[32px] border border-border p-8 space-y-6">
                                            <div>
                                                <h2 className={`${unbounded.className} text-xl font-bold text-foreground mb-1`}>Submit a Support Ticket</h2>
                                                <p className="text-text-secondary text-sm font-medium">Describe your issue and we&apos;ll resolve it ASAP</p>
                                            </div>

                                            {/* Category Selection */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-foreground ml-1">Issue Category</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {TICKET_CATEGORIES.map((cat) => (
                                                        <button
                                                            type="button"
                                                            key={cat.id}
                                                            onClick={() => setTicketCategory(cat.id)}
                                                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${ticketCategory === cat.id
                                                                ? "border-primary bg-primary/5"
                                                                : "border-border hover:border-border"
                                                                }`}
                                                        >
                                                            <div className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center`}>
                                                                <cat.icon className="w-5 h-5" />
                                                            </div>
                                                            <span className="font-bold text-sm text-foreground">{cat.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-foreground ml-1">Subject</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={ticketSubject}
                                                    onChange={(e) => setTicketSubject(e.target.value)}
                                                    placeholder="Brief description of your issue"
                                                    className="w-full px-5 py-4 rounded-xl border border-border bg-muted focus:bg-card focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all font-medium"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-foreground ml-1">Detailed Description</label>
                                                <textarea
                                                    required
                                                    rows={5}
                                                    value={ticketMessage}
                                                    onChange={(e) => setTicketMessage(e.target.value)}
                                                    placeholder="Provide all relevant details about your issue..."
                                                    className="w-full px-5 py-4 rounded-xl border border-border bg-muted focus:bg-card focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all font-medium resize-none"
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={ticketStatus === "sending" || !ticketCategory || !ticketSubject || !ticketMessage}
                                                className="w-full py-4 bg-primary text-white rounded-xl font-black text-lg hover:bg-primary/90 hover:shadow-sm border border-border hover:shadow-md hover:shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95 transition-all duration-200"
                                            >
                                                {ticketStatus === "sending" ? (
                                                    <>
                                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                        Submitting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-5 h-5" />
                                                        Submit Ticket
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    </div>

                                    {/* Sidebar Info */}
                                    <div className="space-y-6">
                                        <div className="bg-gray-900 rounded-[28px] p-6 text-white relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 blur-3xl -translate-y-1/2 translate-x-1/2" />
                                            <div className="relative z-10">
                                                <Headphones className="w-8 h-8 text-primary mb-4" />
                                                <h3 className={`${unbounded.className} text-lg font-bold mb-2`}>Need Urgent Help?</h3>
                                                <p className="text-white/60 text-sm mb-6">For time-sensitive issues, our priority line is available Mon-Sat.</p>
                                                <a href="tel:+923001234567" className="block w-full py-3 bg-card text-foreground text-sm font-bold rounded-xl text-center hover:bg-gray-100 transition-all shadow-sm hover:shadow-md transition-all duration-300">
                                                    Call Priority Line
                                                </a>
                                            </div>
                                        </div>

                                        <div className="bg-card rounded-[28px] border border-border p-6">
                                            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-primary" />
                                                Response Times
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-text-secondary font-medium">Email Support</span>
                                                    <span className="font-bold text-foreground">Within 24 hours</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-text-secondary font-medium">Live Chat</span>
                                                    <span className="font-bold text-primary">~5 minutes</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-text-secondary font-medium">Phone Support</span>
                                                    <span className="font-bold text-foreground">Immediate</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Connect Section */}
                <div className="mt-16 pt-16 border-t border-border">
                    <ConnectSection />
                </div>
            </div>
        </div>
    );
}
