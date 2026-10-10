import React, { useState, useMemo, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  Building2,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  RotateCcw,
  Search,
  ArrowUp,
  ArrowDown,
  Briefcase,
  GraduationCap,
  Heart,
  Ruler,
  BookOpen,
  Palette,
  Activity,
  Crown,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Save,
  MapPin,
  Globe,
  Layers,
  Download,
  Upload,
  Copy,
  Database,
  CreditCard,
} from 'lucide-react';
import { useCrmFields } from '../context/CrmFieldsContext';
import {
  FIELD_CATEGORIES_META,
  CrmFieldSeedings,
  AgencySettings,
} from '../constants/defaultFieldSeedings';

interface SettingsPageProps {
  token: string;
}

type SettingsTab = 'seedings' | 'agency' | 'backup';

export const SettingsPage: React.FC<SettingsPageProps> = ({ token }) => {
  const {
    fields,
    agencySettings,
    addFieldItem,
    removeFieldItem,
    updateFieldItem,
    reorderFieldItems,
    resetCategoryToDefault,
    resetAllToDefaults,
    updatePackagePrice,
    addPackageWithPrice,
    updateAgencySettings,
    refreshFields,
  } = useCrmFields();

  // Active Main Tab: 'seedings' | 'agency' | 'backup'
  const [activeTab, setActiveTab] = useState<SettingsTab>('seedings');

  // Active Category Filter inside Field Seedings compartment
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<keyof CrmFieldSeedings>('professions');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [leftCategorySearch, setLeftCategorySearch] = useState('');
  const [newOptionValue, setNewOptionValue] = useState('');
  const [newPackagePrice, setNewPackagePrice] = useState('20000');
  const [editingItem, setEditingItem] = useState<{ category: keyof CrmFieldSeedings; item: string } | null>(null);
  const [editItemValue, setEditItemValue] = useState('');
  const [editPackagePrice, setEditPackagePrice] = useState('20000');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Agency Settings Form State
  const [agencyForm, setAgencyForm] = useState<AgencySettings>(agencySettings);
  const [isSavingAgency, setIsSavingAgency] = useState(false);

  // File input ref for backup import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync agency form if context changes
  React.useEffect(() => {
    setAgencyForm(agencySettings);
  }, [agencySettings]);

  // Total active options across all categories
  const totalOptionsCount = useMemo(() => {
    return Object.values(fields || {}).reduce((acc: number, curr: any) => {
      return acc + (Array.isArray(curr) ? curr.length : 0);
    }, 0);
  }, [fields]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Find meta for current category
  const currentCategoryMeta = useMemo(() => {
    return (
      FIELD_CATEGORIES_META.find((m) => m.key === selectedCategoryKey) ||
      FIELD_CATEGORIES_META[0]
    );
  }, [selectedCategoryKey]);

  // Filtered categories on the left side
  const filteredCategories = useMemo(() => {
    if (!leftCategorySearch.trim()) return FIELD_CATEGORIES_META;
    const q = leftCategorySearch.toLowerCase().trim();
    return FIELD_CATEGORIES_META.filter((cat) =>
      cat.label.toLowerCase().includes(q)
    );
  }, [leftCategorySearch]);

  // Current category items with search filtering
  const currentCategoryItems = useMemo(() => {
    const list: string[] = Array.isArray(fields[selectedCategoryKey])
      ? (fields[selectedCategoryKey] as string[])
      : [];
    if (!categorySearchQuery.trim()) return list;
    const q = categorySearchQuery.toLowerCase().trim();
    return list.filter((item: string) => item.toLowerCase().includes(q));
  }, [fields, selectedCategoryKey, categorySearchQuery]);

  // Helper to format option values cleanly
  const formatOptionValue = (val: string) => {
    const trimmed = val.trim();
    return trimmed
      .split(' ')
      .map((word) => {
        if (/^[A-Z0-9/.\-()]+$/.test(word) && word.length > 1) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  };

  // Add new item handler
  const handleAddNewItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const formatted = formatOptionValue(newOptionValue);
    if (!formatted) return;

    let success = false;
    if (selectedCategoryKey === 'packages') {
      const priceNum = parseInt(newPackagePrice, 10) || 0;
      success = await addPackageWithPrice(formatted, priceNum);
    } else {
      success = await addFieldItem(selectedCategoryKey, formatted);
    }

    if (success) {
      setNewOptionValue('');
      setNewPackagePrice('20000');
      showToast(`Added "${formatted}" to ${currentCategoryMeta.label}`);
    } else {
      showToast(`"${formatted}" already exists or could not be added`, 'error');
    }
  };

  // Delete item handler
  const handleDeleteItem = async (item: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${item}" from ${currentCategoryMeta.label}?`
      )
    ) {
      return;
    }

    const success = await removeFieldItem(selectedCategoryKey, item);
    if (success) {
      showToast(`Removed "${item}" from ${currentCategoryMeta.label}`);
    } else {
      showToast(`Could not delete "${item}"`, 'error');
    }
  };

  // Start editing item
  const handleStartEdit = (item: string) => {
    setEditingItem({ category: selectedCategoryKey, item });
    setEditItemValue(item);
    if (selectedCategoryKey === 'packages') {
      const currentPrice = fields.packagePrices?.[item] ?? 20000;
      setEditPackagePrice(String(currentPrice));
    }
  };

  // Save edited item
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const formatted = formatOptionValue(editItemValue);
    if (!formatted) {
      setEditingItem(null);
      return;
    }

    const priceNum = parseInt(editPackagePrice, 10);
    const priceChanged =
      editingItem.category === 'packages' &&
      !isNaN(priceNum) &&
      priceNum !== (fields.packagePrices?.[editingItem.item] ?? 20000);

    if (formatted === editingItem.item && !priceChanged) {
      setEditingItem(null);
      return;
    }

    let success = false;
    if (formatted !== editingItem.item) {
      success = await updateFieldItem(
        editingItem.category,
        editingItem.item,
        formatted
      );
      if (success && editingItem.category === 'packages' && !isNaN(priceNum)) {
        await updatePackagePrice(formatted, priceNum);
      }
    } else if (priceChanged) {
      success = await updatePackagePrice(formatted, priceNum);
    }

    if (success) {
      showToast(`Updated "${formatted}"`);
      setEditingItem(null);
    } else {
      showToast(`Could not update option`, 'error');
    }
  };

  // Move item up / down in order
  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    const rawList: string[] = Array.isArray(fields[selectedCategoryKey])
      ? (fields[selectedCategoryKey] as string[])
      : [];
    const list = [...rawList];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    // Swap items
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    await reorderFieldItems(selectedCategoryKey, list);
    showToast(`Updated option ordering`);
  };

  // Reset current category
  const handleResetCategory = async () => {
    if (
      !confirm(
        `Reset all options for "${currentCategoryMeta.label}" back to factory default seedings?`
      )
    ) {
      return;
    }

    const success = await resetCategoryToDefault(selectedCategoryKey);
    if (success) {
      showToast(`Reset ${currentCategoryMeta.label} to default seedings`);
    }
  };

  // Reset ALL categories
  const handleResetAll = async () => {
    if (
      !confirm(
        'ARE YOU SURE?\nThis will restore ALL dropdown field categories back to default factory seedings.'
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      const success = await resetAllToDefaults();
      if (success) {
        showToast('All fields restored to default factory seedings');
      }
    } finally {
      setIsResetting(false);
    }
  };

  // Save Agency Profile Form
  const handleSaveAgencySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAgency(true);
    try {
      const success = await updateAgencySettings(agencyForm);
      if (success) {
        showToast('Agency profile & settings saved successfully!');
      } else {
        showToast('Failed to save agency settings', 'error');
      }
    } finally {
      setIsSavingAgency(false);
    }
  };

  // Export full CRM configuration as JSON file
  const handleExportBackup = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.2.0',
      totalOptions: totalOptionsCount,
      fields,
      agencySettings,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `shadikabbo_crm_settings_backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Configuration backup exported successfully!');
  };

  // Copy raw JSON to clipboard
  const handleCopyJson = async () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      fields,
      agencySettings,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      showToast('Settings JSON copied to clipboard!');
    } catch {
      showToast('Could not copy JSON to clipboard', 'error');
    }
  };

  // Trigger file upload for import
  const handleTriggerImport = () => {
    fileInputRef.current?.click();
  };

  // Handle file import
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (parsed.fields && typeof parsed.fields === 'object') {
          // Push to backend
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const res = await fetch('/api/settings/fields', {
            method: 'PUT',
            headers,
            body: JSON.stringify({ fields: parsed.fields }),
          });

          if (parsed.agencySettings && typeof parsed.agencySettings === 'object') {
            await updateAgencySettings(parsed.agencySettings);
          }

          if (res.ok) {
            await refreshFields();
            showToast('Configuration restored successfully from backup!');
          } else {
            showToast('Failed to apply imported configuration', 'error');
          }
        } else {
          showToast('Invalid backup file format: missing fields object', 'error');
        }
      } catch (err: any) {
        showToast('Error parsing backup JSON file: ' + err.message, 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Render category icon
  const renderCategoryIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'Briefcase':
        return <Briefcase className={className} />;
      case 'GraduationCap':
        return <GraduationCap className={className} />;
      case 'Heart':
        return <Heart className={className} />;
      case 'Ruler':
        return <Ruler className={className} />;
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'Palette':
        return <Palette className={className} />;
      case 'Activity':
        return <Activity className={className} />;
      case 'Crown':
        return <Crown className={className} />;
      case 'MapPin':
        return <MapPin className={className} />;
      case 'Globe':
        return <Globe className={className} />;
      case 'Layers':
        return <Layers className={className} />;
      case 'CreditCard':
        return <CreditCard className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      default:
        return <Building2 className={className} />;
    }
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* Hidden file input for backup restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".json"
        className="hidden"
      />

      {/* ============================================================
          TOP NAVIGATION BAR: COMPACT & SPACE-SAVING (NO WASTED SPACE)
      ============================================================ */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-2.5 px-4 rounded-xl border border-slate-200 shadow-2xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('seedings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'seedings'
                ? 'bg-[#181E54] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Field Customization</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'seedings'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {FIELD_CATEGORIES_META.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('agency')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'agency'
                ? 'bg-[#181E54] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Agency Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-[#181E54] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>Backup &amp; Restore</span>
          </button>
        </div>

        {/* Compact Right Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
            {totalOptionsCount} options
          </span>

          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200 shadow-2xs"
            title="Export JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerImport}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200 shadow-2xs"
            title="Import JSON"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={handleResetAll}
            disabled={isResetting}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-rose-200 shadow-2xs"
            title="Restore Defaults"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ============================================================
          TAB 1: FIELD CUSTOMIZATION & SEEDINGS
          Dual-panel workbench with dedicated left & right scrolling
      ============================================================ */}
      {activeTab === 'seedings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ============================================================
              LEFT PANEL (4 cols): DEDICATED SCROLLING SYSTEM WITH SEARCH
          ============================================================ */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col sticky top-4">
            {/* Left Header with Category Search */}
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/90 shrink-0 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#181E54]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Field Categories
                  </h2>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Scrollable
                  </span>
                  <span className="text-[10px] font-mono bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                    {filteredCategories.length} / {FIELD_CATEGORIES_META.length}
                  </span>
                </div>
              </div>

              {/* Dedicated Search Filter for Left Categories */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={leftCategorySearch}
                  onChange={(e) => setLeftCategorySearch(e.target.value)}
                  placeholder="Filter categories (e.g. city, country)..."
                  className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54] placeholder-slate-400 font-medium"
                />
                {leftCategorySearch && (
                  <button
                    type="button"
                    onClick={() => setLeftCategorySearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Left Scrollable List of Categories with visible custom scrollbar */}
            <div className="p-2 space-y-1 overflow-y-auto max-h-[520px] min-h-[380px] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-100">
              {filteredCategories.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No matching category found
                </div>
              ) : (
                filteredCategories.map((cat) => {
                  const count = (fields[cat.key] || []).length;
                  const isSelected = selectedCategoryKey === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryKey(cat.key);
                        setCategorySearchQuery('');
                        setEditingItem(null);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#181E54] text-white shadow-xs font-bold'
                          : 'text-slate-700 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg shrink-0 ${
                            isSelected
                              ? 'bg-white/15 text-emerald-400'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {renderCategoryIcon(cat.icon, 'w-4 h-4')}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs truncate font-semibold">
                            {cat.label}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Left Footer Note */}
            <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between shrink-0">
              <span>Scroll up/down to explore all {FIELD_CATEGORIES_META.length} categories</span>
              <span className="font-semibold text-emerald-600">Auto Synced</span>
            </div>
          </div>

          {/* ============================================================
              RIGHT MAIN EDITOR PANEL (8 cols)
          ============================================================ */}
          <div className="lg:col-span-8 space-y-4">
            {/* Header of Active Category */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#181E54] text-white flex items-center justify-center shrink-0 shadow-xs">
                    {renderCategoryIcon(currentCategoryMeta.icon, 'w-5 h-5 text-emerald-400')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">
                        {currentCategoryMeta.label}
                      </h2>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {Array.isArray(fields[selectedCategoryKey]) ? (fields[selectedCategoryKey] as string[]).length : 0} Options
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {currentCategoryMeta.description}
                    </p>
                  </div>
                </div>

                {/* Reset this Category button */}
                <button
                  type="button"
                  onClick={handleResetCategory}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
                  title="Reset only this category to factory default"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset Category</span>
                </button>
              </div>

              {/* Connected CRM Targets Tags */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <LinkIcon className="w-3.5 h-3.5 text-[#181E54]" />
                  Connected Modules:
                </span>
                {currentCategoryMeta.connectedSections.map((sec, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-[#181E54] border border-indigo-100"
                  >
                    <Check className="w-2.5 h-2.5" />
                    <span>{sec}</span>
                  </span>
                ))}
              </div>

              {/* Add New Option Form & Fast Search */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                {/* Add Option Input (7 cols) */}
                <form
                  onSubmit={handleAddNewItem}
                  className="sm:col-span-7 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={newOptionValue}
                    onChange={(e) => setNewOptionValue(e.target.value)}
                    placeholder={`Type new ${currentCategoryMeta.label.toLowerCase()}...`}
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54] placeholder-slate-400 font-medium"
                  />
                  {selectedCategoryKey === 'packages' && (
                    <div className="w-28 relative shrink-0">
                      <span className="text-[10px] text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 font-bold font-mono">৳</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={newPackagePrice}
                        onChange={(e) => setNewPackagePrice(e.target.value)}
                        placeholder="Price"
                        className="w-full pl-5 pr-2 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54] font-mono font-semibold"
                        title="Package Default Fee in BDT"
                      />
                    </div>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#D81124] hover:bg-[#B80E1C] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </form>

                {/* Filter / Search within options (5 cols) */}
                <div className="sm:col-span-5 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    placeholder="Search in options..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#181E54] placeholder-slate-400"
                  />
                  {categorySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCategorySearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* List of Dynamic Options with Contained Scrolling */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs font-bold text-slate-600 shrink-0">
                <div className="flex items-center gap-2">
                  <span>Active Option Values ({currentCategoryItems.length})</span>
                  <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Scrollable
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
                  Order controls position in selection dropdowns
                </span>
              </div>

              {currentCategoryItems.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-xs">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600">No options found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {categorySearchQuery
                      ? 'Try another search query'
                      : 'Use the input above to add your first custom option'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px] min-h-[320px] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-100">
                  {currentCategoryItems.map((item: string, index: number) => {
                    const isEditingThis =
                      editingItem?.category === selectedCategoryKey &&
                      editingItem?.item === item;

                    return (
                      <div
                        key={`${item}-${index}`}
                        className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Option Name & Index Badge */}
                        <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                          <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-100 w-6 h-6 rounded-md flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>

                          {isEditingThis ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={editItemValue}
                                onChange={(e) => setEditItemValue(e.target.value)}
                                autoFocus
                                className="w-full px-3 py-1.5 bg-white border border-[#181E54] rounded-lg text-xs font-bold text-slate-900 focus:outline-none ring-2 ring-[#181E54]/20"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit();
                                  if (e.key === 'Escape') setEditingItem(null);
                                }}
                              />
                              {selectedCategoryKey === 'packages' && (
                                <div className="w-24 relative shrink-0">
                                  <span className="text-[10px] text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 font-bold font-mono">৳</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="500"
                                    value={editPackagePrice}
                                    onChange={(e) => setEditPackagePrice(e.target.value)}
                                    className="w-full pl-5 pr-2 py-1.5 bg-white border border-[#181E54] rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none ring-2 ring-[#181E54]/20"
                                    placeholder="Price"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveEdit();
                                      if (e.key === 'Escape') setEditingItem(null);
                                    }}
                                  />
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={handleSaveEdit}
                                className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                                title="Save changes"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingItem(null)}
                                className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-semibold text-slate-900 truncate">
                                {item}
                              </span>
                              {selectedCategoryKey === 'packages' && fields.packagePrices?.[item] !== undefined && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80 font-mono font-bold text-[10px] shrink-0">
                                  ৳ {fields.packagePrices[item].toLocaleString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action buttons: Move Up, Move Down, Edit, Delete */}
                        {!isEditingThis && (
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Reorder Up */}
                            <button
                              type="button"
                              onClick={() => handleMoveItem(index, 'up')}
                              disabled={index === 0}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                              title="Move up in dropdown"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>

                            {/* Reorder Down */}
                            <button
                              type="button"
                              onClick={() => handleMoveItem(index, 'down')}
                              disabled={index === (Array.isArray(fields[selectedCategoryKey]) ? (fields[selectedCategoryKey] as string[]).length : 0) - 1}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                              title="Move down in dropdown"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 text-slate-500 hover:text-[#181E54] hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
                              title="Rename / Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              title="Delete option"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 2: GENERAL & AGENCY PROFILE
      ============================================================ */}
      {activeTab === 'agency' && (
        <div className="max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-[#181E54] text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Agency &amp; Matrimonial Brand Profile
              </h2>
              <p className="text-xs text-slate-500">
                Official agency information printed on invoices, receipts, and system headers
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveAgencySettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agency / Business Name
                </label>
                <input
                  type="text"
                  value={agencyForm.agencyName}
                  onChange={(e) =>
                    setAgencyForm({ ...agencyForm, agencyName: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54] font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tagline / Motto
                </label>
                <input
                  type="text"
                  value={agencyForm.tagline}
                  onChange={(e) =>
                    setAgencyForm({ ...agencyForm, tagline: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Contact Phone
                </label>
                <input
                  type="text"
                  value={agencyForm.phone}
                  onChange={(e) =>
                    setAgencyForm({ ...agencyForm, phone: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Contact Email
                </label>
                <input
                  type="email"
                  value={agencyForm.email}
                  onChange={(e) =>
                    setAgencyForm({ ...agencyForm, email: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Office Address
                </label>
                <input
                  type="text"
                  value={agencyForm.address}
                  onChange={(e) =>
                    setAgencyForm({ ...agencyForm, address: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operating Currency
                </label>
                <select
                  value={agencyForm.currency}
                  onChange={(e) =>
                    setAgencyForm({ ...agencyForm, currency: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54]"
                >
                  <option value="BDT (Tk)">BDT (Tk) - Bangladeshi Taka</option>
                  <option value="USD ($)">USD ($) - US Dollar</option>
                  <option value="EUR (€)">EUR (€) - Euro</option>
                  <option value="GBP (£)">GBP (£) - British Pound</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  System Timezone
                </label>
                <input
                  type="text"
                  value={agencyForm.timezone}
                  onChange={(e) =>
                    setAgencyForm({ ...agencyForm, timezone: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#181E54] font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSavingAgency}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#181E54] hover:bg-[#121642] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                <span>{isSavingAgency ? 'Saving...' : 'Save Agency Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================
          TAB 3: BACKUP & DATA CENTER
      ============================================================ */}
      {activeTab === 'backup' && (
        <div className="max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  CRM Backup &amp; Data Governance Center
                </h2>
                <p className="text-xs text-slate-500">
                  Export, import, and audit your CRM field configurations and settings
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyJson}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy JSON</span>
              </button>
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#181E54] hover:bg-[#121642] text-white rounded-xl shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download Backup</span>
              </button>
            </div>
          </div>

          {/* Audit breakdown table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Field Category Distribution &amp; Options Audit
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {FIELD_CATEGORIES_META.map((cat) => {
                const count = (fields[cat.key] || []).length;
                return (
                  <div
                    key={cat.key}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1 rounded bg-white text-slate-600 border border-slate-200 shrink-0">
                        {renderCategoryIcon(cat.icon, 'w-3.5 h-3.5')}
                      </div>
                      <span className="font-semibold text-slate-800 truncate">
                        {cat.label}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-full border border-slate-200 shrink-0">
                      {count} items
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Import Card */}
          <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-purple-700" />
                Restore Settings from File
              </h4>
              <p className="text-[11px] text-purple-800/80 mt-0.5">
                Upload a previously exported backup file to restore custom dropdown seedings.
              </p>
            </div>
            <button
              type="button"
              onClick={handleTriggerImport}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
            >
              Select Backup JSON
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold ${
              toast.type === 'success'
                ? 'bg-emerald-950 text-white border-emerald-500/50'
                : 'bg-rose-950 text-white border-rose-500/50'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
