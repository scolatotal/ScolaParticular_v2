'use client';

import {
  forwardRef,
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
} from 'react';

export const SCOLA_NAVIGATION_EVENT = 'scola:navigate';

export function useScolaPathname() {
  const [pathname, setPathname] = useState('');
  useEffect(() => {
    const syncPathname = () => setPathname(window.location.pathname);
    syncPathname();
    window.addEventListener('popstate', syncPathname);
    window.addEventListener(SCOLA_NAVIGATION_EVENT, syncPathname);
    return () => {
      window.removeEventListener('popstate', syncPathname);
      window.removeEventListener(SCOLA_NAVIGATION_EVENT, syncPathname);
    };
  }, []);
  return pathname;
}

type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string;
};

export const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(
  function AppLink({ href, onClick, target, children, ...props }, ref) {
    const navigate = (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        (target != null && target !== '_self') ||
        props.download != null ||
        href.startsWith('#')
      )
        return;

      const destination = new URL(href, window.location.href);
      if (destination.origin !== window.location.origin) return;

      event.preventDefault();
      window.history.pushState({}, '', destination.href);
      window.dispatchEvent(new Event(SCOLA_NAVIGATION_EVENT));
      window.scrollTo({ top: 0, behavior: 'auto' });
    };

    return (
      <a {...props} ref={ref} href={href} target={target} onClick={navigate}>
        {children}
      </a>
    );
  },
);
