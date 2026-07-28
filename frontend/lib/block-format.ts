import type { BlockFormat } from "./types";

export const defaultBlockFormat: BlockFormat = {
  fontScale: 100,
  bold: false,
  italic: false,
  dividerThickness: 1,
};

export const getBlockFormat = (format?: BlockFormat | null): BlockFormat => ({
  ...defaultBlockFormat,
  ...format,
});

export const blockFormatCssVariables = (fontScale: number) => {
  const scale = Math.min(140, Math.max(80, fontScale)) / 100;
  const size = (base: number) => `${Number((base * scale).toFixed(2))}px`;

  return {
    "--block-editor-name-size": size(24),
    "--block-editor-title-size": size(16),
    "--block-editor-body-size": size(13),
    "--block-editor-rich-size": size(12),
    "--block-profile-name-size": size(25),
    "--block-contact-size": size(9.5),
    "--block-section-title-size": size(18),
    "--block-body-size": size(14),
    "--block-project-title-size": size(17),
    "--block-meta-size": size(11),
    "--block-project-body-size": size(13),
    "--block-credential-title-size": size(15),
    "--block-credential-detail-size": size(12),
    "--block-simple-title-size": size(13),
    "--block-simple-body-size": size(12),
    "--block-skill-size": size(12),
    "--block-link-size": size(12),
    "--block-link-inline-size": size(11),
  };
};
