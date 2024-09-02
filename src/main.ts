import './app.css'
import App from './App.svelte'
import chatIcon from './assets/chat.svg';
const app = new App({
  target: document.getElementById('app')!,
})
window.addEventListener('load', () => {
  const linkIcon = document.querySelector('link[rel="icon"]');
  if (linkIcon) linkIcon.setAttribute('href', chatIcon);
});
export default app
