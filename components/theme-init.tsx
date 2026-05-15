import { THEME_STORAGE_KEY } from "@/lib/theme";

export function ThemeInit() {
  const script = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");document.documentElement.classList.toggle("dark",t==="dark");}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
