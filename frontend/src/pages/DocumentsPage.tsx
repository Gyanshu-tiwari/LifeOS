import React, { useState } from 'react';
import { useLifeOS } from '../context/LifeOSContext';
import {
  FileText,
  FileCheck2,
  FileX,
  FileUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Download,
  ShieldCheck,
  X,
  UploadCloud,
  File,
} from 'lucide-react';
import { LifeOSButton } from '../components/ui/LifeOSButton';
import { LifeOSModal } from '../components/ui/LifeOSModal';
import { LifeOSBadge } from '../components/ui/LifeOSBadge';
import { LifeOSEmptyState } from '../components/ui/LifeOSEmptyState';

export const DocumentsPage: React.FC = () => {
  const { documents, uploadDocument, deleteDocument, showToast } = useLifeOS();

  const [activeTab, setActiveTab] = useState<'all' | 'verified' | 'missing'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Upload Form State
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Financial Aid');
  const [docRequiredFor, setDocRequiredFor] = useState('Hostel Fee Subsidy & Concession');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const verifiedDocs = documents.filter((d) => d.status === 'verified');
  const missingDocs = documents.filter((d) => d.status === 'missing');

  const filteredDocs = documents.filter((d) => {
    if (activeTab === 'verified') return d.status === 'verified';
    if (activeTab === 'missing') return d.status === 'missing';
    return true;
  });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;

    setIsUploading(true);
    setUploadProgress(25);

    setTimeout(async () => {
      setUploadProgress(75);
      setTimeout(async () => {
        setUploadProgress(100);
        await uploadDocument({
          title: docTitle.trim(),
          category: docCategory,
          fileName: selectedFile ? selectedFile.name : `${docTitle.toLowerCase().replace(/\s+/g, '_')}.pdf`,
          requiredFor: docRequiredFor,
          file: selectedFile || undefined,
        });
        setIsUploading(false);
        setUploadProgress(0);
        setDocTitle('');
        setSelectedFile(null);
        setShowUploadModal(false);
      }, 300);
    }, 300);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#1E60F2] uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Document Agent Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
            Documents & Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Official papers audited by Document Agent for college admission, hostel allotment, and state waivers.
          </p>
        </div>

        <LifeOSButton
          onClick={() => setShowUploadModal(true)}
          variant="primary"
          size="md"
          leftIcon={<FileUp className="w-4 h-4" />}
        >
          Upload Document
        </LifeOSButton>
      </div>

      {/* Integration Boundary Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-blue-50/70 border border-blue-100 flex items-start gap-3.5 shadow-soft-sm">
        <ShieldCheck className="w-5 h-5 text-[#1E60F2] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-bold text-slate-900">
            Document Agent Architecture:
          </span>{' '}
          Documents are processed in client-side state with full REST upload boundaries defined. In real API mode, Document Agent verifies government watermarks, QR codes, and digital certificates via Vision LLM.
        </div>
      </div>

      {/* Status Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Required</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">{documents.length}</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase">Verified</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{verifiedDocs.length}</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase">Missing / Required</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{missingDocs.length}</p>
        </div>
      </div>

      {/* Missing Documents Alert Banner */}
      {missingDocs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>Missing Mandatory Documents</span>
          </h2>

          <div className="space-y-3">
            {missingDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-5 sm:p-6 rounded-3xl bg-amber-50/70 border border-amber-200/90 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm sm:text-base font-bold text-slate-800">{doc.title}</h3>
                    <LifeOSBadge variant="warning">Action Required</LifeOSBadge>
                  </div>
                  <p className="text-xs text-slate-600">{doc.requiredFor}</p>
                  <p className="text-[11.5px] text-amber-800 font-semibold mt-1">
                    ⚠️ Hard Cutoff: Aug 14 (College hostel registration portal closing date)
                  </p>
                </div>

                <LifeOSButton
                  onClick={() => {
                    setDocTitle(doc.title);
                    setShowUploadModal(true);
                  }}
                  variant="primary"
                  size="sm"
                  leftIcon={<FileUp className="w-3.5 h-3.5" />}
                  className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
                >
                  Upload This Document
                </LifeOSButton>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {(['all', 'verified', 'missing'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
              activeTab === tab
                ? 'bg-[#1E60F2] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab === 'all' ? `All Documents (${documents.length})` : tab}
          </button>
        ))}
      </div>

      {/* Document Grid */}
      {filteredDocs.length === 0 ? (
        <LifeOSEmptyState
          icon={FileText}
          title="No documents in this view"
          description="You are all caught up on document requirements."
          actionLabel="Upload Document"
          onAction={() => setShowUploadModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                    {doc.category}
                  </span>
                  <LifeOSBadge variant={doc.status === 'verified' ? 'success' : 'warning'}>
                    {doc.status}
                  </LifeOSBadge>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-1">
                  {doc.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">{doc.requiredFor}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="truncate max-w-[220px]">
                  {doc.fileName ? `File: ${doc.fileName} (${doc.fileSize})` : 'Awaiting upload from user'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    aria-label="Delete document"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal with Drag and Drop */}
      <LifeOSModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Verification Document"
        subtitle="Document Agent will parse and verify validity for admissions."
        footer={
          <>
            <LifeOSButton
              variant="outline"
              size="sm"
              onClick={() => setShowUploadModal(false)}
            >
              Cancel
            </LifeOSButton>
            <LifeOSButton
              variant="primary"
              size="sm"
              isLoading={isUploading}
              onClick={handleUploadSubmit}
            >
              Confirm & Verify
            </LifeOSButton>
          </>
        }
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Document Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="E.g. Income Certificate (Tehsildar signed)"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Category
            </label>
            <select
              value={docCategory}
              onChange={(e) => setDocCategory(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none"
            >
              <option value="Financial Aid">Financial Aid & Scholarship</option>
              <option value="Government ID">Government ID (Aadhaar/PAN)</option>
              <option value="Academic">Academic (Offer Letter, Marksheet)</option>
              <option value="Housing">Housing Application</option>
            </select>
          </div>

          {/* Drag & Drop Box */}
          <label className="border-2 border-dashed border-blue-300 bg-blue-50/40 rounded-2xl p-6 text-center text-xs text-slate-500 hover:bg-blue-50/70 transition-colors flex flex-col items-center justify-center cursor-pointer">
            <UploadCloud className="w-8 h-8 text-[#1E60F2] mb-2" />
            <span className="font-bold text-slate-800">
              {selectedFile ? selectedFile.name : 'Choose PDF or Scanned Document'}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Accepted: PDF, PNG, JPG up to 15MB</p>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
          </label>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Document Agent Verification</span>
                <span className="text-[#1E60F2] font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-[#1E60F2] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </form>
      </LifeOSModal>
    </div>
  );
};
