"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  Link as LinkIcon,
  Mail,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import type { ResumeBlock, ResumeDocument, TiptapDocument } from "../lib/types";
import { blockFormatCssVariables, getBlockFormat } from "../lib/block-format";
import { mergeContactLinksIntoProfile, paginateBlocks } from "../lib/blocks";
import { RichTextView } from "./rich-text-view";

type Data = Record<string, unknown>;
type Item = Record<string, unknown>;

const text = (value: unknown) => (typeof value === "string" ? value : "");
const numeric = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const items = (data: Data) => (Array.isArray(data.items) ? (data.items as Item[]) : []);
const imageDataUrl = (entry: Item) => {
  const source = text(entry.imageDataUrl);
  return /^data:image\/(?:jpeg|png|webp);base64,/i.test(source) ? source : "";
};
const projectEvidenceLinks = (entry: Item) => {
  const links = Array.isArray(entry.evidenceLinks)
    ? (entry.evidenceLinks as Item[])
        .map((link, index) => ({
          id: text(link.id) || `evidence-${index}`,
          label: text(link.label) || `증거 링크 ${index + 1}`,
          url: text(link.url),
        }))
        .filter((link) => Boolean(link.url))
    : [];
  const legacyUrl = text(entry.evidenceUrl);

  if (legacyUrl && !links.some((link) => link.url === legacyUrl)) {
    links.push({
      id: "legacy-evidence",
      label: "코드·PR·이슈",
      url: legacyUrl,
    });
  }

  return links;
};
const hasRichTextContent = (value: unknown): boolean => {
  if (typeof value === "string") return Boolean(value.trim());
  if (Array.isArray(value)) return value.some(hasRichTextContent);
  if (!value || typeof value !== "object") return false;

  const node = value as Record<string, unknown>;
  return Boolean(text(node.text).trim()) || hasRichTextContent(node.content);
};
const contactIsVisible = (data: Data, key: "email" | "phone" | "location") => {
  const visibility =
    data.contactVisibility && typeof data.contactVisibility === "object"
      ? (data.contactVisibility as Record<string, unknown>)
      : {};
  return typeof visibility[key] === "boolean" ? Boolean(visibility[key]) : true;
};
const blockHasVisibleContent = (block: ResumeBlock) => {
  const data = block.data;
  const entries = items(data);

  if (block.type === "divider") return true;
  if (block.type === "profile") {
    return Boolean(
      imageDataUrl(data) ||
        text(data.name) ||
        (text(data.email) && contactIsVisible(data, "email")) ||
        (text(data.phone) && contactIsVisible(data, "phone")) ||
        (text(data.location) && contactIsVisible(data, "location")) ||
        (Array.isArray(data.contactLinks) &&
          (data.contactLinks as Item[]).some(
            (entry) => text(entry.label).trim() || text(entry.url).trim(),
          )),
    );
  }
  if (block.type === "summary" || block.type === "aiExperience") {
    return Boolean(text(data.content).trim());
  }
  if (block.type === "experience") {
    return entries.some(
      (entry) =>
        imageDataUrl(entry) ||
        ["company", "startDate", "endDate", "employmentType", "role", "position", "description"].some(
          (key) => Boolean(text(entry[key]).trim()),
        ),
    );
  }
  if (block.type === "education") {
    return entries.some(
      (entry) =>
        imageDataUrl(entry) ||
        ["school", "period", "status", "major", "degree", "description"].some((key) =>
          Boolean(text(entry[key]).trim()),
        ),
    );
  }
  if (block.type === "project") {
    return entries.some(
      (entry) =>
        imageDataUrl(entry) ||
        projectEvidenceLinks(entry).length > 0 ||
        [
          "name",
          "organization",
          "description",
          "achievements",
          "period",
          "role",
          "stack",
          "url",
        ].some((key) => Boolean(text(entry[key]).trim())),
    );
  }
  if (block.type === "skills" || block.type === "bulletList") {
    return (Array.isArray(data.items) ? data.items : []).some((entry) =>
      Boolean(text(entry).trim()),
    );
  }
  if (block.type === "award") {
    return entries.some((entry) =>
      ["name", "date", "description"].some((key) => Boolean(text(entry[key]).trim())),
    );
  }
  if (block.type === "language") {
    return entries.some((entry) =>
      ["language", "level"].some((key) => Boolean(text(entry[key]).trim())),
    );
  }
  if (block.type === "links") {
    return entries.some((entry) =>
      ["label", "url"].some((key) => Boolean(text(entry[key]).trim())),
    );
  }
  if (block.type === "richText") return hasRichTextContent(data.content);

  return Boolean(text(data.title).trim());
};

function SectionTitle({ children }: { children: string }) {
  return children ? <h2 className="resume-section-title">{children}</h2> : null;
}

function ProjectItems({ entries }: { entries: Item[] }) {
  return (
    <div className="project-list">
      {entries.map((entry, index) => {
        const image = imageDataUrl(entry);
        const previousEntry = index > 0 ? entries[index - 1] : null;
        const previousImage = previousEntry ? imageDataUrl(previousEntry) : "";
        const projectName = text(entry.name);
        const organization = text(entry.organization);
        const previousOrganization = previousEntry
          ? text(previousEntry.organization).trim()
          : "";
        const sameOrganizationAsPrevious =
          Boolean(organization.trim()) &&
          organization.trim().toLocaleLowerCase() ===
            previousOrganization.toLocaleLowerCase();
        const reusePreviousOrganization =
          sameOrganizationAsPrevious &&
          entry.forceProjectImage !== true &&
          (!image || (Boolean(previousImage) && image === previousImage));
        const visibleImage = reusePreviousOrganization ? "" : image;
        const hasMediaColumn = Boolean(visibleImage || reusePreviousOrganization);
        const description = text(entry.description);
        const achievements = text(entry.achievements)
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean);
        const period = text(entry.period);
        const role = text(entry.role);
        const stack = text(entry.stack);
        const projectUrl = text(entry.url);
        const evidenceLinks = projectEvidenceLinks(entry);
        const affiliation = [organization, role].filter(Boolean).join(" · ");
        const hasHeading = Boolean(projectName || projectUrl || affiliation || period || stack);
        const hasLinks = evidenceLinks.length > 0;
        const hasAchievements = achievements.length > 0;

        if (!image && !hasHeading && !description && !hasLinks && !hasAchievements) return null;

        return (
          <article
            className={`project-item ${hasMediaColumn ? "has-image" : ""} ${
              reusePreviousOrganization ? "same-organization" : ""
            }`}
            key={text(entry.id) || String(index)}
          >
            {visibleImage && (
              <div className="project-media">
                <div className="project-image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={`${organization || projectName || "프로젝트"} 로고 또는 사진`}
                  />
                </div>
              </div>
            )}
            {reusePreviousOrganization && (
              <div className="project-media-spacer" aria-hidden="true" />
            )}
            <div className="project-main">
              {hasHeading && (
                <div className="project-heading">
                  {(projectName || projectUrl) && (
                    <div className="project-title-line">
                      {projectName && <h3>{projectName}</h3>}
                      {projectUrl && (
                        <a
                          className="project-title-github"
                          href={projectUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`${projectName || "프로젝트"} GitHub 저장소`}
                        >
                          <FaGithub aria-hidden="true" />
                          GitHub
                        </a>
                      )}
                    </div>
                  )}
                  {affiliation && <p className="project-affiliation">{affiliation}</p>}
                  {period && <time className="project-period">{period}</time>}
                  {stack && <p className="project-stack">{stack}</p>}
                </div>
              )}
              {description && (
                <p className="resume-description project-description">{description}</p>
              )}
              {hasAchievements && (
                <ul className="project-achievement-list">
                  {achievements.map((achievement, achievementIndex) => (
                    <li key={`${achievement}-${achievementIndex}`}>{achievement}</li>
                  ))}
                </ul>
              )}
              {hasLinks && (
                <div className="project-evidence-links">
                  {evidenceLinks.map((link) => (
                    <a key={link.id} href={link.url} target="_blank" rel="noreferrer">
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function CredentialItems({
  entries,
  kind,
}: {
  entries: Item[];
  kind: "experience" | "education";
}) {
  const experience = kind === "experience";
  return (
    <div className="credential-list">
      {entries.map((entry, index) => {
        const image = imageDataUrl(entry);
        const primary = experience ? text(entry.company) : text(entry.school);
        const period = experience
          ? [text(entry.startDate), text(entry.endDate)].filter(Boolean).join(" - ")
          : text(entry.period);
        const meta = experience
          ? [period, text(entry.employmentType)].filter(Boolean)
          : [period, text(entry.status)].filter(Boolean);
        const detail = experience
          ? [text(entry.role), text(entry.position)].filter(Boolean)
          : [text(entry.major), text(entry.degree)].filter(Boolean);
        const description = text(entry.description);

        if (!image && !primary && meta.length === 0 && detail.length === 0 && !description) {
          return null;
        }

        return (
          <article
            className={`credential-item ${image ? "has-image" : ""}`}
            key={text(entry.id) || String(index)}
          >
            {image && (
              <div className="credential-image has-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt={`${primary || (experience ? "회사" : "학교")} 로고 또는 사진`} />
              </div>
            )}
            <div className="credential-main">
              {primary && <h3>{primary}</h3>}
              {!experience && detail.length > 0 && (
                <p className="credential-detail">{detail.join(" · ")}</p>
              )}
              {meta.length > 0 && (
                <div className="credential-meta">
                  {meta.map((item, metaIndex) => (
                    <span key={`${item}-${metaIndex}`}>{item}</span>
                  ))}
                </div>
              )}
              {experience && detail.length > 0 && (
                <p className="credential-detail">{detail.join(" · ")}</p>
              )}
              {description && (
                <p className="resume-description credential-description">
                  {description}
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ResumeBlockView({ block }: { block: ResumeBlock }) {
  const data = block.data;
  const title = text(data.title);

  if (block.type === "divider") {
    return (
      <hr
        className="resume-divider"
        style={{ borderTopWidth: `${block.format?.dividerThickness ?? 1}px` }}
      />
    );
  }

  if (block.type === "profile") {
    const name = text(data.name);
    const profileImage = imageDataUrl(data);
    const imageFit = data.imageFit === "contain" ? "contain" : "cover";
    const imagePositionX = numeric(data.imagePositionX, 50);
    const imagePositionY = numeric(data.imagePositionY, 50);
    const imageZoom = numeric(data.imageZoom, 100);
    const profileImagePlacement =
      data.imagePlacement === "right" ||
      (data.imagePlacement !== "left" && data.layout === "right-photo")
        ? "right"
        : "left";
    const profileImageStyle = {
      objectFit: imageFit,
      objectPosition: `${imagePositionX}% ${imagePositionY}%`,
      transform: `scale(${imageZoom / 100})`,
      transformOrigin: `${imagePositionX}% ${imagePositionY}%`,
    } as const;
    const contacts = [
      { key: "email" as const, value: text(data.email), icon: Mail, href: "" },
      { key: "phone" as const, value: text(data.phone), icon: Phone, href: "" },
      { key: "location" as const, value: text(data.location), icon: MapPin, href: "" },
    ].filter((contact) => contact.value && contactIsVisible(data, contact.key));
    const contactLinks = (
      Array.isArray(data.contactLinks) ? (data.contactLinks as Item[]) : []
    )
      .map((entry, index) => {
        const url = text(entry.url);
        const label = text(entry.label) || url;
        return {
          key: text(entry.id) || `contact-link-${index}`,
          value: label,
          href: url,
          icon: /github(?:\.com)?/i.test(`${label} ${url}`) ? FaGithub : LinkIcon,
        };
      })
      .filter((contact) => contact.value);
    const contactItems = [...contacts, ...contactLinks];
    const hasIdentity = Boolean(name);
    const hasContent = hasIdentity || contactItems.length > 0;
    const rightPhotoLayout =
      data.layout === "right-photo" && profileImagePlacement === "right";

    if (rightPhotoLayout) {
      return (
        <section className="resume-profile resume-profile-right-photo">
          {hasIdentity && (
            <div className="resume-profile-content">
              <div className="resume-profile-heading">
                <h1>{name}</h1>
              </div>
            </div>
          )}
          {(profileImage || contactItems.length > 0) && (
            <aside className="resume-profile-aside">
              {profileImage && (
                <div className="resume-profile-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profileImage}
                    alt={`${name || "지원자"} 프로필`}
                    style={profileImageStyle}
                  />
                </div>
              )}
              {contactItems.length > 0 && (
                <div className="profile-contacts">
                  {contactItems.map((contact) => {
                    const Icon = contact.icon;
                    const content = (
                      <>
                        <Icon size={11} /> {contact.value}
                      </>
                    );
                    return contact.href ? (
                      <a key={contact.key} href={contact.href} target="_blank" rel="noreferrer">
                        {content}
                      </a>
                    ) : (
                      <span key={contact.key}>
                        {content}
                      </span>
                    );
                  })}
                </div>
              )}
            </aside>
          )}
        </section>
      );
    }

    return (
      <section
        className={`resume-profile ${profileImage ? "has-photo" : ""} ${
          profileImage && !hasContent ? "photo-only" : ""
        } ${profileImage && profileImagePlacement === "right" ? "photo-right" : ""}`}
      >
        {profileImage && (
          <div className="resume-profile-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profileImage} alt={`${name || "지원자"} 프로필`} style={profileImageStyle} />
          </div>
        )}
        {hasContent && (
          <div className="resume-profile-content">
            {hasIdentity && (
              <div className="resume-profile-heading">
                {name && <h1>{name}</h1>}
              </div>
            )}
            {contactItems.length > 0 && (
              <div className={`profile-contacts ${hasIdentity ? "" : "without-identity"}`}>
                {contactItems.map((contact) => {
                  const Icon = contact.icon;
                  const content = (
                    <>
                      <Icon size={11} /> {contact.value}
                    </>
                  );
                  return contact.href ? (
                    <a key={contact.key} href={contact.href} target="_blank" rel="noreferrer">
                      {content}
                    </a>
                  ) : (
                    <span key={contact.key}>
                      {content}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    );
  }

  if (block.type === "summary" || block.type === "aiExperience") {
    return (
      <section>
        <SectionTitle>{title}</SectionTitle>
        <div className="icon-copy">
          {block.type === "aiExperience" && (
            <span className="section-icon">
              <Sparkles size={16} />
            </span>
          )}
          <p className="resume-description">{text(data.content)}</p>
        </div>
      </section>
    );
  }

  if (block.type === "experience") {
    return (
      <section>
        <SectionTitle>{title}</SectionTitle>
        <CredentialItems entries={items(data)} kind="experience" />
      </section>
    );
  }

  if (block.type === "project") {
    return (
      <section>
        <SectionTitle>{title}</SectionTitle>
        <ProjectItems entries={items(data)} />
      </section>
    );
  }

  if (block.type === "education") {
    return (
      <section>
        <SectionTitle>{title}</SectionTitle>
        <CredentialItems entries={items(data)} kind="education" />
      </section>
    );
  }

  if (block.type === "skills") {
    const skillItems = (Array.isArray(data.items) ? (data.items as unknown[]) : [])
      .map(text)
      .filter(Boolean);
    return (
      <section>
        <SectionTitle>{title}</SectionTitle>
        <div className="skill-list">
          {skillItems.map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </section>
    );
  }

  if (block.type === "award") {
    const awardItems = items(data).filter(
      (entry) => text(entry.name) || text(entry.date) || text(entry.description),
    );
    return (
      <section>
        <SectionTitle>{title}</SectionTitle>
        <div className="simple-list">
          {awardItems.map((entry, index) => (
            <article key={text(entry.id) || String(index)}>
              <div className="simple-list-head">
                {text(entry.name) && <strong>{text(entry.name)}</strong>}
                <time>{text(entry.date)}</time>
              </div>
              {text(entry.description) && <p>{text(entry.description)}</p>}
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (block.type === "language") {
    const languageItems = items(data).filter(
      (entry) => text(entry.language) || text(entry.level),
    );
    return (
      <section>
        <SectionTitle>{title}</SectionTitle>
        <div className="simple-list">
          {languageItems.map((entry, index) => (
            <article className="language-row" key={text(entry.id) || String(index)}>
              {text(entry.language) && <strong>{text(entry.language)}</strong>}
              <span>{text(entry.level)}</span>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (block.type === "links") {
    const display = text(data.display) === "inline" ? "inline" : "list";
    const linkItems = items(data).filter((entry) => text(entry.label) || text(entry.url));
    return (
      <section>
        <SectionTitle>{title}</SectionTitle>
        <div className={`link-list link-list-${display}`}>
          {linkItems.map((entry, index) => {
            const url = text(entry.url);
            const label = text(entry.label) || url;
            const LinkGlyph = /github(?:\.com)?/i.test(`${label} ${url}`) ? FaGithub : LinkIcon;
            const content = (
              <>
                <LinkGlyph size={14} aria-hidden="true" />
                <span>{label}</span>
                {url && <small>{url}</small>}
              </>
            );
            return url ? (
              <a key={text(entry.id) || String(index)} href={url} target="_blank" rel="noreferrer">
                {content}
              </a>
            ) : (
              <span className="link-placeholder" key={text(entry.id) || String(index)}>
                {content}
              </span>
            );
          })}
        </div>
      </section>
    );
  }

  if (block.type === "richText") {
    return (
      <section>
        <SectionTitle>{title}</SectionTitle>
        <RichTextView value={data.content as TiptapDocument} />
      </section>
    );
  }

  if (block.type === "bulletList") {
    const list = (Array.isArray(data.items) ? (data.items as unknown[]) : [])
      .map(text)
      .filter(Boolean);
    return (
      <section>
        <SectionTitle>{title}</SectionTitle>
        <ul className="resume-bullet-list">
          {list.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <div className="icon-copy">
        <span className="section-icon">
          <BriefcaseBusiness size={16} />
        </span>
      </div>
    </section>
  );
}

export function ResumeRenderer({
  document,
  mode = "preview",
}: {
  document: ResumeDocument;
  mode?: "preview" | "public" | "print";
}) {
  const preparedDocument = mergeContactLinksIntoProfile(document);
  const blocks = [...preparedDocument.blocks]
    .sort((a, b) => a.order - b.order)
    .filter(blockHasVisibleContent);
  const isPrintTemplate = document.template !== "resume-web";
  const isPhotoSidebarTemplate = document.template === "resume-photo-sidebar";
  const resumeFont =
    document.theme.font === "Pretendard" ? '"Pretendard Variable"' : document.theme.font;
  const paginationKey = JSON.stringify(preparedDocument);
  const photoSidebarTypography = {
    profileName: 34,
    contact: 10,
    sectionTitle: 15,
    body: 12.5,
    projectTitle: 15,
    meta: 10.5,
    projectBody: 12,
    credentialTitle: 14,
    credentialDetail: 11.5,
    simpleTitle: 12.5,
    simpleBody: 11.5,
    skill: 11.5,
    link: 11.5,
    linkInline: 10.5,
  };
  const initialPages = useMemo(
    () => (isPrintTemplate ? paginateBlocks(blocks) : []),
    // The serialized document also captures nested block content and formatting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paginationKey, isPrintTemplate],
  );
  const [pages, setPages] = useState(initialPages);
  const [paginationReady, setPaginationReady] = useState(!isPrintTemplate);
  const paperRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setPages(initialPages);
      setPaginationReady(!isPrintTemplate);
    });
    return () => cancelAnimationFrame(frame);
  }, [initialPages, isPrintTemplate]);

  useEffect(() => {
    if (!isPrintTemplate) return;

    let cancelled = false;

    const measure = async () => {
      setPaginationReady(false);
      await window.document.fonts.ready;

      const paper = paperRef.current;
      if (!paper || cancelled) return;

      const images = Array.from(paper.querySelectorAll("img"));
      await Promise.all(
        images.map((image) =>
          image.complete
            ? Promise.resolve()
            : image.decode().catch(() => undefined),
        ),
      );
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      if (cancelled) return;

      const pageElements = Array.from(
        paper.querySelectorAll<HTMLElement>(".resume-page"),
      );

      for (let pageIndex = 0; pageIndex < pageElements.length; pageIndex += 1) {
        const pageElement = pageElements[pageIndex];
        const pageBlocks = pages[pageIndex] ?? [];
        const blockElements = Array.from(
          pageElement.querySelectorAll<HTMLElement>(
            ".resume-block[data-resume-block-id]",
          ),
        );
        if (pageBlocks.length < 2 || blockElements.length < 2) continue;

        const pageRect = pageElement.getBoundingClientRect();
        const pageStyle = getComputedStyle(pageElement);
        const contentBottom =
          pageRect.top +
          pageElement.clientHeight -
          Number.parseFloat(pageStyle.paddingBottom || "0");
        const overflowingBlock = blockElements.find(
          (blockElement) =>
            blockElement.getBoundingClientRect().bottom > contentBottom + 1,
        );
        if (!overflowingBlock) continue;

        const overflowingRect = overflowingBlock.getBoundingClientRect();
        const overflowingId = overflowingBlock.dataset.resumeBlockId;
        let splitIndex = pageBlocks.findIndex(
          (resumeBlock) => resumeBlock.id === overflowingId,
        );
        if (splitIndex <= 0) continue;

        for (const blockElement of blockElements) {
          const blockRect = blockElement.getBoundingClientRect();
          if (Math.abs(blockRect.top - overflowingRect.top) > 1) continue;
          const rowBlockIndex = pageBlocks.findIndex(
            (resumeBlock) =>
              resumeBlock.id === blockElement.dataset.resumeBlockId,
          );
          if (rowBlockIndex >= 0) splitIndex = Math.min(splitIndex, rowBlockIndex);
        }
        if (splitIndex <= 0) continue;

        const nextPages = pages.map((page) => [...page]);
        nextPages.splice(
          pageIndex,
          1,
          pageBlocks.slice(0, splitIndex),
          pageBlocks.slice(splitIndex),
        );
        setPages(nextPages);
        return;
      }

      setPaginationReady(true);
    };

    void measure();
    return () => {
      cancelled = true;
    };
  }, [isPrintTemplate, pages, paginationKey]);

  const renderBlock = (block: ResumeBlock, ignoreBreak = false) => {
    const format = getBlockFormat(block.format);

    return (
      <div
        key={block.id}
        className={`resume-block resume-block-${block.width} resume-block-${block.type} ${
          !ignoreBreak && block.print.breakBefore ? "has-page-break" : ""
        } ${format.bold ? "block-format-bold" : ""} ${
          format.italic ? "block-format-italic" : ""
        }`}
        style={
          {
            breakBefore: !ignoreBreak && block.print.breakBefore ? "page" : "auto",
            ...blockFormatCssVariables(
              format.fontScale,
              isPhotoSidebarTemplate ? photoSidebarTypography : undefined,
            ),
          } as React.CSSProperties
        }
        data-break-before={!ignoreBreak && block.print.breakBefore ? "true" : "false"}
        data-resume-block-id={block.id}
      >
        <ResumeBlockView block={block} />
      </div>
    );
  };

  return (
    <article
      ref={paperRef}
      className={`resume-paper resume-paper-${mode} density-${document.theme.density} template-${document.template ?? "resume-one-page"} ${isPrintTemplate ? "resume-paper-paged" : "resume-paper-flow"} ${isPrintTemplate && !paginationReady ? "is-paginating" : ""}`}
      style={
        {
          "--resume-accent": document.theme.accentColor,
          "--resume-font": resumeFont,
        } as React.CSSProperties
      }
      data-render-ready={!isPrintTemplate || paginationReady ? "true" : "false"}
    >
      {isPrintTemplate ? (
        <div className="resume-pages">
          {pages.map((pageBlocks, pageIndex) => (
            <div
              className="resume-page"
              key={pageBlocks[0]?.id ?? `page-${pageIndex}`}
              aria-label={`A4 ${pageIndex + 1}페이지`}
            >
              {isPhotoSidebarTemplate ? (
                <div className="resume-sidebar-layout">
                  {pageBlocks.some((resumeBlock) => resumeBlock.type === "profile") && (
                    <div className="resume-sidebar-header">
                      {pageBlocks
                        .filter((resumeBlock) => resumeBlock.type === "profile")
                        .map((resumeBlock) => renderBlock(resumeBlock, true))}
                    </div>
                  )}
                  <div className="resume-sidebar-columns">
                    <div className="resume-sidebar-main">
                      {pageBlocks
                        .filter(
                          (resumeBlock) =>
                            resumeBlock.type !== "profile" &&
                            resumeBlock.data.layoutColumn !== "sidebar",
                        )
                        .map((resumeBlock) => renderBlock(resumeBlock, true))}
                    </div>
                    <aside className="resume-sidebar-side">
                      {pageBlocks
                        .filter(
                          (resumeBlock) =>
                            resumeBlock.type !== "profile" &&
                            resumeBlock.data.layoutColumn === "sidebar",
                        )
                        .map((resumeBlock) => renderBlock(resumeBlock, true))}
                    </aside>
                  </div>
                </div>
              ) : (
                <div className="resume-grid">
                  {pageBlocks.map((resumeBlock) => renderBlock(resumeBlock, true))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="resume-grid">
          {blocks.map((resumeBlock) => renderBlock(resumeBlock))}
        </div>
      )}
    </article>
  );
}
