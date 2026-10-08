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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 flex items-center justify-center p-3 md:p-6 transition-opacity duration-150">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header with Title and Edit Icon */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
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
              className="relative group/avatar cursor-pointer focus:outline-none"
            >
              <div className="w-11 h-11 rounded-2xl overflow-hidden border border-slate-200 bg-[#181E54] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs group-hover/avatar:ring-2 group-hover/avatar:ring-[#181E54]/30 transition-all">
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
                <span className="absolute -bottom-1 -right-1 bg-[#D81124] text-white text-[8px] font-bold px-1 py-0.5 rounded-full border border-white shadow-2xs">
                  +{traffic.images.length - 1}
                </span>
              )}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#181E54]">{currentTraffic.name}</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                  {currentTraffic.id}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                >
                  <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{statusMeta.label}</span>
                </span>

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
              <p className="text-xs text-slate-500">
                Created: {currentTraffic.createdAt} · Created By: <span className="font-semibold text-[#181E54]">{currentTraffic.createdBy || 'Sohag'} ({currentTraffic.creatorRole || 'Super Admin'})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Edit Icon required (Super Admin only) */}
            {canEdit && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(currentTraffic);
                }}
                title="Edit Profile"
                className="p-2 text-slate-600 hover:text-white hover:bg-[#181E54] border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              >
                <Edit3 className="w-4 h-4 text-[#D81124]" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2.5 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-[#181E54] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Bio-Data &amp; Details</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'activity'
                  ? 'bg-[#181E54] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Activity Log</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'activity'
                    ? 'bg-[#D81124] text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {activityCount}
              </span>
            </button>
          </div>

          {currentTraffic.package && (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                {currentTraffic.package} Package
              </span>
            </div>
          )}
        </div>

        {activeTab === 'activity' ? (
          <div className="p-6 max-h-[75vh] overflow-y-auto text-xs">
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
          /* Content Body */
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
          
          {/* Part 1: Basic Info */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#D81124] mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Name:</span>
                <span className="font-semibold text-slate-900">{traffic.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <CountryFlag iso={detectCountryIso(traffic.phone)} className="w-5 h-3.5" />
                <span className="font-semibold text-slate-900">{traffic.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-900">{traffic.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Part 2: Additional Info */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#D81124] mb-3">Additional Information</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 block mb-0.5">Assign By</span>
                <span className="font-semibold text-slate-900">{traffic.assignBy || 'MK Unassigned'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Profession</span>
                <span className="font-semibold text-slate-900">{traffic.profession || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Jobe Type</span>
                <span className="font-semibold text-slate-900">{traffic.jobType || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Date of Birth</span>
                <span className="font-semibold text-slate-900">{traffic.dateOfBirth || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Marital Status</span>
                <span className="font-semibold text-slate-900">{traffic.maritalStatus || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Gender</span>
                <span className="font-semibold text-slate-900">{traffic.gender || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Body Color</span>
                <span className="font-semibold text-slate-900">{traffic.bodyColor || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Height</span>
                <span className="font-semibold text-slate-900">{traffic.height || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Religion</span>
                <span className="font-semibold text-slate-900">{traffic.religion || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Blood Group</span>
                <span className="font-semibold text-slate-900">{traffic.bloodGroup || 'N/A'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block mb-0.5">Qualification</span>
                <span className="font-semibold text-slate-900">{traffic.qualification || 'N/A'}</span>
              </div>
            </div>

            {/* Requirement */}
            <div className="mt-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block mb-1 font-medium">Requirement</span>
              <p className="text-slate-800 leading-relaxed">{traffic.requirement || 'None specified.'}</p>
            </div>
          </div>

          {/* Address Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#D81124] mb-3">Address Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#181E54] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Present Address</span>
                  <span className="text-slate-600">
                    {traffic.presentCity || 'Dhaka'}, {traffic.presentCountry || 'Bangladesh'}
                  </span>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#D81124] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Permanent Address</span>
                  <span className="text-slate-600">
                    {traffic.permanentCity || 'Chittagong'}, {traffic.permanentCountry || 'Bangladesh'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Picture Uploads (Unlimited) */}
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#D81124]">
                  Candidate Photos ({traffic.images?.length || 0})
                </h3>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  (Click any photo to view full screen &amp; download)
                </span>
              </div>
              {traffic.images && traffic.images.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleOpenPhoto(0)}
                  className="text-xs font-semibold text-[#181E54] hover:text-[#D81124] flex items-center gap-1.5 transition-colors cursor-pointer bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-[#181E54]" />
                  <span>View Full Screen ({traffic.images.length})</span>
                </button>
              )}
            </div>

            {traffic.images && traffic.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {traffic.images.map((img: string, index: number) => (
                  <div
                    key={index}
                    onClick={() => handleOpenPhoto(index)}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 hover:border-[#181E54] bg-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer"
                  >
                    <img
                      src={img}
                      alt={`Candidate Photo ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />

                    {/* Hover Action Overlay with Direct Download & Fullscreen Icons */}
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                          #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadCandidateImage(img, traffic.name, traffic.id, index);
                          }}
                          title="Download photo"
                          className="p-1 rounded-md bg-white hover:bg-emerald-600 text-slate-800 hover:text-white shadow-xs transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs">
                          <Maximize2 className="w-3 h-3 text-emerald-400" />
                          Full Screen
                        </span>
                      </div>

                      <div className="text-[9px] text-center text-white/80 font-medium">
                        Click to view
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-slate-400 italic text-center border border-dashed border-slate-200">
                No photos attached to this candidate profile
              </div>
            )}
          </div>

          {/* PDF Upload */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#D81124] mb-3">Biodata Document (PDF)</h3>
            {traffic.pdf ? (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#D81124]" />
                  <div>
                    <p className="font-bold text-slate-800">{traffic.pdf.name}</p>
                    <p className="text-[10px] text-slate-400">{(traffic.pdf.size / 1024).toFixed(1)} KB · PDF Document</p>
                  </div>
                </div>
                <a
                  href={traffic.pdf.dataUrl}
                  download={traffic.pdf.name}
                  className="px-3 py-1 bg-[#181E54] text-white rounded-lg text-xs font-semibold hover:bg-[#121642] transition-colors"
                >
                  Download PDF
                </a>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl text-slate-400 italic">No PDF document attached</div>
            )}
          </div>

          {/* Part 3: Payment details */}
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#D81124]">Payment Summary</h3>
              
              <div className="flex items-center gap-2">
                {traffic.paymentStatus === 'accepted' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Payment Cleared &amp; Invoiced
                  </span>
                ) : traffic.paidAmount > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock className="w-3.5 h-3.5" />
                    Payment Verification Pending
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    Unpaid / Pending Submission
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 block mb-0.5">Package</span>
                <span className="font-semibold text-slate-900">{traffic.package || 'Standard'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Price</span>
                <span className="font-semibold text-slate-900">{Number(traffic.price || 0).toLocaleString()} BDT</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Discount</span>
                <span className="font-semibold text-slate-900">{Number(traffic.discount || 0).toLocaleString()} BDT</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Paid Amount</span>
                <span className="font-semibold text-emerald-600 font-mono">৳ {Number(traffic.paidAmount || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Due Amount</span>
                <span className="font-semibold text-red-600 font-mono">৳ {Number(traffic.dueAmount || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Payment Method</span>
                <span className="font-semibold text-slate-900">{traffic.paymentMethod || 'bKash'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block mb-0.5">After Marriage Fee</span>
                <span className="font-semibold text-[#181E54] font-mono">৳ {Number(traffic.afterMarriageFee || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Request Action Buttons */}
            {traffic.paymentStatus !== 'accepted' && (
              <div className="mt-3 flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex-wrap">
                <div className="text-xs text-slate-600">
                  {Number(traffic.paidAmount || 0) > 0 ? (
                    <span>Payment info is recorded. You can send or re-send the request to Accounts for approval.</span>
                  ) : (
                    <span>Payment info is not complete yet. Click below to enter package and payment details.</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {canEdit && onEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEdit(traffic, 3);
                      }}
                      className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#D81124]" />
                      <span>Edit Payment Info</span>
                    </button>
                  )}

                  {Number(traffic.paidAmount || 0) > 0 && token && (
                    <button
                      type="button"
                      onClick={handleSendPaymentRequest}
                      disabled={isSendingRequest}
                      className="px-4 py-1.5 bg-[#181E54] hover:bg-[#121642] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isSendingRequest ? 'Sending...' : 'Send Payment Request'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {requestMessage && (
              <p className="mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center">
                {requestMessage}
              </p>
            )}
          </div>

        </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
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
