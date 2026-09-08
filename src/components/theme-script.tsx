/**
 * Paints the page ground before hydration so the first frame matches the app.
 */
const script = `(function(){try{var r=document.documentElement;r.style.colorScheme="light";r.style.background="#f6f7f9";}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
