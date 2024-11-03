import FileSaver from 'file-saver';

import { surpriseMePrompts } from '../constants';

export function getRandomPrompt(prompt) {
  const randomIndex = Math.floor(Math.random() * surpriseMePrompts.length);
  const randomPrompt = surpriseMePrompts[randomIndex];
  
  if(randomPrompt === prompt) return getRandomPrompt(prompt);

  return randomPrompt;
}

export async function downloadImage(_id, photo) {
  FileSaver.saveAs(photo, `download-${_id}.jpg`);
}

export const generateLowResBlurredImage = (src, callback) => {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = src;

  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to a smaller size
    const width = img.width / 10;
    const height = img.height / 10;
    canvas.width = width;
    canvas.height = height;

    // Draw the image on the canvas
    ctx.drawImage(img, 0, 0, width, height);

    // Apply blur effect
    ctx.filter = 'blur(10px)';
    ctx.drawImage(canvas, 0, 0, width, height);

    // Get the data URL of the low-resolution, blurred image
    const lowResBlurredImage = canvas.toDataURL('image/jpeg');
    callback(lowResBlurredImage);
  };
};