import {
  BriefcaseBusiness,
  GraduationCap,
  Link as LinkIcon,
  Mail,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";
import type { ResumeBlock, ResumeDocument, TiptapDocument } from "../lib/types";
import { RichTextView } from "./rich-text-view";

type Data = Record<string, unknown>;
type Item = Record<string, unknown>;

const text = (value: unknown) => (typeof value === "string" ? value : "");
const items = (data: Data) => (Array.isArray(data.items) ? (data.items as Item[]) : []);
const imageDataUrl = (entry: Item) => {
  const source = text(entry.imageDataUrl);
  return /^data:image\/(?:jpeg|png|webp);base64,/i.test(source) ? source : "";
};

function SectionTitle({ children }: { children: string }) {
  return children ? <h2 className="resume-section-title">{children}</h2> : null;
}

function TimelineItems({
  entries,
  primary,
  secondary,
  period,
}: {
  entries: Item[];
  primary: (entry: Item) => string;
  secondary: (entry: Item) => string;
  period: (entry: Item) => string;
}) {
  return (
    <div className="timeline-list">
      {entries.map((entry, index) => (
        <article className="timeline-item" key={text(entry.id) || String(index)}>
          <div className="timeline-dot" />
          <div className="timeline-head">
            <div>
              {primary(entry) && <h3>{primary(entry)}</h3>}
              {secondary(entry) && <p className="timeline-subtitle">{secondary(entry)}</p>}
            </div>
            {period(entry) && <time>{period(entry)}</time>}
          </div>
          {text(entry.description) && (
            <p className="resume-description">{text(entry.description)}</p>
          )}
          {text(entry.url) && (
            <a className="inline-link" href={text(entry.url)} target="_blank" rel="noreferrer">
              프로젝트 보기
            </a>
          )}
        </article>
      ))}
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
          <article className="credential-item" key={text(entry.id) || String(index)}>
            <div className={`credential-image ${image ? "has-image" : ""}`}>
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={`${primary || (experience ? "회사" : "학교")} 로고 또는 사진`} />
              ) : experience ? (
                <BriefcaseBusiness size={20} />
              ) : (
                <GraduationCap size={21} />
              )}
            </div>
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
    const role = text(data.role);
    const name = text(data.name);
    return (
      <section className="resume-profile">
        {(role || name) && (
          <div>
            {role && <p className="resume-kicker">{role}</p>}
            {name && <h1>{name}</h1>}
          </div>
        )}
        <div className="profile-contacts">
          {text(data.email) && (
            <span>
              <Mail size={14} /> {text(data.email)}
            </span>
          )}
          {text(data.phone) && (
            <span>
              <Phone size={14} /> {text(data.phone)}
            </span>
          )}
          {text(data.location) && (
            <span>
              <MapPin size={14} /> {text(data.location)}
            </span>
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
        <TimelineItems
          entries={items(data)}
          primary={(entry) => text(entry.name)}
          secondary={() => ""}
          period={(entry) => text(entry.period)}
        />
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
    return (
      <section>
        <SectionTitle>{title}</SectionTitle>
        <div className="link-list">
          {items(data).map((entry, index) => (
            <a key={text(entry.id) || String(index)} href={text(entry.url)} target="_blank" rel="noreferrer">
              <LinkIcon size={14} />
              <span>{text(entry.label) || text(entry.url)}</span>
              <small>{text(entry.url)}</small>
            </a>
          ))}
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
  return (
    <article
      className={`resume-paper resume-paper-${mode} density-${document.theme.density}`}
      style={
        {
          "--resume-accent": document.theme.accentColor,
          "--resume-font": document.theme.font,
        } as React.CSSProperties
      }
      data-render-ready="true"
    >
      <div className="resume-grid">
        {blocks.map((block) => (
          <div
            key={block.id}
            className={`resume-block resume-block-${block.width}`}
            style={{ breakBefore: block.print.breakBefore ? "page" : "auto" }}
          >
            <ResumeBlockView block={block} />
          </div>
        ))}
      </div>
    </article>
  );
}
