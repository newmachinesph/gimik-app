// The side-effect CSS import in the root layout carries no types of its own.
// Without this, `import './global.css'` fails typecheck even though Metro handles it.
declare module '*.css';
