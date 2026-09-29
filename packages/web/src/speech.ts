/** Browser speech synthesis (FR-041). Polly and the microphone are cut (FR-043). */
export function speak(text: string, on: boolean) {
  if (!on || !text || typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  speechSynthesis.speak(u);
}
