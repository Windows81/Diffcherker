declare global {
  interface Window {
    gtag: (type: string, name: string, opts: object) => void;
  }
}

export const pageView = (url: string) => {
  if (window.gtag && typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_title: window.document.title,
      page_location: url,
    });
  }
};
