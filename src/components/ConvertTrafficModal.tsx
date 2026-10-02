import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  ArrowUpRight,
  UserCheck,
  Package,
  Sparkles,
  User,
  Heart,
  Calendar,
  Briefcase,
  MapPin,
  Image as ImageIcon,
  FileText,
  Upload,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PROFESSIONS } from './AddLeadModal';

export interface ConvertTrafficModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  token: string;
  onConversionSuccess: (newTraffic: any) => void;
}

export const ConvertTrafficModal: React.FC<ConvertTrafficModalProps> = ({
  isOpen,
  onClose,
  lead,
  token,
  onConversionSuccess,
}) => {
  // MK Accounts list for "Assign By" selection menu
  const [mkAccounts, setMkAccounts] = useState<any[]>([]);

  // Validation Layer States
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [activeFieldHighlight, setActiveFieldHighlight] = useState<string | null>(null);

  // ==========================================
  // PART 1 - BASIC INFO (Mandatory for Traffic)
  // ==========================================
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // ==========================================
  // PART 2 - ADDITIONAL INFO (Mandatory for Traffic)
  // ==========================================
  const [assignBy, setAssignBy] = useState('');
  const [profession, setProfession] = useState('');
  const [jobType, setJobType] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [gender, setGender] = useState('');
  const [bodyColor, setBodyColor] = useState('');
  const [height, setHeight] = useState('');
  const [religion, setReligion] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [qualification, setQualification] = useState('');
  const [requirement, setRequirement] = useState('');

  // Address
  const [presentCity, setPresentCity] = useState('');
  const [presentCountry, setPresentCountry] = useState('Bangladesh');
  const [permanentCity, setPermanentCity] = useState('');
  const [permanentCountry, setPermanentCountry] = useState('Bangladesh');
  const [sameAsPresent, setSameAsPresent] = useState(false);

  // Uploads
  const [images, setImages] = useState<string[]>([]);
  const [pdfFile, setPdfFile] = useState<{ name: string; size: number; dataUrl: string } | null>(null);

  // ==========================================
  // PART 3 - PAYMENT (Traffic Financial Pipeline)
  // ==========================================
  const [pkg, setPkg] = useState('Gold');
  const [price, setPrice] = useState('15000');
  const [customPrice, setCustomPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [paidAmount, setPaidAmount] = useState('5000');
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [afterMarriageFee, setAfterMarriageFee] = useState('20000');
  const [customAfterMarriageFee, setCustomAfterMarriageFee] = useState('');

  // Conversion Animation State
  const [isConverting, setIsConverting] = useState(false);
  const [conversionDone, setConversionDone] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Drag and drop states
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const formTopRef = useRef<HTMLDivElement>(null);

  // Fetch MK Accounts on modal open
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/users?role=MK', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setMkAccounts(data);
        if (data.length > 0 && !assignBy) {
          setAssignBy(data[0].name);
        }
      })
      .catch((err) => console.error('Error fetching MK accounts:', err));
  }, [isOpen, token, assignBy]);

  // Sync lead details when modal opens
  useEffect(() => {
    if (lead) {
      setName(lead.name || '');
      setPhone(lead.phone || '');
      setEmail(lead.email || '');
      setProfession(lead.profession || '');
      setJobType(lead.jobType || '');
      setDateOfBirth(lead.dateOfBirth || '');
      setMaritalStatus(lead.maritalStatus || '');
      setGender(lead.gender || '');
      setBodyColor(lead.bodyColor || '');
      setHeight(lead.height || '');
      setReligion(lead.religion || '');
      setBloodGroup(lead.bloodGroup || '');
      setQualification(lead.qualification || '');
      setRequirement(lead.requirement || '');
      setPresentCity(lead.presentCity || '');
      setPresentCountry(lead.presentCountry || 'Bangladesh');
      setPermanentCity(lead.permanentCity || '');
      setPermanentCountry(lead.permanentCountry || 'Bangladesh');
      setSameAsPresent(
        Boolean(
          lead.presentCity &&
            lead.permanentCity &&
            lead.presentCity === lead.permanentCity &&
            lead.presentCountry === lead.permanentCountry
        )
      );
      setImages(Array.isArray(lead.images) ? lead.images : []);
      setPdfFile(lead.pdf || null);

      setIsConverting(false);
      setConversionDone(null);
      setError(null);
      setAttemptedSubmit(false);
      setActiveFieldHighlight(null);
    }
  }, [lead, isOpen]);

  // Handle same address toggle
  const handleSameAsPresentToggle = (checked: boolean) => {
    setSameAsPresent(checked);
    if (checked) {
      setPermanentCity(presentCity);
      setPermanentCountry(presentCountry);
    }
  };

  // Pricing calculations
  const actualPrice = useMemo(
    () => (price === 'custom' ? Number(customPrice) || 0 : Number(price) || 0),
    [price, customPrice]
  );
  const numericDiscount = useMemo(() => Number(discount) || 0, [discount]);
  const numericPaid = useMemo(() => Number(paidAmount) || 0, [paidAmount]);
  const calculatedDue = useMemo(
    () => Math.max(0, actualPrice - numericDiscount - numericPaid),
    [actualPrice, numericDiscount, numericPaid]
  );
  const actualAfterMarriageFee = useMemo(
    () =>
      afterMarriageFee === 'custom'
        ? Number(customAfterMarriageFee) || 0
        : Number(afterMarriageFee) || 0,
    [afterMarriageFee, customAfterMarriageFee]
  );

  // Picture handling
  const processImageFiles = (files: File[]) => {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // PDF handling
  const processPdfFile = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only authentic PDF format (.pdf) is permitted for bio-data document.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setPdfFile({
          name: file.name,
          size: file.size,
          dataUrl: reader.result as string,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Checklist of Mandatory Requirements for Traffic
  const requirementsList = useMemo(() => {
    return [
      {
        key: 'name',
        fieldId: 'field-name',
        label: 'Candidate Name',
        section: 'Part 1',
        fulfilled: Boolean(name.trim()),
        errorMessage: 'Candidate full name is required for Traffic profile registration.',
      },
      {
        key: 'phone',
        fieldId: 'field-phone',
        label: 'Phone Number',
        section: 'Part 1',
        fulfilled: Boolean(phone.trim()),
        errorMessage: 'Valid official phone number is mandatory for Traffic onboarding.',
      },
      {
        key: 'email',
        fieldId: 'field-email',
        label: 'Email Address',
        section: 'Part 1',
        fulfilled: Boolean(email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())),
        errorMessage: 'Valid email address (e.g. candidate@domain.com) is mandatory for Traffic onboarding.',
      },
      {
        key: 'assignBy',
        fieldId: 'field-assignBy',
        label: 'Assign By (MK)',
        section: 'Part 2',
        fulfilled: Boolean(assignBy.trim()),
        errorMessage: 'Please select an MK Marketing Officer account from the selection menu.',
      },
      {
        key: 'profession',
        fieldId: 'field-profession',
        label: 'Profession',
        section: 'Part 2',
        fulfilled: Boolean(profession.trim()),
        errorMessage: 'Candidate profession must be selected.',
      },
      {
        key: 'jobType',
        fieldId: 'field-jobType',
        label: 'Job Type',
        section: 'Part 2',
        fulfilled: Boolean(jobType.trim()),
        errorMessage: 'Employment Job Type selection is required.',
      },
      {
        key: 'dateOfBirth',
        fieldId: 'field-dateOfBirth',
        label: 'Date of Birth',
        section: 'Part 2',
        fulfilled: Boolean(dateOfBirth.trim()),
        errorMessage: 'Date of birth is required for matrimonial matching.',
      },
      {
        key: 'maritalStatus',
        fieldId: 'field-maritalStatus',
        label: 'Marital Status',
        section: 'Part 2',
        fulfilled: Boolean(maritalStatus.trim()),
        errorMessage: 'Marital status must be specified before transferring to Traffic.',
      },
      {
        key: 'gender',
        fieldId: 'field-gender',
        label: 'Gender',
        section: 'Part 2',
        fulfilled: Boolean(gender.trim()),
        errorMessage: 'Gender specification is mandatory.',
      },
      {
        key: 'bodyColor',
        fieldId: 'field-bodyColor',
        label: 'Body Color',
        section: 'Part 2',
        fulfilled: Boolean(bodyColor.trim()),
        errorMessage: 'Body complexion specification must be selected.',
      },
      {
        key: 'height',
        fieldId: 'field-height',
        label: 'Height',
        section: 'Part 2',
        fulfilled: Boolean(height.trim()),
        errorMessage: 'Candidate height specification is required.',
      },
      {
        key: 'religion',
        fieldId: 'field-religion',
        label: 'Religion',
        section: 'Part 2',
        fulfilled: Boolean(religion.trim()),
        errorMessage: 'Religion selection is mandatory for classification.',
      },
      {
        key: 'bloodGroup',
        fieldId: 'field-bloodGroup',
        label: 'Blood Group',
        section: 'Part 2',
        fulfilled: Boolean(bloodGroup.trim()),
        errorMessage: 'Blood group must be specified for medical profile accuracy.',
      },
      {
        key: 'qualification',
        fieldId: 'field-qualification',
        label: 'Qualification',
        section: 'Part 2',
        fulfilled: Boolean(qualification.trim()),
        errorMessage: 'Educational qualification is required for matrimonial matching.',
      },
      {
        key: 'requirement',
        fieldId: 'field-requirement',
        label: 'Partner Requirement',
        section: 'Part 2',
        fulfilled: Boolean(requirement.trim()),
        errorMessage: 'Partner expectations and requirements must be detailed.',
      },
      {
        key: 'presentAddress',
        fieldId: 'field-presentAddress',
        label: 'Present Address',
        section: 'Part 2',
        fulfilled: Boolean(presentCity.trim() && presentCountry.trim()),
        errorMessage: 'Present city and country are mandatory for Traffic verification.',
      },
      {
        key: 'permanentAddress',
        fieldId: 'field-permanentAddress',
        label: 'Permanent Address',
        section: 'Part 2',
        fulfilled: Boolean(permanentCity.trim() && permanentCountry.trim()),
        errorMessage: 'Permanent city and country are mandatory for Traffic verification.',
      },
      {
        key: 'images',
        fieldId: 'field-images',
        label: 'Picture Upload',
        section: 'Part 2',
        fulfilled: images.length > 0,
        errorMessage: 'At least 1 authentic candidate photograph must be uploaded.',
      },
      {
        key: 'pdf',
        fieldId: 'field-pdf',
        label: 'PDF Biodata',
        section: 'Part 2',
        fulfilled: pdfFile !== null,
        errorMessage: 'Authentic candidate bio-data in PDF format (.pdf) is mandatory.',
      },
      {
        key: 'price',
        fieldId: 'field-price',
        label: 'Package Price',
        section: 'Part 3',
        fulfilled: actualPrice > 0,
        errorMessage: 'Package price must be greater than 0 BDT.',
      },
    ];
  }, [
    name,
    phone,
    email,
    assignBy,
    profession,
    jobType,
    dateOfBirth,
    maritalStatus,
    gender,
    bodyColor,
    height,
    religion,
    bloodGroup,
    qualification,
    requirement,
    presentCity,
    presentCountry,
    permanentCity,
    permanentCountry,
    images.length,
    pdfFile,
    actualPrice,
  ]);

  const fulfilledCount = requirementsList.filter((r) => r.fulfilled).length;
  const totalCount = requirementsList.length;
  const isAllFulfilled = fulfilledCount === totalCount;

  // Jump to field helper with smooth scrolling and brief focus highlight
  const scrollToField = (fieldId: string) => {
    const el = document.getElementById(fieldId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setActiveFieldHighlight(fieldId);
      setTimeout(() => {
        const input = el.querySelector('input, select, textarea') as HTMLElement | null;
        if (input) {
          input.focus();
        }
      }, 350);
      setTimeout(() => {
        setActiveFieldHighlight(null);
      }, 2500);
    }
  };

  const isFieldMissing = (key: string) => attemptedSubmit && !requirementsList.find((r) => r.key === key)?.fulfilled;
  const getFieldError = (key: string) => requirementsList.find((r) => r.key === key)?.errorMessage || 'This field is required for Traffic.';

  // Form Submit Handler
  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    // Validate ALL Mandatory Traffic Requirements
    const missing = requirementsList.filter((r) => !r.fulfilled);

    if (missing.length > 0) {
      setAttemptedSubmit(true);
      setError(`Transfer Blocked: ${missing.length} mandatory requirement(s) are missing. Please complete the highlighted fields below before converting to Traffic.`);
      scrollToField(missing[0].fieldId);
      return;
    }

    if (actualPrice <= 0) {
      setAttemptedSubmit(true);
      setError('Please provide a valid Package Price for Traffic onboarding.');
      scrollToField('field-price');
      return;
    }

    setIsConverting(true);
    setError(null);

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      assignBy,
      profession,
      jobType,
      dateOfBirth,
      maritalStatus,
      gender,
      bodyColor,
      height,
      religion,
      bloodGroup,
      qualification,
      requirement: requirement.trim(),
      presentCity: presentCity.trim(),
      presentCountry: presentCountry.trim(),
      permanentCity: permanentCity.trim(),
      permanentCountry: permanentCountry.trim(),
      images,
      pdf: pdfFile,
      package: pkg,
      price: actualPrice,
      discount: numericDiscount,
      paidAmount: numericPaid,
      dueAmount: calculatedDue,
      paymentMethod,
      afterMarriageFee: actualAfterMarriageFee,
    };

    try {
      const response = await fetch(`/api/leads/${lead.id}/convert-traffic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Conversion failed');
      }

      const result = await response.json();

      // Show celebratory animation before finalizing
      setConversionDone(result.traffic);
      setTimeout(() => {
        onConversionSuccess(result.traffic);
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err.message || 'An error occurred during traffic conversion.');
      setIsConverting(false);
    }
  };

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 transition-opacity duration-150">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Conversion In-Progress / Success Animation Overlay */}
        <AnimatePresence>
          {isConverting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-[#181E54]/95 text-white flex flex-col items-center justify-center p-6 text-center"
            >
              {conversionDone ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="space-y-4 max-w-sm"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                    <CheckCircle className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Successfully Converted to Traffic!</h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Promoted from Lead <span className="font-mono text-amber-300">{lead.id}</span> to Traffic Candidate{' '}
                      <span className="font-mono text-emerald-300 font-bold">{conversionDone.id}</span>.
                    </p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-2xl border border-white/10 text-xs text-slate-200">
                    Removed from Lead section and transferred directly into the <strong>Traffic</strong> section.
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="w-16 h-16 border-4 border-white/20 border-t-[#D81124] rounded-full animate-spin" />
                    <Sparkles className="w-6 h-6 text-amber-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Promoting Lead to Traffic...</h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Validating mandatory requirements, registering MK account assignment, and initiating billing ticket.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider border border-amber-200">
                Pipeline: Lead ➔ Traffic
              </span>
              <h2 className="text-lg md:text-xl font-bold text-[#181E54]">Convert Lead to Traffic</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Fulfill all mandatory requirements to promote candidate <strong className="text-slate-800">{lead.name}</strong> from preliminary inquiry into full Traffic.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Requirements Completion Progress Tracker Banner */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#181E54]" />
              Mandatory Traffic Requirements Status:
            </span>
            <span
              className={`font-mono font-bold px-2 py-0.5 rounded-full text-[11px] ${
                isAllFulfilled
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {fulfilledCount} / {totalCount} Requirements Fulfilled ({Math.round((fulfilledCount / totalCount) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isAllFulfilled ? 'bg-emerald-600' : 'bg-[#181E54]'
              }`}
              style={{ width: `${(fulfilledCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConvert} className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
          <div ref={formTopRef} />

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-[#D81124]" />
              <span className="font-medium text-xs leading-relaxed">{error}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECTION 1: PART 1 - BASIC INFO                           */}
          {/* ======================================================== */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#181E54]" />
                <h3 className="text-xs font-bold text-[#181E54] uppercase tracking-wider">
                  Part 1 — Basic Information (Mandatory)
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">All 3 fields required for Traffic</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* 1. Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Candidate Full Name <span className="text-[#D81124]">*</span>
                  </label>
                  {lead.name && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                      From Lead
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Candidate Full Name"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                />
              </div>

              {/* 2. Phone */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Official Phone Number <span className="text-[#D81124]">*</span>
                  </label>
                  {lead.phone && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                      From Lead
                    </span>
                  )}
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Official Phone Number"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                />
              </div>

              {/* 3. Email (MANDATORY FOR TRAFFIC) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Email Address <span className="text-[#D81124]">*</span>
                  </label>
                  {lead.email ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                      From Lead
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-300">
                      Required for Traffic
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  className={`w-full px-3 py-2 bg-white border rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 ${
                    !email.trim()
                      ? 'border-amber-400 focus:ring-amber-500 bg-amber-50/20'
                      : 'border-slate-300 focus:ring-[#181E54]'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 2: PART 2 - ADDITIONAL INFO                      */}
          {/* ======================================================== */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#D81124]" />
                <h3 className="text-xs font-bold text-[#181E54] uppercase tracking-wider">
                  Part 2 — Additional Information (Mandatory)
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">All attributes required to become Traffic</span>
            </div>

            {/* 1. Assign By - Selection menu with all MK Accounts */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-0.5">
                    Assign By (MK Role Accounts) <span className="text-[#D81124]">*</span>
                  </label>
                  <p className="text-[11px] text-amber-700">
                    Select which Marketing officer (MK) created or manages this candidate
                  </p>
                </div>
                <div className="w-full sm:w-72">
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      required
                      value={assignBy}
                      onChange={(e) => setAssignBy(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                    >
                      <option value="">Select MK Officer...</option>
                      {mkAccounts.map((acc) => (
                        <option key={acc.id} value={acc.name}>
                          {acc.name} ({acc.role})
                        </option>
                      ))}
                      {mkAccounts.length === 0 && (
                        <option value="MK Staff Officer">MK Staff Officer</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid of Profile Attributes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {/* Profession */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Profession <span className="text-[#D81124]">*</span>
                </label>
                <select
                  required
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="">Select Profession...</option>
                  {PROFESSIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Type */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Job Type <span className="text-[#D81124]">*</span>
                </label>
                <select
                  required
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="">Select Job Type...</option>
                  <option value="Private Job">Private Job</option>
                  <option value="Government Job">Government Job</option>
                  <option value="Multinational (MNC)">Multinational (MNC)</option>
                  <option value="Own Business">Own Business</option>
                  <option value="Freelancing / Remote">Freelancing / Remote</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Non-Employed">Non-Employed</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Date of Birth <span className="text-[#D81124]">*</span>
                  </label>
                  {!dateOfBirth && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-300">
                      Required
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className={`w-full px-3 py-2 bg-white border rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 ${
                    !dateOfBirth ? 'border-amber-400 bg-amber-50/20' : 'border-slate-300 focus:ring-[#181E54]'
                  }`}
                />
              </div>

              {/* Marital Status */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Marital Status <span className="text-[#D81124]">*</span>
                </label>
                <select
                  required
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="">Select Marital Status...</option>
                  <option value="Never Married">Never Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Awaiting Divorce">Awaiting Divorce</option>
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Gender <span className="text-[#D81124]">*</span>
                </label>
                <select
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="">Select Gender...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Body Color */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Body Color <span className="text-[#D81124]">*</span>
                </label>
                <select
                  required
                  value={bodyColor}
                  onChange={(e) => setBodyColor(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="">Select Body Color...</option>
                  <option value="Fair">Fair</option>
                  <option value="Very Fair">Very Fair</option>
                  <option value="Wheatish">Wheatish</option>
                  <option value="Dusky">Dusky</option>
                  <option value="Dark">Dark</option>
                </select>
              </div>

              {/* Height */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Height <span className="text-[#D81124]">*</span>
                </label>
                <select
                  required
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="">Select Height...</option>
                  <option value="4'8&quot; (142 cm)">4&apos;8&quot; (142 cm)</option>
                  <option value="4'9&quot; (145 cm)">4&apos;9&quot; (145 cm)</option>
                  <option value="4'10&quot; (147 cm)">4&apos;10&quot; (147 cm)</option>
                  <option value="4'11&quot; (150 cm)">4&apos;11&quot; (150 cm)</option>
                  <option value="5'0&quot; (152 cm)">5&apos;0&quot; (152 cm)</option>
                  <option value="5'1&quot; (155 cm)">5&apos;1&quot; (155 cm)</option>
                  <option value="5'2&quot; (157 cm)">5&apos;2&quot; (157 cm)</option>
                  <option value="5'3&quot; (160 cm)">5&apos;3&quot; (160 cm)</option>
                  <option value="5'4&quot; (163 cm)">5&apos;4&quot; (163 cm)</option>
                  <option value="5'5&quot; (165 cm)">5&apos;5&quot; (165 cm)</option>
                  <option value="5'6&quot; (168 cm)">5&apos;6&quot; (168 cm)</option>
                  <option value="5'7&quot; (170 cm)">5&apos;7&quot; (170 cm)</option>
                  <option value="5'8&quot; (173 cm)">5&apos;8&quot; (173 cm)</option>
                  <option value="5'9&quot; (175 cm)">5&apos;9&quot; (175 cm)</option>
                  <option value="5'10&quot; (178 cm)">5&apos;10&quot; (178 cm)</option>
                  <option value="5'11&quot; (180 cm)">5&apos;11&quot; (180 cm)</option>
                  <option value="6'0&quot; (183 cm)">6&apos;0&quot; (183 cm)</option>
                  <option value="6'1&quot; (185 cm)">6&apos;1&quot; (185 cm)</option>
                  <option value="6'2&quot;+ (188+ cm)">6&apos;2&quot;+ (188+ cm)</option>
                </select>
              </div>

              {/* Religion */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Religion <span className="text-[#D81124]">*</span>
                </label>
                <select
                  required
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="">Select Religion...</option>
                  <option value="Islam (Sunni)">Islam (Sunni)</option>
                  <option value="Islam (Shia)">Islam (Shia)</option>
                  <option value="Islam (Other)">Islam (Other)</option>
                  <option value="Hinduism">Hinduism</option>
                  <option value="Christianity">Christianity</option>
                  <option value="Buddhism">Buddhism</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Blood Group */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Blood Group <span className="text-[#D81124]">*</span>
                </label>
                <select
                  required
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="">Select Blood Group...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              {/* Qualification */}
              <div className="sm:col-span-2 md:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">
                  Educational Qualification <span className="text-[#D81124]">*</span>
                </label>
                <select
                  required
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="">Select Qualification...</option>
                  <option value="SSC / O-Level">SSC / O-Level</option>
                  <option value="HSC / A-Level">HSC / A-Level</option>
                  <option value="Bachelor's / Honors">Bachelor&apos;s / Honors</option>
                  <option value="Master's Degree">Master&apos;s Degree</option>
                  <option value="MBBS / Medical">MBBS / Medical</option>
                  <option value="B.Sc Engineering">B.Sc Engineering</option>
                  <option value="CA / ACCA / CMA">CA / ACCA / CMA</option>
                  <option value="Ph.D / Doctorate">Ph.D / Doctorate</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Requirement - Manually Input */}
              <div className="sm:col-span-2 md:col-span-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Partner Requirement / Expectations <span className="text-[#D81124]">*</span>
                  </label>
                  {!requirement.trim() && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-300">
                      Required for Traffic
                    </span>
                  )}
                </div>
                <textarea
                  rows={2}
                  required
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  placeholder="Candidate's expectations regarding age, height, education, family background, or district preferences..."
                  className={`w-full px-3.5 py-2 bg-white border rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 resize-none ${
                    !requirement.trim()
                      ? 'border-amber-400 focus:ring-amber-500 bg-amber-50/20'
                      : 'border-slate-300 focus:ring-[#181E54]'
                  }`}
                />
              </div>
            </div>

            {/* Address Details */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#181E54]" />
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Address Section <span className="text-[#D81124]">*</span>
                  </span>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsPresent}
                    onChange={(e) => handleSameAsPresentToggle(e.target.checked)}
                    className="rounded border-slate-300 text-[#181E54] focus:ring-[#181E54]"
                  />
                  <span>Permanent same as Present</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Present Address */}
                <div className="space-y-2 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-700 block">Present Address</span>
                  <input
                    type="text"
                    required
                    value={presentCity}
                    onChange={(e) => {
                      setPresentCity(e.target.value);
                      if (sameAsPresent) setPermanentCity(e.target.value);
                    }}
                    placeholder="City / District (e.g. Dhaka, Gulshan)"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                  />
                  <input
                    type="text"
                    required
                    value={presentCountry}
                    onChange={(e) => {
                      setPresentCountry(e.target.value);
                      if (sameAsPresent) setPermanentCountry(e.target.value);
                    }}
                    placeholder="Country (e.g. Bangladesh)"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                  />
                </div>

                {/* Permanent Address */}
                <div className="space-y-2 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-700 block">Permanent Address</span>
                  <input
                    type="text"
                    required
                    value={permanentCity}
                    disabled={sameAsPresent}
                    onChange={(e) => setPermanentCity(e.target.value)}
                    placeholder="City / District (e.g. Sylhet)"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54] disabled:opacity-60"
                  />
                  <input
                    type="text"
                    required
                    value={permanentCountry}
                    disabled={sameAsPresent}
                    onChange={(e) => setPermanentCountry(e.target.value)}
                    placeholder="Country (e.g. Bangladesh)"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54] disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            {/* Uploads Section: Picture Upload & PDF Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Picture Upload (MANDATORY FOR TRAFFIC) */}
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  images.length === 0
                    ? 'bg-amber-50/40 border-amber-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#181E54]" />
                    <span className="text-xs font-bold text-slate-800">
                      Picture Upload ({images.length}) <span className="text-[#D81124]">*</span>
                    </span>
                  </div>
                  {images.length === 0 ? (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      At least 1 required
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Unlimited allowed
                    </span>
                  )}
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingImages(true);
                  }}
                  onDragLeave={() => setIsDraggingImages(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingImages(false);
                    if (e.dataTransfer.files) {
                      processImageFiles(Array.from(e.dataTransfer.files));
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-3.5 text-center transition-all bg-slate-50/60 ${
                    isDraggingImages
                      ? 'border-[#181E54] bg-[#181E54]/5'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                  <p className="text-[11px] font-semibold text-slate-700">Drag &amp; drop photos here</p>
                  <label className="mt-1.5 inline-block px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs">
                    Browse Pictures
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          processImageFiles(Array.from(e.target.files));
                          e.target.value = '';
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 max-h-24">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-slate-200 group">
                        <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-red-600/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PDF Document Upload (MANDATORY FOR TRAFFIC) */}
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  !pdfFile
                    ? 'bg-amber-50/40 border-amber-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#D81124]" />
                    <span className="text-xs font-bold text-slate-800">
                      PDF Bio-Data <span className="text-[#D81124]">*</span>
                    </span>
                  </div>
                  {!pdfFile ? (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      Required for Traffic
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      PDF Ready
                    </span>
                  )}
                </div>

                {!pdfFile ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingPdf(true);
                    }}
                    onDragLeave={() => setIsDraggingPdf(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingPdf(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        processPdfFile(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`border-2 border-dashed rounded-xl p-3.5 text-center transition-all bg-slate-50/60 ${
                      isDraggingPdf
                        ? 'border-[#D81124] bg-red-50/30'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <FileText className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                    <p className="text-[11px] font-semibold text-slate-700">Strictly PDF only (.pdf)</p>
                    <label className="mt-1.5 inline-block px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs">
                      Upload PDF Bio-Data
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            processPdfFile(e.target.files[0]);
                            e.target.value = '';
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-[#D81124] border border-red-200 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-slate-800 truncate">{pdfFile.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {(pdfFile.size / 1024).toFixed(1)} KB • PDF Document
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPdfFile(null)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove PDF"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 3: PART 3 - PAYMENT FINANCIAL RECORD             */}
          {/* ======================================================== */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#181E54]" />
                <h3 className="text-xs font-bold text-[#181E54] uppercase tracking-wider">
                  Part 3 — Payment &amp; Financial Onboarding
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Automatic Payment Ticket Generation</span>
            </div>

            {/* Matrimonial Package Selection */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Matrimonial Service Package <span className="text-[#D81124]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: 'Silver', price: '10000', badge: 'Basic' },
                  { name: 'Gold', price: '15000', badge: 'Popular' },
                  { name: 'Diamond', price: '25000', badge: 'Premium' },
                  { name: 'Platinum', price: '40000', badge: 'VIP' },
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setPkg(item.name);
                      setPrice(item.price);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      pkg === item.name
                        ? 'bg-[#181E54] text-white border-[#181E54] shadow-sm ring-2 ring-[#181E54]/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{item.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          pkg === item.name ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-semibold mt-1 block">
                      {Number(item.price).toLocaleString()} BDT
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing, Discount, Paid & Calculated Due */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Package Price */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Package Price (BDT) <span className="text-[#D81124]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                    ৳
                  </span>
                  <input
                    type="number"
                    required
                    min="0"
                    value={price === 'custom' ? customPrice : price}
                    onChange={(e) => {
                      setPrice('custom');
                      setCustomPrice(e.target.value);
                    }}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                  />
                </div>
              </div>

              {/* Discount */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Discount (BDT)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                  />
                </div>
              </div>

              {/* Paid Amount */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Paid Amount (BDT) <span className="text-[#D81124]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-semibold text-xs">
                    ৳
                  </span>
                  <input
                    type="number"
                    required
                    min="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Calculated Due, AMA & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60">
              {/* Auto Calculated Due */}
              <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl">
                <span className="text-[11px] text-red-700 font-semibold block">Auto-Calculated Due</span>
                <span className="font-mono text-base font-bold text-red-600 mt-0.5 block">
                  {calculatedDue.toLocaleString()} BDT
                </span>
                <span className="text-[10px] text-red-500">Price - Discount - Paid</span>
              </div>

              {/* After Marriage Amount (AMA) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">After Marriage Fee (AMA)</label>
                <input
                  type="number"
                  min="0"
                  value={afterMarriageFee}
                  onChange={(e) => setAfterMarriageFee(e.target.value)}
                  placeholder="e.g. 20000"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#181E54] focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash at Office</option>
                  <option value="Card">Credit/Debit Card</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 shrink-0">
            <div className="text-[11px] text-slate-500">
              {isAllFulfilled ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  All Traffic requirements fulfilled. Ready for pipeline promotion!
                </span>
              ) : (
                <span className="text-amber-700 font-medium">
                  ⚠️ Complete remaining ({totalCount - fulfilledCount}) requirements above to convert to Traffic.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isConverting}
                className={`px-6 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer group ${
                  isAllFulfilled
                    ? 'bg-[#181E54] hover:bg-[#12163f] text-white ring-2 ring-[#181E54]/20'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                <span>Convert to Traffic</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-[#D81124]" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
