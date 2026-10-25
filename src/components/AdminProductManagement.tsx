import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { readLocalImageFile } from '../utils/teamUtils';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  X,
  FileText,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Tag,
  Zap,
  Sparkles,
  SlidersHorizontal,
  Check,
  ChevronDown,
  CheckSquare,
  Square,
} from 'lucide-react';
import { SpellSpeedBadge, normalizeSpeedStr, isSpellSpeedMatching } from './SpellSpeedBadge';
import {
  optimizeLocalImage,
  ImageOptimizationResult,
  OPTIMIZATION_PRESETS,
  OptimizationPreset,
  formatBytes,
  getBase64ByteSize,
} from '../utils/imageOptimizer';

export const AdminProductManagement: React.FC = () => {
  const { products, addProduct, updateProduct, batchUpdateProducts, deleteProduct, showToast } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'published' | 'hidden'>('all');
  const [badgeFilter, setBadgeFilter] = useState<string>('all');
  type SortField = 'default' | 'badge' | 'name' | 'price' | 'published' | 'spellSpeed';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('default');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [spellSpeedFilter, setSpellSpeedFilter] = useState<string>('all');

  // Batch selection state & actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchMenuOpen, setIsBatchMenuOpen] = useState(false);
  const [batchConfirmTarget, setBatchConfirmTarget] = useState<{
    title: string;
    description: string;
    targetPublished: boolean;
    ids: string[];
  } | null>(null);

  const selectAllCheckboxRef = useRef<HTMLInputElement | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Add / Edit
  const [name, setName] = useState('');
  const [price, setPrice] = useState('800');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [spellSpeed, setSpellSpeed] = useState<string>('');
  const [enableUsageMemo, setEnableUsageMemo] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [image, setImage] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imagePreset, setImagePreset] = useState<OptimizationPreset>('balanced');
  const [optimizationResult, setOptimizationResult] = useState<ImageOptimizationResult | null>(null);
  const [isDraggingOverImage, setIsDraggingOverImage] = useState(false);
  const selectedLocalFileRef = useRef<File | null>(null);

  // File input ref for local file selection
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField('default');
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Available unique badges across all products
  const availableBadges = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.badge?.trim()) {
        set.add(p.badge.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ja'));
  }, [products]);

  // Available unique spell speeds across all registered products (including user custom entries)
  const availableSpellSpeeds = useMemo(() => {
    const map = new Map<string, string>();
    // Default baseline speeds
    ['1', '2', '3'].forEach((s) => map.set(s, s));

    products.forEach((p) => {
      if (p.spellSpeed !== undefined && p.spellSpeed !== null && String(p.spellSpeed).trim() !== '') {
        const raw = String(p.spellSpeed).trim();
        const norm = normalizeSpeedStr(raw);
        if (norm) {
          map.set(norm, raw);
        }
      }
    });

    return Array.from(map.entries()).sort((a, b) => {
      const numA = Number(a[0]);
      const numB = Number(b[0]);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      if (!isNaN(numA)) return -1;
      if (!isNaN(numB)) return 1;
      return a[0].localeCompare(b[0], 'ja');
    });
  }, [products]);

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const isPub = p.isPublished !== false;
        if (visibilityFilter === 'published' && !isPub) return false;
        if (visibilityFilter === 'hidden' && isPub) return false;

        if (badgeFilter !== 'all') {
          if (p.badge?.trim() !== badgeFilter) return false;
        }

        if (!isSpellSpeedMatching(p.spellSpeed, spellSpeedFilter)) {
          return false;
        }

        const query = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          (p.badge && p.badge.toLowerCase().includes(query)) ||
          (p.spellSpeed && String(p.spellSpeed).toLowerCase().includes(query)) ||
          (p.spellSpeed && `スペルスピード${p.spellSpeed}`.toLowerCase().includes(query)) ||
          (p.spellSpeed && `ss${p.spellSpeed}`.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => {
        if (sortField === 'badge') {
          const hasA = Boolean(a.badge && a.badge.trim());
          const hasB = Boolean(b.badge && b.badge.trim());
          if (hasA && !hasB) return -1;
          if (!hasA && hasB) return 1;
          if (!hasA && !hasB) return a.name.localeCompare(b.name, 'ja');
          const badgeComp = (a.badge || '').localeCompare(b.badge || '', 'ja');
          const result = badgeComp !== 0 ? badgeComp : a.name.localeCompare(b.name, 'ja');
          return sortDirection === 'asc' ? result : -result;
        }
        if (sortField === 'spellSpeed') {
          const getSpeedVal = (s?: number | string) => {
            if (s === undefined || s === null || s === '') return 999;
            const norm = normalizeSpeedStr(s);
            const n = Number(norm);
            return isNaN(n) ? 500 : n;
          };
          const sA = getSpeedVal(a.spellSpeed);
          const sB = getSpeedVal(b.spellSpeed);
          const diff = sA - sB;
          const result = diff !== 0 ? diff : a.name.localeCompare(b.name, 'ja');
          return sortDirection === 'asc' ? result : -result;
        }
        if (sortField === 'name') {
          const result = a.name.localeCompare(b.name, 'ja');
          return sortDirection === 'asc' ? result : -result;
        }
        if (sortField === 'price') {
          return sortDirection === 'asc' ? a.price - b.price : b.price - a.price;
        }
        if (sortField === 'published') {
          const pubA = a.isPublished !== false ? 1 : 0;
          const pubB = b.isPublished !== false ? 1 : 0;
          return sortDirection === 'asc' ? pubB - pubA : pubA - pubB;
        }
        return 0; // default order
      });
  }, [products, visibilityFilter, badgeFilter, spellSpeedFilter, searchQuery, sortField, sortDirection]);

  const publishedCount = products.filter((p) => p.isPublished !== false).length;
  const hiddenCount = products.filter((p) => p.isPublished === false).length;

  // Selection and batch calculation
  const allFilteredIds = useMemo(() => filteredProducts.map((p) => p.id), [filteredProducts]);
  const isAllFilteredSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.includes(id));
  const isSomeFilteredSelected = allFilteredIds.some((id) => selectedIds.includes(id)) && !isAllFilteredSelected;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isSomeFilteredSelected;
    }
  }, [isSomeFilteredSelected]);

  const selectedProducts = useMemo(
    () => products.filter((p) => selectedIds.includes(p.id)),
    [products, selectedIds]
  );
  const selectedStats = useMemo(() => {
    const published = selectedProducts.filter((p) => p.isPublished !== false).length;
    const hidden = selectedProducts.filter((p) => p.isPublished === false).length;
    return { published, hidden };
  }, [selectedProducts]);

  const toggleSelectProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const selectByStatus = (status: 'published' | 'hidden') => {
    const ids = filteredProducts
      .filter((p) => (status === 'published' ? p.isPublished !== false : p.isPublished === false))
      .map((p) => p.id);
    setSelectedIds(ids);
  };

  const handleBatchSetPublished = async (ids: string[], targetPublished: boolean) => {
    if (!ids.length) return;
    try {
      await batchUpdateProducts(ids, { isPublished: targetPublished });
      showToast(
        `${ids.length}件の商品を一括で「購入ページに${targetPublished ? '表示（公開）' : '非表示'}」に設定しました`,
        targetPublished ? 'success' : 'info'
      );
      clearSelection();
    } catch {
      showToast('一括更新に失敗しました', 'error');
    }
  };

  const promptBatchAction = (scope: 'selected' | 'filtered' | 'all', targetPublished: boolean) => {
    let ids: string[] = [];
    let title = '';
    let description = '';

    if (scope === 'selected') {
      ids = selectedIds;
      title = `選択中の商品 (${ids.length}件)`;
      description = `現在チェックがついている ${ids.length} 件の商品を購入ページに${targetPublished ? '表示（公開）' : '非表示'}にします。`;
    } else if (scope === 'filtered') {
      ids = allFilteredIds;
      title = `絞り込み結果の商品 (${ids.length}件)`;
      description = `現在表示されている ${ids.length} 件の商品を購入ページに${targetPublished ? '表示（公開）' : '非表示'}にします。`;
    } else {
      ids = products.map((p) => p.id);
      title = `登録済みの全商品 (${ids.length}件)`;
      description = `登録されている全 ${ids.length} 件の商品を購入ページに${targetPublished ? '表示（公開）' : '非表示'}にします。`;
    }

    if (ids.length === 0) {
      showToast('対象の商品がありません', 'error');
      return;
    }

    setBatchConfirmTarget({
      title,
      description,
      targetPublished,
      ids,
    });
  };

  const executeBatchConfirm = async () => {
    if (!batchConfirmTarget) return;
    const { ids, targetPublished } = batchConfirmTarget;
    setBatchConfirmTarget(null);
    await handleBatchSetPublished(ids, targetPublished);
  };

  const openAddModal = () => {
    setName('');
    setPrice('750');
    setDescription('');
    setBadge('');
    setSpellSpeed('');
    setImage('');
    setOptimizationResult(null);
    selectedLocalFileRef.current = null;
    setImagePreset('balanced');
    setEnableUsageMemo(false);
    setIsPublished(true); // デフォルトで購入ページに表示（公開）
    setShowUrlInput(false);
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setPrice(p.price.toString());
    setDescription(p.description);
    setBadge(p.badge || '');
    setSpellSpeed(p.spellSpeed !== undefined && p.spellSpeed !== null ? String(p.spellSpeed) : '');
    setImage(p.image || '');
    setOptimizationResult(null);
    selectedLocalFileRef.current = null;
    setImagePreset('balanced');
    setEnableUsageMemo(p.enableUsageMemo === true);
    setIsPublished(p.isPublished !== false);
    setShowUrlInput(false);
  };

  // Toggle publish/hidden status directly from table
  const handleTogglePublish = (p: Product) => {
    const nextVal = p.isPublished === false ? true : false;
    updateProduct(p.id, { isPublished: nextVal });
    showToast(
      `「${p.name}」を${nextVal ? '購入ページに表示（公開）' : '購入ページから非表示'}に設定しました`,
      nextVal ? 'success' : 'info'
    );
  };

  // Optimize and set local image file
  const processAndSetLocalImage = async (file: File, preset: OptimizationPreset = imagePreset) => {
    try {
      setIsProcessingImage(true);
      selectedLocalFileRef.current = file;
      const presetCfg = OPTIMIZATION_PRESETS[preset];
      const res = await optimizeLocalImage(file, presetCfg.options);
      setImage(res.dataUrl);
      setOptimizationResult(res);
      showToast(
        `画像を最適化しました (${formatBytes(res.originalSizeBytes)} → ${formatBytes(res.compressedSizeBytes)} / ${res.reductionRatio}%削減)`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || '画像の読み込み・最適化に失敗しました', 'error');
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Handle local image file selection
  const handleLocalImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndSetLocalImage(file, imagePreset);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Change optimization preset and re-optimize if source file is in memory
  const handleChangePreset = async (newPreset: OptimizationPreset) => {
    setImagePreset(newPreset);
    if (selectedLocalFileRef.current) {
      await processAndSetLocalImage(selectedLocalFileRef.current, newPreset);
    }
  };

  // Drag and drop handlers for image dropzone
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverImage(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverImage(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverImage(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processAndSetLocalImage(file, imagePreset);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!name.trim()) return;

    const numPrice = parseInt(price, 10);
    const parsedPrice = isNaN(numPrice) ? 0 : Math.max(0, numPrice);
    const trimmedSpeed = spellSpeed.trim();
    const normalizedSpeed = trimmedSpeed ? normalizeSpeedStr(trimmedSpeed) : '';
    const parsedSpellSpeed = normalizedSpeed
      ? (isNaN(Number(normalizedSpeed)) ? normalizedSpeed : Number(normalizedSpeed))
      : '';

    try {
      setIsSubmitting(true);
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: name.trim(),
          price: parsedPrice,
          description: description.trim(),
          badge: badge.trim() || undefined,
          spellSpeed: parsedSpellSpeed,
          image: image.trim() || undefined,
          enableUsageMemo: enableUsageMemo,
          isPublished: isPublished,
        });
        setEditingProduct(null);
        setIsAddModalOpen(false);
      } else {
        await addProduct({
          name: name.trim(),
          price: parsedPrice,
          description: description.trim(),
          badge: badge.trim() || undefined,
          spellSpeed: parsedSpellSpeed || undefined,
          image: image.trim() || undefined,
          enableUsageMemo: enableUsageMemo,
          isPublished: isPublished,
        });
        setIsAddModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Action */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <Package className="w-4 h-4" />
            <span>商品マスタ管理</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            取扱商品の登録・管理
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ストアで販売する商品の追加、ローカルからの画像挿入、価格設定、メモ機能の切替を行えます。
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          新規商品を登録する
        </button>
      </div>

      {/* Search, Filter & Sort Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => setVisibilityFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  visibilityFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                すべて ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setVisibilityFilter('published')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  visibilityFilter === 'published'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>表示中 ({publishedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setVisibilityFilter('hidden')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  visibilityFilter === 'hidden'
                    ? 'bg-white text-slate-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>非表示中 ({hiddenCount})</span>
              </button>
            </div>

            {/* Quick Batch Menu Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsBatchMenuOpen(!isBatchMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="表示・非表示の一括操作"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                <span>一括操作</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isBatchMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsBatchMenuOpen(false)}
                  />
                  <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-xs animate-in fade-in duration-150">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
                      <span>チェック選択の補助</span>
                      {selectedIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            clearSelection();
                            setIsBatchMenuOpen(false);
                          }}
                          className="text-rose-600 hover:underline cursor-pointer"
                        >
                          選択解除
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        toggleSelectAllFiltered();
                        setIsBatchMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{isAllFilteredSelected ? '絞り込み中の全選択を解除' : `絞り込み中の商品を全選択 (${allFilteredIds.length}件)`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        selectByStatus('published');
                        setIsBatchMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>表示中の商品のみ選択</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        selectByStatus('hidden');
                        setIsBatchMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                      <span>非表示の商品のみ選択</span>
                    </button>

                    <div className="px-3 py-1.5 border-t border-b border-slate-100 text-[11px] font-bold text-slate-400 bg-slate-50/60 mt-1">
                      絞り込み結果の一括操作 ({allFilteredIds.length}件)
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBatchMenuOpen(false);
                        promptBatchAction('filtered', true);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>絞り込み結果を一括【表示】にする</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBatchMenuOpen(false);
                        promptBatchAction('filtered', false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                      <span>絞り込み結果を一括【非表示】にする</span>
                    </button>

                    <div className="px-3 py-1.5 border-t border-b border-slate-100 text-[11px] font-bold text-slate-400 bg-slate-50/60 mt-1">
                      全商品の一括操作 ({products.length}件)
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBatchMenuOpen(false);
                        promptBatchAction('all', true);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>全商品を一括【表示】にする</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBatchMenuOpen(false);
                        promptBatchAction('all', false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-rose-50 text-slate-700 hover:text-rose-900 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                      <span>全商品を一括【非表示】にする</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sort Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[11px] text-slate-400 font-medium">並び替え:</span>
              <select
                value={sortField === 'default' ? 'default' : `${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'default') {
                    setSortField('default');
                    setSortDirection('asc');
                  } else {
                    const [f, d] = val.split('-');
                    setSortField(f as SortField);
                    setSortDirection(d as SortDirection);
                  }
                }}
                className="bg-transparent text-xs text-slate-700 font-medium focus:outline-hidden cursor-pointer pr-1"
                aria-label="商品の並び替え"
              >
                <option value="default">標準（登録順）</option>
                <option value="badge-asc">🏷️ バッジ・ラベル順 (昇順: A→Z/あ→ん)</option>
                <option value="badge-desc">🏷️ バッジ・ラベル順 (降順: Z→A/ん→あ)</option>
                <option value="name-asc">商品名順 (昇順)</option>
                <option value="name-desc">商品名順 (降順)</option>
                <option value="price-asc">販売単価が安い順</option>
                <option value="price-desc">販売単価が高い順</option>
                <option value="published-asc">表示中（公開）優先</option>
                <option value="published-desc">非表示中優先</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="商品名・説明文・バッジで検索"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
              {filteredProducts.length} 件
            </span>
          </div>
        </div>

        {/* Badge Quick Filters */}
        {availableBadges.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
              <Tag className="w-3 h-3 text-indigo-500" />
              バッジ絞り込み:
            </span>
            <button
              type="button"
              onClick={() => setBadgeFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                badgeFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              すべて
            </button>
            {availableBadges.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBadgeFilter(badgeFilter === b ? 'all' : b)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  badgeFilter === b
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50/80 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                <span>{b}</span>
                {badgeFilter === b && <X className="w-3 h-3 ml-0.5" />}
              </button>
            ))}
          </div>
        )}

        {/* Spell Speed Quick Filters (動的自作値・標準値すべて反映) */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
            <Zap className="w-3 h-3 text-amber-500" />
            スペルスピード絞り込み:
          </span>
          <button
            type="button"
            onClick={() => setSpellSpeedFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              spellSpeedFilter === 'all'
                ? 'bg-amber-500 text-white shadow-xs font-bold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            すべて
          </button>

          {availableSpellSpeeds.map(([normKey, rawLabel]) => {
            const isSelected =
              spellSpeedFilter === rawLabel ||
              spellSpeedFilter === normKey ||
              normalizeSpeedStr(spellSpeedFilter) === normKey;

            let displayLabel = `SS ${rawLabel}`;
            if (normKey === '1') displayLabel = 'SS 1 (通常)';
            else if (normKey === '2') displayLabel = 'SS 2 (速攻)';
            else if (normKey === '3') displayLabel = 'SS 3 (カウンター)';
            else if (rawLabel.startsWith('SS') || rawLabel.startsWith('スペルスピード')) {
              displayLabel = rawLabel;
            }

            return (
              <button
                key={normKey}
                type="button"
                onClick={() => setSpellSpeedFilter(isSelected ? 'all' : rawLabel)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-xs font-bold'
                    : 'bg-amber-50/80 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <span>{displayLabel}</span>
                {isSelected && <X className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setSpellSpeedFilter(spellSpeedFilter === 'none' ? 'all' : 'none')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              spellSpeedFilter === 'none'
                ? 'bg-slate-700 text-white shadow-xs font-bold'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>未設定</span>
            {spellSpeedFilter === 'none' && <X className="w-3 h-3 ml-0.5" />}
          </button>
        </div>

        {/* Active Sort / Filter Banner */}
        {(sortField !== 'default' || badgeFilter !== 'all' || spellSpeedFilter !== 'all' || searchQuery) && (
          <div className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-slate-600">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-700">現在の表示条件:</span>
              {sortField !== 'default' && (
                <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200 text-[11px] font-medium">
                  {sortField === 'badge' && `バッジ・ラベル順 (${sortDirection === 'asc' ? '昇順' : '降順'})`}
                  {sortField === 'spellSpeed' && `スペルスピード順 (${sortDirection === 'asc' ? '1→3順' : '3→1順'})`}
                  {sortField === 'name' && `商品名順 (${sortDirection === 'asc' ? '昇順' : '降順'})`}
                  {sortField === 'price' && `販売単価順 (${sortDirection === 'asc' ? '安い順' : '高い順'})`}
                  {sortField === 'published' && `表示状態順 (${sortDirection === 'asc' ? '公開優先' : '非公開優先'})`}
                </span>
              )}
              {spellSpeedFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200 text-[11px] font-medium">
                  速度: {spellSpeedFilter === 'none' ? '未設定のみ' : `SS ${spellSpeedFilter}`}
                </span>
              )}
              {badgeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200 text-[11px] font-medium">
                  バッジ: {badgeFilter}
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200 text-[11px] font-medium">
                  検索: {searchQuery}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setSortField('default');
                setSortDirection('asc');
                setBadgeFilter('all');
                setSpellSpeedFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline whitespace-nowrap ml-2"
            >
              条件をリセット
            </button>
          </div>
        )}
      </div>

      {/* Floating / Sticky Batch Action Bar for Selected Products */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-30 bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-500 text-white font-extrabold text-xs shadow-inner shrink-0">
              {selectedIds.length}
            </span>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
                <span>{selectedIds.length} 件の商品を選択中</span>
                <span className="text-[11px] font-normal text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                  表示中: {selectedStats.published}件 / 非表示中: {selectedStats.hidden}件
                </span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                選択した商品の購入ページへの表示・非表示を一括で切り替えられます
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
            {/* Batch Publish Selected */}
            <button
              type="button"
              onClick={() => handleBatchSetPublished(selectedIds, true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Eye className="w-4 h-4 text-emerald-200" />
              <span>選択した商品を一括【表示】</span>
            </button>

            {/* Batch Hide Selected */}
            <button
              type="button"
              onClick={() => handleBatchSetPublished(selectedIds, false)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border border-slate-600"
            >
              <EyeOff className="w-4 h-4 text-slate-300" />
              <span>選択した商品を一括【非表示】</span>
            </button>

            <div className="h-5 w-px bg-slate-700 hidden sm:block" />

            {/* Clear Selection */}
            <button
              type="button"
              onClick={clearSelection}
              className="px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              選択解除
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                {/* Select All Checkbox */}
                <th className="pl-5 pr-2 py-3.5 w-10">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      ref={selectAllCheckboxRef}
                      checked={isAllFilteredSelected}
                      onChange={toggleSelectAllFiltered}
                      className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      title={isAllFilteredSelected ? '全選択を解除' : '絞り込み中の商品を全選択'}
                      aria-label="絞り込み中の商品を全選択"
                    />
                  </div>
                </th>

                {/* Name Header */}
                <th className="px-5 py-3.5">
                  <button
                    type="button"
                    onClick={() => handleSortToggle('name')}
                    className="flex items-center gap-1.5 hover:text-slate-800 transition-colors cursor-pointer group"
                    title="商品名で並び替え"
                  >
                    <span>商品（画像・名称）</span>
                    {sortField === 'name' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />
                    )}
                  </button>
                </th>

                {/* Published Header */}
                <th className="px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => handleSortToggle('published')}
                    className="flex items-center gap-1.5 hover:text-slate-800 transition-colors cursor-pointer group"
                    title="表示/非表示状態で並び替え"
                  >
                    <span>購入ページ表示</span>
                    {sortField === 'published' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />
                    )}
                  </button>
                </th>

                {/* Badge Header with Interactive Sorting */}
                <th
                  className={`px-4 py-3.5 transition-colors ${
                    sortField === 'badge' ? 'bg-indigo-50 text-indigo-900 font-bold' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSortToggle('badge')}
                    className="flex items-center gap-1.5 hover:text-indigo-700 transition-colors cursor-pointer group"
                    title="バッジ・ラベルで昇順/降順に並び替え"
                  >
                    <Tag className="w-3.5 h-3.5 text-indigo-500" />
                    <span>バッジ・ラベル</span>
                    {sortField === 'badge' ? (
                      sortDirection === 'asc' ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-indigo-200/80 text-indigo-800 px-1.5 py-0.5 rounded font-bold">
                          昇順 <ArrowUp className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-indigo-200/80 text-indigo-800 px-1.5 py-0.5 rounded font-bold">
                          降順 <ArrowDown className="w-3 h-3" />
                        </span>
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400" />
                    )}
                  </button>
                </th>

                {/* Spell Speed Header */}
                <th
                  className={`px-4 py-3.5 transition-colors ${
                    sortField === 'spellSpeed' ? 'bg-amber-50 text-amber-900 font-bold' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSortToggle('spellSpeed')}
                    className="flex items-center gap-1.5 hover:text-amber-700 transition-colors cursor-pointer group"
                    title="スペルスピードで昇順/降順に並び替え"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>スペルスピード</span>
                    {sortField === 'spellSpeed' ? (
                      sortDirection === 'asc' ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                          1→3 <ArrowUp className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                          3→1 <ArrowDown className="w-3 h-3" />
                        </span>
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-400" />
                    )}
                  </button>
                </th>

                {/* Price Header */}
                <th className="px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => handleSortToggle('price')}
                    className="flex items-center gap-1.5 hover:text-slate-800 transition-colors cursor-pointer group"
                    title="販売単価で並び替え"
                  >
                    <span>販売単価</span>
                    {sortField === 'price' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />
                    )}
                  </button>
                </th>

                <th className="px-4 py-3.5">使用時メモ機能</th>
                <th className="px-6 py-3.5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                return (
                  <tr
                    key={p.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-indigo-50/70 hover:bg-indigo-100/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Row Checkbox */}
                    <td className="pl-5 pr-2 py-3.5 w-10" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectProduct(p.id)}
                        className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        aria-label={`${p.name}を選択`}
                      />
                    </td>

                    {/* Image & Name & Description */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-slate-400" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 leading-snug">{p.name}</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-sm mt-0.5">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Published Toggle */}
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(p)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer shadow-2xs ${
                          p.isPublished !== false
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                        }`}
                        title={
                          p.isPublished !== false
                            ? 'クリックで購入ページから非表示にします'
                            : 'クリックで購入ページに表示（公開）します'
                        }
                      >
                        {p.isPublished !== false ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span>表示中（公開）</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                            <span>非表示（非公開）</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Badge */}
                    <td className={`px-4 py-3.5 ${sortField === 'badge' ? 'bg-indigo-50/30' : ''}`}>
                      {p.badge ? (
                        <button
                          type="button"
                          onClick={() => setBadgeFilter(badgeFilter === p.badge ? 'all' : p.badge!)}
                          className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-[11px] font-bold px-2.5 py-0.5 rounded-full cursor-pointer transition-colors"
                          title={`バッジ「${p.badge}」で絞り込み`}
                        >
                          <Tag className="w-3 h-3 text-indigo-500" />
                          <span>{p.badge}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Spell Speed */}
                    <td className={`px-4 py-3.5 ${sortField === 'spellSpeed' ? 'bg-amber-50/30' : ''}`}>
                      {p.spellSpeed !== undefined && p.spellSpeed !== null && p.spellSpeed !== '' ? (
                        <SpellSpeedBadge speed={p.spellSpeed} showLabel={false} />
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3.5 font-mono font-bold text-sm text-slate-900 tabular-nums">
                      ¥{p.price.toLocaleString()}
                    </td>

                    {/* Memo Feature Indicator */}
                    <td className="px-4 py-3.5">
                      {p.enableUsageMemo ? (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/90 text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                          <FileText className="w-3 h-3 text-amber-600" />
                          メモ機能あり
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded-md">
                          メモなし(即時)
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="編集"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setProductToDelete(p)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-slate-600 text-sm">該当する商品がありません</p>
                    <p className="text-xs text-slate-400 mt-1">検索条件や絞り込みフィルターを変更してください</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {editingProduct ? '商品情報の編集' : '新規商品の登録'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
              {/* Product Image Upload Section with Advanced Optimization */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <label className="text-xs font-bold text-slate-800">
                      商品画像（ローカル画像サイズ自動最適化）
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    {showUrlInput ? 'ローカル選択に戻る' : 'URL入力に切替'}
                  </button>
                </div>

                {/* Hidden local file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleLocalImageChange}
                  className="hidden"
                />

                {!showUrlInput ? (
                  <div className="space-y-3">
                    {/* Optimization Preset Selector */}
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-1.5 px-1">
                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                          <SlidersHorizontal className="w-3 h-3 text-indigo-600" />
                          最適化モード（自動圧縮）:
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {OPTIMIZATION_PRESETS[imagePreset].sub}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['balanced', 'high', 'eco'] as OptimizationPreset[]).map((presetKey) => {
                          const preset = OPTIMIZATION_PRESETS[presetKey];
                          const isActive = imagePreset === presetKey;
                          return (
                            <button
                              key={presetKey}
                              type="button"
                              onClick={() => handleChangePreset(presetKey)}
                              className={`px-2 py-1.5 rounded-lg text-left transition-all cursor-pointer border ${
                                isActive
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-2xs'
                                  : 'bg-slate-50/50 hover:bg-slate-100/70 border-slate-200 text-slate-600'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold block">{preset.label}</span>
                                {isActive && <Check className="w-3 h-3 text-indigo-600" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Drag and drop upload container */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative rounded-xl border-2 border-dashed p-4 transition-all flex flex-col sm:flex-row items-center gap-4 ${
                        isDraggingOverImage
                          ? 'border-indigo-500 bg-indigo-50/80 scale-[1.01]'
                          : 'border-slate-300 hover:border-indigo-300 bg-white'
                      }`}
                    >
                      {/* Thumbnail preview */}
                      <div className="w-24 h-24 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative group shadow-2xs">
                        {image ? (
                          <>
                            <img
                              src={image}
                              alt="プレビュー"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-1.5 bg-white text-slate-800 rounded-lg text-[10px] font-bold shadow-xs cursor-pointer"
                                title="画像を変更"
                              >
                                変更
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-2 text-slate-400">
                            <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-60" />
                            <span className="text-[9px] block">未選択</span>
                          </div>
                        )}
                      </div>

                      {/* Dropzone text & Action Buttons */}
                      <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <button
                            type="button"
                            disabled={isProcessingImage}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isProcessingImage ? '最適化中...' : '画像を選択またはドラッグ＆ドロップ'}</span>
                          </button>

                          {image && (
                            <button
                              type="button"
                              onClick={() => {
                                setImage('');
                                setOptimizationResult(null);
                                selectedLocalFileRef.current = null;
                              }}
                              className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
                            >
                              画像を削除
                            </button>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          スマホ・カメラの写真（JPG, PNG, WebP）をそのまま選択できます。自動的に余白・解像度を調整し、
                          <strong className="text-indigo-600 font-bold">超軽量WebP/JPEGに最適化</strong>して保存します。
                        </p>
                      </div>
                    </div>

                    {/* Optimization result card */}
                    {optimizationResult && (
                      <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs animate-fade-in">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
                            <Sparkles className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-emerald-900">最適化完了:</span>
                              <span className="line-through text-slate-400 font-mono text-[11px]">
                                {formatBytes(optimizationResult.originalSizeBytes)}
                              </span>
                              <span className="font-bold font-mono text-emerald-700">
                                → {formatBytes(optimizationResult.compressedSizeBytes)}
                              </span>
                              <span className="bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-extrabold text-[10px]">
                                -{optimizationResult.reductionRatio}%
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              寸法: {optimizationResult.width} × {optimizationResult.height} px（{optimizationResult.format.toUpperCase()}形式・容量節約済み）
                            </div>
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-emerald-200 text-[11px] text-emerald-800 font-bold self-end sm:self-auto shrink-0 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>高速表示最適化済</span>
                        </div>
                      </div>
                    )}

                    {/* Existing image size indicator (if not newly optimized in this turn) */}
                    {!optimizationResult && image && image.startsWith('data:image/') && (
                      <div className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>保存済み画像サイズ: 約 {formatBytes(getBase64ByteSize(image))}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Base64保存中</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => {
                        setImage(e.target.value);
                        setOptimizationResult(null);
                        selectedLocalFileRef.current = null;
                      }}
                      placeholder="https://example.com/image.jpg または /src/assets/..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      画像URLを直接指定することも可能です。
                    </p>
                  </div>
                )}
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  商品名 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="例: 特製クラフトモクテル / チュロス"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              {/* Badge & Label */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  バッジ・ラベル（任意）
                </label>
                <input
                  type="text"
                  placeholder="例: おすすめ / 限定 / フェス名物"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Spell Speed Section */}
              <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                    <span>スペルスピード（発動速度）</span>
                  </label>
                  {spellSpeed ? (
                    <SpellSpeedBadge speed={spellSpeed} size="sm" />
                  ) : (
                    <span className="text-[10px] text-slate-400">未設定（通常アイテム）</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  TCGルールに基づくカードやアイテムの発動速度（1: 通常、2: 速攻・即時、3: カウンター・最速）を設定できます。
                </p>

                {/* Quick Select Buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { val: '', label: 'なし', sub: '未設定' },
                    { val: '1', label: 'SS 1', sub: '通常' },
                    { val: '2', label: 'SS 2', sub: '速攻' },
                    { val: '3', label: 'SS 3', sub: 'カウンター' },
                  ].map((btn) => (
                    <button
                      key={btn.val}
                      type="button"
                      onClick={() => setSpellSpeed(btn.val)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        spellSpeed === btn.val
                          ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      <span className="block text-xs font-bold">{btn.label}</span>
                      <span className={`block text-[10px] ${spellSpeed === btn.val ? 'text-white/80' : 'text-slate-400'}`}>
                        {btn.sub}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Free input */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-500 shrink-0">自由入力:</span>
                  <input
                    type="text"
                    placeholder="例: 1, 2, 3, または任意テキスト"
                    value={spellSpeed}
                    onChange={(e) => setSpellSpeed(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {spellSpeed && (
                    <button
                      type="button"
                      onClick={() => setSpellSpeed('')}
                      className="text-[11px] text-slate-500 hover:text-slate-800 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
                    >
                      クリア
                    </button>
                  )}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  販売価格 (円) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  placeholder="例: 800"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['+10', '+50', '+100', '+500'].map((add) => (
                    <button
                      key={add}
                      type="button"
                      onClick={() => {
                        const current = parseInt(price, 10) || 0;
                        setPrice((current + parseInt(add, 10)).toString());
                      }}
                      className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded border border-slate-200 transition-colors"
                    >
                      {add}円
                    </button>
                  ))}
                </div>
              </div>

              {/* Memo Option Selection */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>商品使用時のメモ入力機能</span>
                  <span className="text-[10px] text-slate-400 font-normal">※所持数ページでの使用時</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-2.5">
                  利用者が購入後に「所持数ページ」でこの商品を使用する際、メモ入力欄を設けるかどうかを選択します。
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* メモを使わない */}
                  <button
                    type="button"
                    onClick={() => setEnableUsageMemo(false)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      !enableUsageMemo
                        ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          !enableUsageMemo ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-400 bg-white'
                        }`}
                      >
                        {!enableUsageMemo && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="font-bold text-xs text-slate-900">メモ機能を使わない</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5 pl-6 leading-relaxed">
                      メモ欄を表示せず数量確認のみで素早く消化。（フード・ドリンク・グッズ推奨）
                    </p>
                  </button>

                  {/* メモを使う */}
                  <button
                    type="button"
                    onClick={() => setEnableUsageMemo(true)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      enableUsageMemo
                        ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          enableUsageMemo ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-400 bg-white'
                        }`}
                      >
                        {enableUsageMemo && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        メモ機能を使う
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5 pl-6 leading-relaxed">
                      用途・引換場所・整理券番号などを任意で入力。（体験チケット・抽選券推奨）
                    </p>
                  </button>
                </div>
              </div>

              {/* 購入ページ表示/非表示設定 */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>購入ページへの表示設定</span>
                    <span className="text-[10px] text-slate-400 font-normal">※参加者への公開設定</span>
                  </label>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isPublished ? '表示（公開中）' : '非表示（下書き）'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2.5">
                  この商品を利用者の「購入ページ」に表示して購入可能にするか、非表示（下書き・準備中）にするかを選択します。
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* 表示する */}
                  <button
                    type="button"
                    onClick={() => setIsPublished(true)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isPublished
                        ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isPublished ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-400 bg-white'
                        }`}
                      >
                        {isPublished && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        購入ページに表示する
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5 pl-6 leading-relaxed">
                      利用者の購入ページに並び、所持金での注文・購入が可能になります。
                    </p>
                  </button>

                  {/* 表示しない */}
                  <button
                    type="button"
                    onClick={() => setIsPublished(false)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      !isPublished
                        ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          !isPublished ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-400 bg-white'
                        }`}
                      >
                        {!isPublished && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                        購入ページに表示しない
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5 pl-6 leading-relaxed">
                      管理者画面のみで確認でき、利用者の購入ページには非表示となります。
                    </p>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  商品説明・詳細
                </label>
                <textarea
                  rows={3}
                  placeholder="商品のこだわり、容量、アレルギー情報など"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  {isSubmitting ? '保存中...' : editingProduct ? '変更を保存する' : '商品を登録する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">商品の削除確認</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                商品「<span className="font-bold text-slate-900">{productToDelete.name}</span>」（¥{productToDelete.price.toLocaleString()}）をストアから完全に削除しますか？<br />
                この操作は取り消せません。
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteProduct(productToDelete.id);
                    setProductToDelete(null);
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  削除する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Confirm Modal */}
      {batchConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${batchConfirmTarget.targetPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                {batchConfirmTarget.targetPublished ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  一括{batchConfirmTarget.targetPublished ? '表示（公開）' : '非表示'}の確認
                </h3>
                <p className="text-xs text-slate-500">
                  {batchConfirmTarget.title}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-700 space-y-1.5 leading-relaxed">
              <p>
                対象件数: <strong className="font-bold text-slate-900">{batchConfirmTarget.ids.length} 件</strong>
              </p>
              <p className="text-slate-500 text-[11px]">
                {batchConfirmTarget.targetPublished
                  ? '対象の商品は利用者の購入ページに表示され、購入が可能になります。'
                  : '対象の商品は利用者の購入ページから非表示になり、利用者は閲覧・購入できなくなります。'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBatchConfirmTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={executeBatchConfirm}
                className={`px-4 py-2 text-xs font-bold rounded-xl text-white shadow-sm transition-all cursor-pointer ${
                  batchConfirmTarget.targetPublished
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-slate-800 hover:bg-slate-900'
                }`}
              >
                {batchConfirmTarget.ids.length}件を一括{batchConfirmTarget.targetPublished ? '表示にする' : '非表示にする'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
