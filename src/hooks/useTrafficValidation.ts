import { useState, useCallback } from 'react';

export interface TrafficFormData {
  name: string;
  phone: string;
  email?: string;
  assignBy?: string;
  profession?: string;
  jobType?: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  gender?: string;
  bodyColor?: string;
  height?: string;
  religion?: string;
  bloodGroup?: string;
  qualification?: string;
  requirement?: string;
  presentCity?: string;
  presentCountry?: string;
  permanentCity?: string;
  permanentCountry?: string;
  package?: string;
  price?: number;
  discount?: number;
  paidAmount?: number;
  dueAmount?: number;
  paymentMethod?: string;
  afterMarriageFee?: number;
}

export interface FileValidationResult {
  isValid: boolean;
  error: string | null;
}

export interface ImageBatchValidationResult {
  validFiles: File[];
  error: string | null;
}

export const useTrafficValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const clearErrors = useCallback(() => {
    setErrors({});
    setGeneralError(null);
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  // Binary inspection for image formats: JPEG, PNG, GIF, WebP
  const verifyImageBinary = useCallback(async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arr = new Uint8Array(e.target?.result as ArrayBuffer).subarray(0, 12);
        let hex = '';
        for (let i = 0; i < arr.length; i++) {
          hex += arr[i].toString(16).padStart(2, '0').toUpperCase();
        }

        // JPEG: FF D8 FF
        const isJpeg = hex.startsWith('FFD8FF');
        // PNG: 89 50 4E 47
        const isPng = hex.startsWith('89504E47');
        // GIF: 47 49 46 38
        const isGif = hex.startsWith('47494638');
        // WEBP: 52 49 46 46 (RIFF) with WEBP at offset 8-11
        const isRiff = hex.startsWith('52494646');
        const isWebp = isRiff && hex.length >= 24 && hex.substring(16, 24) === '57454250';

        resolve(isJpeg || isPng || isGif || isWebp || isRiff);
      };
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file.slice(0, 12));
    });
  }, []);

  // Binary inspection for PDF files: starts with '%PDF-'
  const verifyPdfBinary = useCallback(async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arr = new Uint8Array(e.target?.result as ArrayBuffer).subarray(0, 5);
        let str = '';
        for (let i = 0; i < arr.length; i++) {
          str += String.fromCharCode(arr[i]);
        }
        resolve(str.startsWith('%PDF-'));
      };
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file.slice(0, 5));
    });
  }, []);

  // Client-side strict validation for profile images
  const validateImageFiles = useCallback(
    async (files: File[]): Promise<ImageBatchValidationResult> => {
      const validFiles: File[] = [];
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const maxSizeBytes = 15 * 1024 * 1024; // 15 MB

      for (const file of files) {
        const fileExt = '.' + (file.name.split('.').pop() || '').toLowerCase();
        const hasValidExt = allowedExtensions.includes(fileExt);
        const hasValidMime = file.type.startsWith('image/');

        if (!hasValidExt || !hasValidMime) {
          return {
            validFiles,
            error: `Invalid file format: "${file.name}" is not an image. The profile picture field only permits image files (.jpg, .jpeg, .png, .webp).`,
          };
        }

        if (file.size > maxSizeBytes) {
          return {
            validFiles,
            error: `File size too large: "${file.name}" exceeds the 15MB limit for photos.`,
          };
        }

        const passesBinarySignature = await verifyImageBinary(file);
        if (!passesBinarySignature) {
          return {
            validFiles,
            error: `Security Verification: "${file.name}" failed image header inspection. Please upload genuine image files (.jpg, .png, .webp).`,
          };
        }

        validFiles.push(file);
      }

      return { validFiles, error: null };
    },
    [verifyImageBinary]
  );

  // Client-side strict validation for document upload (PDF only)
  const validatePdfFile = useCallback(
    async (file: File): Promise<FileValidationResult> => {
      const fileName = file.name.toLowerCase();
      const hasPdfExt = fileName.endsWith('.pdf');
      const hasPdfMime = file.type === 'application/pdf' || file.type === '';
      const maxSizeBytes = 25 * 1024 * 1024; // 25 MB

      if (!hasPdfExt || !hasPdfMime) {
        return {
          isValid: false,
          error: `Incorrect file type: "${file.name}" rejected. The document field exclusively accepts PDF files (.pdf).`,
        };
      }

      if (file.size > maxSizeBytes) {
        return {
          isValid: false,
          error: `File size too large: "${file.name}" exceeds the 25MB limit for PDF bio-data documents.`,
        };
      }

      const passesBinarySignature = await verifyPdfBinary(file);
      if (!passesBinarySignature) {
        return {
          isValid: false,
          error: `Security Verification: "${file.name}" is not a valid PDF document header. Please provide an authentic .pdf file.`,
        };
      }

      return { isValid: true, error: null };
    },
    [verifyPdfBinary]
  );

  // Form-level validation
  const validateForm = useCallback((formData: TrafficFormData): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Name is required
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Name is required.';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters.';
    }

    // 2. Phone Number is required
    if (!formData.phone || !formData.phone.trim()) {
      newErrors.phone = 'Phone Number is required.';
    } else {
      const cleanPhone = formData.phone.trim().replace(/[\s-]/g, '');
      // Validates general phone digits, allowing + at start
      const phoneRegex = /^\+?[0-9]{7,15}$/;
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.phone = 'Please provide a valid phone number (e.g. 01XXXXXXXXX).';
      }
    }

    // 3. Email (optional, but if provided must be valid)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please provide a valid email address.';
      }
    }

    // 4. Financial sanity checks
    if (formData.price !== undefined && formData.price < 0) {
      newErrors.price = 'Price cannot be negative.';
    }
    if (formData.discount !== undefined && formData.discount < 0) {
      newErrors.discount = 'Discount cannot be negative.';
    }
    if (formData.paidAmount !== undefined && formData.paidAmount < 0) {
      newErrors.paidAmount = 'Paid amount cannot be negative.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      setGeneralError(firstError);
      return false;
    }

    setGeneralError(null);
    return true;
  }, []);

  return {
    errors,
    generalError,
    setGeneralError,
    clearErrors,
    clearFieldError,
    validateForm,
    validateImageFiles,
    validatePdfFile,
  };
};
