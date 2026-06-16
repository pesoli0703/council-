# Council - Board of Directors

A web application that lets you assemble a diverse "Board of Directors" of different personas and perspectives. Ask your board questions, and use the Gemini API to get responses from each persona's unique worldview.

## Features

- 🎭 **Multiple Personas**: Choose from pre-defined thought leaders (Elon Musk, Jesus, Cristiano Ronaldo, Steve Jobs, Aristotle, Oprah Winfrey)
- 🤖 **AI-Powered Responses**: Uses Google's Gemini API to generate authentic responses from each persona's perspective
- 💡 **Collaborative Decision-Making**: Get diverse viewpoints to inform your decisions
- 🎨 **Beautiful UI**: Modern, responsive design with Tailwind CSS
- ⚡ **Fast & Serverless**: Deployed on Vercel with Next.js

## Getting Started

### Prerequisites
- Node.js 18+
- Google Gemini API key ([get one here](https://ai.google.dev/))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/pesoli0703/council.git
cd council
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file and add your Gemini API key:
```bash
cp .env.example .env.local
# Edit .env.local and add your API key
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Select Board Members**: Click on personas to add them to your board (you can select multiple)
2. **Ask a Question**: Type a question or topic you need perspectives on
3. **Get Responses**: Each board member responds from their unique worldview
4. **Make Decisions**: Use the diverse perspectives to inform your decision-making

## Project Structure

```
council/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page
│   └── globals.css         # Global styles
├── components/
│   ├── PersonaSelector.tsx # Board member selection
│   ├── QuestionForm.tsx    # Question input
│   └── ResponseCard.tsx    # Persona response display
├── lib/
│   ├── personas.ts         # Persona definitions
│   └── gemini.ts           # Gemini API integration
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variable: `NEXT_PUBLIC_GEMINI_API_KEY`
5. Deploy!

## Adding New Personas

Edit `lib/personas.ts` and add a new persona object to the `defaultPersonas` array:

```typescript
{
  id: 'your-persona-id',
  name: 'Your Persona Name',
  title: 'Role/Title',
  description: 'Short description',
  worldview: 'Their worldview and values',
  color: 'bg-color-500' // Tailwind color class
}
```

## Technologies Used

- **Next.js** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Google Gemini API** - AI responses
- **Vercel** - Hosting

## Future Features

- 💾 Save favorite boards and responses
- 🔄 Compare responses side-by-side
- 👥 Create custom personas
- 📊 Export board decisions as reports
- 🌍 Multi-language support
- 🎯 Debate mode (personas debate topics)

## License

MIT

## Author

[pesoli0703](https://github.com/pesoli0703)
