(function () {
  "use strict";
  window.CouncilEngine = {
    deliberateLocal: function (members, decision) {
      const q = decision.question;
      const responses = members.map(m => {
        const lean = q.length % 2 === 0 ? "go" : "caution";
        return {
          memberId: m.id,
          name: m.name,
          lean: lean,
          confidence: 90,
          text: `I have considered your question: "${q}". My worldview as ${m.name} suggests you move with ${lean}. Trust your values.`,
          quote: "The truth will set you free."
        };
      });
      return {
        responses,
        synthesis: { headline: "Local Review", direction: `Focus on the essence of "${q}".`, agree: [], tension: "", questions: [] }
      };
    }
  };
})();
