export interface Photo {
  id: string;
  /** Display-size image (about 1080px wide). */
  url: string;
  /** Tiny image used for color sampling. */
  sampleUrl: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  photoUrl: string;
}
