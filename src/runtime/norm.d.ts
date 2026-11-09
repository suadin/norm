// Type declarations for the Norm runtime. The implementation is plain JS; these
// types are all an app needs to mount the footer and the documentation reader.

export interface NormDocPage {
  title: string;
  slug: string;
  markdown: string;
}

export interface NormDoc {
  slug: string;
  title: string;
  /** Basename of the markdown file, for inter-document links (file-based docs). */
  file?: string;
  changelog?: string;
  /** Present when a server provides pre-split documents (API docs). */
  pages?: NormDocPage[];
}

export interface NormApp {
  name: string;
  version: string;
  logo?: string;
}

export interface NormOptions {
  root?: Document | Element;
  app?: NormApp;
  source?: string;
  normVersion?: string;
  base?: string;
  docs?: readonly NormDoc[] | (() => Promise<readonly NormDoc[]>);
  /** When true (default), the runtime owns the docs routing and toggles `home`. */
  autoRoute?: boolean;
  home?: string;
  /** Where the reader-close button returns; a string or a function. */
  homeHash?: string | (() => string);
  /** A metrics URL, a metrics object, or nothing. */
  metrics?: string | Record<string, unknown>;
  footer?: boolean;
}

export interface NormHandle {
  open: (slug: string, section?: string | null) => void;
  close: () => void;
  unmount: () => void;
}

export function mountNorm(options?: NormOptions): Promise<NormHandle>;
