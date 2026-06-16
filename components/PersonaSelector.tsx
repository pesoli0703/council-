'use client';

import { Persona, defaultPersonas } from '@/lib/personas';

interface PersonaSelectorProps {
  selectedPersonas: Persona[];
  onTogglePersona: (persona: Persona) => void;
}

export default function PersonaSelector({
  selectedPersonas,
  onTogglePersona,
}: PersonaSelectorProps) {
  const isSelected = (persona: Persona) =>
    selectedPersonas.some((p) => p.id === persona.id);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Select Your Board Members
      </h2>
      <p className="text-gray-600 mb-6">
        Choose the perspectives you want represented on your board
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {defaultPersonas.map((persona) => (
          <button
            key={persona.id}
            onClick={() => onTogglePersona(persona)}
            className={`p-4 rounded-lg border-2 transition-all ${
              isSelected(persona)
                ? `${persona.color} text-white border-transparent`
                : 'bg-gray-50 text-gray-800 border-gray-200 hover:border-gray-400'
            }`}
          >
            <div className="font-bold text-lg">{persona.name}</div>
            <div className="text-sm font-semibold">{persona.title}</div>
            <div className="text-xs mt-2 opacity-90">{persona.description}</div>
          </button>
        ))}
      </div>

      {selectedPersonas.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800">
            <strong>Board Size:</strong> {selectedPersonas.length} member
            {selectedPersonas.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
