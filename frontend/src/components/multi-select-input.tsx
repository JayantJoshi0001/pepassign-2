'use client';

import { useRef, useState, useEffect } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';

interface MultiSelectInputProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  required?: boolean;
}

export function MultiSelectInput({
  options,
  selected,
  onChange,
  placeholder = 'Select options...',
  required = false,
}: MultiSelectInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchValue.toLowerCase()),
  );

  const availableOptions = filteredOptions.filter((option) => !selected.includes(option));

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleToggleOption(option: string) {
    const newSelected = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];

    onChange(newSelected);
  }

  function handleRemoveChip(option: string, event: React.MouseEvent) {
    event.stopPropagation();
    onChange(selected.filter((item) => item !== option));
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    setSearchValue(event.target.value);
    setIsOpen(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && searchValue === '' && selected.length > 0) {
      onChange(selected.slice(0, -1));
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }

  function handleContainerClick() {
    setIsOpen(true);
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={handleContainerClick}
        className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-100 cursor-text"
      >
        {selected.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-3 py-1 text-sm font-medium text-cyan-900 whitespace-nowrap"
          >
            {item}
            <button
              type="button"
              onClick={(e) => handleRemoveChip(item, e)}
              className="ml-1 rounded-full hover:bg-cyan-200 transition p-0.5 inline-flex items-center justify-center"
              aria-label={`Remove ${item}`}
            >
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={selected.length === 0 ? placeholder : ''}
          className="flex-1 bg-transparent outline-none text-slate-900 placeholder-slate-500 min-w-24"
          required={required && selected.length === 0}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-300 bg-white shadow-lg z-50">
          {availableOptions.length > 0 ? (
            availableOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  handleToggleOption(option);
                  setSearchValue('');
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-cyan-50 transition text-sm text-slate-900 first:rounded-t-lg last:rounded-b-lg"
              >
                {option}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500 text-center">
              {searchValue ? 'No matching categories' : 'All selected'}
            </div>
          )}
        </div>
      )}

      {selected.length === 0 && (
        <input
          type="hidden"
          name="categories"
          value=""
          required={required}
        />
      )}
    </div>
  );
}
