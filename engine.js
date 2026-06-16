(function () {
  "use strict";
  window.CouncilEngine = {
    deliberateLocal: function (members, decision) {
      const q = decision.question;
      const responses = members.map(m => {
        const hash = m.name.length + q.length;
        const lean = hash % 2 === 0 ? "go" : "caution";
        return {
          memberId: m.id,
          name: m.name,
          lean: lean,
          confidence: 80 + (hash % 15),
          text: `I have reflected on your choice regarding "${q}". As ${m.name}, I believe you should move with ${lean}. Focus on your values and don't look back.`,
          quote: "The truth will set you free."
        };
      });
      return {
        responses,
        synthesis: {
          headline: "Local Council Review",
          direction: `Regarding "${q}", we lean toward ${responses[0].lean}.`,
          agree: ["Integrity", "Vision"],
          tension: "The balance of risk and reward.",
          questions: ["Does this align with your purpose?", "What are you afraid of?"]
        }
      };
    }
  };
})();
