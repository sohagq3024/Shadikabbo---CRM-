import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import {
  X,
  Upload,
  Trash2,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  User,
  FileCheck,
  Image as ImageIcon,
  Calendar,
  Briefcase,
  MapPin,
  Heart,
  ChevronDown,
  Search,
  Phone,
  Mail,
  Star,
  Layers,
} from 'lucide-react';
import { CountryFlag, COUNTRY_CODES, CountryCodeOption, detectCountryIso } from './CountryFlag';
import { useCrmFields } from '../context/CrmFieldsContext';

export interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  initialData?: any;
  token: string;
}

// Slide-in animation variants matching AddTrafficModal
const STEP_VARIANTS: Variants = {
  enter: (dir: 'forward' | 'backward') => ({
    x: dir === 'forward' ? 36 : -36,
    opacity: 0,
    scale: 0.985,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.28,
      ease: 'easeOut',
    },
  },
  exit: (dir: 'forward' | 'backward') => ({
    x: dir === 'forward' ? -36 : 36,
    opacity: 0,
    scale: 0.985,
    transition: {
      duration: 0.18,
      ease: 'easeIn',
    },
  }),
};

export const PROFESSIONS = [
  'Doctor',
  'Software Engineer',
  'Civil Engineer',
  'Electrical Engineer',
  'Banker',
  'Business Owner',
  'Government Service',
  'University Lecturer',
  'Teacher',
  'Chartered Accountant',
  'Lawyer',
  'Defense Officer',
  'Architect',
  'Private Service',
  'Other',
];

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  initialData,
  token,
}) => {
  const { fields } = useCrmFields();
  // Step: 1 = Basic Info, 2 = Additional Info
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const goToStep = useCallback((targetStep: 1 | 2) => {
    setCurrentStep((prev) => {
      if (targetStep === prev) return prev;
      setDirection(targetStep > prev ? 'forward' : 'backward');
      return targetStep;
    });
  }, []);

  // ==========================================
  // PART 1 - BASIC INFO
  // ==========================================
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCodeOption>(COUNTRY_CODES[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Close country dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };
    if (isCountryDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isCountryDropdownOpen]);

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRY_CODES;
    const q = countrySearch.toLowerCase().trim();
    return COUNTRY_CODES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  // ==========================================
  // PART 2 - ADDITIONAL INFO (Optional for Lead, Each adds % to Info Level)
  // ==========================================
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
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);

  // Validation & Error states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync initialData if editing
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setPhone(initialData.phone || '');
      setEmail(initialData.email || '');
      setCategory(initialData.category || '');
      setProfession(initialData.profession || '');
      setJobType(initialData.jobType || '');
      setDateOfBirth(initialData.dateOfBirth || '');
      setMaritalStatus(initialData.maritalStatus || '');
      setGender(initialData.gender || '');
      setBodyColor(initialData.bodyColor || '');
      setHeight(initialData.height || '');
      setReligion(initialData.religion || '');
      setBloodGroup(initialData.bloodGroup || '');
      setQualification(initialData.qualification || '');
      setRequirement(initialData.requirement || '');
      setPresentCity(initialData.presentCity || '');
      setPresentCountry(initialData.presentCountry || 'Bangladesh');
      setPermanentCity(initialData.permanentCity || '');
      setPermanentCountry(initialData.permanentCountry || 'Bangladesh');
      setSameAsPresent(false);
      setImages(Array.isArray(initialData.images) ? initialData.images : []);
      setPdfFile(initialData.pdf || null);
    } else {
      // Clean blank state - Starts empty so 1st only = 20% / 1 star
      setName('');
      setPhone('');
      setEmail('');
      setCategory('');
      setProfession('');
      setJobType('');
      setDateOfBirth('');
      setMaritalStatus('');
      setGender('');
      setBodyColor('');
      setHeight('');
      setReligion('');
      setBloodGroup('');
      setQualification('');
      setRequirement('');
      setPresentCity('');
      setPresentCountry('Bangladesh');
      setPermanentCity('');
      setPermanentCountry('Bangladesh');
      setSameAsPresent(false);
      setImages([]);
      setPdfFile(null);
    }
    setCurrentStep(1);
    setErrors({});
    setGeneralError(null);
  }, [initialData, isOpen]);

  // Handle same address toggle
  const handleSameAsPresentToggle = (checked: boolean) => {
    setSameAsPresent(checked);
    if (checked) {
      setPermanentCity(presentCity);
      setPermanentCountry(presentCountry);
    }
  };

  // Picture Upload Validation & Handling
  const processImageFiles = (files: File[]) => {
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setGeneralError('Invalid file type: Please upload authentic image files only.');
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processImageFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // PDF Document Validation & Handling
  const processPdfFile = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setGeneralError('Security validation failed: Only authentic PDF format (.pdf) is permitted for bio-data.');
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

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    processPdfFile(e.target.files[0]);
    e.target.value = '';
  };

  // Live Completeness Score calculation
  const completeness = useMemo(() => {
    let score = 0;
    // Part 1: Mandatory for Lead (Name + Phone + Category = 20%) -> Guarantees 20% & 1 Star
    if (name.trim()) score += 8;
    if (phone.trim()) score += 6;
    if (category.trim()) score += 6;

    // Part 2: Specific Optional Fields (each adds 8% -> 10 options * 8% = 80%)
    if (profession && profession.trim()) score += 8;
    if (dateOfBirth && dateOfBirth.trim()) score += 8;
    if (maritalStatus && maritalStatus.trim()) score += 8;
    if (gender && gender.trim()) score += 8;
    if (height && height.trim()) score += 8;
    if (religion && religion.trim()) score += 8;
    if (qualification && qualification.trim()) score += 8;
    if (presentCity.trim() || permanentCity.trim()) score += 8;
    if (images.length > 0) score += 8;
    if (pdfFile && (pdfFile.dataUrl || pdfFile.name)) score += 8;

    const percentage = Math.min(100, Math.max(0, score));
    // 1st part filled = 20% -> 1 Star (★☆☆☆☆)
    // 20-39% = 1 Star, 40-59% = 2 Stars, 60-79% = 3 Stars, 80-99% = 4 Stars, 100% = 5 Stars
    const stars = percentage < 20 ? 0 : Math.min(5, Math.floor(percentage / 20));
    return { percentage, stars };
  }, [
    name,
    phone,
    category,
    profession,
    dateOfBirth,
    maritalStatus,
    gender,
    height,
    religion,
    qualification,
    presentCity,
    permanentCity,
    images.length,
    pdfFile,
  ]);

  // Step 1 Validation & Navigation
  const handleNextFromStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Candidate full name is required';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Official phone number is required';
    }
    if (!category.trim()) {
      newErrors.category = 'Lead Source is mandatory to count as a lead';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setGeneralError('Please fill in the required fields before continuing.');
      return;
    }

    setErrors({});
    setGeneralError(null);
    setDirection('forward');
    setCurrentStep(2);
  };

  // Final Form Submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!name.trim() || !phone.trim() || !category.trim()) {
      setGeneralError('Candidate Name, Phone Number, and Lead Source are required.');
      setCurrentStep(1);
      return;
    }

    setLoading(true);
    setGeneralError(null);

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      category: category.trim(),
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
      images,
      pdf: pdfFile,
    };

    try {
      const url = initialData ? `/api/leads/${initialData.id}` : '/api/leads';
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit lead record');
      }

      onSubmitSuccess();
      onClose();
    } catch (err: any) {
      setGeneralError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 flex items-center justify-center p-3 md:p-6 transition-opacity duration-150">
      <div className="relative w-full max-w-6xl xl:max-w-7xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-6 flex flex-col h-[700px] lg:h-[750px] max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#181E54] text-white flex items-center justify-center font-bold text-base shadow-xs">
              LD
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#181E54]">
                {initialData ? 'Edit Matrimonial Lead' : 'Add New Lead'}
              </h2>
              <p className="text-xs text-slate-500">
                Primary stage inquiry registration (Lead → Traffic → Payment → Paid Traffic)
              </p>
            </div>
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

        {/* MULTI-STEP PROGRESS STEPPER (Wide Web Optimized) */}
        <div className="px-6 py-3.5 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between max-w-3xl mx-auto relative">
            {/* Connecting Progress Track */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-100 -z-0 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#181E54]"
                initial={false}
                animate={{
                  width: currentStep === 1 ? '0%' : '100%',
                }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            {/* Step 1: Basic Info */}
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="flex items-center gap-2 relative z-10 bg-white px-2 py-1 rounded-full cursor-pointer focus:outline-none group"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep === 1
                    ? 'bg-[#181E54] text-white ring-4 ring-[#181E54]/20 shadow-sm'
                    : currentStep > 1
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {currentStep > 1 ? <CheckCircle className="w-4 h-4" /> : '1'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Part 1</p>
                <p
                  className={`text-xs font-semibold ${
                    currentStep === 1 ? 'text-[#181E54]' : 'text-slate-600'
                  }`}
                >
                  Basic Info
                </p>
              </div>
            </button>

            {/* Live Info Level Indicator Center Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 z-10">
              <span className="text-[10px] font-bold uppercase text-slate-500">Info Level:</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3 h-3 ${
                      s <= completeness.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="font-mono text-xs font-bold text-[#181E54] ml-1">
                {completeness.percentage}%
              </span>
            </div>

            {/* Step 2: Additional Info */}
            <button
              type="button"
              onClick={() => {
                if (name && phone && category) goToStep(2);
              }}
              disabled={!name || !phone || !category}
              className={`flex items-center gap-2 relative z-10 bg-white px-2 py-1 rounded-full focus:outline-none group ${
                !name || !phone || !category ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep === 2
                    ? 'bg-[#181E54] text-white ring-4 ring-[#181E54]/20 shadow-sm'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                2
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Part 2</p>
                <p
                  className={`text-xs font-semibold ${
                    currentStep === 2 ? 'text-[#181E54]' : 'text-slate-600'
                  }`}
                >
                  Additional Info
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Global Error Alert Banner */}
        {generalError && (
          <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2.5 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#D81124]" />
            <span className="font-medium">{generalError}</span>
          </div>
        )}

        {/* MAIN MULTI-STEP FORM BODY */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative">
          <AnimatePresence mode="wait" custom={direction}>
            {/* ======================================================== */}
            {/* STEP 1: PART 1 - BASIC INFO                              */}
            {/* ======================================================== */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={STEP_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-5 w-full min-h-[400px]"
              >
                <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#181E54] text-white flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#181E54]">Candidate Primary Details</h3>
                        <p className="text-[11px] text-slate-500">
                          Essential identity and contact credentials for the client
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      Step 1 of 3
                    </span>
                  </div>

                  {/* 2-Column Responsive Grid for Web */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* LEFT COLUMN: Name & Phone */}
                    <div className="space-y-4">
                      {/* 1. Name */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Candidate Full Name <span className="text-[#D81124]">*</span>
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (errors.name) {
                              setErrors((prev) => ({ ...prev, name: '' }));
                            }
                          }}
                          placeholder="e.g. Farhana Yasmin or Tanvir Ahmed"
                          required
                          autoFocus
                          className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                            errors.name
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-slate-300 focus:ring-[#181E54]'
                          }`}
                        />
                        {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
                      </div>

                      {/* 2. Official Phone Number with Country Flag & Code Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Official Phone Number <span className="text-[#D81124]">*</span>
                        </label>

                        <div className="relative flex items-center rounded-xl border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-[#181E54] focus-within:border-transparent transition-all">
                          {/* Country Code Trigger Button */}
                          <div ref={countryDropdownRef} className="relative shrink-0">
                            <button
                              type="button"
                              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-l-xl border-r border-slate-200 text-xs font-semibold text-slate-800 transition-colors cursor-pointer select-none"
                              title={`Selected: ${selectedCountry.name} (${selectedCountry.code})`}
                            >
                              <CountryFlag iso={selectedCountry.iso} name={selectedCountry.name} className="w-6 h-4" />
                              <span className="font-mono text-slate-700 text-xs">{selectedCountry.code}</span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                                  isCountryDropdownOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </button>

                            {/* Dropdown Menu */}
                            {isCountryDropdownOpen && (
                              <div className="absolute left-0 top-full mt-1.5 w-64 max-h-60 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col">
                                {/* Search inside dropdown */}
                                <div className="p-2 border-b border-slate-100 bg-slate-50">
                                  <div className="relative">
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                    <input
                                      type="text"
                                      value={countrySearch}
                                      onChange={(e) => setCountrySearch(e.target.value)}
                                      placeholder="Search country or code..."
                                      className="w-full pl-8 pr-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#181E54]"
                                      autoFocus
                                    />
                                  </div>
                                </div>

                                {/* Country List */}
                                <div className="overflow-y-auto flex-1 divide-y divide-slate-50 p-1">
                                  {filteredCountries.length === 0 ? (
                                    <div className="p-3 text-center text-xs text-slate-400">
                                      No country found
                                    </div>
                                  ) : (
                                    filteredCountries.map((c) => (
                                      <button
                                        key={c.code + c.name}
                                        type="button"
                                        onClick={() => {
                                          setSelectedCountry(c);
                                          setIsCountryDropdownOpen(false);
                                          setCountrySearch('');
                                        }}
                                        className={`w-full flex items-center justify-between px-2.5 py-2 text-left text-xs rounded-lg transition-colors cursor-pointer ${
                                          selectedCountry.code === c.code && selectedCountry.name === c.name
                                            ? 'bg-[#181E54]/10 text-[#181E54] font-semibold'
                                            : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <CountryFlag iso={c.iso} name={c.name} className="w-6 h-4" />
                                          <span className="truncate text-xs">{c.name}</span>
                                        </div>
                                        <span className="font-mono text-[11px] text-slate-500 shrink-0 ml-2">
                                          {c.code}
                                        </span>
                                      </button>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Phone Input */}
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => {
                              setPhone(e.target.value);
                              if (errors.phone) {
                                setErrors((prev) => ({ ...prev, phone: '' }));
                              }
                            }}
                            placeholder="e.g. 01711223344"
                            required
                            className="w-full px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none rounded-r-xl"
                          />
                        </div>
                        {errors.phone && <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Email & Source */}
                    <div className="space-y-4">
                      {/* 3. Email (Optional) */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. client@gmail.com"
                            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                          />
                        </div>
                      </div>

                      {/* 4. Source (Mandatory Selection Menu to count as Lead) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            Source <span className="text-[#D81124]">*</span>
                          </label>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Mandatory to qualify as a Lead
                          </span>
                        </div>
                        <div className="relative">
                          <Layers className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <select
                            value={category}
                            onChange={(e) => {
                              setCategory(e.target.value);
                              if (errors.category) {
                                setErrors((prev) => ({ ...prev, category: '' }));
                              }
                            }}
                            required
                            className={`w-full pl-10 pr-10 py-2.5 bg-white border rounded-xl text-xs appearance-none focus:outline-none focus:ring-2 cursor-pointer transition-colors ${
                              errors.category
                                ? 'border-red-500 focus:ring-red-500 bg-red-50/20 text-red-900'
                                : category
                                ? 'border-slate-300 focus:ring-[#181E54] text-slate-900 font-medium'
                                : 'border-slate-300 focus:ring-[#181E54] text-slate-400'
                            }`}
                          >
                            <option value="" disabled>
                              Select Lead Source...
                            </option>
                            {(fields.leadCategories && fields.leadCategories.length > 0
                              ? fields.leadCategories
                              : [
                                  'FB Message',
                                  'FB Call',
                                  'FB Comment',
                                  'Call center',
                                  'Reference',
                                  'Others source',
                                ]
                            ).map((cat: string) => (
                              <option key={cat} value={cat} className="text-slate-800 py-1 font-medium">
                                {cat}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        {errors.category && (
                          <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                            <span>{errors.category}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Live Candidate Summary Strip */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200/90 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="font-bold text-[#181E54]">Live Preview:</span>
                      <span className="font-semibold text-slate-900">{name || '(No Name entered)'}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-700">{phone ? `${selectedCountry.code} ${phone}` : '(No Phone)'}</span>
                      <span>•</span>
                      <span className="text-slate-500">{email || 'No Email'}</span>
                    </div>
                    <div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${category ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        Source: {category || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* STEP 2: PART 2 - ADDITIONAL INFO (Matching AddTraffic)   */}
            {/* ======================================================== */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={STEP_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-6 min-h-[440px]"
              >
                {/* Matrimonial Profile Specification (Same as AddTrafficModal) */}
                <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                    <Heart className="w-4 h-4 text-[#D81124]" />
                    <h3 className="text-xs font-bold text-[#181E54] uppercase tracking-wider">
                      Bio &amp; Matrimonial Specification
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                    {/* Profession Selection Menu */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Profession
                      </label>
                      <select
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                      >
                        <option value="">Select Profession...</option>
                        {(fields.professions || PROFESSIONS).map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Job Type Selection Menu */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Job Type
                      </label>
                      <select
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                      >
                        <option value="">Select Job Type...</option>
                        {(fields.jobTypes || []).map((jt) => (
                          <option key={jt} value={jt}>
                            {jt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date of Birth Input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                      />
                    </div>

                    {/* Marital Status Selection Menu */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Marital Status
                      </label>
                      <select
                        value={maritalStatus}
                        onChange={(e) => setMaritalStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                      >
                        <option value="">Select Marital Status...</option>
                        {(fields.maritalStatuses || []).map((ms) => (
                          <option key={ms} value={ms}>
                            {ms}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Gender Selection Menu */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                      >
                        <option value="">Select Gender...</option>
                        {(fields.genders || []).map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Body Color Selection Menu */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Body Color
                      </label>
                      <select
                        value={bodyColor}
                        onChange={(e) => setBodyColor(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                      >
                        <option value="">Select Body Color...</option>
                        {(fields.bodyColors || []).map((bc) => (
                          <option key={bc} value={bc}>
                            {bc}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Height Selection Menu */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Height
                      </label>
                      <select
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                      >
                        <option value="">Select Height...</option>
                        {(fields.heights || []).map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Religion Selection Menu */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Religion
                      </label>
                      <select
                        value={religion}
                        onChange={(e) => setReligion(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                      >
                        <option value="">Select Religion...</option>
                        {(fields.religions || []).map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Blood Group Selection Menu */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Blood Group
                      </label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                      >
                        <option value="">Select Blood Group...</option>
                        {(fields.bloodGroups || []).map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Qualification Selection Menu */}
                    <div className="sm:col-span-2 md:col-span-3">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Qualification
                      </label>
                      <select
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                      >
                        <option value="">Select Qualification...</option>
                        {(fields.qualifications || []).map((q) => (
                          <option key={q} value={q}>
                            {q}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Requirement - Manually Input */}
                    <div className="sm:col-span-2 md:col-span-3">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Partner Requirement (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={requirement}
                        onChange={(e) => setRequirement(e.target.value)}
                        placeholder="Candidate's expectations regarding age, height, education, family background, or district preferences..."
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#181E54] resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2-Column Responsive Section: Address Details on Left, Uploads on Right */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                  {/* Address Section */}
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#181E54]" />
                        <h3 className="text-xs font-bold text-[#181E54] uppercase tracking-wider">
                          Address Details
                        </h3>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sameAsPresent}
                          onChange={(e) => handleSameAsPresentToggle(e.target.checked)}
                          className="rounded border-slate-300 text-[#181E54] focus:ring-[#181E54]"
                        />
                        <span>Same as Present</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Present Address */}
                      <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Present Address
                        </span>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            City / District
                          </label>
                          <select
                            value={presentCity}
                            onChange={(e) => {
                              setPresentCity(e.target.value);
                              if (sameAsPresent) setPermanentCity(e.target.value);
                            }}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                          >
                            <option value="">Select City / District</option>
                            {(fields.cities || []).map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                            {presentCity && !(fields.cities || []).includes(presentCity) && (
                              <option value={presentCity}>{presentCity} (Custom)</option>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Country
                          </label>
                          <select
                            value={presentCountry}
                            onChange={(e) => {
                              setPresentCountry(e.target.value);
                              if (sameAsPresent) setPermanentCountry(e.target.value);
                            }}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                          >
                            <option value="">Select Country</option>
                            {(fields.countries || []).map((co) => (
                              <option key={co} value={co}>{co}</option>
                            ))}
                            {presentCountry && !(fields.countries || []).includes(presentCountry) && (
                              <option value={presentCountry}>{presentCountry} (Custom)</option>
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Permanent Address */}
                      <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Permanent Address
                        </span>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            City / District (Permanent CT)
                          </label>
                          <select
                            value={permanentCity}
                            disabled={sameAsPresent}
                            onChange={(e) => setPermanentCity(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54] disabled:opacity-60"
                          >
                            <option value="">Select Permanent City</option>
                            {(fields.cities || []).map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                            {permanentCity && !(fields.cities || []).includes(permanentCity) && (
                              <option value={permanentCity}>{permanentCity} (Custom)</option>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Country
                          </label>
                          <select
                            value={permanentCountry}
                            disabled={sameAsPresent}
                            onChange={(e) => setPermanentCountry(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54] disabled:opacity-60"
                          >
                            <option value="">Select Country</option>
                            {(fields.countries || []).map((co) => (
                              <option key={co} value={co}>{co}</option>
                            ))}
                            {permanentCountry && !(fields.countries || []).includes(permanentCountry) && (
                              <option value={permanentCountry}>{permanentCountry} (Custom)</option>
                            )}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Uploads Section: Unlimited Pictures & PDF Only */}
                  <div className="space-y-4">
                    {/* 1. PICTURE UPLOAD */}
                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-[#181E54]" />
                          <span className="text-xs font-bold text-slate-800">
                            Picture Upload ({images.length})
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Unlimited allowed
                        </span>
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
                        className={`border-2 border-dashed rounded-xl p-3 text-center transition-all bg-white ${
                          isDraggingImages
                            ? 'border-[#181E54] bg-[#181E54]/5'
                            : 'border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <label className="cursor-pointer block">
                          <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                          <p className="text-xs font-semibold text-slate-700">Click or Drag images here</p>
                          <p className="text-[10px] text-slate-400">Supports JPG, PNG, WEBP</p>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {images.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 max-h-28 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200">
                          {images.map((img, idx) => (
                            <div
                              key={idx}
                              className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-2xs"
                            >
                              <img src={img} alt="candidate" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute inset-0 bg-red-600/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title="Delete photo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 2. PDF UPLOAD */}
                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#D81124]" />
                          <span className="text-xs font-bold text-slate-800">PDF Bio-data</span>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                          PDF only
                        </span>
                      </div>

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
                        className={`border-2 border-dashed rounded-xl p-3 text-center transition-all bg-white ${
                          isDraggingPdf
                            ? 'border-[#D81124] bg-[#D81124]/5'
                            : 'border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <label className="cursor-pointer block">
                          <FileCheck className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                          <p className="text-xs font-semibold text-slate-700">Click or Drag PDF biodata</p>
                          <p className="text-[10px] text-slate-400">Authentic .pdf document only</p>
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handlePdfUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {pdfFile && (
                        <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="truncate font-medium">{pdfFile.name}</span>
                            <span className="text-[10px] text-emerald-600 shrink-0">
                              ({(pdfFile.size / 1024).toFixed(0)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPdfFile(null)}
                            className="text-emerald-700 hover:text-rose-600 p-1"
                            title="Remove PDF"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* MODAL FOOTER NAVIGATION BAR (Matching AddTrafficModal layout) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {currentStep === 1 ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDirection('backward');
                  setCurrentStep(1);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Basic Info</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
              Step {currentStep} of 2
            </span>

            {currentStep === 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={loading || !name.trim() || !phone.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
                  title="Directly save lead with Basic Info (Name & Phone = 20% • 1 Star)"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Save Lead (20% • 1 Star)</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextFromStep1}
                  className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-[#181E54] hover:bg-[#121642] text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <span>Next: Additional Info (+%)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#D81124] hover:bg-[#B80E1C] text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>{initialData ? 'Update Lead' : 'Save Lead'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
