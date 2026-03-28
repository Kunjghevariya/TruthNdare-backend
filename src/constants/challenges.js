const buildChallenge = (id, prompt, tone, intensity, durationLabel) => ({
  id,
  prompt,
  tone,
  intensity,
  durationLabel,
});

export const TRUTH_TASKS = [
  buildChallenge('truth-habit-reset', 'What is one habit you keep promising to change but still have not fixed?', 'honest', 'medium', '30 sec'),
  buildChallenge('truth-room-trust', 'Who in the room would you trust with your biggest secret, and why?', 'close-friends', 'medium', '45 sec'),
  buildChallenge('truth-awkward-memory', 'What memory still makes you cringe the second you think about it?', 'funny', 'light', '30 sec'),
  buildChallenge('truth-fake-like', 'What is something you pretend to like just because everyone else seems into it?', 'playful', 'light', '30 sec'),
  buildChallenge('truth-hidden-fear', 'What fear do you usually keep to yourself?', 'honest', 'bold', '45 sec'),
  buildChallenge('truth-spontaneous', 'What is the most impulsive thing you have ever done and did it work out?', 'storytime', 'medium', '45 sec'),
  buildChallenge('truth-proud', 'When did you last feel genuinely proud of yourself?', 'warm', 'light', '30 sec'),
  buildChallenge('truth-misread', 'What is one thing people often get wrong about you?', 'honest', 'medium', '30 sec'),
  buildChallenge('truth-red-flag', 'What is your biggest red flag when you first meet someone new?', 'spicy', 'bold', '30 sec'),
  buildChallenge('truth-secret-competitive', 'What are you secretly way more competitive about than people realize?', 'playful', 'medium', '30 sec'),
  buildChallenge('truth-time-thief', 'Which app on your phone steals the most time from you?', 'relatable', 'light', '20 sec'),
  buildChallenge('truth-cannot-fail', 'What would you try first if you knew you could not fail?', 'hopeful', 'medium', '30 sec'),
];

export const DARE_TASKS = [
  buildChallenge('dare-trailer-voice', 'Do your best dramatic movie-trailer voice for the next 20 seconds.', 'perform', 'light', '20 sec'),
  buildChallenge('dare-emoji-message', 'Send a funny emoji-only message to a group chat of your choice.', 'chaotic', 'medium', '30 sec'),
  buildChallenge('dare-documentary', 'Describe the room like you are narrating a nature documentary.', 'perform', 'light', '20 sec'),
  buildChallenge('dare-victory-dance', 'Do your most confident victory dance for 10 seconds.', 'funny', 'light', '10 sec'),
  buildChallenge('dare-superhero-voice', 'Speak in a superhero voice until the next player is chosen.', 'chaotic', 'medium', '1 round'),
  buildChallenge('dare-runway', 'Turn the floor into a runway and strike three dramatic poses.', 'perform', 'medium', '20 sec'),
  buildChallenge('dare-slogan', 'Invent a personal slogan and say it like it belongs on a billboard.', 'playful', 'light', '15 sec'),
  buildChallenge('dare-acceptance-speech', 'Pretend you just won an award and give a short acceptance speech.', 'perform', 'medium', '30 sec'),
  buildChallenge('dare-life-coach', 'Give the room a two-line motivational speech like an overconfident life coach.', 'funny', 'light', '15 sec'),
  buildChallenge('dare-product-pitch', 'Make up a fake product and deliver a fast sales pitch for it.', 'creative', 'medium', '30 sec'),
  buildChallenge('dare-weather-report', 'Do a serious weather report about the mood in this room right now.', 'perform', 'light', '20 sec'),
  buildChallenge('dare-commentator', 'Talk like a game commentator while the next player gets ready.', 'chaotic', 'medium', '1 round'),
];

export const getChallengeDeck = (choice) => (choice === 'Dare' ? DARE_TASKS : TRUTH_TASKS);
