import React, { useState } from 'react';
import { Tag } from 'lucide-react';

interface SessionLabelInputProps {
  label: string | undefined;
  onUpdateLabel: (newLabel: string) => void;
}

const QUICK_TAGS = ['Deep Work', 'Coding', 'Writing', 'Study', 'Design'];

export const SessionLabelInput: React.FC<SessionLabelInputProps> = ({
  label = '',
  onUpdateLabel,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(label);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateLabel(inputValue.trim());
    setIsEditing(false);
  };

  const handleSelectQuickTag = (tag: string) => {
    setInputValue(tag);
    onUpdateLabel(tag);
  };

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Focusing on..."
            maxLength={60}
            autoFocus
            onBlur={() => handleSubmit()}
            className="px-3 py-1 text-xs bg-zinc-900 border border-zinc-700 rounded-full text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 text-center w-48 transition"
          />
        </form>
      ) : (
        <button
          onClick={() => {
            setInputValue(label);
            setIsEditing(true);
          }}
          className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/60 transition"
          title="Click to set session label"
        >
          <Tag className="w-3 h-3 text-rose-400/80" />
          <span>{label ? label : 'Add focus label...'}</span>
        </button>
      )}

      {/* Subtle quick tags if empty */}
      {!label && !isEditing && (
        <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleSelectQuickTag(tag)}
              className="text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 px-2 py-0.5 rounded-full transition"
            >
              +{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
