import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Heart,
  Shield,
  Award,
  DollarSign,
  FileText,
  CheckCircle2,
  Clock,
  CreditCard,
  Send,
  Download,
  Maximize2,
  Eye,
  User,
} from 'lucide-react';
import { CountryFlag, detectCountryIso } from './CountryFlag';
import { ImageLightboxModal, downloadCandidateImage } from './ImageLightboxModal';
import { ActivityLog, getStatusMeta } from './ActivityLog';
import { CategoryBadgeSelector } from './CategoryBadgeSelector';

interface TrafficProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  traffic: any;
  onEdit?: (traffic: any, initialStep?: 1 | 2 | 3) => void;
  token?: string;
  onPaymentRequestSuccess?: () => void;
  initialTab?: 'overview' | 'activity';
  onStatusUpdated?: (traffic: any) => void;
  canEdit?: boolean;
}

export const TrafficProfileModal: React.FC<TrafficProfileModalProps> = ({
  isOpen,
  onClose,
  traffic,
  onEdit,
  token,
  onPaymentRequestSuccess,
  initialTab = 'overview',
  onStatusUpdated,
  canEdit = true,
}) => {
  const [currentTraffic, setCurrentTraffic] = useState<any>(traffic);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>(initialTab);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    setCurrentTraffic(traffic);
    if (initialTab) setActiveTab(initialTab);
  }, [traffic, initialTab]);

  if (!isOpen || !currentTraffic) return null;

  const statusMeta = getStatusMeta(currentTraffic.status || 'WP Connect');
  const StatusIcon = statusMeta.icon;
  const activityCount = Array.isArray(currentTraffic.activityLog) ? currentTraffic.activityLog.length : 1;

  const handleOpenPhoto = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleSendPaymentRequest = async () => {
    if (!token) return;
    setIsSendingRequest(true);
    setRequestMessage(null);
    try {
      const response = await fetch('/api/payments/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trafficId: traffic.id,
          trafficName: traffic.name,
          phone: traffic.phone,
          paidAmount: traffic.paidAmount,
          dueAmount: traffic.dueAmount,
          afterMarriageFee: traffic.afterMarriageFee,
          package: traffic.package,
          paymentMethod: traffic.paymentMethod,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to submit payment request');
      }

      setRequestMessage('Payment request successfully submitted to Payment section!');
      if (onPaymentRequestSuccess) onPaymentRequestSuccess();
    } catch (err: any) {
      setRequestMessage(err.message || 'Error submitting request');
    } finally {
      setIsSendingRequest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-3 md:p-4 transition-opacity duration-150">
      <div className="relative w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl max-h-[96vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden">
        
        {/* ==================================================
            COMPACT HEADER (Pinned inside viewport)
        ================================================== */}
        <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-5 sm:py-3 border-b border-slate-100 bg-slate-50/90 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Avatar thumbnail */}
            <button
              type="button"
              onClick={() => {
                if (traffic.images && traffic.images.length > 0) {
                  handleOpenPhoto(0);
                }
              }}
              title={
                traffic.images && traffic.images.length > 0
                  ? 'Click to view photo in full screen & download'
                  : traffic.name
              }
              className="relative group/avatar cursor-pointer focus:outline-none shrink-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-slate-200 bg-[#181E54] text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 shadow-2xs group-hover/avatar:ring-2 group-hover/avatar:ring-[#181E54]/30 transition-all">
                {traffic.images && traffic.images.length > 0 ? (
                  <img
                    src={traffic.images[0]}
                    alt={traffic.name}
                    className="w-full h-full object-cover group-hover/avatar:scale-105 transition-transform"
                  />
                ) : (
                  traffic.gender === 'Female' ? 'F' : 'M'
                )}
              </div>
              {traffic.images && traffic.images.length > 1 && (
                <span className="absolute -bottom-1 -right-1 bg-[#D81124] text-white text-[8px] font-bold px-1 py-0.2 rounded-full border border-white shadow-2xs">
                  +{traffic.images.length - 1}
                </span>
              )}
            </button>

            {/* Profile Title & Badges */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-[#181E54] truncate">{currentTraffic.name}</h2>
                
                <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-semibold">
                  {currentTraffic.id}
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border shadow-2xs ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                >
                  <StatusIcon className="w-3 h-3 shrink-0" />
                  <span>{statusMeta.label}</span>
                </span>

                {currentTraffic.matchmakingLevel && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Level: {currentTraffic.matchmakingLevel}
                  </span>
                )}

                {/* Quality Category Selector in Header */}
                {token && (
                  <CategoryBadgeSelector
                    category={currentTraffic.clientCategory || 'Normal'}
                    itemId={currentTraffic.id}
                    type="traffic"
                    token={token}
                    onCategoryChanged={(newCat) => {
                      setCurrentTraffic((prev: any) => ({ ...prev, clientCategory: newCat }));
                      if (onStatusUpdated) {
                        onStatusUpdated({ ...currentTraffic, clientCategory: newCat });
                      }
                    }}
                  />
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate mt-0.5">
                Created: {currentTraffic.createdAt} · Created By: <span className="font-semibold text-[#181E54]">{currentTraffic.createdBy || 'Sohag'}</span>
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {currentTraffic.package && (
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                {currentTraffic.package}
              </span>
            )}

            {/* Edit Icon (Super Admin only) */}
            {canEdit && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(currentTraffic);
                }}
                title="Edit Profile"
                className="px-2.5 py-1 text-slate-600 hover:text-white hover:bg-[#181E54] border border-slate-200 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#D81124]" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              title="Close modal"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* ==================================================
            NAVIGATION TABS (Pinned inside viewport)
        ================================================== */}
        <div className="px-3.5 sm:px-5 py-1.5 bg-gradient-to-r from-slate-50 via-indigo-50/15 to-slate-50 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-[#181E54] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <User className="w-3 h-3" />
              <span>Bio-Data &amp; Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'activity'
                  ? 'bg-[#181E54] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Activity Log</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                  activeTab === 'activity'
                    ? 'bg-[#D81124] text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {activityCount}
              </span>
            </button>
          </div>

          {/* Quick Staff Tag on Right */}
          <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1">
            <span>Staff Assigned:</span>
            <span className="font-semibold text-[#181E54] bg-white px-2 py-0.5 rounded-md border border-slate-200">
              {traffic.assignBy || 'MK Unassigned'}
            </span>
          </div>
        </div>

        {/* ==================================================
            TAB CONTENT: Highly organized, clean, zero empty space layout
            Everything neatly proportioned and well-aligned
        ================================================== */}
        {activeTab === 'activity' ? (
          <div className="p-4 sm:p-5 flex-1 min-h-0 overflow-y-auto text-xs">
            <ActivityLog
              traffic={currentTraffic}
              token={token || ''}
              onStatusUpdated={(updated) => {
                setCurrentTraffic(updated);
                if (onStatusUpdated) onStatusUpdated(updated);
              }}
            />
          </div>
        ) : (
          <div className="p-3 sm:p-4 md:p-5 flex-1 min-h-0 overflow-y-auto text-xs text-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5 items-stretch">
              
              {/* ==================================================
                  COLUMN 1 (lg:col-span-4): Candidate Photo, Contact & Residence
              ================================================== */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                
                {/* Candidate Photo & Gallery Showcase */}
                <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#D81124] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Candidate Photo ({traffic.images?.length || 0})
                    </span>
                    {traffic.images && traffic.images.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleOpenPhoto(0)}
                        className="text-[10px] font-semibold text-[#181E54] hover:text-[#D81124] flex items-center gap-1 transition-colors cursor-pointer bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs"
                      >
                        <Maximize2 className="w-2.5 h-2.5 text-[#181E54]" />
                        <span>View Full</span>
                      </button>
                    )}
                  </div>

                  {traffic.images && traffic.images.length > 0 ? (
                    <div>
                      {/* Featured Main Photo */}
                      <div
                        onClick={() => handleOpenPhoto(0)}
                        className="group relative h-44 sm:h-48 w-full rounded-xl overflow-hidden border border-slate-200 hover:border-[#181E54] bg-slate-900 shadow-xs transition-all cursor-pointer"
                      >
                        <img
                          src={traffic.images[0]}
                          alt={traffic.name}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-between p-2.5 opacity-90 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] font-bold text-white bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                            <Eye className="w-3 h-3 text-emerald-400" />
                            Click to expand
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadCandidateImage(traffic.images[0], traffic.name, traffic.id, 0);
                            }}
                            title="Download original image"
                            className="p-1 rounded bg-white hover:bg-emerald-600 text-slate-800 hover:text-white shadow-xs transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Additional Thumbnails Grid */}
                      {traffic.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-1.5 mt-2">
                          {traffic.images.slice(1, 5).map((img: string, idx: number) => (
                            <div
                              key={idx + 1}
                              onClick={() => handleOpenPhoto(idx + 1)}
                              className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-[#181E54] bg-slate-100 cursor-pointer shadow-2xs group"
                            >
                              <img
                                src={img}
                                alt={`Thumb ${idx + 2}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize2 className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          ))}
                          {traffic.images.length > 5 && (
                            <div
                              onClick={() => handleOpenPhoto(5)}
                              className="aspect-square rounded-lg border border-dashed border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center text-[10px] font-bold text-[#181E54] cursor-pointer"
                            >
                              +{traffic.images.length - 5}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-40 bg-white rounded-xl text-slate-400 border border-dashed border-slate-200 flex flex-col items-center justify-center gap-1.5 text-[11px]">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <User className="w-6 h-6" />
                      </div>
                      <span>No candidate photos uploaded</span>
                    </div>
                  )}
                </div>

                {/* Contact & Assignment Card */}
                <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2 flex-1">
                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#D81124] flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      Contact &amp; Assignment
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {traffic.id}</span>
                  </div>

                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white border border-slate-200/60 text-[11px]">
                      <span className="text-slate-400 font-medium">Name:</span>
                      <span className="font-bold text-slate-900 truncate max-w-[170px]">{traffic.name}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white border border-slate-200/60 text-[11px]">
                      <span className="text-slate-400 font-medium">Phone:</span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <CountryFlag iso={detectCountryIso(traffic.phone)} className="w-3.5 h-2.5 rounded-2xs" />
                        <span className="font-mono text-[11px]">{traffic.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white border border-slate-200/60 text-[11px]">
                      <span className="text-slate-400 font-medium">Email:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[170px]">{traffic.email || '—'}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-white border border-slate-200/60 text-[11px]">
                      <span className="text-slate-400 font-medium">Assigned Staff:</span>
                      <span className="font-bold text-[#181E54] truncate max-w-[170px]">{traffic.assignBy || 'MK Unassigned'}</span>
                    </div>

                    {/* Address Fields */}
                    <div className="pt-1 space-y-1.5">
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200/60 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-[#181E54] shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <span className="text-slate-400 text-[9px] block uppercase font-bold">Present Address</span>
                          <span className="font-semibold text-slate-800 truncate block">
                            {[traffic.presentCity, traffic.presentCountry].filter(Boolean).join(', ') || 'Dhaka, Bangladesh'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200/60 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-[#D81124] shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <span className="text-slate-400 text-[9px] block uppercase font-bold">Permanent Address</span>
                          <span className="font-semibold text-slate-800 truncate block">
                            {[traffic.permanentCity, traffic.permanentCountry].filter(Boolean).join(', ') || 'Chittagong, Bangladesh'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Biodata Document (PDF) if present */}
                    {traffic.pdf && (
                      <div className="flex items-center justify-between p-2 bg-indigo-50/50 rounded-lg border border-indigo-200/80 text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileText className="w-4 h-4 text-[#D81124] shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate max-w-[130px] text-[10.5px]">{traffic.pdf.name}</p>
                            <p className="text-[9px] text-slate-400">{(traffic.pdf.size / 1024).toFixed(0)} KB · PDF</p>
                          </div>
                        </div>
                        <a
                          href={traffic.pdf.dataUrl}
                          download={traffic.pdf.name}
                          className="px-2.5 py-1 bg-[#181E54] hover:bg-[#121642] text-white rounded text-[10px] font-semibold transition-colors shrink-0"
                        >
                          Download
                        </a>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* ==================================================
                  COLUMN 2 (lg:col-span-5): Bio-Data & Personal Background
              ================================================== */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <div className="bg-slate-50/90 p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex-1 flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-2 mb-2.5">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#D81124] flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      Personal Attributes &amp; Bio-Data
                    </h3>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Profile Matrix
                    </span>
                  </div>
                  
                  {/* Grid of Attributes */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                      <span className="text-slate-400 block text-[9.5px] uppercase font-bold mb-0.5">Profession</span>
                      <span className="font-bold text-slate-900 truncate block text-[11.5px]">{traffic.profession || '—'}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                      <span className="text-slate-400 block text-[9.5px] uppercase font-bold mb-0.5">Job Type</span>
                      <span className="font-bold text-slate-900 truncate block text-[11.5px]">{traffic.jobType || '—'}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                      <span className="text-slate-400 block text-[9.5px] uppercase font-bold mb-0.5">Date of Birth</span>
                      <span className="font-bold text-slate-900 truncate block text-[11.5px]">{traffic.dateOfBirth || '—'}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                      <span className="text-slate-400 block text-[9.5px] uppercase font-bold mb-0.5">Marital Status</span>
                      <span className="font-bold text-slate-900 truncate block text-[11.5px]">{traffic.maritalStatus || 'Never Married'}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                      <span className="text-slate-400 block text-[9.5px] uppercase font-bold mb-0.5">Gender</span>
                      <span className="font-bold text-slate-900 truncate block text-[11.5px]">{traffic.gender || '—'}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                      <span className="text-slate-400 block text-[9.5px] uppercase font-bold mb-0.5">Religion</span>
                      <span className="font-bold text-slate-900 truncate block text-[11.5px]">{traffic.religion || 'Islam'}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                      <span className="text-slate-400 block text-[9.5px] uppercase font-bold mb-0.5">Height</span>
                      <span className="font-bold text-slate-900 truncate block text-[11.5px]">{traffic.height || '—'}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                      <span className="text-slate-400 block text-[9.5px] uppercase font-bold mb-0.5">Complexion</span>
                      <span className="font-bold text-slate-900 truncate block text-[11.5px]">{traffic.bodyColor || 'Fair'}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                      <span className="text-slate-400 block text-[9.5px] uppercase font-bold mb-0.5">Blood Group</span>
                      <span className="font-bold text-slate-900 truncate block text-[11.5px]">{traffic.bloodGroup || '—'}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-3">
                      <span className="text-slate-400 block text-[9.5px] uppercase font-bold mb-0.5">Educational Qualification</span>
                      <span className="font-bold text-slate-900 block text-[11.5px]">{traffic.qualification || 'Not Specified'}</span>
                    </div>
                  </div>

                  {/* Partner Requirement */}
                  <div className="mt-3 bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs flex-1 flex flex-col justify-start">
                    <span className="text-slate-400 block mb-1 text-[9.5px] uppercase font-bold flex items-center gap-1">
                      <Heart className="w-3 h-3 text-[#D81124]" />
                      Partner Expectation &amp; Requirements
                    </span>
                    <p className="text-slate-800 leading-relaxed text-[11.5px]">
                      {traffic.requirement || 'Standard family expectations. No special conditions recorded.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ==================================================
                  COLUMN 3 (lg:col-span-3): Financial Clearance & Actions
              ================================================== */}
              <div className="lg:col-span-3 flex flex-col gap-3">
                <div className="bg-slate-50/90 p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex-1 flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-2 mb-2.5">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#D81124] flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      Payment Summary
                    </h3>
                    <div>
                      {traffic.paymentStatus === 'accepted' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Cleared
                        </span>
                      ) : traffic.paidAmount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Unpaid
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between">
                      <span className="text-slate-500 font-medium text-[11px]">Package</span>
                      <span className="font-bold text-[#181E54] text-[11.5px] uppercase">{traffic.package || 'Standard'}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between">
                      <span className="text-slate-500 font-medium text-[11px]">Package Price</span>
                      <span className="font-mono font-bold text-slate-900 text-[11.5px]">৳ {Number(traffic.price || 0).toLocaleString()}</span>
                    </div>

                    <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200/80 shadow-2xs flex items-center justify-between">
                      <span className="text-emerald-800 font-bold text-[11px]">Paid Amount</span>
                      <span className="font-mono font-bold text-emerald-700 text-[12px]">৳ {Number(traffic.paidAmount || 0).toLocaleString()}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between">
                      <span className="text-slate-500 font-medium text-[11px]">Due Balance</span>
                      <span className={`font-mono font-bold text-[11.5px] ${Number(traffic.dueAmount || 0) > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                        ৳ {Number(traffic.dueAmount || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between">
                      <span className="text-slate-500 font-medium text-[11px]">Payment Method</span>
                      <span className="font-bold text-slate-900 text-[11px]">{traffic.paymentMethod || 'bKash'}</span>
                    </div>

                    <div className="bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-200/80 shadow-2xs flex items-center justify-between">
                      <span className="text-[#181E54] font-bold text-[11px]">After Marriage Fee</span>
                      <span className="font-mono font-bold text-[#181E54] text-[12px]">৳ {Number(traffic.afterMarriageFee || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Payment Action Row */}
                  {traffic.paymentStatus !== 'accepted' && (
                    <div className="mt-3 p-2.5 bg-white rounded-lg border border-slate-200/80 space-y-2">
                      <div className="text-[10px] text-slate-500">
                        {Number(traffic.paidAmount || 0) > 0 ? (
                          <span>Payment recorded. Ready for Accounts verification.</span>
                        ) : (
                          <span>Payment pending. Add package details to send request.</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {canEdit && onEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onEdit(traffic, 3);
                            }}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-[10.5px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3 text-[#D81124]" />
                            <span>Edit Payment</span>
                          </button>
                        )}

                        {Number(traffic.paidAmount || 0) > 0 && token && (
                          <button
                            type="button"
                            onClick={handleSendPaymentRequest}
                            disabled={isSendingRequest}
                            className="px-3 py-1.5 bg-[#181E54] hover:bg-[#121642] text-white rounded-md text-[10.5px] font-semibold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          >
                            <Send className="w-3 h-3 text-emerald-400" />
                            <span>{isSendingRequest ? 'Sending...' : 'Send Request'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {requestMessage && (
                    <p className="mt-2 text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded p-1.5 text-center">
                      {requestMessage}
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================================================
            COMPACT FOOTER (Pinned inside viewport)
        ================================================== */}
        <div className="px-3.5 sm:px-5 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="font-mono font-semibold text-[#181E54]">{traffic.id}</span>
            <span>•</span>
            <span>Registered Paid Traffic Profile</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      {/* Full Screen Image Lightbox Modal with Zoom, Rotation, and Real Download Logic */}
      <ImageLightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={traffic.images || []}
        initialIndex={lightboxIndex}
        title={traffic.name}
        candidateId={traffic.id}
      />
    </div>
  );
};
