import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'LIF Project',
      // hide default border, keep minimal like app
      transparentMode: true,
    },
    // match app theme spacing
    sidebar: {
      collapsible: true,
    },
  };
}


