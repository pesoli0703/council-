'use client';

import { FormEvent, useState } from 'react';

interface QuestionFormProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
  boardSize: number;
}

export default function QuestionForm({
  onSubmit,
  isLoading,
  boardSize,
}: QuestionFormProps) {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (question.trim() && boardSize > 0) {
      onSubmit(question);
      setQuestion('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Ask Your Board
      </h2>

      <div className="mb-4">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What decision do you need help with? What question would you like your board's perspective on?"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          rows={4}
          disabled={isLoading || boardSize === 0}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !question.trim() || boardSize === 0}
        className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Consulting Board...' : 'Get Board Perspectives'}
      </button>

      {boardSize === 0 && (
        <p className="text-red-600 text-sm mt-2">
          Please select at least one board member first
        </p>
      )}
    </form>
  );
}
