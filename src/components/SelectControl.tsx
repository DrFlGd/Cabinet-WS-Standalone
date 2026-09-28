import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type Props = {
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

type MenuPosition = {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
};

export default function SelectControl({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder = 'Select…',
  className = '',
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = options.find(option => option.value === value);
  const enabledOptions = options.filter(option => !option.disabled);

  function measure() {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const viewportPadding = 8;
    const desiredHeight = Math.min(280, Math.max(44, enabledOptions.length * 31 + 8));
    const below = window.innerHeight - rect.bottom - viewportPadding;
    const above = rect.top - viewportPadding;
    const openAbove = below < Math.min(150, desiredHeight) && above > below;
    const maxHeight = Math.max(80, Math.min(desiredHeight, openAbove ? above : below));
    const top = openAbove
      ? Math.max(viewportPadding, rect.top - maxHeight - 4)
      : Math.min(window.innerHeight - viewportPadding - maxHeight, rect.bottom + 4);
    const width = Math.max(rect.width, 130);
    const left = Math.min(
      Math.max(viewportPadding, rect.left),
      Math.max(viewportPadding, window.innerWidth - viewportPadding - width),
    );
    setPosition({ left, top, width, maxHeight });
  }

  function openMenu() {
    if (disabled || !enabledOptions.length) return;
    measure();
    setOpen(true);
  }

  function choose(next: string) {
    const option = options.find(candidate => candidate.value === next);
    if (!option || option.disabled) return;
    onChange(next);
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  }

  function moveSelection(direction: 1 | -1) {
    if (!enabledOptions.length) return;
    const current = enabledOptions.findIndex(option => option.value === value);
    const start = current < 0 ? (direction > 0 ? -1 : 0) : current;
    const index = (start + direction + enabledOptions.length) % enabledOptions.length;
    choose(enabledOptions[index].value);
  }

  useLayoutEffect(() => {
    if (open) measure();
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;

    const closeFromOutside = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && (buttonRef.current?.contains(target) || menuRef.current?.contains(target))) return;
      setOpen(false);
    };
    const closeForViewportChange = () => setOpen(false);

    document.addEventListener('pointerdown', closeFromOutside, true);
    window.addEventListener('resize', closeForViewportChange);
    window.addEventListener('scroll', closeForViewportChange, true);
    return () => {
      document.removeEventListener('pointerdown', closeFromOutside, true);
      window.removeEventListener('resize', closeForViewportChange);
      window.removeEventListener('scroll', closeForViewportChange, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`select-control ${className}`.trim()}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          if (open) setOpen(false);
          else openMenu();
        }}
        onKeyDown={event => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (!open) openMenu();
            else moveSelection(1);
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (!open) openMenu();
            else moveSelection(-1);
          } else if (event.key === 'Escape' && open) {
            event.preventDefault();
            setOpen(false);
          }
        }}
      >
        <span className={selected ? 'select-control-value' : 'select-control-value placeholder'}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className={open ? 'select-control-chevron open' : 'select-control-chevron'} size={13} />
      </button>

      {open && position && createPortal(
        <div
          ref={menuRef}
          className="select-control-menu"
          role="listbox"
          aria-label={ariaLabel}
          style={{
            left: position.left,
            top: position.top,
            width: position.width,
            maxHeight: position.maxHeight,
          }}
        >
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              disabled={option.disabled}
              className={option.value === value ? 'select-control-option selected' : 'select-control-option'}
              onClick={() => choose(option.value)}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={12} />}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
