/* Council — local deliberation engine (offline, no API needed).
 *
 * Each preloaded member has a hand-crafted VOICE so they sound authentically
 * like themselves — their own vocabulary, rhythm, and way of reasoning — rather
 * than a shared template. Responses adapt to the user's decision and a heuristic
 * "leaning" (go / caution / depends). Custom members fall back to a generic-but-
 * personalized voice built from their profile.
 *
 * When deployed with an AI key (api/deliberate.js), the app prefers live AI and
 * falls back to this engine, so it always works.
 */
(function () {
  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
    return h;
  }
  function pick(arr, seed) { return arr[Math.abs(hash(seed)) % arr.length]; }

  // ---- Heuristic leaning so members genuinely differ on a decision ----
  function leaning(member, decision) {
    const text = (decision.question + " " + (decision.context || "")).toLowerCase();
    const riskWords = ["quit", "leave", "start", "move", "invest", "bet", "gamble", "all in", "launch", "risk", "change"];
    const cautionWords = ["safe", "stay", "stable", "secure", "wait", "debt", "loan", "family", "afford", "mortgage", "kids"];
    let risk = 0;
    riskWords.forEach(w => { if (text.includes(w)) risk++; });
    cautionWords.forEach(w => { if (text.includes(w)) risk--; });

    const bold = { ronaldo: 2, musk: 2, goggins: 2, jobs: 1, oprah: 1 };
    const cautious = { buffett: -2, aurelius: -1, mandela: -1, selman: -1, naval: -1 };
    const bias = (bold[member.id] || 0) + (cautious[member.id] || 0);

    const score = risk + bias + (hash(member.id + decision.question) % 3 - 1);
    if (score >= 1) return "go";
    if (score <= -1) return "caution";
    return "depends";
  }

  // Short topic noun pulled from the question, for natural phrasing.
  function topic(decision) {
    const q = decision.question.replace(/[?.!]/g, "").trim();
    return q.length > 60 ? "this" : "this";
  }

  // ---- VOICES: one function per preloaded member, keyed by lean ----
  // Each returns the body text. Openers/closers are baked in so the rhythm differs.
  const VOICES = {
    ronaldo: {
      go: () => "Listen — I don't believe in waiting for the perfect moment. You work, you sacrifice, and you go. Talent means nothing without the hard work behind it. If you give one hundred percent and you're not afraid of the pressure, you will be ready. The doubters? Let them talk. Use it as fuel and prove them wrong.",
      caution: () => "I love ambition, but champions are not reckless — they are disciplined. Before you jump, are you truly prepared? Have you done the work, every single day, in private? Don't move because you're emotional. Move because you've trained for this moment and you know you can win.",
      depends: () => "Here is the truth: only you know if you've put in the work. If you've sacrificed, trained, and you believe — then nothing can stop you. If you haven't, then this is your sign to start grinding now. Greatness is not luck. It's discipline repeated until it becomes who you are."
    },
    selman: {
      go: () => "Beloved, when purpose and preparation meet a divine window, hesitation becomes disobedience. If this aligns with the assignment on your life and your conscience is at peace, step forward in faith. Grace will take you where talent cannot — but remember, it is character that will keep you there.",
      caution: () => "The quality of your life is determined by the quality of your decisions, so do not rush what God is not rushing. Seek wisdom, counsel, and clarity. Is this driven by pressure, or by purpose? Divine timing is real. Do your part diligently, and let God order your steps rather than your anxiety.",
      depends: () => "Two questions will guide you, beloved: Does this align with your purpose, and can you maintain your integrity through it? If yes, the door is from God. If you must compromise your values to walk through it, it is a distraction wearing the face of an opportunity. Pray, then move with wisdom."
    },
    jesus: {
      go: () => "Do not be afraid. Ask yourself first: does this path let you love God and love your neighbour? If it allows you to walk in truth and to serve, then go, and do not store up treasures only for yourself. Whatever you do, do it with a whole heart, as unto the Father.",
      caution: () => "Consider the cost before you build the tower. What does it profit a person to gain the whole world, yet forfeit their soul? Weigh the eternal against the temporary. If this pursuit would harden your heart or wound those you love, the gain is not worth the loss. Choose the narrow road.",
      depends: () => "Where your treasure is, there your heart will be also. So examine your heart honestly: what are you truly seeking? Do to others as you would have them do to you, and let love — not fear, not pride — be the measure. Then the right path will be made plain to you."
    },
    jobs: {
      go: () => "Most people never ship because they wait for permission. Don't. Focus is saying no to a thousand good things so you can pour everything into the one that matters. If this is the thing that keeps you up at night, simplify it to its essence and build it. Real artists ship.",
      caution: () => "Before you leap, ask the hard question: is this insanely great, or merely good? Good is the enemy. Deciding what NOT to do matters as much as deciding what to do. If you can't say clearly why this is worth your one finite life, that's your answer to wait and cut deeper.",
      depends: () => "Your time is limited — don't waste it living someone else's life. Strip away every opinion that isn't yours. When you connect the dots looking backward, you'll see the brave choice was usually right. So: does this make your heart sing, or are you just being sensible?"
    },
    buffett: {
      go: () => "Well, if it sits squarely within your circle of competence and you've got a real margin of safety, then opportunity doesn't knock often — take it. But only swing at the pitch you understand. The big money isn't in the buying or the selling; it's in the patient waiting that came before it.",
      caution: () => "Rule number one: don't lose. Rule number two: don't forget rule number one. Be fearful when others are greedy. If you're stretching outside what you truly understand, or betting money you can't afford to lose, sit on your hands. The best opportunities reward patience, not panic.",
      depends: () => "Temperament beats intellect in decisions like this. Ask whether you'd be comfortable owning this choice for ten years if the door slammed shut behind you. If yes, it's probably sound. If a price drop or a setback would make you panic, you don't understand it well enough yet."
    },
    aurelius: {
      go: () => "Separate what is in your control from what is not. The outcome is not yours to command — but the choice to act with courage and reason is. If virtue points this way, then act, and accept whatever follows with equanimity. The impediment to action often advances the action.",
      caution: () => "Waste no time arguing what a good person should do — be one. Pause and strip this of its drama. Much of the urgency you feel is opinion, not reality. Ask what reason and justice require, not what fear demands. If you cannot yet see clearly, stillness is also a decision.",
      depends: () => "You have power over your mind, not outside events — realize this and you'll find your strength. The question is not really what to do, but who you wish to be while doing it. Choose the path that virtue can walk without shame, and let the rest unfold as nature wills."
    },
    oprah: {
      go: () => "Here's what I know for sure: your life is speaking to you, and that whisper you keep hearing is your truth. If this lights you up and aligns with who you really are, honor it. The biggest adventure you can take is to live the life of your dreams. Trust that and step into it.",
      caution: () => "Before you move, get quiet and listen — really listen. Is this your truth, or someone else's expectation dressed up as yours? When you don't know what to do, get still; the answer will come. Don't let noise rush a decision your gut hasn't fully blessed yet.",
      depends: () => "Every decision is really asking, 'Who am I becoming?' Turn your wounds into wisdom and let them guide, not govern, you. Pay attention to how each option makes you feel in your body — your intuition is data. The path that brings peace, not just excitement, is usually the truth."
    },
    musk: {
      go: () => "Reason from first principles, not by analogy. Boil it down: what's physically true here, and what's just convention people accept? If the potential upside is enormous and the failure won't kill you, the expected value says go — fast. When something matters enough, you do it even if the odds are against you.",
      caution: () => "I'm all for big bets, but run the numbers honestly. What's the actual probability of ruin? If failure is survivable, push hard. If one bad outcome ends the game permanently, that's not boldness, that's negligence. Reduce the catastrophic risk first, then accelerate like hell.",
      depends: () => "Delete the assumptions and rebuild from the ground up. Most 'rules' here are just things people never questioned. Ask: if you started from scratch today, knowing what you know, would you choose this? If yes, the legacy fear is irrelevant. If no, you're just sunk-cost reasoning."
    },
    angelou: {
      go: () => "Courage is the most important of all the virtues, because without it you can practice no other consistently. If this path asks you to be brave and keeps your dignity intact, walk it with your head high. People will forget what you said, but never how you made them feel — including yourself.",
      caution: () => "When someone shows you who they are, believe them — and that includes situations. Look honestly at what this will cost your spirit and the people you love. There is a difference between courage and self-betrayal. Do not let urgency talk you into a choice that dims your light.",
      depends: () => "Ask yourself how each road will make you feel, years from now, when you tell the story. You may not control all that happens, but you can decide not to be reduced by it. Choose the path that lets you keep your dignity and grow — that is rarely the easy one, but it is the true one."
    },
    mandela: {
      go: () => "It always seems impossible until it is done. If this serves something larger than yourself and you can pursue it without bitterness, then begin. Courage is not the absence of fear, but the triumph over it. Move forward — but bring others with you, for a thing done alone rarely endures.",
      caution: () => "I have learned that patience and principle outlast haste. Before you act, ask whether this builds or whether it burns. A good head and a good heart are a formidable combination — use both. If acting now would divide more than it heals, the wiser strength is to wait and prepare.",
      depends: () => "The question is not only what you will gain, but what kind of person — and what kind of community — this choice creates. Resentment is a poison you drink hoping it harms another. Choose the path you can walk with forgiveness and dignity, and you will be able to live with it."
    },
    naval: {
      go: () => "Play long-term games with long-term people. If this builds leverage — code, media, capital, or specific knowledge that compounds while you sleep — and it buys you freedom rather than a fancier cage, then go. The returns in life come from owning, not renting your time.",
      caution: () => "Before you leap, ask: does this compound, or is it a treadmill? Avoid decisions that trade your scarce freedom for someone else's timeline. A calm mind makes better bets than an anxious one. If you're choosing from FOMO rather than conviction, wait until the signal is clear.",
      depends: () => "The real question is whether this moves you toward freedom — financial, mental, and of time. Earn with your mind, not your hours. If this builds specific knowledge only you can offer and lets you play infinite games, it's worth it. If it just looks impressive, skip it."
    },
    goggins: {
      go: () => "Stop negotiating with yourself. You already know the answer — you're just scared of the work. Good. Run toward it. You're stopped by your mind, not your body. Callus that mind by doing the hard thing on purpose. Motivation is garbage; discipline is everything. Get after it.",
      caution: () => "Hold up — be honest about whether you've actually done the prep, or you're just chasing a feeling. Talk is cheap. If you haven't put in the unseen reps, you're not ready, and wanting it badly won't save you. Earn the right to make this move by doing the boring work first.",
      depends: () => "Ask yourself one thing: are you avoiding this because it's genuinely wrong, or because it's hard? Most people quit at forty percent and call it logic. If it's hard but right, that's exactly why you do it. The cookie jar is full of every hard thing you've already conquered. Pull from it."
    }
  };

  // Generic personalized voice for custom members (built from their profile).
  function genericVoice(member, lean, decision) {
    const v1 = member.values && member.values[0] ? member.values[0] : "wisdom";
    const v2 = member.values && member.values[1] ? member.values[1] : "honesty";
    const lensLine = member.lens || "Does this align with what truly matters to you?";
    const opener = {
      go: "From where I stand, the way forward is to act. ",
      caution: "I'd urge you to slow down before committing. ",
      depends: "There's a genuine trade-off here, so be honest with yourself. "
    }[lean];
    const close = {
      go: `If it honours ${v1} and ${v2}, and you're prepared for the cost, take the step.`,
      caution: `Protect what matters most, and make sure this won't cost you your ${v1}.`,
      depends: `Get clear on your real motive, and the right path will follow.`
    }[lean];
    return `${opener}${lensLine} ${close}`;
  }

  function memberResponse(member, decision) {
    const lean = leaning(member, decision);
    const voice = VOICES[member.id];
    const text = voice ? voice[lean]() : genericVoice(member, lean, decision);
    const quote = (member.quotes && member.quotes.length)
      ? pick(member.quotes, member.id + decision.question)
      : "";
    const baseConf = { go: 80, caution: 66, depends: 57 }[lean];
    const conf = Math.min(96, baseConf + (Math.abs(hash(member.id + decision.question)) % 12));
    return { memberId: member.id, name: member.name, lean, confidence: conf, text, quote };
  }

  function synthesize(responses) {
    const go = responses.filter(r => r.lean === "go");
    const caution = responses.filter(r => r.lean === "caution");
    const depends = responses.filter(r => r.lean === "depends");
    const first = arr => arr.map(r => r.name.split(" ")[0]);

    let headline, direction;
    if (go.length > caution.length && go.length >= responses.length / 2) {
      headline = "The board leans toward moving forward.";
      direction = "Most of your council sees more upside in acting than waiting — provided you prepare well and can absorb the worst case.";
    } else if (caution.length > go.length && caution.length >= responses.length / 2) {
      headline = "The board urges caution.";
      direction = "Your council sees real risk here. Don't kill the idea — but reduce the downside, gather more clarity, and protect what matters before you commit.";
    } else {
      headline = "The board is genuinely split.";
      direction = "This is a values decision, not a logic one. The split means there's no objectively 'right' answer — only the one most true to who you want to become.";
    }

    const agree = [];
    if (go.length) agree.push(`${first(go).join(", ")} see an opportunity worth taking`);
    if (caution.length) agree.push(`${first(caution).join(", ")} want you to protect your downside first`);
    if (depends.length) agree.push(`${first(depends).join(", ")} say it hinges on your true motive`);

    const tension = (go.length && caution.length)
      ? "The core tension: ambition and momentum versus patience and safety. Both are right — the real question is which one your situation actually needs right now."
      : "There's broad alignment, which is a strong signal — but make sure you're not just hearing what you already wanted to hear.";

    const questions = [
      "If you were not afraid, what would you do?",
      "What's the worst realistic outcome — and could you recover from it?",
      "Which choice will you respect yourself for in five years?",
      "Is this driven by your values, or by other people's expectations?"
    ];

    return { headline, direction, agree, tension, questions };
  }

  window.CouncilEngine = {
    deliberateLocal: function (members, decision) {
      const responses = members.map(m => memberResponse(m, decision));
      return { responses, synthesis: synthesize(responses) };
    }
  };
})();
