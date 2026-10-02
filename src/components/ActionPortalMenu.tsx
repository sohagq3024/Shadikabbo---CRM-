import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ActionMenuItem {
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'primary';
}

export interface ActionPortalMenuProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRect: DOMRect | null;
  items: ActionMenuItem[];
  title?: string;
}

export const ActionPortalMenu: React.FC<ActionPortalMenuProps> = ({
  isOpen,
  onClose,
  triggerRect,
  items,
  title,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    top?: number;
    bottom?: number;
    right: number;
    openUpward: boolean;
  } | null>(null);

  useEffect(() => {
    if (!isOpen || !triggerRect) {
      setPosition(null);
      return;
    }

    // Estimate menu height based on item count: header (~36px) + each item (~44px) + padding
    const estimatedHeight = (title ? 40 : 10) + items.length * 44 + 20;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    // If space below is not enough and space above has more room, open upward
    const openUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    const right = Math.max(12, window.innerWidth - triggerRect.right);

    if (openUpward) {
      setPosition({
        bottom: window.innerHeight - triggerRect.top + 6,
        right,
        openUpward: true,
      });
    } else {
      setPosition({
        top: triggerRect.bottom + 6,
        right,
        openUpward: false,
      });
    }

    const handleScrollOrResize = () => {
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, triggerRect, items.length, title, onClose]);

  if (!isOpen || !position) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-auto">
      {/* Invisible backdrop to detect outside clicks immediately */}
      <div
        className="fixed inset-0 bg-transparent cursor-default"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Floating Menu Popover */}
      <div
        ref={menuRef}
        style={{
          top: position.top !== undefined ? `${position.top}px` : undefined,
          bottom: position.bottom !== undefined ? `${position.bottom}px` : undefined,
          right: `${position.right}px`,
        }}
        className={`fixed w-52 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 z-[10000] text-xs text-left divide-y divide-slate-100 origin-${
          position.openUpward ? 'bottom-right' : 'top-right'
        } animate-in fade-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {title}
          </div>
        )}

        <div className="py-1">
          {items.map((item, idx) => {
            const isDanger = item.variant === 'danger';
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onClose();
                  item.onClick();
                }}
                className={`w-full px-3.5 py-2.5 flex items-center gap-2.5 text-left transition-colors cursor-pointer group ${
                  isDanger
                    ? 'text-rose-600 hover:bg-rose-50'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-[#181E54]'
                }`}
              >
                <span className="shrink-0 transition-transform group-hover:scale-110">
                  {item.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block font-semibold text-xs leading-snug truncate">
                    {item.label}
                  </span>
                  {item.sublabel && (
                    <span
                      className={`block text-[10px] leading-tight truncate ${
                        isDanger ? 'text-rose-400' : 'text-slate-400'
                      }`}
                    >
                      {item.sublabel}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
};
