import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  Award,
  Heart,
  MapPin,
  FileText,
  Edit,
  ArrowRight,
  Star,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  Clock,
  UserCheck,
  Layers,
} from 'lucide-react';
import { CountryFlag, detectCountryIso } from './CountryFlag';
import { ActivityLog, getStatusMeta } from './ActivityLog';
import { CategoryBadgeSelector } from './CategoryBadgeSelector';
import { ImageLightboxModal, downloadCandidateImage } from './ImageLightboxModal';
import { Download, Maximize2 } from 'lucide-react';

export interface LeadProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  onEdit: (lead: any) => void;
  onConvert: (lead: any) => void;
  token?: string;
  onStatusUpdated?: (lead: any) => void;
  initialTab?: 'overview' | 'activity';
  canEdit?: boolean;
}

export const LeadProfileModal: React.FC<LeadProfileModalProps> = ({
  isOpen,
  onClose,
  lead,
  onEdit,
  onConvert,
  token = '',
  onStatusUpdated,
  initialTab = 'overview',
  canEdit = true,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>(initialTab);
  const [currentLead, setCurrentLead] = useState<any>(lead);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setCurrentLead(lead);
    setActiveTab(initialTab);
  }, [lead, initialTab]);

  if (!isOpen || !currentLead) return null;

  const images: string[] = Array.isArray(currentLead.images) ? currentLead.images : [];
  const completeness: number = typeof currentLead.completeness === 'number' ? currentLead.completeness : 0;
  const stars: number = typeof currentLead.stars === 'number' ? currentLead.stars : (completeness < 20 ? 0 : Math.min(5, Math.floor(completeness / 20)));
  const statusMeta = getStatusMeta(currentLead.status || 'active');
  const StatusIcon = statusMeta.icon;
  const activityCount = Array.isArray(currentLead.activityLog) ? currentLead.activityLog.length : 1;

  const handleLeadStatusChange = (updatedLead: any) => {
    setCurrentLead(updatedLead);
    if (onStatusUpdated) {
      onStatusUpdated(updatedLead);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 transition-opacity duration-150">
      <div className="relative w-full max-w-6xl xl:max-w-7xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-[#181E54] text-white font-mono text-xs font-bold shadow-2xs">
              {currentLead.id}
            </span>

            {/* Current Status Pill in Header */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
            >
              <StatusIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{statusMeta.label}</span>
            </span>

            {/* Quality Category Selector in Header */}
            {token && (
              <CategoryBadgeSelector
                category={currentLead.clientCategory || 'Normal'}
                itemId={currentLead.id}
                type="lead"
                token={token}
                onCategoryChanged={(newCat) => {
                  setCurrentLead((prev: any) => ({ ...prev, clientCategory: newCat }));
                  if (onStatusUpdated) {
                    onStatusUpdated({ ...currentLead, clientCategory: newCat });
                  }
                }}
              />
            )}

            <div>
              <h2 className="text-lg md:text-xl font-bold text-[#181E54]">{currentLead.name}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>Created: {currentLead.createdAt || 'N/A'}</span>
                <span>•</span>
                <span>By: <strong className="text-slate-700">{currentLead.createdBy || 'Sohag'}</strong> ({currentLead.creatorRole || 'Super Admin'})</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher & Completeness Highlight Banner */}
        <div className="px-6 py-2.5 bg-gradient-to-r from-slate-50 via-amber-50/40 to-slate-50 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2 shrink-0">
          {/* Navigation Tabs */}
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

          {/* Info Level Indicator & Convert Action */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">Info Level:</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#181E54] text-white">
                {completeness}%
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onConvert(currentLead);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D81124] hover:bg-[#B80E1C] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>Convert to Traffic</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
          {activeTab === 'activity' ? (
            /* Activity Log Component View */
            <ActivityLog
              lead={currentLead}
              token={token}
              onStatusUpdated={handleLeadStatusChange}
            />
          ) : (
            /* Bio-data and Overview View: Wide Multi-Column Layout */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              {/* LEFT COLUMN: Photos, Contact Info & Address */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                
                {/* Photo Preview / Gallery Card */}
                <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 flex flex-col items-center">
                  <div
                    onClick={() => {
                      if (images.length > 0) setLightboxOpen(true);
                    }}
                    className={`w-36 h-36 sm:w-40 sm:h-40 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-slate-200 flex items-center justify-center relative group ${
                      images.length > 0 ? 'cursor-pointer' : ''
                    }`}
                  >
                    {images.length > 0 ? (
                      <>
                        <img
                          src={images[activeImageIndex]}
                          alt={currentLead.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadCandidateImage(
                                  images[activeImageIndex],
                                  currentLead.name,
                                  currentLead.id,
                                  activeImageIndex
                                );
                              }}
                              title="Download photo"
                              className="p-1 rounded-md bg-white hover:bg-emerald-600 text-slate-800 hover:text-white shadow-xs transition-colors cursor-pointer"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center justify-center">
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs">
                              <Maximize2 className="w-2.5 h-2.5 text-emerald-400" />
                              Full Screen
                            </span>
                          </div>
                          <div className="text-[8px] text-center text-white/80">
                            Click to view
                          </div>
                        </div>
                      </>
                    ) : (
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center ${
                          currentLead.gender?.toLowerCase() === 'female'
                            ? 'bg-rose-50 text-rose-500'
                            : 'bg-blue-50 text-blue-500'
                        }`}
                      >
                        <User className="w-10 h-10 opacity-60" />
                        <span className="text-[10px] mt-1 font-medium text-slate-400">No Photo</span>
                      </div>
                    )}
                  </div>

                  {images.length > 1 && (
                    <div className="flex items-center justify-center gap-1 mt-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                        }
                        className="p-1 rounded-md bg-white border border-slate-200 shadow-2xs hover:bg-slate-100 cursor-pointer"
                      >
                        <ChevronLeft className="w-3 h-3 text-slate-600" />
                      </button>
                      <span className="text-[10px] text-slate-500 font-mono px-2">
                        {activeImageIndex + 1} / {images.length}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                        }
                        className="p-1 rounded-md bg-white border border-slate-200 shadow-2xs hover:bg-slate-100 cursor-pointer"
                      >
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Contact & Identity Details Card */}
                <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#D81124] mb-2">Contact &amp; Identity</h3>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-400 font-medium">Name</span>
                    <span className="font-bold text-slate-900">{currentLead.name}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-400 font-medium">Phone</span>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                      <CountryFlag iso={detectCountryIso(currentLead.phone)} className="w-4 h-3 rounded-xs" />
                      <span>{currentLead.phone}</span>
                    </div>
                  </div>
                  {currentLead.email && (
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-400 font-medium">Email</span>
                      <span className="font-semibold text-slate-900 truncate max-w-[160px]">{currentLead.email}</span>
                    </div>
                  )}
                  {currentLead.dateOfBirth && (
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-400 font-medium">Date of Birth</span>
                      <span className="font-semibold text-slate-900">{currentLead.dateOfBirth}</span>
                    </div>
                  )}
                  {currentLead.maritalStatus && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-400 font-medium">Marital Status</span>
                      <span className="font-semibold text-slate-900">{currentLead.maritalStatus}</span>
                    </div>
                  )}
                </div>

                {/* Address Details */}
                <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#D81124] mb-2">Address Details</h3>
                  <div className="flex items-start gap-2 py-1 border-b border-slate-200/60">
                    <MapPin className="w-3.5 h-3.5 text-[#181E54] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">Present Address</span>
                      <span className="font-semibold text-slate-800">
                        {[currentLead.presentCity, currentLead.presentCountry].filter(Boolean).join(', ') || 'Not specified'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 py-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D81124] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">Permanent Address</span>
                      <span className="font-semibold text-slate-800">
                        {[currentLead.permanentCity, currentLead.permanentCountry].filter(Boolean).join(', ') || 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio-data / CV Attachment */}
                {currentLead.pdf && (
                  <div className="p-3 bg-red-50/60 border border-red-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#D81124] shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900 block text-xs truncate max-w-[150px]">{currentLead.pdf.name}</span>
                        <span className="text-[10px] text-slate-500">
                          {(currentLead.pdf.size / 1024).toFixed(1)} KB • PDF
                        </span>
                      </div>
                    </div>
                    <a
                      href={currentLead.pdf.dataUrl}
                      download={currentLead.pdf.name}
                      className="px-2.5 py-1 bg-[#181E54] hover:bg-[#12163f] text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Download
                    </a>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Bio-Data, Career, Profile, Requirements & Notes */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                
                {/* Professional & Personal Attributes Grid */}
                <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#D81124] mb-3">
                    Personal Attributes &amp; Background
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Profession</span>
                      <span className="font-semibold text-slate-900">{currentLead.profession || '—'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Qualification</span>
                      <span className="font-semibold text-slate-900">{currentLead.qualification || '—'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Religion</span>
                      <span className="font-semibold text-slate-900">{currentLead.religion || '—'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Gender</span>
                      <span className="font-semibold text-slate-900">{currentLead.gender || '—'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Height</span>
                      <span className="font-semibold text-slate-900">{currentLead.height || '—'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Current Status</span>
                      <span className={`font-bold px-2 py-0.5 rounded text-[10px] border inline-block ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                  </div>

                  {/* Partner Requirement */}
                  {currentLead.requirement && (
                    <div className="mt-3 bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs">
                      <span className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">Partner Requirement</span>
                      <p className="text-slate-800 leading-relaxed text-xs">{currentLead.requirement}</p>
                    </div>
                  )}

                  {/* Internal Staff Notes */}
                  {currentLead.notes && (
                    <div className="mt-3 bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs">
                      <span className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">Internal Staff Notes</span>
                      <p className="text-slate-700 leading-relaxed text-xs">{currentLead.notes}</p>
                    </div>
                  )}
                </div>

                {/* Conversion Banner & Quick Actions Card */}
                <div className="p-4 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-200/80 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h4 className="font-bold text-[#181E54] text-xs">Ready to advance this candidate?</h4>
                    <p className="text-[11px] text-slate-500">
                      Promote this lead to a Traffic Profile with full matrimonial bio-data fields &amp; package billing.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onConvert(currentLead);
                    }}
                    className="px-4 py-2 bg-[#D81124] hover:bg-[#B80E1C] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>Promote to Traffic</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2.5">
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(currentLead);
                }}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Edit className="w-3.5 h-3.5 text-[#181E54]" />
                <span>Edit Lead</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onConvert(currentLead);
              }}
              className="px-5 py-2 bg-[#D81124] hover:bg-[#B80E1C] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Convert to Traffic</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Full-screen Image Lightbox Modal with Zoom, Rotation & Download */}
      <ImageLightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={images}
        initialIndex={activeImageIndex}
        title={currentLead.name}
        candidateId={currentLead.id}
      />
    </div>
  );
};
