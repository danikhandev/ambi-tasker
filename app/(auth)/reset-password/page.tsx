"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Loader2, ShieldCheck, Mail } from "lucide-react";
import { unbounded } from "@/app/fonts";

function ResetPasswordContent() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // Check password strength
  useEffect(() => {
    setPasswordStrength({
      hasMinLength: formData.newPassword.length >= 8,
      hasNumber: true,
      hasSpecialChar: true,
    });
  }, [formData.newPassword]);

  const isPasswordValid =
    passwordStrength.hasMinLength;

  const isFormValid =
    formData.otp.length === 6 &&
    isPasswordValid &&
    formData.newPassword === formData.confirmPassword;

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/user/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset code");
      }

      setSuccess("Reset code sent! Please check your email.");
      setTimeout(() => {
        setStep("reset");
        setSuccess("");
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (formData.otp.length !== 6) {
        throw new Error("Please enter a valid 6-digit code");
      }

      if (!isPasswordValid) {
        throw new Error("Password does not meet security requirements");
      }

      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const response = await fetch("/api/user/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Password reset failed");
      }

      setSuccess("Password reset successfully! Redirecting to login...");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-background via-primary/5 to-secondary/5 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-40 -right-20 w-96 h-96 bg-secondary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-card/80 backdrop-blur-lg rounded-2xl shadow-md border border-border/50 hover:shadow-lg border border-primary/10 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary to-secondary p-8 text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="mx-auto w-16 h-16 bg-card/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h1 className={`${unbounded.className} text-3xl md:text-4xl font-bold text-white mb-2`}>
                Reset Password
              </h1>
              <p className="text-white/90 text-sm">
                {step === "email"
                  ? "Enter your email to receive a reset code"
                  :`Enter the code sent to ${formData.email}`}
              </p>
            </motion.div>
          </div>

          {/* Form Container */}
          <div className="p-8">
            {step === "email" ? (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                onSubmit={handleSendResetCode}
                className="space-y-6"
              >
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text/40" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-primary/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-card"
                      placeholder="john@gmail.com"
                    />
                  </div>
                </div>

                {/* Error/Success Messages */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm"
                    >
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      <span>{success}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      Send Reset Code
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {/* Back to Login Link */}
                <div className="text-center pt-4 border-t border-primary/10">
                  <p className="text-text/70 text-sm">
                    Remember your password?{" "}
                    <Link
                      href="/login"
                      className="text-primary hover:text-primary/80 transition-colors font-semibold"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </motion.form>
            ) : (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                onSubmit={handleResetPassword}
                className="space-y-6"
              >
                {/* OTP Input */}
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-2">
                    Verification Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 6) {
                          setFormData({ ...formData, otp: value });
                        }
                      }}
                      maxLength={6}
                      required
                      className="w-full px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] rounded-xl border border-primary/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-card"
                      placeholder="000000"
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* New Password Input */}
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text/40" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      required
                      className="w-full pl-12 pr-12 py-3 rounded-xl border border-primary/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-card"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text/40 hover:text-text/60 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password Strength Indicators */}
                  {formData.newPassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 space-y-1"
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <div
                          className={`w-2 h-2 rounded-full ${passwordStrength.hasMinLength ? "bg-green-500" : "bg-gray-300"
                            }`}
                        />
                        <span className={passwordStrength.hasMinLength ? "text-green-700" : "text-text/60"}>
                          At least 8 characters
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text/40" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      className="w-full pl-12 pr-12 py-3 rounded-xl border border-primary/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-card"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text/40 hover:text-text/60 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2"
                    >
                      {formData.newPassword === formData.confirmPassword ? (
                        <div className="flex items-center gap-2 text-xs text-green-700">
                          <CheckCircle2 className="w-4 h-4" />
                          Passwords match
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-red-700">
                          <AlertCircle className="w-4 h-4" />
                          Passwords do not match
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Error/Success Messages */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm"
                    >
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      <span>{success}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !isFormValid}
                  className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {/* Back to Login Link */}
                <div className="text-center pt-4 border-t border-primary/10">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setFormData({ ...formData, otp: "", newPassword: "", confirmPassword: "" });
                      setError("");
                      setSuccess("");
                    }}
                    className="text-text/60 hover:text-primary transition-colors text-sm"
                  >
                    ← Use a different email
                  </button>
                </div>
              </motion.form>
            )}
          </div>
        </div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6"
        >
          <Link
            href="/"
            className="text-text/60 hover:text-primary transition-colors text-sm"
          >
            ← Back to homepage
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/5">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
