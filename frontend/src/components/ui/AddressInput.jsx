import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GeocodeService } from '../../api/services';
import { MapPin, Loader2, X } from 'lucide-react';
import { createPortal } from 'react-dom';

export const AddressInput = ({ value, onChange, placeholder = 'Search address...' }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  // Updates dropdown position to float correctly over other elements
  const updateDropdownPos = useCallback(() => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setFocused(false);
        setSuggestions([]);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', updateDropdownPos, true);
    window.addEventListener('resize', updateDropdownPos);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updateDropdownPos, true);
      window.removeEventListener('resize', updateDropdownPos);
    };
  }, [updateDropdownPos]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    // Change this line in AddressInput.jsx
    if (!value || value.length < 3 || !focused) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      abortRef.current = new AbortController();
      setLoading(true);
      try {
        // FIX 1: Pass null for lat/lng to shift the signal to the 4th parameter
        const results = await GeocodeService.autocomplete(
          value,
          null,
          null,
          abortRef.current.signal
        );

        // FIX 2: Ensure 'list' is always an array to prevent the ".map is not a function" error
        const list = Array.isArray(results) ? results : [];
        setSuggestions(list);

        if (list.length > 0) {
          updateDropdownPos();
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
        setActiveIndex(-1);
      } catch (err) {
        if (err?.name !== 'AbortError') {
          setSuggestions([]);
          setIsOpen(false);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [value, focused, updateDropdownPos]);

  const handleSelect = useCallback((s) => {
    onChange(s.formattedAddress);
    setSuggestions([]);
    setIsOpen(false);
    setFocused(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  }, [onChange]);

  const handleKeyDown = (e) => {
    if (!isOpen || !suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); handleSelect(suggestions[activeIndex]); }
    else if (e.key === 'Escape') { setIsOpen(false); setSuggestions([]); inputRef.current?.blur(); }
  };

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // The Portal dropdown ensures the list isn't cut off by parent containers
  const dropdown = isOpen && suggestions.length > 0
    ? createPortal(
      <div
        style={{
          position: 'absolute',
          top: dropdownPos.top,
          left: dropdownPos.left,
          width: dropdownPos.width,
          zIndex: 9999,
        }}
        className="animate-in fade-in slide-in-from-top-1 duration-150"
      >
        <ul className="bg-base-100 border border-base-300 rounded-2xl shadow-2xl overflow-hidden">
          <div className="max-h-[240px] overflow-y-auto overscroll-contain">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex items-start gap-3 px-4 py-3 w-full text-left border-b border-base-200 last:border-0 transition-colors duration-100 ${activeIndex === i
                      ? 'bg-primary/10 text-primary'
                      : 'text-base-content/60 hover:bg-base-200/60'
                    }`}
                >
                  <MapPin
                    size={14}
                    className={`mt-0.5 shrink-0 ${activeIndex === i ? 'text-primary' : 'text-base-content/30'}`}
                  />
                  <span className="text-sm leading-snug line-clamp-2">{s.formattedAddress}</span>
                </button>
              </li>
            ))}
          </div>
          <div className="px-4 py-1.5 border-t border-base-200 bg-base-200/40">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-base-content/25">
              ↑↓ navigate · Enter to select · Esc to close
            </span>
          </div>
        </ul>
      </div>,
      document.body
    )
    : null;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className={`relative flex items-center h-11 rounded-xl border bg-base-100 transition-all duration-200 ${focused
            ? 'border-primary ring-2 ring-primary/15 shadow-sm'
            : 'border-base-300 hover:border-base-400'
          }`}
      >
        <MapPin
          size={15}
          className={`absolute left-3.5 shrink-0 pointer-events-none transition-colors duration-200 ${focused ? 'text-primary' : 'text-base-content/30'
            }`}
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => { onChange(e.target.value); setFocused(true); }}
          onFocus={() => {
            setFocused(true);
            updateDropdownPos();
            if (value.length >= 2 && suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full h-full bg-transparent pl-9 pr-9 text-sm text-base-content placeholder:text-base-content/30 focus:outline-none"
        />
        <div className="absolute right-3 flex items-center gap-1.5">
          {loading && <Loader2 size={13} className="animate-spin text-primary" />}
          {!loading && value && (
            <button
              type="button"
              onMouseDown={handleClear}
              className="w-4 h-4 rounded-full bg-base-content/15 hover:bg-base-content/25 flex items-center justify-center transition-colors"
            >
              <X size={9} className="text-base-content/50" />
            </button>
          )}
        </div>
      </div>
      {dropdown}
    </div>
  );
};