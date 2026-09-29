import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLifeOS } from '../context/LifeOSContext';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Wallet,
  Clock,
  Car,
  CheckCircle2,
  FileUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Compass,
  AlertCircle,
  Sliders,
  Check,
  Trash2,
} from 'lucide-react';
import { ProgressBar } from '../components/dashboard/ProgressBar';
import { TaskItem } from '../components/dashboard/TaskItem';
import { LifeOSButton } from '../components/ui/LifeOSButton';
import { LifeOSModal } from '../components/ui/LifeOSModal';
import { LifeOSBadge } from '../components/ui/LifeOSBadge';

export const GoalDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    goals,
    tasks,
    documents,
    plan,
    toggleTask,
    uploadDocument,
    updateGoal,
    showToast,
  } = useLifeOS();

  const [activeTab, setActiveTab] = useState<'overview' | 'plan' | 'tasks' | 'documents' | 'evidence'>('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditConstraintsModal, setShowEditConstraintsModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Financial Aid');

  // Find target goal or default to active
  const goal = goals.find((g) => g.id === id) || goals[0];

  // Editable constraints state
  const [editBudget, setEditBudget] = useState(goal.constraints.budget);
  const [editCommute, setEditCommute] = useState(goal.constraints.maxCommute);
  const [editVehicle, setEditVehicle] = useState(goal.constraints.vehicle);

  const goalTasks = tasks.filter((t) => !t.goalId || t.goalId === goal.id);
  const goalDocs = documents.filter((d) => !d.goalId || d.goalId === goal.id);

  const handleDocUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;
    uploadDocument({
      title: docTitle.trim(),
      category: docCategory,
      fileName: `${docTitle.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      requiredFor: 'Hostel Fee Subsidy & Concession',
    });
    setDocTitle('');
    setShowUploadModal(false);
  };

  const handleSaveConstraints = (e: React.FormEvent) => {
    e.preventDefault();
    updateGoal(goal.id, {
      constraints: {
        ...goal.constraints,
        budget: editBudget,
        maxCommute: editCommute,
        vehicle: editVehicle,
      },
    });
    setShowEditConstraintsModal(false);
    showToast('Updated goal constraints. Verification Agent re-auditing.', 'info');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/goals')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Goals</span>
        </button>

        <div className="flex items-center gap-2">
          <LifeOSButton
            onClick={() => setShowEditConstraintsModal(true)}
            variant="outline"
            size="sm"
            leftIcon={<Sliders className="w-3.5 h-3.5" />}
          >
            Edit Constraints
          </LifeOSButton>

          <LifeOSButton
            onClick={() => navigate(`/goals/${goal.id}/plan`)}
            variant="secondary"
            size="sm"
            leftIcon={<Compass className="w-3.5 h-3.5" />}
          >
            AI Plan Review
          </LifeOSButton>
        </div>
      </div>

      {/* Goal Hero Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <LifeOSBadge variant="success" pulse>
                {goal.status}
              </LifeOSBadge>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                {goal.category}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
              {goal.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {goal.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>{goal.location}</span>
            </span>
            <span className="flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <Calendar className="w-4 h-4 text-[#1E60F2]" />
              <span>Target: {goal.deadline}</span>
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-2 border-t border-slate-100">
          <ProgressBar
            completed={goal.completedTasks}
            total={goal.totalTasks}
            label={`Goal Execution Progress: ${goal.completedTasks} of ${goal.totalTasks} Tasks Completed`}
          />
        </div>

        {/* Extracted Constraints System */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Verified Constraints
            </h3>
            <button
              onClick={() => setShowEditConstraintsModal(true)}
              className="text-xs font-semibold text-[#1E60F2] hover:underline"
            >
              Adjust Parameters →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100">
              <div className="flex items-center gap-1.5 text-xs text-[#1E60F2] font-semibold mb-1">
                <Wallet className="w-3.5 h-3.5" /> Budget Cap
              </div>
              <p className="text-sm font-bold text-slate-800">{goal.constraints.budget}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100">
              <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-semibold mb-1">
                <Clock className="w-3.5 h-3.5" /> Max Commute
              </div>
              <p className="text-sm font-bold text-slate-800">{goal.constraints.maxCommute}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-100/70 border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold mb-1">
                <Car className="w-3.5 h-3.5" /> Vehicle Transit
              </div>
              <p className="text-sm font-bold text-slate-800 truncate">{goal.constraints.vehicle}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Agent Math
              </div>
              <p className="text-sm font-bold text-slate-800">₹13.8k/mo Verified</p>
            </div>
          </div>
        </div>

        {/* Next Action Banner */}
        {goal.nextAction && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                  Next Required Action (Document Agent)
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  {goal.nextAction}
                </p>
              </div>
            </div>
            <LifeOSButton
              onClick={() => setShowUploadModal(true)}
              variant="primary"
              size="sm"
              leftIcon={<FileUp className="w-4 h-4" />}
            >
              Upload Now
            </LifeOSButton>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {(['overview', 'plan', 'tasks', 'documents', 'evidence'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-[#1E60F2] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab === 'plan' ? 'AI Plan' : tab}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Tasks Checklist */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">
                Goal Tasks ({goalTasks.filter((t) => t.isCompleted).length}/{goalTasks.length})
              </h3>
              <button
                onClick={() => navigate('/tasks')}
                className="text-xs font-semibold text-[#1E60F2] hover:underline"
              >
                Manage All →
              </button>
            </div>
            <div className="space-y-2.5">
              {goalTasks.map((t) => (
                <TaskItem key={t.id} task={t} onToggle={toggleTask} />
              ))}
            </div>
          </div>

          {/* Documents State */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">
                Required Verification Documents
              </h3>
              <button
                onClick={() => setShowUploadModal(true)}
                className="text-xs font-bold text-[#1E60F2] hover:underline flex items-center gap-1"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {goalDocs.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                    doc.status === 'verified'
                      ? 'bg-emerald-50/50 border-emerald-200/80'
                      : 'bg-amber-50/50 border-amber-200/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {doc.status === 'verified' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-slate-800">{doc.title}</p>
                      <p className="text-[11px] text-slate-500">{doc.requiredFor}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-[10.5px] uppercase ${
                      doc.status === 'verified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800 animate-pulse'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AI Plan */}
      {activeTab === 'plan' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800">4-Phase Relocation Strategy</h3>
              <p className="text-xs text-slate-500">{plan.summary}</p>
            </div>
            <LifeOSButton
              onClick={() => navigate(`/goals/${goal.id}/plan`)}
              variant="primary"
              size="sm"
            >
              Open Full Plan Review →
            </LifeOSButton>
          </div>

          <div className="space-y-3">
            {plan.steps.map((step, idx) => (
              <div
                key={step.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1E60F2] font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-800">{step.title}</h4>
                    <p className="text-slate-500 text-[11px]">{step.description}</p>
                  </div>
                </div>
                <span className="font-semibold text-slate-700 capitalize text-right">
                  {step.assignedAgent} Agent
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Tasks Full View */}
      {activeTab === 'tasks' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800">Execution Checklist</h3>
              <p className="text-xs text-slate-500">Checking a task automatically updates goal progress.</p>
            </div>
            <LifeOSButton
              onClick={() => navigate('/tasks')}
              variant="primary"
              size="sm"
            >
              + Add Custom Task
            </LifeOSButton>
          </div>
          <div className="space-y-2.5">
            {goalTasks.map((t) => (
              <TaskItem key={t.id} task={t} onToggle={toggleTask} />
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Documents View */}
      {activeTab === 'documents' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800">Document Repository</h3>
              <p className="text-xs text-slate-500">Document Agent audits signatures, validity dates, and seals.</p>
            </div>
            <LifeOSButton
              onClick={() => setShowUploadModal(true)}
              variant="primary"
              size="sm"
              leftIcon={<FileUp className="w-3.5 h-3.5" />}
            >
              Upload Document
            </LifeOSButton>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {goalDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10.5px] font-bold text-slate-400 uppercase">
                      {doc.category}
                    </span>
                    <LifeOSBadge variant={doc.status === 'verified' ? 'success' : 'warning'}>
                      {doc.status}
                    </LifeOSBadge>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">{doc.title}</h4>
                  <p className="text-xs text-slate-500 leading-snug">{doc.requiredFor}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-400">
                  {doc.fileName ? `File: ${doc.fileName} (${doc.fileSize})` : 'Awaiting upload from user'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Evidence & Reasoning */}
      {activeTab === 'evidence' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">
              Evidence & Mathematical Audit
            </h3>
            <p className="text-xs text-slate-500">
              LIFEOS does not guess. All recommendations are anchored to verified facts, commute equations, and sources.
            </p>
          </div>

          <div className="space-y-3">
            {plan.evidenceNotes.map((note, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3"
              >
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {note}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
            <span className="text-xs text-blue-900 font-semibold">
              Want to see trade-offs and alter decisions?
            </span>
            <LifeOSButton
              onClick={() => navigate(`/goals/${goal.id}/plan`)}
              variant="primary"
              size="sm"
            >
              Open Plan Review
            </LifeOSButton>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      <LifeOSModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Verification Document"
        subtitle="Document Agent will parse and verify validity for this goal."
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
              onClick={handleDocUpload}
            >
              Upload & Verify
            </LifeOSButton>
          </>
        }
      >
        <form onSubmit={handleDocUpload} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Document Title
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
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
            >
              <option value="Financial Aid">Financial Aid</option>
              <option value="Government ID">Government ID</option>
              <option value="Academic">Academic</option>
              <option value="Housing">Housing</option>
            </select>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center text-xs text-slate-500 hover:bg-slate-50 cursor-pointer">
            <FileUp className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <span className="font-semibold text-slate-700">Choose PDF or Scanned Image</span>
            <p className="text-[11px] text-slate-400 mt-1">Accepted: PDF, JPG, PNG up to 15MB</p>
          </div>
        </form>
      </LifeOSModal>

      {/* Edit Constraints Modal */}
      <LifeOSModal
        isOpen={showEditConstraintsModal}
        onClose={() => setShowEditConstraintsModal(false)}
        title="Edit Real-World Constraints"
        subtitle="Verification Agent will re-audit housing and commute options based on new limits."
        footer={
          <>
            <LifeOSButton
              variant="outline"
              size="sm"
              onClick={() => setShowEditConstraintsModal(false)}
            >
              Cancel
            </LifeOSButton>
            <LifeOSButton
              variant="primary"
              size="sm"
              onClick={handleSaveConstraints}
            >
              Save Constraints
            </LifeOSButton>
          </>
        }
      >
        <form onSubmit={handleSaveConstraints} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Monthly Budget Cap
            </label>
            <input
              type="text"
              value={editBudget}
              onChange={(e) => setEditBudget(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Maximum Commute
            </label>
            <input
              type="text"
              value={editCommute}
              onChange={(e) => setEditCommute(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Vehicle Constraints
            </label>
            <input
              type="text"
              value={editVehicle}
              onChange={(e) => setEditVehicle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]"
            />
          </div>
        </form>
      </LifeOSModal>
    </div>
  );
};
