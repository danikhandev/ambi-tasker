"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { unbounded } from '@/app/fonts';
import { 
  X, 
  Download, 
  Printer, 
  ShieldCheck, 
  Calendar, 
  User, 
  Briefcase, 
  MapPin, 
  CreditCard,
  Hash
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import Logo from '../ui/Logo';

interface BookingSlipProps {
  slip: {
    slipNumber: string;
    generatedAt: string;
    serviceTitle: string;
    providerName: string;
    consumerName: string;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    serviceDate: string;
    bookingId: string;
  };
  onClose: () => void;
}

const BookingSlip: React.FC<BookingSlipProps> = ({ slip, onClose }) => {
  const { t, isRTL } = useTranslation();

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
      >
        {/* Actions Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 flex items-center gap-2"
            >
              <Printer size={18} />
              <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Print</span>
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 flex items-center gap-2"
              onClick={() => {
                  // Simple mock download
                  alert("Slip download initiated (PDF generation would happen here)");
              }}
            >
              <Download size={18} />
              <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Download</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-400"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-12 print:p-0" id="printable-slip">
          <div className="max-w-md mx-auto print:max-w-full">
            {/* Logo & Header */}
            <div className="text-center mb-10">
              <div className="flex justify-center mb-6">
                <Logo size="lg" />
              </div>
              <h2 className={`${unbounded.className} text-2xl font-black text-gray-900`}>Ambi Tasker <span className="text-primary italic">Receipt</span>.</h2>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Professional Service Marketplace</p>
            </div>

            {/* Slip Meta */}
            <div className="flex justify-between items-center mb-10 p-4 bg-gray-50 rounded-2xl border border-gray-100">
               <div>
                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Receipt No</p>
                 <p className="text-xs font-bold text-gray-900">{slip.slipNumber}</p>
               </div>
               <div className="text-right">
                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Issue Date</p>
                 <p className="text-xs font-bold text-gray-900">{new Date(slip.generatedAt).toLocaleDateString()}</p>
               </div>
            </div>

            {/* Service & Provider */}
            <div className="space-y-6 mb-10">
               <div className="flex gap-4">
                 <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-gray-400 flex-shrink-0">
                   <Briefcase size={18} />
                 </div>
                 <div>
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Service Rendered</p>
                   <p className="text-sm font-bold text-gray-900">{slip.serviceTitle}</p>
                 </div>
               </div>

               <div className="flex gap-4">
                 <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-gray-400 flex-shrink-0">
                   <User size={18} />
                 </div>
                 <div className="flex-1 grid grid-cols-2">
                   <div>
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Provider</p>
                     <p className="text-sm font-bold text-gray-900">{slip.providerName}</p>
                   </div>
                   <div>
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Consumer</p>
                     <p className="text-sm font-bold text-gray-900">{slip.consumerName}</p>
                   </div>
                 </div>
               </div>

               <div className="flex gap-4">
                 <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-gray-400 flex-shrink-0">
                   <Calendar size={18} />
                 </div>
                 <div>
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Execution Date</p>
                   <p className="text-sm font-bold text-gray-900">{new Date(slip.serviceDate).toLocaleString()}</p>
                 </div>
               </div>
            </div>

            {/* Financial Summary */}
            <div className="border-t-2 border-dashed border-gray-100 pt-8 mb-8">
               <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-500 font-medium">Service Fee</span>
                  <span className="font-bold text-gray-900">Rs. {slip.totalAmount}</span>
               </div>
               <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-500 font-medium">Tax & Platform Fee</span>
                  <span className="font-bold text-gray-900">Included</span>
               </div>
               <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                  <span className={`${unbounded.className} text-sm font-black text-gray-900 uppercase`}>Total Paid</span>
                  <span className={`${unbounded.className} text-xl font-black text-primary`}>Rs. {slip.totalAmount}</span>
               </div>
            </div>

            {/* Payment Meta */}
            <div className="grid grid-cols-2 gap-4 mb-10">
               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <CreditCard size={10} /> Method
                  </p>
                  <p className="text-xs font-bold text-gray-900">{slip.paymentMethod}</p>
               </div>
               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <ShieldCheck size={10} /> Status
                  </p>
                  <p className={`text-xs font-black uppercase italic ${slip.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {slip.paymentStatus}
                  </p>
               </div>
            </div>

            {/* Footer */}
            <div className="text-center">
               <p className="text-[10px] text-gray-400 font-medium mb-1">Generated electronically by Ambi Tasker Grid.</p>
               <p className="text-[10px] text-gray-300">Reference: {slip.bookingId}</p>
            </div>
          </div>
        </div>

        {/* Brand Footer */}
        <div className="p-4 text-center bg-gray-900">
           <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Thank you for your trust</p>
        </div>
      </motion.div>

      {/* CSS for printing */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-slip, #printable-slip * {
            visibility: visible;
          }
          #printable-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default BookingSlip;
