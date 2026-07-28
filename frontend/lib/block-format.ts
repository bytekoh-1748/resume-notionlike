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

type BlockFormatBases = Partial<{
  profileName: number;
  contact: number;
  sectionTitle: number;
  body: number;
  projectTitle: number;
  meta: number;
  projectBody: number;
  credentialTitle: number;
  credentialDetail: number;
  simpleTitle: number;
  simpleBody: number;
  skill: number;
  link: number;
  linkInline: number;
}>;

export const blockFormatCssVariables = (fontScale: number, overrides: BlockFormatBases = {}) => {
  const scale = Math.min(140, Math.max(80, fontScale)) / 100;
  const size = (base: number) => `${Number((base * scale).toFixed(2))}px`;
  const bases = {
    profileName: 25,
    contact: 9.5,
    sectionTitle: 18,
    body: 14,
    projectTitle: 17,
    meta: 11,
    projectBody: 13,
    credentialTitle: 15,
    credentialDetail: 12,
    simpleTitle: 13,
    simpleBody: 12,
    skill: 12,
    link: 12,
    linkInline: 11,
    ...overrides,
  };

  return {
    "--block-editor-name-size": size(24),
    "--block-editor-title-size": size(16),
    "--block-editor-body-size": size(13),
    "--block-editor-rich-size": size(12),
    "--block-profile-name-size": size(bases.profileName),
    "--block-contact-size": size(bases.contact),
    "--block-section-title-size": size(bases.sectionTitle),
    "--block-body-size": size(bases.body),
    "--block-project-title-size": size(bases.projectTitle),
    "--block-meta-size": size(bases.meta),
    "--block-project-body-size": size(bases.projectBody),
    "--block-credential-title-size": size(bases.credentialTitle),
    "--block-credential-detail-size": size(bases.credentialDetail),
    "--block-simple-title-size": size(bases.simpleTitle),
    "--block-simple-body-size": size(bases.simpleBody),
    "--block-skill-size": size(bases.skill),
    "--block-link-size": size(bases.link),
    "--block-link-inline-size": size(bases.linkInline),
  };
};
