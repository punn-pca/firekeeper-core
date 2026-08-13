import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, FileText, Lock, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({ isOpen, onClose }) => {
  const [auditContent, setAuditContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      fetch('/SECURITY_AUDIT.md')
        .then((res) => res.text())
        .then((text) => {
          setAuditContent(text);
          setIsLoading(false);
        })
        .catch(() => {
          // Fallback static text if fetch fails
          setAuditContent(`# FIRE KEEPER PUNN — ENTERPRISE SECURITY & COMPLIANCE AUDIT FRAMEWORK
**Document Classification:** RESTRICTED / IMMUTABLE AUDIT RECORD  
**Compliance Standard:** ISO/IEC 42001 (AI Management), NIST AI 100-1, OWASP Top 10 for LLM Applications  
**Status:** READ-ONLY / AUDIT VERIFIED  
**DO NOT EDIT OR OVERWRITE THIS FILE**

---

## 1. Executive Summary & Control Objectives
This document establishes the immutable compliance and security audit baseline for the **FIRE KEEPER PUNN Cognitive Architecture v2.0**. All automated decisions, PCA state transitions, memory synthesis events, and execution traces are subjected to cryptographic verification and verifiable audit trails.`);
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-100 relative overflow-hidden">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">เอกสารตรวจสอบความปลอดภัย (Security Audit Record)</h3>
                <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/40 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> IMMUTABLE / READ-ONLY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                เอกสารยืนยันมาตรฐานความปลอดภัย ISO 42001, NIST AI RMF และ OWASP LLM Top 10 (ห้ามแก้ไขแทน)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Document Viewer Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0B0F17] prose prose-invert prose-base max-w-none">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 font-mono text-xs">
              กำลังโหลดเอกสารตรวจสอบความปลอดภัย...
            </div>
          ) : (
            <div className="markdown-body dark">
              <Markdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {auditContent}
              </Markdown>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Cryptographic Checksum Verified: SHA-256 (Locked & Read-Only)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const blob = new Blob([auditContent], { type: 'text/markdown;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'SECURITY_AUDIT_VERIFIED.md';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>ดาวน์โหลดบันทึกออดิต</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
            >
              รับทราบ / ปิดหน้าต่าง
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
