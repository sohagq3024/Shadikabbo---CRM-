// Universal tactile micro-interactions and smooth ripple animation for mobile and desktop

let isInitialized = false;

/**
 * Determines whether an element has a dark background color or dark styling
 */
function isElementDark(el: HTMLElement): boolean {
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

    const style = window.getComputedStyle(el);
    const bg = style.backgroundColor;
    if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') {
      const color = style.color;
      // If text is white/light, background is likely dark
      if (color && (color.includes('255, 255, 255') || color.includes('248, 250, 252'))) {
        return true;
      }
      return false;
    }

    // Parse rgb(r, g, b)
    const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      // Brightness formula
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 150;
    }
  } catch {
    // Fallback safe
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

    // Find the closest interactive target
    const interactiveTarget = rawTarget.closest<HTMLElement>(
      'button, [role="button"], a, [data-ripple], .cursor-pointer, .interactive-item, summary'
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

    // Compute relative pointer coordinates
    const rect = interactiveTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Ensure parent container has positioning and overflow containment
    const computedStyle = window.getComputedStyle(interactiveTarget);
    if (computedStyle.position === 'static') {
      interactiveTarget.style.position = 'relative';
    }
    const hadOverflowHidden = computedStyle.overflow === 'hidden';
    if (!hadOverflowHidden) {
      interactiveTarget.style.overflow = 'hidden';
    }

    // Calculate ripple radius to cover the entire bounding box
    const maxDim = Math.max(rect.width, rect.height);
    const size = Math.max(maxDim * 1.8, 48);

    const isDark = isElementDark(interactiveTarget);

    const ripple = document.createElement('span');
    ripple.className = `app-ripple-circle ${isDark ? 'app-ripple-light' : ''}`;
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    interactiveTarget.appendChild(ripple);

    // Remove element once ripple animation finishes
    const cleanup = () => {
      if (ripple.parentNode === interactiveTarget) {
        interactiveTarget.removeChild(ripple);
      }
      if (!hadOverflowHidden && interactiveTarget.querySelectorAll('.app-ripple-circle').length === 0) {
        interactiveTarget.style.overflow = '';
      }
    };

    ripple.addEventListener('animationend', cleanup, { once: true });
    setTimeout(cleanup, 550);
  };

  document.addEventListener('pointerdown', handlePointerDown, { passive: true });

  return () => {
    document.removeEventListener('pointerdown', handlePointerDown);
    isInitialized = false;
  };
}
