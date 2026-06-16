'use client';

import { Persona } from '@/lib/personas';

interface ResponseCardProps {
  persona: Persona;
  response: string;
  isLoading?: boolean;
}

export default function ResponseCard({
  persona,
  response,
  isLoading = false,
}: ResponseCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-4">
      <div className={`${persona.color} text-white p-4`}>
        <div className="font-bold text-lg">{persona.name}</div>
        <div className="text-sm opacity-90">{persona.title}</div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded mb-2 w-full"></div>
              <div className="h-4 bg-gray-300 rounded mb-2 w-5/6"></div>
              <div className="h-4 bg-gray-300 rounded w-4/6"></div>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {response}
          </p>
        )}
      </div>
    </div>
  );
}
