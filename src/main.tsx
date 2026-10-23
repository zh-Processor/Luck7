import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './styles.css';

const root = document.getElementById('root')!;
const tree = <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}><App /></BrowserRouter>;
// A static archive cannot pre-render every visitor's search/filter combination.
// Render those initial query URLs fresh instead of hydrating different markup.
if (root.firstElementChild && !window.location.search) hydrateRoot(root, tree);
else createRoot(root).render(tree);
