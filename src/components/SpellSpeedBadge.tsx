import React from 'react';
import { Zap } from 'lucide-react';

export function normalizeSpeedStr(speed?: number | string | null): string {
  if (speed === undefined || speed === null) return '';
  let s = String(speed).trim();
  if (!s) return '';
  // Convert Zenkaku (全角) numbers to Hankaku (半角)
  s = s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  // Strip common prefixes like 'スペルスピード', 'SS', 'スピード', 'speed'
  const stripped = s.replace(/^(スペルスピード|SS|スピード|speed)\s*[:：\-]?\s*/i, '').trim();
  return stripped || s;
}

export function isSpellSpeedMatching(
  productSpeed?: number | string | null,
  filterSpeed?: string
): boolean {
  if (!filterSpeed || filterSpeed === 'all') return true;
  const hasSpeed = productSpeed !== undefined && productSpeed !== null && String(productSpeed).trim() !== '';
  if (filterSpeed === 'none') {
    return !hasSpeed;
  }
  if (!hasSpeed) return false;

  const rawProd = String(productSpeed).trim().toLowerCase();
  const rawFilter = filterSpeed.trim().toLowerCase();

  // 1. Exact match
  if (rawProd === rawFilter) return true;

  // 2. Normalized match (e.g. "スペルスピード1" matches "1", "SS 2" matches "2", "１" matches "1")
  const normProd = normalizeSpeedStr(rawProd).toLowerCase();
  const normFilter = normalizeSpeedStr(rawFilter).toLowerCase();
  if (normProd && normFilter && normProd === normFilter) return true;

  // 3. Alphanumeric / Substring match
  const alphaProd = rawProd.replace(/[^0-9a-zぁ-んァ-ン一-龥]/gi, '');
  const alphaFilter = rawFilter.replace(/[^0-9a-zぁ-んァ-ン一-龥]/gi, '');
  if (alphaProd && alphaFilter && (alphaProd === alphaFilter || alphaProd.includes(alphaFilter) || alphaFilter.includes(alphaProd))) {
    return true;
  }

  return false;
}

interface SpellSpeedBadgeProps {
  speed?: number | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean; // If true, shows "スペルスピード 1", if false, shows "SS 1"
  className?: string;
}

export const SpellSpeedBadge: React.FC<SpellSpeedBadgeProps> = ({
  speed,
  size = 'sm',
  showLabel = true,
  className = '',
}) => {
  if (speed === undefined || speed === null || speed === '') return null;

  const norm = normalizeSpeedStr(speed);
  const num = parseInt(norm, 10);
  const isSpeed1 = norm === '1' || num === 1;
  const isSpeed2 = norm === '2' || num === 2;
  const isSpeed3 = norm === '3' || num === 3;

  let colorClasses = 'bg-purple-50 text-purple-700 border-purple-300';
  let zapColor = 'text-purple-600';
  let speedTitle = showLabel ? `スペルスピード ${norm}` : `SS ${norm}`;
  let speedSub = '任意速度';

  if (isSpeed1) {
    colorClasses = 'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100';
    zapColor = 'text-sky-600';
    speedTitle = showLabel ? 'スペルスピード 1' : 'SS 1';
    speedSub = '通常';
  } else if (isSpeed2) {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100';
    zapColor = 'text-amber-600';
    speedTitle = showLabel ? 'スペルスピード 2' : 'SS 2';
    speedSub = '速攻・即時';
  } else if (isSpeed3) {
    colorClasses = 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100';
    zapColor = 'text-rose-600';
    speedTitle = showLabel ? 'スペルスピード 3' : 'SS 3';
    speedSub = 'カウンター・最速';
  }

  const sizeClasses =
    size === 'lg'
      ? 'text-xs px-3 py-1 gap-1.5'
      : size === 'md'
      ? 'text-[11px] px-2.5 py-0.5 gap-1'
      : 'text-[10px] px-2 py-0.5 gap-0.5';

  const iconSize = size === 'lg' ? 'w-3.5 h-3.5' : 'w-3 h-3';

  return (
    <span
      className={`inline-flex items-center font-extrabold rounded-full border shadow-2xs transition-colors shrink-0 ${colorClasses} ${sizeClasses} ${className}`}
      title={`スペルスピード: ${norm} (${speedSub})`}
    >
      <Zap className={`${iconSize} ${zapColor} shrink-0 fill-current opacity-90`} />
      <span>{speedTitle}</span>
    </span>
  );
};
