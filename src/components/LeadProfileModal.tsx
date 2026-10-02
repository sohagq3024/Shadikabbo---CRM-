import React, { useState } from 'react';
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
} from 'lucide-react';
import { CountryFlag, detectCountryIso } from './CountryFlag';

export interface LeadProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  onEdit: (lead: any) => void;
  onConvert: (lead: any) => void;
}

export const LeadProfileModal: React.FC<LeadProfileModalProps> = ({
  isOpen,
  onClose,
  lead,
  onEdit,
  onConvert,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!isOpen || !lead) return null;

  const images: string[] = Array.isArray(lead.images) ? lead.images : [];
  const completeness: number = typeof lead.completeness === 'number' ? lead.completeness : 0;
  const stars: number = typeof lead.stars === 'number' ? lead.stars : (completeness < 20 ? 0 : Math.min(5, Math.floor(completeness / 20)));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 transition-opacity duration-150">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-[#181E54] text-white font-mono text-xs font-bold shadow-2xs">
              {lead.id}
            </span>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-[#181E54]">{lead.name}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>Created: {lead.createdAt || 'N/A'}</span>
                <span>•</span>
                <span>By: <strong className="text-slate-700">{lead.createdBy || 'Sohag'}</strong> ({lead.creatorRole || 'Super Admin'})</span>
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

        {/* Profile Completeness Highlight Banner */}
        <div className="px-6 py-3 bg-gradient-to-r from-slate-50 via-amber-50/50 to-slate-50 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-700">Lead Info Level:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#181E54] text-white">
              {completeness}% Completed
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onConvert(lead);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D81124] hover:bg-[#B80E1C] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>Convert to Traffic</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
          {/* Top Profile Summary Card with Photos */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            {/* Photo Preview / Gallery */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-slate-200 flex items-center justify-center">
                {images.length > 0 ? (
                  <img
                    src={images[activeImageIndex]}
                    alt={lead.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-full flex flex-col items-center justify-center ${
                      lead.gender?.toLowerCase() === 'female'
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
                <div className="flex items-center justify-center gap-1 mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                    }
                    className="p-1 rounded-md bg-white border border-slate-200 shadow-2xs hover:bg-slate-100 cursor-pointer"
                  >
                    <ChevronLeft className="w-3 h-3 text-slate-600" />
                  </button>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {activeImageIndex + 1}/{images.length}
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

            {/* Quick Contact & Personal Details */}
            <div className="flex-1 space-y-3 w-full">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{lead.name}</h3>
                  <span className="text-slate-500 text-xs">{lead.profession || 'Profession Not Specified'}</span>
                </div>

                {lead.gender && (
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      lead.gender.toLowerCase() === 'female'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {lead.gender}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-[#D81124] shrink-0" />
                  <div className="flex items-center gap-1.5 font-mono">
                    <CountryFlag iso={detectCountryIso(lead.phone)} className="w-4 h-3 rounded-xs" />
                    <span className="font-semibold text-xs">{lead.phone}</span>
                  </div>
                </div>

                {lead.email && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-4 h-4 text-[#181E54] shrink-0" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                )}

                {lead.dateOfBirth && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>DOB: {lead.dateOfBirth}</span>
                  </div>
                )}

                {lead.maritalStatus && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{lead.maritalStatus}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Professional & Educational Bio */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#181E54]" />
                Education & Career
              </span>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400">Profession</span>
                  <span className="font-semibold text-slate-800">{lead.profession || '—'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400">Qualification</span>
                  <span className="font-semibold text-slate-800">{lead.qualification || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Height</span>
                  <span className="font-semibold text-slate-800">{lead.height || '—'}</span>
                </div>
              </div>
            </div>

            {/* Cultural & Religious Bio */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#181E54]" />
                Personal Profile
              </span>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400">Religion</span>
                  <span className="font-semibold text-slate-800">{lead.religion || '—'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400">Marital Status</span>
                  <span className="font-semibold text-slate-800">{lead.maritalStatus || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Lead Stage</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                    Primary Lead
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#181E54]" />
              Address Details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Present Address</span>
                <span className="text-slate-800 font-medium">
                  {[lead.presentCity, lead.presentCountry].filter(Boolean).join(', ') || 'Not specified'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Permanent Address</span>
                <span className="text-slate-800 font-medium">
                  {[lead.permanentCity, lead.permanentCountry].filter(Boolean).join(', ') || 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Bio-data / CV Attachment */}
          {lead.pdf && (
            <div className="p-4 bg-red-50/60 border border-red-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-[#D81124] shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block text-xs">{lead.pdf.name}</span>
                  <span className="text-[10px] text-slate-500">
                    {(lead.pdf.size / 1024).toFixed(1)} KB • Attached Bio-data
                  </span>
                </div>
              </div>
              <a
                href={lead.pdf.dataUrl}
                download={lead.pdf.name}
                className="px-3 py-1.5 bg-[#181E54] hover:bg-[#12163f] text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Download PDF
              </a>
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
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(lead);
              }}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Edit className="w-3.5 h-3.5 text-[#181E54]" />
              <span>Edit Lead</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onConvert(lead);
              }}
              className="px-5 py-2 bg-[#D81124] hover:bg-[#B80E1C] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Convert to Traffic</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
