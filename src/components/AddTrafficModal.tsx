import React, { useState, useEffect } from 'react';
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
  CreditCard,
  FileCheck,
  Image as ImageIcon,
  DollarSign,
  ShieldCheck,
  Calendar,
  Briefcase,
  MapPin,
  Heart,
  ChevronDown,
  Search,
  Phone,
} from 'lucide-react';
import { useTrafficValidation } from '../hooks/useTrafficValidation';

export interface AddTrafficModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  initialData?: any;
  token: string;
}

import { CountryFlag, COUNTRY_CODES, CountryCodeOption, detectCountryIso } from './CountryFlag';

// Static slide-in animation variants for step transitions (prevent re-creating on renders)
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

export const AddTrafficModal: React.FC<AddTrafficModalProps> = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  initialData,
  token,
}) => {
  // Wizard Step: 1 = Basic Info, 2 = Additional Info, 3 = Payment
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  // Step navigation helper with directional slide (memoized)
  const goToStep = React.useCallback((targetStep: 1 | 2 | 3) => {
    setCurrentStep((prev) => {
      if (targetStep === prev) return prev;
      setDirection(targetStep > prev ? 'forward' : 'backward');
      return targetStep;
    });
  }, []);

  // Client-side validation hook
  const {
    errors,
    generalError,
    setGeneralError,
    clearErrors,
    clearFieldError,
    validateForm,
    validateImageFiles,
    validatePdfFile,
  } = useTrafficValidation();

  // ==========================================
  // PART 1 - BASIC INFO
  // ==========================================
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCodeOption>(COUNTRY_CODES[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const countryDropdownRef = React.useRef<HTMLDivElement>(null);

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

  const filteredCountries = React.useMemo(() => {
    if (!countrySearch.trim()) return COUNTRY_CODES;
    const q = countrySearch.toLowerCase().trim();
    return COUNTRY_CODES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countrySearch]);
  const [email, setEmail] = useState('');

  // ==========================================
  // PART 2 - ADDITIONAL INFO
  // ==========================================
  const [assignBy, setAssignBy] = useState('');
  const [profession, setProfession] = useState('Private Service');
  const [jobType, setJobType] = useState('Private Job');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('Never Married');
  const [gender, setGender] = useState('Male');
  const [bodyColor, setBodyColor] = useState('Fair');
  const [height, setHeight] = useState('5\'6" (168 cm)');
  const [religion, setReligion] = useState('Islam (Sunni)');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [qualification, setQualification] = useState('Bachelor\'s / Honors');
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
  // PART 3 - PAYMENT
  // ==========================================
  const [pkg, setPkg] = useState('Gold');
  const [price, setPrice] = useState('15000');
  const [customPrice, setCustomPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [paidAmount, setPaidAmount] = useState('5000');
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [afterMarriageFee, setAfterMarriageFee] = useState('20000');
  const [customAfterMarriageFee, setCustomAfterMarriageFee] = useState('');

  // MK Accounts for "Assign By" selection menu
  const [mkAccounts, setMkAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Drag-and-drop feedback states
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);

  // Immediate file validation errors
  const [imageError, setImageError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Fetch MK Role Accounts for Assign By selection menu (only runs when modal opens)
  useEffect(() => {
    if (isOpen) {
      fetch('/api/users?role=MK', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setMkAccounts(data);
            setAssignBy((prev) => prev || (initialData?.assignBy ?? data[0].name));
          }
        })
        .catch((err) => console.error('Failed to load MK accounts:', err));
    }
  }, [isOpen, token]);

  // Sync state when editing or opening fresh
  useEffect(() => {
    if (initialData) {
      setCurrentStep(1);
      setName(initialData.name || '');
      const rawPhone = initialData.phone || '';
      const matchedCountry = COUNTRY_CODES.find((c) => rawPhone.startsWith(c.code));
      if (matchedCountry) {
        setSelectedCountry(matchedCountry);
        setPhone(rawPhone.slice(matchedCountry.code.length).trim());
      } else {
        setSelectedCountry(COUNTRY_CODES[0]);
        setPhone(rawPhone);
      }
      setEmail(initialData.email || '');
      setAssignBy(initialData.assignBy || '');
      setProfession(initialData.profession || 'Private Service');
      setJobType(initialData.jobType || 'Private Job');
      setDateOfBirth(initialData.dateOfBirth || '');
      setMaritalStatus(initialData.maritalStatus || 'Never Married');
      setGender(initialData.gender || 'Male');
      setBodyColor(initialData.bodyColor || 'Fair');
      setHeight(initialData.height || '5\'6" (168 cm)');
      setReligion(initialData.religion || 'Islam (Sunni)');
      setBloodGroup(initialData.bloodGroup || 'O+');
      setQualification(initialData.qualification || 'Bachelor\'s / Honors');
      setRequirement(initialData.requirement || '');
      setPresentCity(initialData.presentCity || '');
      setPresentCountry(initialData.presentCountry || 'Bangladesh');
      setPermanentCity(initialData.permanentCity || '');
      setPermanentCountry(initialData.permanentCountry || 'Bangladesh');
      setImages(initialData.images || []);
      setPdfFile(initialData.pdf || null);
      setPkg(initialData.package || 'Gold');
      setPrice(String(initialData.price ?? 15000));
      setDiscount(String(initialData.discount ?? 0));
      setPaidAmount(String(initialData.paidAmount ?? 5000));
      setPaymentMethod(initialData.paymentMethod || 'bKash');
      setAfterMarriageFee(String(initialData.afterMarriageFee ?? 20000));
      setImageError(null);
      setPdfError(null);
      clearErrors();
    } else if (isOpen) {
      setCurrentStep(1);
      setName('');
      setSelectedCountry(COUNTRY_CODES[0]);
      setPhone('');
      setEmail('');
      setProfession('Private Service');
      setJobType('Private Job');
      setDateOfBirth('');
      setMaritalStatus('Never Married');
      setGender('Male');
      setBodyColor('Fair');
      setHeight('5\'6" (168 cm)');
      setReligion('Islam (Sunni)');
      setBloodGroup('O+');
      setQualification('Bachelor\'s / Honors');
      setRequirement('');
      setPresentCity('');
      setPresentCountry('Bangladesh');
      setPermanentCity('');
      setPermanentCountry('Bangladesh');
      setSameAsPresent(false);
      setImages([]);
      setPdfFile(null);
      setPkg('Gold');
      setPrice('15000');
      setCustomPrice('');
      setDiscount('0');
      setPaidAmount('5000');
      setPaymentMethod('bKash');
      setAfterMarriageFee('20000');
      setCustomAfterMarriageFee('');
      setImageError(null);
      setPdfError(null);
      clearErrors();
    }
  }, [initialData, isOpen, clearErrors]);

  // Handle same address toggle
  const handleSameAsPresentToggle = (checked: boolean) => {
    setSameAsPresent(checked);
    if (checked) {
      setPermanentCity(presentCity);
      setPermanentCountry(presentCountry);
    }
  };

  // Auto-calculated due amount: Price - Discount - Paid (memoized to prevent re-calculations)
  const actualPriceValue = React.useMemo(
    () => (price === 'custom' ? Number(customPrice) || 0 : Number(price) || 0),
    [price, customPrice]
  );
  const numericDiscount = React.useMemo(() => Number(discount) || 0, [discount]);
  const numericPaid = React.useMemo(() => Number(paidAmount) || 0, [paidAmount]);
  const calculatedDue = React.useMemo(
    () => Math.max(0, actualPriceValue - numericDiscount - numericPaid),
    [actualPriceValue, numericDiscount, numericPaid]
  );
  const actualAfterMarriageFee = React.useMemo(
    () =>
      afterMarriageFee === 'custom'
        ? Number(customAfterMarriageFee) || 0
        : Number(afterMarriageFee) || 0,
    [afterMarriageFee, customAfterMarriageFee]
  );

  // Picture Upload Validation & Handling (Unlimited)
  const processImageFiles = async (files: File[]) => {
    setImageError(null);
    const { validFiles, error: validationError } = await validateImageFiles(files);

    if (validationError) {
      setImageError(validationError);
      setGeneralError(validationError);
      return;
    }

    setImageError(null);
    setGeneralError(null);

    for (const file of validFiles) {
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

  // PDF Document Validation & Handling (Strictly PDF only)
  const processPdfFile = async (file: File) => {
    setPdfError(null);
    const { isValid, error: validationError } = await validatePdfFile(file);

    if (!isValid || validationError) {
      setPdfError(validationError);
      setGeneralError(validationError);
      return;
    }

    setPdfError(null);
    setGeneralError(null);

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

  // Step 1 Validation before advancing
  const handleNextFromStep1 = () => {
    clearErrors();
    setGeneralError(null);

    if (!name.trim()) {
      setGeneralError('Please enter candidate name to proceed.');
      return;
    }
    if (!phone.trim()) {
      setGeneralError('Please enter official candidate phone number to proceed.');
      return;
    }
    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (selectedCountry.code === '+880') {
      if (!/^0?1[3-9]\d{8}$/.test(cleanPhone)) {
        setGeneralError('Please enter a valid Bangladeshi contact number (e.g. 017XXXXXXXX).');
        return;
      }
    } else {
      if (!/^\d{6,15}$/.test(cleanPhone)) {
        setGeneralError(`Please enter a valid phone number for ${selectedCountry.name}.`);
        return;
      }
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setGeneralError('Please enter a valid email address or leave it empty.');
      return;
    }

    setDirection('forward');
    setCurrentStep(2);
  };

  // Step 2 Validation before advancing
  const handleNextFromStep2 = () => {
    if (imageError || pdfError) {
      setGeneralError('Please resolve document/file format issues before proceeding.');
      return;
    }
    setGeneralError(null);
    setDirection('forward');
    setCurrentStep(3);
  };

  // Final Form Submission (Step 3)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (imageError || pdfError) {
      setGeneralError('Please resolve document or file format errors before saving.');
      return;
    }

    let formattedPhone = phone.trim();
    if (!phone.trim().startsWith('+')) {
      formattedPhone = `${selectedCountry.code} ${phone.trim()}`;
    }

    const isFormValid = validateForm({
      name,
      phone: formattedPhone,
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
      package: pkg,
      price: actualPriceValue,
      discount: numericDiscount,
      paidAmount: numericPaid,
      dueAmount: calculatedDue,
      paymentMethod,
      afterMarriageFee: actualAfterMarriageFee,
    });

    if (!isFormValid) {
      return;
    }

    setLoading(true);
    setGeneralError(null);

    try {
      let currentUser: any = null;
      try {
        const storedUser = sessionStorage.getItem('shadikabbo_user');
        if (storedUser) currentUser = JSON.parse(storedUser);
      } catch (e) {}

      const payload = {
        name,
        phone: formattedPhone,
        email,
        createdByName: currentUser?.name,
        createdByRole: currentUser?.role,
        assignBy: assignBy || (mkAccounts[0]?.name ?? 'MK Official'),
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
        package: pkg,
        price: actualPriceValue,
        discount: numericDiscount,
        paidAmount: numericPaid,
        dueAmount: calculatedDue,
        paymentMethod,
        afterMarriageFee: actualAfterMarriageFee,
        images,
        pdf: pdfFile,
      };

      const url = initialData ? `/api/traffic/${initialData.id}` : '/api/traffic';
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
        throw new Error(errorData.error || 'Failed to submit traffic form');
      }

      clearErrors();
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
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col h-[650px] max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#181E54] text-white flex items-center justify-center font-bold text-base shadow-xs">
              SK
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#181E54]">
                {initialData ? 'Edit Candidate Profile' : 'Add New Traffic'}
              </h2>
              <p className="text-xs text-slate-500">
                Matrimonial client onboarding &amp; record creation
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

        {/* MODERN MULTI-STEP PROGRESS STEPPER */}
        <div className="px-6 py-3.5 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between max-w-2xl mx-auto relative">
            {/* Connecting Progress Track */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-100 -z-0 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#181E54]"
                initial={false}
                animate={{
                  width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
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

            {/* Step 2: Additional Info */}
            <button
              type="button"
              onClick={() => {
                if (name && phone) goToStep(2);
              }}
              disabled={!name || !phone}
              className={`flex items-center gap-2 relative z-10 bg-white px-2 py-1 rounded-full focus:outline-none group ${
                !name || !phone ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep === 2
                    ? 'bg-[#181E54] text-white ring-4 ring-[#181E54]/20 shadow-sm'
                    : currentStep > 2
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {currentStep > 2 ? <CheckCircle className="w-4 h-4" /> : '2'}
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

            {/* Step 3: Payment */}
            <button
              type="button"
              onClick={() => {
                if (name && phone) goToStep(3);
              }}
              disabled={!name || !phone}
              className={`flex items-center gap-2 relative z-10 bg-white px-2 py-1 rounded-full focus:outline-none group ${
                !name || !phone ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep === 3
                    ? 'bg-[#181E54] text-white ring-4 ring-[#181E54]/20 shadow-sm'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                3
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Part 3</p>
                <p
                  className={`text-xs font-semibold ${
                    currentStep === 3 ? 'text-[#181E54]' : 'text-slate-600'
                  }`}
                >
                  Payment
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative"><AnimatePresence mode="wait" custom={direction}>
          
          {/* ======================================================== */}
          {/* STEP 1: PART 1 - BASIC INFO                              */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <motion.div key="step-1" custom={direction} variants={STEP_VARIANTS} initial="enter" animate="center" exit="exit" className="space-y-6 max-w-2xl mx-auto min-h-[440px]">
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60">
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
                      clearFieldError('name');
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
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
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

                    {/* Phone Number Input */}
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        clearFieldError('phone');
                      }}
                      placeholder={selectedCountry.placeholder}
                      required
                      className="flex-1 px-3.5 py-2.5 bg-transparent text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  {errors.phone && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* 3. Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearFieldError('email');
                    }}
                    placeholder="candidate@example.com"
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-slate-300 focus:ring-[#181E54]'
                    }`}
                  />
                  {errors.email && <p className="text-[11px] text-red-600 mt-1">{errors.email}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: PART 2 - ADDITIONAL INFO                         */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <motion.div key="step-2" custom={direction} variants={STEP_VARIANTS} initial="enter" animate="center" exit="exit" className="space-y-6 min-h-[440px]">
              
              {/* Top Banner: Assign By MK Role accounts */}
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80">
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
                    <select
                      value={assignBy}
                      onChange={(e) => setAssignBy(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                    >
                      {mkAccounts.length === 0 ? (
                        <option value="MK General Queue">MK Official Staff</option>
                      ) : (
                        mkAccounts.map((mk) => (
                          <option key={mk.id} value={mk.name}>
                            {mk.name} ({mk.phone})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Matrimonial Profile Specification */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                  <Heart className="w-4 h-4 text-[#D81124]" />
                  <h3 className="text-xs font-bold text-[#181E54] uppercase tracking-wider">
                    Bio &amp; Matrimonial Specification
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
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
                      <option value="Doctor">Doctor</option>
                      <option value="Software Engineer">Software Engineer</option>
                      <option value="Civil Engineer">Civil Engineer</option>
                      <option value="Electrical Engineer">Electrical Engineer</option>
                      <option value="Banker">Banker</option>
                      <option value="Business Owner">Business Owner</option>
                      <option value="Government Service">Government Service</option>
                      <option value="University Lecturer">University Lecturer</option>
                      <option value="Teacher">Teacher</option>
                      <option value="Chartered Accountant">Chartered Accountant</option>
                      <option value="Lawyer">Lawyer</option>
                      <option value="Defense Officer">Defense Officer</option>
                      <option value="Architect">Architect</option>
                      <option value="Private Service">Private Service</option>
                      <option value="Other">Other</option>
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
                      <option value="Never Married">Never Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Awaiting Divorce">Awaiting Divorce</option>
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
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
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
                      <option value="Fair">Fair</option>
                      <option value="Very Fair">Very Fair</option>
                      <option value="Wheatish">Wheatish</option>
                      <option value="Dusky">Dusky</option>
                      <option value="Dark">Dark</option>
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
                      <option value="Islam (Sunni)">Islam (Sunni)</option>
                      <option value="Islam (Shia)">Islam (Shia)</option>
                      <option value="Islam (Other)">Islam (Other)</option>
                      <option value="Hinduism">Hinduism</option>
                      <option value="Christianity">Christianity</option>
                      <option value="Buddhism">Buddhism</option>
                      <option value="Other">Other</option>
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Partner Requirement (Manually Input)
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
                    <span>Permanent address same as Present</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Present Address */}
                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Present Address
                    </span>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Present City / District
                      </label>
                      <input
                        type="text"
                        value={presentCity}
                        onChange={(e) => {
                          setPresentCity(e.target.value);
                          if (sameAsPresent) setPermanentCity(e.target.value);
                        }}
                        placeholder="e.g. Dhaka (Gulshan) or Chittagong"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Present Country
                      </label>
                      <input
                        type="text"
                        value={presentCountry}
                        onChange={(e) => {
                          setPresentCountry(e.target.value);
                          if (sameAsPresent) setPermanentCountry(e.target.value);
                        }}
                        placeholder="Bangladesh"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                      />
                    </div>
                  </div>

                  {/* Permanent Address */}
                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Permanent Address
                    </span>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Permanent City / District
                      </label>
                      <input
                        type="text"
                        value={permanentCity}
                        disabled={sameAsPresent}
                        onChange={(e) => setPermanentCity(e.target.value)}
                        placeholder="e.g. Sylhet or Comilla"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54] disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Permanent Country
                      </label>
                      <input
                        type="text"
                        value={permanentCountry}
                        disabled={sameAsPresent}
                        onChange={(e) => setPermanentCountry(e.target.value)}
                        placeholder="Bangladesh"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54] disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Uploads Section: Unlimited Pictures & PDF Only */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. PICTURE UPLOAD (Unlimited) */}
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
                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-all bg-white ${
                      isDraggingImages
                        ? 'border-[#181E54] bg-[#181E54]/5'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <label className="cursor-pointer block">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                      <p className="text-xs font-semibold text-slate-700">Click or Drag candidate photos</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WEBP</p>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {imageError && (
                    <p className="text-[11px] text-red-600 font-medium">{imageError}</p>
                  )}

                  {/* Thumbnail Gallery */}
                  {images.length > 0 && (
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative group/thumb w-14 h-14 rounded-lg overflow-hidden border border-slate-200">
                          <img src={img} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity"
                            title="Remove picture"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. PDF UPLOAD (PDF only) */}
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#D81124]" />
                      <span className="text-xs font-bold text-slate-800">Biodata / CV (PDF Only)</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      .pdf only
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
                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-all bg-white ${
                      isDraggingPdf
                        ? 'border-[#D81124] bg-[#D81124]/5'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <label className="cursor-pointer block">
                      <FileCheck className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                      <p className="text-xs font-semibold text-slate-700">Click or Drag PDF biodata</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Authentic .pdf document only</p>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handlePdfUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {pdfError && (
                    <p className="text-[11px] text-red-600 font-medium">{pdfError}</p>
                  )}

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
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: PART 3 - PAYMENT                                 */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <motion.div key="step-3" custom={direction} variants={STEP_VARIANTS} initial="enter" animate="center" exit="exit" className="space-y-6 max-w-3xl mx-auto min-h-[440px]">
              
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#181E54]" />
                    <h3 className="text-xs font-bold text-[#181E54] uppercase tracking-wider">
                      Matrimonial Package &amp; Settlement Details
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    Currency: BDT (৳)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* 1. Package - Selection Menu */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Package
                    </label>
                    <select
                      value={pkg}
                      onChange={(e) => {
                        const selectedPkg = e.target.value;
                        setPkg(selectedPkg);
                        // Optional preset pricing auto-set
                        if (selectedPkg === 'Bronze') setPrice('10000');
                        else if (selectedPkg === 'Silver') setPrice('15000');
                        else if (selectedPkg === 'Gold') setPrice('20000');
                        else if (selectedPkg === 'Diamond') setPrice('30000');
                        else if (selectedPkg === 'Platinum') setPrice('50000');
                        else if (selectedPkg === 'VIP Royal') setPrice('100000');
                        else if (selectedPkg === 'Free Trial') setPrice('0');
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                    >
                      <option value="Free Trial">Free Trial</option>
                      <option value="Bronze">Bronze Package</option>
                      <option value="Silver">Silver Package</option>
                      <option value="Gold">Gold Package</option>
                      <option value="Diamond">Diamond Package</option>
                      <option value="Platinum">Platinum Package</option>
                      <option value="VIP Royal">VIP Royal Package</option>
                      <option value="Custom">Custom Package</option>
                    </select>
                  </div>

                  {/* 2. Price - Selection Menu */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Price (BDT)
                    </label>
                    <select
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                    >
                      <option value="0">৳ 0 (Free)</option>
                      <option value="5000">৳ 5,000</option>
                      <option value="10000">৳ 10,000</option>
                      <option value="15000">৳ 15,000</option>
                      <option value="20000">৳ 20,000</option>
                      <option value="25000">৳ 25,000</option>
                      <option value="30000">৳ 30,000</option>
                      <option value="50000">৳ 50,000</option>
                      <option value="100000">৳ 1,00,000</option>
                      <option value="custom">Custom Amount</option>
                    </select>
                    {price === 'custom' && (
                      <input
                        type="number"
                        min="0"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        placeholder="Enter custom price"
                        className="w-full mt-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                      />
                    )}
                  </div>

                  {/* 3. Discount - Manually Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Discount (BDT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                    />
                  </div>

                  {/* 4. Paid Amount - Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Paid Amount (BDT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      placeholder="5000"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                    />
                  </div>

                  {/* 5. Due Amount - Auto Calculated */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Due Amount (Auto-Calculated)
                    </label>
                    <div
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold font-mono border flex items-center justify-between ${
                        calculatedDue > 0
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      <span>৳ {calculatedDue.toLocaleString()}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider">
                        {calculatedDue > 0 ? 'Pending Due' : 'Paid in Full'}
                      </span>
                    </div>
                  </div>

                  {/* 6. Payment Method - Selection Menu */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                    >
                      <option value="bKash">bKash (Personal / Merchant)</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Rocket">Rocket (DBBL)</option>
                      <option value="Bank Transfer">Bank Wire Transfer</option>
                      <option value="Cash">Cash Deposit</option>
                      <option value="Card">Credit / Debit Card</option>
                      <option value="Other">Other Gateway</option>
                    </select>
                  </div>

                  {/* 7. After Marriage Fee - Selection / Input */}
                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      After Marriage Success Fee (BDT)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={afterMarriageFee}
                        onChange={(e) => setAfterMarriageFee(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                      >
                        <option value="0">৳ 0 (No success fee)</option>
                        <option value="10000">৳ 10,000</option>
                        <option value="20000">৳ 20,000</option>
                        <option value="30000">৳ 30,000</option>
                        <option value="50000">৳ 50,000</option>
                        <option value="100000">৳ 1,00,000</option>
                        <option value="200000">৳ 2,00,000</option>
                        <option value="custom">Custom Success Fee</option>
                      </select>
                      {afterMarriageFee === 'custom' && (
                        <input
                          type="number"
                          min="0"
                          value={customAfterMarriageFee}
                          onChange={(e) => setCustomAfterMarriageFee(e.target.value)}
                          placeholder="Enter custom after marriage fee"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Live Settlement Breakdown Card */}
                <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white space-y-2">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800 font-semibold">
                    <span className="text-slate-400">Payment Breakdown</span>
                    <span className="text-amber-400 uppercase tracking-wider text-[10px]">
                      Package: {pkg}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div>
                      <p className="text-[10px] text-slate-400">Package Price</p>
                      <p className="font-bold text-white font-mono">৳ {actualPriceValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Discount</p>
                      <p className="font-bold text-emerald-400 font-mono">-৳ {numericDiscount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Paid Amount</p>
                      <p className="font-bold text-sky-400 font-mono">৳ {numericPaid.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Remaining Due</p>
                      <p className="font-bold text-rose-400 font-mono">৳ {calculatedDue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </form>

        {/* MODAL FOOTER NAVIGATION BAR */}
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
                onClick={() => { setDirection('backward'); setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : 1)); }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
              Step {currentStep} of 3
            </span>

            {currentStep === 1 && (
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#181E54] hover:bg-[#121642] text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <span>Next: Additional Info</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleNextFromStep2}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#181E54] hover:bg-[#121642] text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <span>Next: Payment Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#D81124] hover:bg-[#B80E1C] text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-70"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{loading ? 'Submitting...' : initialData ? 'Update Profile' : 'Add Traffic'}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
