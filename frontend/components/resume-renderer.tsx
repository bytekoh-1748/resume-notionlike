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
import { paginateBlocks } from "../lib/blocks";
import { RichTextView } from "./rich-text-view";

type Data = Record<string, unknown>;
type Item = Record<string, unknown>;

const text = (value: unknown) => (typeof value === "string" ? value : "");
const items = (data: Data) => (Array.isArray(data.items) ? (data.items as Item[]) : []);
const imageDataUrl = (entry: Item) => {
  const source = text(entry.imageDataUrl);
  return /^data:image\/(?:jpeg|png|webp);base64,/i.test(source) ? source : "";
};
const contactIsVisible = (data: Data, key: "email" | "phone" | "location") => {
  const visibility =
    data.contactVisibility && typeof data.contactVisibility === "object"
      ? (data.contactVisibility as Record<string, unknown>)
      : {};
  return typeof visibility[key] === "boolean" ? Boolean(visibility[key]) : true;
};

function SectionTitle({ children }: { children: string }) {
  return children ? <h2 className="resume-section-title">{children}</h2> : null;
}

function ProjectItems({ entries }: { entries: Item[] }) {
  return (
    <div className="project-list">
      {entries.map((entry, index) => {
        const achievements = text(entry.achievements)
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean);
        const projectUrl = text(entry.url);
        const evidenceUrl = text(entry.evidenceUrl);

        return (
          <article className="project-item" key={text(entry.id) || String(index)}>
            <div className="project-heading">
              {text(entry.name) && <h3>{text(entry.name)}</h3>}
              {text(entry.description) && (
                <p className="resume-description">{text(entry.description)}</p>
              )}
            </div>
            <div className="project-body">
              <aside className="project-meta">
                {text(entry.period) && <time>{text(entry.period)}</time>}
                {text(entry.role) && <strong>{text(entry.role)}</strong>}
                {text(entry.stack) && <span>{text(entry.stack)}</span>}
                <div className="project-evidence-links">
                  {projectUrl && (
                    <a href={projectUrl} target="_blank" rel="noreferrer">
                      프로젝트 상세
                    </a>
                  )}
                  {evidenceUrl && (
                    <a href={evidenceUrl} target="_blank" rel="noreferrer">
                      코드·PR 증거
                    </a>
                  )}
                </div>
              </aside>
              {achievements.length > 0 && (
                <ul>
                  {achievements.map((achievement, achievementIndex) => (
                    <li key={`${achievement}-${achievementIndex}`}>{achievement}</li>
                  ))}
                </ul>
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
              {meta.length > 0 && (
                <div className="credential-meta">
                  {meta.map((item, metaIndex) => (
                    <span key={`${item}-${metaIndex}`}>{item}</span>
                  ))}
                </div>
              )}
              {detail.length > 0 && <p className="credential-detail">{detail.join(" · ")}</p>}
              {text(entry.description) && (
                <p className="resume-description credential-description">
                  {text(entry.description)}
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

  if (block.type === "divider") return <hr className="resume-divider" />;

  if (block.type === "profile") {
    const roleVisible = typeof data.roleVisible === "boolean" ? data.roleVisible : true;
    const role = roleVisible ? text(data.role) : "";
    const name = text(data.name);
    const profileImage = imageDataUrl(data);
    const contacts = [
      { key: "email" as const, value: text(data.email), icon: Mail },
      { key: "phone" as const, value: text(data.phone), icon: Phone },
      { key: "location" as const, value: text(data.location), icon: MapPin },
    ].filter((contact) => contact.value && contactIsVisible(data, contact.key));
    return (
      <section className={`resume-profile ${profileImage ? "has-photo" : ""}`}>
        {profileImage && (
          <div className="resume-profile-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profileImage} alt={`${name || "지원자"} 프로필`} />
          </div>
        )}
        <div className="resume-profile-content">
          {(role || name) && (
            <div className="resume-profile-heading">
              {name && <h1>{name}</h1>}
              {role && <p className="resume-kicker">{role}</p>}
            </div>
          )}
          {contacts.length > 0 && (
            <div className="profile-contacts">
              {contacts.map((contact) => {
                const Icon = contact.icon;
                return (
                  <span key={contact.key}>
                    <Icon size={11} /> {contact.value}
                  </span>
                );
              })}
            </div>
          )}
        </div>
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
    const skillItems = Array.isArray(data.items) ? (data.items as unknown[]) : [];
    return (
      <section>
        <SectionTitle>{title}</SectionTitle>
        <div className="skill-list">
          {skillItems.map((item, index) => (
            <span key={`${text(item)}-${index}`}>{text(item)}</span>
          ))}
        </div>
      </section>
    );
  }

  if (block.type === "award") {
    return (
      <section>
        <SectionTitle>{title}</SectionTitle>
        <div className="simple-list">
          {items(data).map((entry, index) => (
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
    return (
      <section>
        <SectionTitle>{title}</SectionTitle>
        <div className="simple-list">
          {items(data).map((entry, index) => (
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
    return (
      <section>
        <SectionTitle>{title}</SectionTitle>
        <div className={`link-list link-list-${display}`}>
          {items(data).map((entry, index) => {
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
    const list = Array.isArray(data.items) ? (data.items as unknown[]) : [];
    return (
      <section>
        <SectionTitle>{title}</SectionTitle>
        <ul className="resume-bullet-list">
          {list.map((item, index) => (
            <li key={index}>{text(item)}</li>
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
  const blocks = [...document.blocks].sort((a, b) => a.order - b.order);
  const isPrintTemplate = document.template !== "resume-web";
  const pages = isPrintTemplate ? paginateBlocks(blocks) : [];
  const renderBlock = (block: ResumeBlock, ignoreBreak = false) => (
    <div
      key={block.id}
      className={`resume-block resume-block-${block.width} resume-block-${block.type} ${!ignoreBreak && block.print.breakBefore ? "has-page-break" : ""}`}
      style={{ breakBefore: !ignoreBreak && block.print.breakBefore ? "page" : "auto" }}
      data-break-before={!ignoreBreak && block.print.breakBefore ? "true" : "false"}
    >
      <ResumeBlockView block={block} />
    </div>
  );

  return (
    <article
      className={`resume-paper resume-paper-${mode} density-${document.theme.density} template-${document.template ?? "resume-one-page"} ${isPrintTemplate ? "resume-paper-paged" : "resume-paper-flow"}`}
      style={
        {
          "--resume-accent": document.theme.accentColor,
          "--resume-font": document.theme.font,
        } as React.CSSProperties
      }
      data-render-ready="true"
    >
      {isPrintTemplate ? (
        <div className="resume-pages">
          {pages.map((pageBlocks, pageIndex) => (
            <div
              className="resume-page"
              key={pageBlocks[0]?.id ?? `page-${pageIndex}`}
              aria-label={`A4 ${pageIndex + 1}페이지`}
            >
              <div className="resume-grid">
                {pageBlocks.map((resumeBlock) => renderBlock(resumeBlock, true))}
              </div>
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
