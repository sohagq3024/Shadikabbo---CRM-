import React from 'react';
import { X, Edit3, Phone, Mail, MapPin, Calendar, Heart, Shield, Award, DollarSign, FileText } from 'lucide-react';
import { CountryFlag, detectCountryIso } from './CountryFlag';

interface TrafficProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  traffic: any;
  onEdit: (traffic: any) => void;
}

export const TrafficProfileModal: React.FC<TrafficProfileModalProps> = ({
  isOpen,
  onClose,
  traffic,
  onEdit,
}) => {
  if (!isOpen || !traffic) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 flex items-center justify-center p-3 md:p-6 transition-opacity duration-150">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header with Title and Edit Icon */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden border border-slate-200 bg-[#181E54] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              {traffic.images && traffic.images.length > 0 ? (
                <img
                  src={traffic.images[0]}
                  alt={traffic.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                traffic.gender === 'Female' ? 'F' : 'M'
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#181E54]">{traffic.name}</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                  {traffic.id}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Created: {traffic.createdAt} · Created By: <span className="font-semibold text-[#181E54]">{traffic.createdBy || 'Sohag'} ({traffic.creatorRole || 'Super Admin'})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Edit Icon required */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(traffic);
              }}
              title="Edit Profile"
              className="p-2 text-slate-600 hover:text-white hover:bg-[#181E54] border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <Edit3 className="w-4 h-4 text-[#D81124]" />
              <span className="hidden sm:inline">Edit</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#D81124] mb-3">
              Candidate Photos ({traffic.images?.length || 0})
            </h3>
            {traffic.images && traffic.images.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {traffic.images.map((img: string, index: number) => (
                  <div key={index} className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
                    <img src={img} alt={`Profile ${index + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl text-slate-400 italic">No photos attached</div>
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#D81124] mb-3">Payment Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 block mb-0.5">Package</span>
                <span className="font-semibold text-slate-900">{traffic.package}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Price</span>
                <span className="font-semibold text-slate-900">{traffic.price?.toLocaleString()} BDT</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Discount</span>
                <span className="font-semibold text-slate-900">{traffic.discount?.toLocaleString()} BDT</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Paid Amount</span>
                <span className="font-semibold text-emerald-600">{traffic.paidAmount?.toLocaleString()} BDT</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Due Amount</span>
                <span className="font-semibold text-red-600">{traffic.dueAmount?.toLocaleString()} BDT</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Payment Method</span>
                <span className="font-semibold text-slate-900">{traffic.paymentMethod}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block mb-0.5">After Marriage Fee</span>
                <span className="font-semibold text-indigo-700">{traffic.afterMarriageFee?.toLocaleString()} BDT</span>
              </div>
            </div>
          </div>

        </div>

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
    </div>
  );
};
