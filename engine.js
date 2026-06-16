/* Council — Dynamic Local Engine 
 * This ensures that even in "Local Mode", the advisors 
 * use your specific question in their answer.
 */
(function () {
  "use strict";

  function getLeaning(member, question) {
    const q = question.toLowerCase();
    const cautious = ["stop", "wait", "no", "risk", "scared", "dangerous"];
    if (cautious.some(word => q.includes(word))) return "caution";
    return "go";
  }

  window.CouncilEngine = {
    deliberateLocal: function (members, decision) {
      const responses = members.map(m => {
        const lean = getLeaning(m, decision.question);
        
        // Dynamic text generation based on the user's question
        const adviceText = lean === "go" 
          ? `I've considered your question about "${decision.question}". My worldview says move forward with courage. Focus on the outcome and don't let fear stop you.` 
          : `Looking at "${decision.question}", I urge you to be careful. Is this truly aligned with your core values? Slow down and protect your soul first.`;

        return {
          memberId: m.id,
          name: m.name,
          lean: lean,
          confidence: 88,
          text: adviceText,
          quote: m.quotes && m.quotes.length ? m.quotes[0] : "Focus on what matters."
        };
      });

      return {
        responses,
        synthesis: {
          headline: "Local Council Review",
          direction: `Regarding "${decision.question}", the board suggests you move with ${getLeaning({}, decision.question)}.`,
          agree: ["Integrity", "Focus"],
          tension: "Short-term gain vs Long-term peace",
          questions: ["Will you respect this choice in 10 years?", "What is your gut saying?"]
        }
      };
    }
  };
})();
