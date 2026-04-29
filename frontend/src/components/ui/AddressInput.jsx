import React, { useState, useEffect } from 'react';
import { GeocodeService } from '../../api/services';
import { Search, MapPin } from 'lucide-react';

export const AddressInput = ({ value, onChange, label }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (value.length > 2 && isOpen) {
        const results = await GeocodeService.autocomplete(value);
        setSuggestions(results);
      }
    }, 400); // Respects your rate limits

    return () => clearTimeout(delayDebounce);
  }, [value, isOpen]);

  return (
    <div className="form-control w-full relative">
      <label className="label"><span className="label-text font-bold text-xs uppercase opacity-60">{label}</span></label>
      <div className="relative">
        <input
          className="input input-bordered w-full bg-base-200 focus:input-primary"
          value={value}
          onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
        />
        <Search className="absolute right-3 top-3 opacity-20" size={18} />
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute top-[85px] z-[200] menu bg-base-100 w-full rounded-box shadow-2xl border border-base-300 p-2">
          {suggestions.map((s, i) => (
            <li key={i} onClick={() => { onChange(s.formattedAddress); setIsOpen(false); }}>
              <a className="py-3 text-sm border-b border-base-200 last:border-0">
                <MapPin size={14} className="text-primary" /> {s.formattedAddress}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};