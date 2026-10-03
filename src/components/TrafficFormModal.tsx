import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useTrafficValidation } from '../hooks/useTrafficValidation';
import { useCrmFields } from '../context/CrmFieldsContext';

interface TrafficFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  initialData?: any; // If provided, modal is in Edit mode
  token: string;
}

export const TrafficFormModal: React.FC<TrafficFormModalProps> = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  initialData,
  token,
}) => {
  const { fields } = useCrmFields();
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

  // PART 1 - Basic info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // PART 2 - Additional info
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

  // ADDRESS SECTION
  const [presentCity, setPresentCity] = useState('');
  const [presentCountry, setPresentCountry] = useState('Bangladesh');
  const [permanentCity, setPermanentCity] = useState('');
  const [permanentCountry, setPermanentCountry] = useState('Bangladesh');

  // PICTURE UPLOAD (unlimited)
  const [images, setImages] = useState<string[]>([]);

  // PDF UPLOAD (pdf only)
  const [pdfFile, setPdfFile] = useState<{ name: string; size: number; dataUrl: string } | null>(null);

  // PART 3 - Payment
  const [pkg, setPkg] = useState('Gold');
  const [price, setPrice] = useState('15000');
  const [discount, setDiscount] = useState('0');
  const [paidAmount, setPaidAmount] = useState('5000');
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [afterMarriageFee, setAfterMarriageFee] = useState('20000');

  // MK Accounts for "Assign By"
  const [mkAccounts, setMkAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load MK Accounts from backend
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/users?role=MK', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMkAccounts(data);
          if (data.length > 0 && !assignBy && !initialData) {
            setAssignBy(data[0].name);
          }
        }
      })
      .catch((err) => console.error('Error fetching MK accounts:', err));
  }, [isOpen, token]);

  // Sync initialData if editing
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setPhone(initialData.phone || '');
      setEmail(initialData.email || '');
      setAssignBy(initialData.assignBy || '');
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
      setImages(initialData.images || []);
      setPdfFile(initialData.pdf || null);
      setPkg(initialData.package || 'Gold');
      setPrice(String(initialData.price ?? 15000));
      setDiscount(String(initialData.discount ?? 0));
      setPaidAmount(String(initialData.paidAmount ?? 5000));
      setPaymentMethod(initialData.paymentMethod || 'bKash');
      setAfterMarriageFee(String(initialData.afterMarriageFee ?? 20000));
    } else {
      // Reset form
      setName('');
      setPhone('');
      setEmail('');
      setAssignBy(mkAccounts[0]?.name || '');
      setProfession('Business Owner');
      setJobType('Full Time');
      setDateOfBirth('1996-05-15');
      setMaritalStatus('Never Married');
      setGender('Male');
      setBodyColor('Fair');
      setHeight("5'9\"");
      setReligion('Islam (Sunni)');
      setBloodGroup('O+');
      setQualification("Bachelor's / Honors");
      setRequirement('Educated, family-oriented partner with shared values.');
      setPresentCity('Dhaka');
      setPresentCountry('Bangladesh');
      setPermanentCity('Dhaka');
      setPermanentCountry('Bangladesh');
      setImages([]);
      setPdfFile(null);
      setPkg('Gold');
      setPrice('15000');
      setDiscount('0');
      setPaidAmount('5000');
      setPaymentMethod('bKash');
      setAfterMarriageFee('20000');
      clearErrors();
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Due calculation: Price - Discount - Paid
  const numericPrice = Number(price) || 0;
  const numericDiscount = Number(discount) || 0;
  const numericPaid = Number(paidAmount) || 0;
  const calculatedDue = Math.max(0, numericPrice - numericDiscount - numericPaid);

  // Unlimited picture upload handler with binary & MIME verification
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);

  const processImageFiles = async (files: File[]) => {
    const { validFiles, error: validationError } = await validateImageFiles(files);
    
    if (validationError) {
      setGeneralError(validationError);
      return;
    }

    setGeneralError(null);

    // Read validated files as base64 Data URLs
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

  // PDF upload only handler with strict MIME, extension, and %PDF- signature validation
  const processPdfFile = async (file: File) => {
    const { isValid, error: validationError } = await validatePdfFile(file);

    if (!isValid || validationError) {
      setGeneralError(validationError);
      return;
    }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isFormValid = validateForm({
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
      package: pkg,
      price: numericPrice,
      discount: numericDiscount,
      paidAmount: numericPaid,
      dueAmount: calculatedDue,
      paymentMethod,
      afterMarriageFee: Number(afterMarriageFee) || 0,
    });

    if (!isFormValid) {
      return;
    }

    setLoading(true);
    try {
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
        requirement,
        presentCity,
        presentCountry,
        permanentCity,
        permanentCountry,
        images,
        pdf: pdfFile,
        package: pkg,
        price: numericPrice,
        discount: numericDiscount,
        paidAmount: numericPaid,
        dueAmount: calculatedDue,
        paymentMethod,
        afterMarriageFee: Number(afterMarriageFee) || 0,
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-[#181E54]">
              {initialData ? 'Edit Traffic Profile' : 'Add Traffic'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Fill in the required information to register customer traffic
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {generalError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#D81124]" />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-8 max-h-[78vh] overflow-y-auto">
          
          {/* PART 1 - Basic info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D81124]">Part 1</span>
              <h3 className="text-sm font-bold text-[#181E54]">Basic Info</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Name <span className="text-[#D81124]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearFieldError('name');
                  }}
                  placeholder="Full Name"
                  required
                  className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 ${
                    errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-[#181E54]'
                  }`}
                />
                {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Phone Number <span className="text-[#D81124]">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearFieldError('phone');
                  }}
                  placeholder="01XXXXXXXXX"
                  required
                  className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 ${
                    errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-[#181E54]'
                  }`}
                />
                {errors.phone && <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError('email');
                  }}
                  placeholder="example@mail.com"
                  className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 ${
                    errors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-[#181E54]'
                  }`}
                />
                {errors.email && <p className="text-[11px] text-red-600 mt-1">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* PART 2 - Additional info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D81124]">Part 2</span>
              <h3 className="text-sm font-bold text-[#181E54]">Additional Info</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Assign By: Selection menu. It must show all MK role accounts. */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Assign By (MK Role Accounts)
                </label>
                <select
                  value={assignBy}
                  onChange={(e) => setAssignBy(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  {mkAccounts.length === 0 ? (
                    <option value="MK Official">MK General Queue</option>
                  ) : (
                    mkAccounts.map((mk) => (
                      <option key={mk.id} value={mk.name}>
                        {mk.name} ({mk.phone})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Profession */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Profession
                </label>
                <select
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="">Select Profession</option>
                  {(fields.professions || []).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                  {profession && !(fields.professions || []).includes(profession) && (
                    <option value={profession}>{profession} (Custom)</option>
                  )}
                </select>
              </div>

              {/* Job Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Job Type
                </label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="">Select Job Type</option>
                  {(fields.jobTypes || []).map((jt) => (
                    <option key={jt} value={jt}>
                      {jt}
                    </option>
                  ))}
                  {jobType && !(fields.jobTypes || []).includes(jobType) && (
                    <option value={jobType}>{jobType} (Custom)</option>
                  )}
                </select>
              </div>

              {/* Date of birth */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Date of birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                />
              </div>

              {/* Marital status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Marital status
                </label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="">Select Marital Status</option>
                  {(fields.maritalStatuses || []).map((ms) => (
                    <option key={ms} value={ms}>
                      {ms}
                    </option>
                  ))}
                  {maritalStatus && !(fields.maritalStatuses || []).includes(maritalStatus) && (
                    <option value={maritalStatus}>{maritalStatus} (Custom)</option>
                  )}
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="">Select Gender</option>
                  {(fields.genders || []).map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                  {gender && !(fields.genders || []).includes(gender) && (
                    <option value={gender}>{gender} (Custom)</option>
                  )}
                </select>
              </div>

              {/* Body color */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Body color
                </label>
                <select
                  value={bodyColor}
                  onChange={(e) => setBodyColor(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="">Select Body Color</option>
                  {(fields.bodyColors || []).map((bc) => (
                    <option key={bc} value={bc}>
                      {bc}
                    </option>
                  ))}
                  {bodyColor && !(fields.bodyColors || []).includes(bodyColor) && (
                    <option value={bodyColor}>{bodyColor} (Custom)</option>
                  )}
                </select>
              </div>

              {/* Height */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Height
                </label>
                <select
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="">Select Height</option>
                  {(fields.heights || []).map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                  {height && !(fields.heights || []).includes(height) && (
                    <option value={height}>{height} (Custom)</option>
                  )}
                </select>
              </div>

              {/* Religion */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Religion
                </label>
                <select
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="">Select Religion</option>
                  {(fields.religions || []).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                  {religion && !(fields.religions || []).includes(religion) && (
                    <option value={religion}>{religion} (Custom)</option>
                  )}
                </select>
              </div>

              {/* Blood group */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Blood group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="">Select Blood Group</option>
                  {(fields.bloodGroups || []).map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                  {bloodGroup && !(fields.bloodGroups || []).includes(bloodGroup) && (
                    <option value={bloodGroup}>{bloodGroup} (Custom)</option>
                  )}
                </select>
              </div>

              {/* Qualification */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Qualification
                </label>
                <select
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="">Select Qualification</option>
                  {(fields.qualifications || []).map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                  {qualification && !(fields.qualifications || []).includes(qualification) && (
                    <option value={qualification}>{qualification} (Custom)</option>
                  )}
                </select>
              </div>

              {/* Requirement: Manual input */}
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Requirement (Manual Input)
                </label>
                <textarea
                  rows={2}
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  placeholder="Detail matrimonial partner expectations, family background requirements, etc."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                />
              </div>
            </div>

            {/* ADDRESS SECTION */}
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">Address Section</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-3">
                  <span className="text-xs font-bold text-[#181E54]">Present Address</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Present City / District</label>
                      <select
                        value={presentCity}
                        onChange={(e) => setPresentCity(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                      >
                        <option value="">Select Present City</option>
                        {(fields.cities || []).map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        {presentCity && !(fields.cities || []).includes(presentCity) && (
                          <option value={presentCity}>{presentCity} (Custom)</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Present Country</label>
                      <select
                        value={presentCountry}
                        onChange={(e) => setPresentCountry(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                      >
                        <option value="">Select Present Country</option>
                        {(fields.countries || []).map((co) => (
                          <option key={co} value={co}>{co}</option>
                        ))}
                        {presentCountry && !(fields.countries || []).includes(presentCountry) && (
                          <option value={presentCountry}>{presentCountry} (Custom)</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold text-[#181E54]">Permanent Address</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Permanent City / District (CT)</label>
                      <select
                        value={permanentCity}
                        onChange={(e) => setPermanentCity(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                      >
                        <option value="">Select Permanent City (CT)</option>
                        {(fields.cities || []).map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        {permanentCity && !(fields.cities || []).includes(permanentCity) && (
                          <option value={permanentCity}>{permanentCity} (Custom)</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Permanent Country</label>
                      <select
                        value={permanentCountry}
                        onChange={(e) => setPermanentCountry(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                      >
                        <option value="">Select Permanent Country</option>
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
            </div>

            {/* PICTURE UPLOAD (unlimited) & PDF UPLOAD (pdf only) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Unlimited Picture Upload */}
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
                className={`p-4 rounded-2xl border transition-all ${
                  isDraggingImages
                    ? 'border-[#D81124] bg-red-50/50 ring-2 ring-[#D81124]/20'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-[#181E54]">
                      Picture Upload
                    </label>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[9px] uppercase tracking-wide">
                      Images Only (JPG, PNG, WEBP)
                    </span>
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 shadow-xs transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#D81124]" />
                    <span>Select Images</span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {images.length > 0 ? (
                  <div>
                    <p className="text-[10px] text-slate-500 mb-2 font-medium">
                      Uploaded photos: <span className="font-bold text-[#181E54]">{images.length}</span> (Drop more images anytime)
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-100 shadow-xs">
                          <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Remove picture"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-300 rounded-xl p-3 text-center bg-white/60">
                    <p className="text-[11px] text-slate-500">
                      Drag &amp; drop photos here or click <span className="font-semibold text-[#181E54]">&ldquo;Select Images&rdquo;</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Strictly verified image files only (max 15MB each)</p>
                  </div>
                )}
              </div>

              {/* PDF Upload Only */}
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
                className={`p-4 rounded-2xl border transition-all ${
                  isDraggingPdf
                    ? 'border-[#181E54] bg-indigo-50/50 ring-2 ring-[#181E54]/20'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-[#181E54]">
                      PDF Upload
                    </label>
                    <span className="px-2 py-0.5 rounded-md bg-red-50 text-[#D81124] border border-red-200 font-bold text-[9px] uppercase tracking-wide">
                      PDF Only (.pdf)
                    </span>
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 shadow-xs transition-colors">
                    <FileText className="w-3.5 h-3.5 text-[#181E54]" />
                    <span>Upload Bio-data PDF</span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {pdfFile ? (
                  <div className="flex items-center justify-between p-2.5 mt-2 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-5 h-5 text-[#D81124] shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-medium text-slate-800 truncate">{pdfFile.name}</p>
                        <p className="text-[10px] text-slate-400">{(pdfFile.size / 1024).toFixed(1)} KB · Verified PDF document</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPdfFile(null)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer transition-colors"
                      title="Remove PDF"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-300 rounded-xl p-3 text-center bg-white/60">
                    <p className="text-[11px] text-slate-500">
                      Drag &amp; drop biodata PDF here or click <span className="font-semibold text-[#181E54]">&ldquo;Upload Bio-data PDF&rdquo;</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Strictly authentic PDF documents only (max 25MB)</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PART 3 - Payment */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D81124]">Part 3</span>
              <h3 className="text-sm font-bold text-[#181E54]">Payment</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Package */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Package
                </label>
                <select
                  value={pkg}
                  onChange={(e) => setPkg(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  {(fields.packages || ['Silver', 'Gold', 'Platinum', 'Royal Diamond', 'VIP Customized']).map((p) => (
                    <option key={p} value={p}>
                      {p.includes('Package') ? p : `${p} Package`}
                    </option>
                  ))}
                  {pkg && !(fields.packages || []).includes(pkg) && (
                    <option value={pkg}>{pkg}</option>
                  )}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Price
                </label>
                <select
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="5000">5,000 BDT</option>
                  <option value="10000">10,000 BDT</option>
                  <option value="15000">15,000 BDT</option>
                  <option value="20000">20,000 BDT</option>
                  <option value="25000">25,000 BDT</option>
                  <option value="35000">35,000 BDT</option>
                  <option value="50000">50,000 BDT</option>
                  <option value="100000">100,000 BDT</option>
                </select>
              </div>

              {/* Discount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Discount
                </label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                />
              </div>

              {/* Due Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Due Amount
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${calculatedDue.toLocaleString()} BDT`}
                  className="w-full px-3.5 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-red-600 cursor-not-allowed"
                />
              </div>

              {/* Paid Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Paid Amount
                </label>
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                />
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Payment method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Card (POS)">Card (POS)</option>
                </select>
              </div>

              {/* After marriage fee */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  After marriage fee
                </label>
                <input
                  type="number"
                  min="0"
                  value={afterMarriageFee}
                  onChange={(e) => setAfterMarriageFee(e.target.value)}
                  placeholder="20000"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer / Submit Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#D81124] hover:bg-[#B80E1C] text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-70 flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Saving...' : initialData ? 'Update Profile' : 'Add Traffic'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
