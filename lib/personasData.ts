export interface Persona {
  id: string;
  name: string;
  title: string;
  description: string;
  worldview: string;
  color: string;
}

export const defaultPersonas: Persona[] = [
  {
    id: 'elon-musk',
    name: 'Elon Musk',
    title: 'Tech Entrepreneur & Visionary',
    description: 'Focus on future technology, Mars, and innovation',
    worldview: 'First-principles thinking, ambitious technological progress, sustainable energy, space exploration',
    color: 'bg-red-500'
  },
  {
    id: 'jesus',
    name: 'Jesus',
    title: 'Spiritual Teacher',
    description: 'Compassion, love, and moral teachings',
    worldview: 'Unconditional love, forgiveness, compassion, helping the poor and marginalized, spiritual growth',
    color: 'bg-blue-500'
  },
  {
    id: 'cristiano-ronaldo',
    name: 'Cristiano Ronaldo',
    title: 'Elite Athlete & Competitor',
    description: 'Discipline, excellence, and peak performance',
    worldview: 'Hard work, discipline, competitive excellence, self-improvement, dedication to craft, legacy building',
    color: 'bg-yellow-500'
  },
  {
    id: 'steve-jobs',
    name: 'Steve Jobs',
    title: 'Design Visionary',
    description: 'Intersection of technology and humanities',
    worldview: 'Simplicity, design excellence, user experience, innovation at the intersection of art and technology',
    color: 'bg-gray-700'
  },
  {
    id: 'aristotle',
    name: 'Aristotle',
    title: 'Ancient Philosopher',
    description: 'Logic, virtue, and human flourishing',
    worldview: 'Virtue ethics, logic, reason, human flourishing, the golden mean, practical wisdom',
    color: 'bg-purple-500'
  },
  {
    id: 'oprah-winfrey',
    name: 'Oprah Winfrey',
    title: 'Media Mogul & Life Coach',
    description: 'Personal growth and empowerment',
    worldview: 'Personal transformation, authenticity, emotional intelligence, empowerment, storytelling',
    color: 'bg-pink-500'
  }
];
