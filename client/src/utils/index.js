import FileSaver from 'file-saver';

import { surpriseMePrompts } from '../constants';

export function getRandomPrompt(prompt) {
  const randomIndex = Math.floor(Math.random() * surpriseMePrompts.length);
  const randomPrompt = surpriseMePrompts[randomIndex];
  
  if(randomPrompt === prompt) return getRandomPrompt(prompt);

  return randomPrompt;
}

export async function downloadImage(_id, photo) {
  const response = await fetch(photo);
  const blob = await response.blob();
  FileSaver.saveAs(blob, `Image-${_id}.jpg`);
}
