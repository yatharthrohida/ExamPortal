import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loader = ({ message = 'Loading...', fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 p-6">
        <Loader2 size={28} className="animate-spin text-neutral-700" />
        <p className="text-neutral-600 text-xs font-medium tracking-wide">
          {message}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12 px-4 gap-2.5 text-neutral-500">
      <Loader2 size={18} className="animate-spin text-neutral-700" />
      <span className="text-xs font-medium text-neutral-600">{message}</span>
    </div>
  );
};

export default Loader;
