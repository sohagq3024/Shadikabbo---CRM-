// Universal tactile micro-interactions and smooth ripple animation for mobile and desktop

let isInitialized = false;

/**
 * Fast check whether an element has dark background styling without layout thrashing
 */
function isElementDarkFast(el: HTMLElement): boolean {
  try {
    const classList = el.className || '';
    if (typeof classList === 'string') {
      if (
        classList.includes('bg-[#181E54]') ||
        classList.includes('bg-[#121742]') ||
        classList.includes('bg-[#252E7D]') ||
        classList.includes('bg-[#D81124]') ||
        classList.includes('bg-slate-900') ||
        classList.includes('bg-slate-800') ||
        classList.includes('bg-blue-900') ||
        classList.includes('bg-purple-900') ||
        classList.includes('bg-black') ||
        classList.includes('text-white')
      ) {
        return true;
      }
    }
  } catch {
    // Safe fallback
  }
  return false;
}

/**
 * Initializes universal tactile ripple and tap scaling
 */
export function initTactileEffects(): () => void {
  if (isInitialized || typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }
  isInitialized = true;

  const handlePointerDown = (e: PointerEvent) => {
    const rawTarget = e.target as HTMLElement | null;
    if (!rawTarget) return;

    // Do not trigger ripple on form input controls
    const tagName = rawTarget.tagName.toLowerCase();
    if (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      rawTarget.isContentEditable
    ) {
      return;
    }

    // Only apply to interactive button / a elements
    const interactiveTarget = rawTarget.closest<HTMLElement>(
      'button, a, [data-ripple]'
    );

    if (!interactiveTarget) return;

    // Skip disabled elements or elements explicitly opting out
    if (
      (interactiveTarget as any).disabled ||
      interactiveTarget.getAttribute('aria-disabled') === 'true' ||
      interactiveTarget.hasAttribute('data-no-ripple')
    ) {
      return;
    }

    // Gentle tactile haptic feedback for touch devices (8ms vibration)
    if (e.pointerType === 'touch' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(8);
      } catch {
        // Safe fallback
      }
    }

    // Defer ripple element creation to next animation frame so click isn't delayed
    requestAnimationFrame(() => {
      if (!interactiveTarget.isConnected) return;
      const rect = interactiveTarget.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const maxDim = Math.max(rect.width, rect.height);
      const size = Math.max(maxDim * 1.5, 40);

      const isDark = isElementDarkFast(interactiveTarget);

      const ripple = document.createElement('span');
      ripple.className = `app-ripple-circle ${isDark ? 'app-ripple-light' : ''}`;
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      interactiveTarget.appendChild(ripple);

      const cleanup = () => {
        if (ripple.parentNode === interactiveTarget) {
          interactiveTarget.removeChild(ripple);
        }
      };

      ripple.addEventListener('animationend', cleanup, { once: true });
      setTimeout(cleanup, 450);
    });
  };

  document.addEventListener('pointerdown', handlePointerDown, { passive: true });

  return () => {
    document.removeEventListener('pointerdown', handlePointerDown);
    isInitialized = false;
  };
}
