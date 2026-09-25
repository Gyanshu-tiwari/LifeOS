import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLifeOS } from '../context/LifeOSContext';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Bot,
  MapPin,
  Calendar,
  Wallet,
  Clock,
  Car,
  CheckCircle2,
  Sliders,
  Check,
  Building,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { LifeOSButton } from '../components/ui/LifeOSButton';
import { LifeOSBadge } from '../components/ui/LifeOSBadge';

export const CreateGoalPage: React.FC = () => {
  const { addGoal, showToast } = useLifeOS();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Form State
  const [title, setTitle] = useState('Move to Lucknow for College');
  const [description, setDescription] = useState(
    'Find a suitable place to live within ₹15,000/month, no personal vehicle, within 45 minutes of college via public transit.'
  );
  const [location, setLocation] = useState('Lucknow, UP');
  const [budget, setBudget] = useState('₹15,000/month');
  const [maxCommute, setMaxCommute] = useState('≤ 45 mins');
  const [vehicle, setVehicle] = useState('No vehicle (Metro & Walking)');
  const [deadline, setDeadline] = useState('Aug 25, 2026');
  const [housingPreference, setHousingPreference] = useState<'hostel' | 'pg' | 'flat'>('hostel');
  const [category, setCategory] = useState('Relocation & Education');

  const handleAutofillLucknow = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setTitle('Move to Lucknow for College');
      setDescription(
        'Find a suitable place to live within ₹15,000/month, no personal vehicle, within 45 minutes of college.'
      );
      setLocation('Lucknow, UP');
      setBudget('₹15,000/month');
      setMaxCommute('≤ 45 mins');
      setVehicle('No vehicle (Metro & Walking)');
      setDeadline('Aug 25, 2026');
      setCategory('Relocation & Education');
      setHousingPreference('hostel');
      setIsAnalyzing(false);
      showToast('LIFEOS extracted constraints for Lucknow college relocation', 'info');
    }, 400);
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !title.trim()) {
      showToast('Please enter your goal objective', 'warning');
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitGoal = async () => {
    setIsAnalyzing(true);
    try {
      const newId = await addGoal({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        deadline: deadline.trim(),
        category: category.trim(),
        constraints: {
          budget,
          vehicle,
          maxCommute,
          location,
        },
      });
      setIsAnalyzing(false);
      navigate(`/goals/${newId}`);
    } catch (err: any) {
      setIsAnalyzing(false);
    }
  };

  const steps = [
    { num: 1, label: 'Objective & Context' },
    { num: 2, label: 'Constraint Audit' },
    { num: 3, label: 'Preferences' },
    { num: 4, label: 'AI Review & Launch' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white shadow-soft-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Intelligent Goal Setup Workflow</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Initialize a Real-World Goal
          </h1>
          <p className="text-xs sm:text-sm text-blue-200/80 max-w-xl leading-relaxed">
            Tell LIFEOS what you want to accomplish. Specialized agents will extract your constraints, audit feasibility, and coordinate execution.
          </p>

          <button
            type="button"
            onClick={handleAutofillLucknow}
            className="mt-3 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition-colors"
          >
            ⚡ Load MVP Scenario: "Moving to Lucknow for College"
          </button>
        </div>
      </div>

      {/* Progress Step Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft">
        <div className="grid grid-cols-4 gap-2">
          {steps.map((st) => (
            <div key={st.num} className="flex flex-col items-center text-center">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep === st.num
                    ? 'bg-[#1E60F2] text-white ring-4 ring-blue-500/20 shadow-sm'
                    : currentStep > st.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {currentStep > st.num ? <Check className="w-4 h-4" /> : st.num}
              </div>
              <span
                className={`text-[10.5px] sm:text-xs font-bold mt-1.5 hidden sm:block ${
                  currentStep === st.num ? 'text-[#1E60F2]' : 'text-slate-500'
                }`}
              >
                {st.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: OBJECTIVE & DESTINATION */}
      {currentStep === 1 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-5 animate-fade-in">
          <div>
            <span className="text-xs font-bold text-[#1E60F2] uppercase tracking-wider block mb-1">
              Step 1 of 4
            </span>
            <h2 className="text-lg font-bold text-[#0B192C]">
              What do you want to accomplish?
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Describe your objective in natural language. LIFEOS will extract parameters automatically.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Goal Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g. Move to Lucknow for College"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Detailed Context & Requirements
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe budget, transit, and dates..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E60F2]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Target Destination / City
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-rose-500" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Arrival Deadline
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-[#1E60F2]" />
                  <input
                    type="text"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <LifeOSButton
              onClick={handleNextStep}
              variant="primary"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Analyze Constraints
            </LifeOSButton>
          </div>
        </div>
      )}

      {/* STEP 2: EXTRACTED CONSTRAINTS */}
      {currentStep === 2 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-5 animate-fade-in">
          <div>
            <span className="text-xs font-bold text-[#1E60F2] uppercase tracking-wider block mb-1">
              Step 2 of 4
            </span>
            <h2 className="text-lg font-bold text-[#0B192C]">
              Verify Extracted Constraints
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Here is what LIFEOS extracted from your objective. You can adjust the parameters to fit your situation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-600" />
                Monthly Budget Cap
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-semibold"
              />
              <span className="text-[11px] text-slate-500 block">
                Verification Agent will flag housing options exceeding this total.
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                Maximum Commute Time
              </label>
              <input
                type="text"
                value={maxCommute}
                onChange={(e) => setMaxCommute(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-semibold"
              />
              <span className="text-[11px] text-slate-500 block">
                Maps Agent will discard routes exceeding this duration.
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 sm:col-span-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Car className="w-4 h-4 text-amber-600" />
                Vehicle Transit Constraint
              </label>
              <input
                type="text"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-semibold"
              />
              <span className="text-[11px] text-slate-500 block">
                Routes must rely purely on walking, Metro, and local public transit.
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <LifeOSButton onClick={handlePrevStep} variant="outline" size="md">
              Back
            </LifeOSButton>
            <LifeOSButton onClick={handleNextStep} variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Next: Preferences
            </LifeOSButton>
          </div>
        </div>
      )}

      {/* STEP 3: PREFERENCES & OPTIONS */}
      {currentStep === 3 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-5 animate-fade-in">
          <div>
            <span className="text-xs font-bold text-[#1E60F2] uppercase tracking-wider block mb-1">
              Step 3 of 4
            </span>
            <h2 className="text-lg font-bold text-[#0B192C]">
              Housing & Living Preferences
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select your primary housing target so Planning Agent can prioritize options.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'hostel',
                title: 'On-Campus College Hostel',
                desc: '₹9,500/mo including mess. 5-min walk. Requires Income Certificate before Aug 14.',
              },
              {
                id: 'pg',
                title: 'Private Student PG',
                desc: '₹11,000/mo. Air conditioned, high privacy. Near Metro stations (Indira / Gomti Nagar).',
              },
              {
                id: 'flat',
                title: 'Shared Student Flat',
                desc: '₹8,000/mo + groceries. More independence, self-cooking required.',
              },
            ].map((opt) => (
              <div
                key={opt.id}
                onClick={() => setHousingPreference(opt.id as any)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  housingPreference === opt.id
                    ? 'bg-blue-50/70 border-[#1E60F2] ring-2 ring-blue-500/20'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800">{opt.title}</span>
                    {housingPreference === opt.id && (
                      <CheckCircle2 className="w-4 h-4 text-[#1E60F2]" />
                    )}
                  </div>
                  <p className="text-[11.5px] text-slate-500 leading-relaxed">{opt.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <LifeOSButton onClick={handlePrevStep} variant="outline" size="md">
              Back
            </LifeOSButton>
            <LifeOSButton onClick={handleNextStep} variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Review & Launch
            </LifeOSButton>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & LAUNCH */}
      {currentStep === 4 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-6 animate-fade-in">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">
              Step 4 of 4
            </span>
            <h2 className="text-xl font-bold text-[#0B192C]">
              Here is what LIFEOS Understood
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review your goal structure before initializing multi-agent coordination.
            </p>
          </div>

          {/* Understood Summary Card */}
          <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800 uppercase">Core Objective</span>
              <LifeOSBadge variant="primary">{category}</LifeOSBadge>
            </div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-blue-200/60 text-xs">
              <div>
                <span className="text-slate-400 text-[10.5px] block font-bold">BUDGET</span>
                <span className="font-bold text-slate-800">{budget}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10.5px] block font-bold">COMMUTE</span>
                <span className="font-bold text-slate-800">{maxCommute}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10.5px] block font-bold">DESTINATION</span>
                <span className="font-bold text-slate-800">{location}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10.5px] block font-bold">DEADLINE</span>
                <span className="font-bold text-slate-800">{deadline}</span>
              </div>
            </div>
          </div>

          {/* Assigned Agent Squad */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Assigned Specialized Agent Squad
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-purple-700 block">Research Agent</span>
                <p className="text-slate-500 text-[11px] mt-0.5">Scans PG listings & hostel quotas in Lucknow</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-blue-700 block">Maps Agent</span>
                <p className="text-slate-500 text-[11px] mt-0.5">Calculates Metro Red Line commute timetable</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-teal-700 block">Verification Agent</span>
                <p className="text-slate-500 text-[11px] mt-0.5">Audits budget: ₹13.8k ≤ ₹15k constraint</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <LifeOSButton onClick={handlePrevStep} variant="outline" size="md">
              Back
            </LifeOSButton>
            <LifeOSButton
              onClick={handleSubmitGoal}
              variant="primary"
              size="lg"
              isLoading={isAnalyzing}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Initialize Goal with LIFEOS
            </LifeOSButton>
          </div>
        </div>
      )}
    </div>
  );
};
