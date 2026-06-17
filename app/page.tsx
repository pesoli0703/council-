'use client';

import { useState } from 'react';
import { Persona, defaultPersonas } from '../lib/personasData';
import { generateBoardResponses } from '../lib/gemini';
import PersonaSelector from '../components/PersonaSelector';
import QuestionForm from '../components/QuestionForm';
import ResponseCard from '../components/ResponseCard';

interface BoardResponse {
  [key: string]: string;
}

export default function Home() {
  const [selectedPersonas, setSelectedPersonas] = useState<Persona[]>([]);
  const [responses, setResponses] = useState<BoardResponse>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [error, setError] = useState('');

  const handleTogglePersona = (persona: Persona) => {
    setSelectedPersonas((prev) => {
      const isSelected = prev.some((p) => p.id === persona.id);
      if (isSelected) {
        return prev.filter((p) => p.id !== persona.id);
      } else {
        return [...prev, persona];
      }
    });
    setResponses({});
  };

  const handleSubmitQuestion = async (question: string) => {
    setError('');
    setCurrentQuestion(question);
    setResponses({});
    setIsLoading(true);

    try {
      const boardResponses = await generateBoardResponses(
        selectedPersonas,
        question
      );
      setResponses(boardResponses);
    } catch (err) {
      setError('Failed to get board responses. Please check your API key and try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getPersonaById = (id: string) =>
    defaultPersonas.find((p) => p.id === id);

  return (
    <main className="py-12">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Council</h1>
          <p className="text-xl text-purple-100">
            Assemble diverse perspectives to make better decisions
          </p>
        </div>

        {/* Persona Selector */}
        <PersonaSelector
          selectedPersonas={selectedPersonas}
          onTogglePersona={handleTogglePersona}
        />

        {/* Question Form */}
        {selectedPersonas.length > 0 && (
          <QuestionForm
            onSubmit={handleSubmitQuestion}
            isLoading={isLoading}
            boardSize={selectedPersonas.length}
          />
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Board Responses */}
        {currentQuestion && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Board Question
            </h2>
            <p className="text-gray-600">{currentQuestion}</p>
          </div>
        )}

        {Object.keys(responses).length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">
              Perspectives from Your Board
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {selectedPersonas.map((persona) => {
                const personaData = getPersonaById(persona.id);
                if (!personaData) return null;

                return (
                  <ResponseCard
                    key={persona.id}
                    persona={personaData}
                    response={responses[persona.id] || ''}
                    isLoading={isLoading}
                  />
                );
              })}
            </div>
          </div>
        )}

        {isLoading && Object.keys(responses).length === 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">
              Your Board is Thinking...
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {selectedPersonas.map((persona) => {
                const personaData = getPersonaById(persona.id);
                if (!personaData) return null;

                return (
                  <ResponseCard
                    key={persona.id}
                    persona={personaData}
                    response=""
                    isLoading={true}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
