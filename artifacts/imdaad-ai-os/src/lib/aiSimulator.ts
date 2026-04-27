import { useEffect, useState } from 'react';

export function streamText(
  text: string,
  onChunk: (partial: string) => void,
  onDone: () => void,
  msPerWord = 15,
): () => void {
  const words = text.split(' ');
  let i = 0;
  const interval = window.setInterval(() => {
    if (i >= words.length) {
      window.clearInterval(interval);
      onDone();
      return;
    }
    onChunk(words.slice(0, i + 1).join(' '));
    i += 1;
  }, msPerWord);
  return () => window.clearInterval(interval);
}

export function useStreamedText(text: string, startDelay = 800) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let cleanup: (() => void) | undefined;
    const timeout = window.setTimeout(() => {
      cleanup = streamText(text, setDisplayed, () => setDone(true));
    }, startDelay);
    return () => {
      window.clearTimeout(timeout);
      cleanup?.();
    };
  }, [startDelay, text]);

  return { displayed, done };
}
