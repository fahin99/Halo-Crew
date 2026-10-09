// Fictional, reproducible mission records for the showcase; never real medical data.
export const sampleHistory = Array.from({ length: 30 }, (_, i) => {
  const phase = i % 7;
  const recovery = i === 9 || i === 20;
  return {
    day: 118 + i,
    date: new Date(Date.UTC(2026, 8, 10 + i)).toISOString().slice(0, 10),
    pulse: recovery ? 82 : [64, 66, 63, 65, 67, 62, 64][phase],
    hrv: recovery ? 32 : [48, 45, 51, 47, 44, 52, 49][phase],
    sleep: recovery ? 5.6 : [7.3, 7.6, 7.1, 8, 7.4, 7.8, 7.5][phase],
    oxygen: [98, 98, 99, 98, 97, 99, 98][phase],
    temperature: [36.7, 36.6, 36.8, 36.7, 36.9, 36.6, 36.7][phase],
    fatigue: recovery ? 7 : [3, 2, 4, 2, 4, 2, 3][phase],
    mood: recovery ? "Tired" : ["Calm", "Focused", "Calm", "Focused", "Tired", "Calm", "Calm"][phase],
    exerciseMinutes: phase === 4 ? 0 : [35, 40, 30, 45, 0, 35, 30][phase],
    co2: [850, 910, 820, 880, 940, 810, 850][phase],
    note: recovery ? "Short sleep after a demanding workday; recovery break recorded." : phase === 4 ? "Rest day; movement plan reviewed." : "Daily check-in and routine movement completed.",
  };
});
