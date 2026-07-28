"use client";

import {
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  useEffect,
  useState,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  BriefcaseBusiness,
  FolderKanban,
  GraduationCap,
  ImagePlus,
  Link as LinkIcon,
  Mail,
  MapPin,
  Phone,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import type { ResumeBlock, TiptapDocument } from "../lib/types";
import { RichTextEditor } from "./rich-text";

type Data = Record<string, unknown>;
type Item = Record<string, unknown>;
type ContactKey = "email" | "phone" | "location";

const value = (data: Data, key: string) => (typeof data[key] === "string" ? (data[key] as string) : "");
const numericValue = (data: Data, key: string, fallback: number) =>
  typeof data[key] === "number" && Number.isFinite(data[key]) ? (data[key] as number) : fallback;
const list = (data: Data) => (Array.isArray(data.items) ? (data.items as Item[]) : []);
const contactFields: Array<{
  key: ContactKey;
  label: string;
  placeholder: string;
  icon: typeof Mail;
}> = [
  { key: "email", label: "이메일", placeholder: "name@example.com", icon: Mail },
  { key: "phone", label: "연락처", placeholder: "010-0000-0000", icon: Phone },
  { key: "location", label: "지역", placeholder: "서울, 대한민국", icon: MapPin },
];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_EDGE = 512;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function optimizeImage(file: File): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new Error("JPG, PNG, WebP 이미지만 사용할 수 있습니다.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("이미지는 8MB 이하로 선택해 주세요.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("이미지 파일을 읽을 수 없습니다."));
      nextImage.src = objectUrl;
    });
    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error("이미지 크기를 확인할 수 없습니다.");
    }

    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("이미지를 처리할 수 없습니다.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/webp", 0.86);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  bulleted = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  bulleted?: boolean;
}) {
  const bulletLines = bulleted && value ? value.split("\n") : [];

  return (
    <label className={`field ${multiline ? "field-wide" : ""}`}>
      <span>{label}</span>
      {multiline ? (
        <div className={`textarea-control ${bulleted ? "bullet-textarea-control" : ""}`}>
          {bulleted && (
            <span className="bullet-line-markers" aria-hidden="true">
              {bulletLines.map((_, index) => (
                <i key={index}>•</i>
              ))}
            </span>
          )}
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
          />
        </div>
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      )}
    </label>
  );
}

function SkillsField({
  skills,
  onChange,
}: {
  skills: string[];
  onChange: (skills: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const addSkills = (values: string[]) => {
    const nextSkills = [...skills];
    values
      .flatMap((item) => item.split(/[,，\n]/))
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => {
        if (!nextSkills.some((skill) => skill.toLocaleLowerCase() === item.toLocaleLowerCase())) {
          nextSkills.push(item);
        }
      });

    if (nextSkills.length !== skills.length) onChange(nextSkills);
  };

  const commitDraft = () => {
    addSkills([draft]);
    setDraft("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;

    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitDraft();
      return;
    }

    if (event.key === "Backspace" && !draft && skills.length > 0) {
      onChange(skills.slice(0, -1));
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pastedText = event.clipboardData.getData("text");
    if (!/[,，\n]/.test(pastedText)) return;

    event.preventDefault();
    addSkills([draft, pastedText]);
    setDraft("");
  };

  return (
    <div className="field skills-field">
      <span>스킬</span>
      <div className="skills-input" onClick={(event) => event.currentTarget.querySelector("input")?.focus()}>
        {skills.map((skill, index) => (
          <span className="skills-input-tag" key={`${skill}-${index}`}>
            {skill}
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onChange(skills.filter((_, skillIndex) => skillIndex !== index))}
              aria-label={`${skill} 삭제`}
            >
              <X size={12} aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={commitDraft}
          aria-label="스킬 추가"
          placeholder={skills.length > 0 ? "스킬 추가" : "React 입력 후 Enter"}
        />
      </div>
      <small>Enter 또는 쉼표로 스킬을 추가할 수 있습니다.</small>
    </div>
  );
}

function SectionHeading({ data, onData }: { data: Data; onData: (data: Data) => void }) {
  return (
    <input
      className="inline-section-title"
      value={value(data, "title")}
      onChange={(event) => onData({ ...data, title: event.target.value })}
      aria-label="섹션 제목"
      placeholder="섹션 제목"
    />
  );
}

function ListEditor({
  entries,
  onChange,
  fields,
  createItem,
  imageKind,
  imageErrors,
  onImageError,
}: {
  entries: Item[];
  onChange: (items: Item[]) => void;
  fields: Array<{
    key: string;
    label: string;
    placeholder?: string;
    multiline?: boolean;
    bulleted?: boolean;
  }>;
  createItem: () => Item;
  imageKind?: "experience" | "education" | "project";
  imageErrors?: Record<string, string>;
  onImageError?: (itemId: string, message: string) => void;
}) {
  const update = (index: number, key: string, next: unknown) => {
    onChange(entries.map((entry, entryIndex) => (entryIndex === index ? { ...entry, [key]: next } : entry)));
  };
  const move = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= entries.length) return;

    const nextEntries = [...entries];
    [nextEntries[index], nextEntries[targetIndex]] = [nextEntries[targetIndex], nextEntries[index]];
    onChange(nextEntries);
  };

  return (
    <div className="item-editor-list">
      {entries.map((entry, index) => {
        const itemId = String(entry.id || index);
        const imageDataUrl = typeof entry.imageDataUrl === "string" ? entry.imageDataUrl : "";
        const previousEntry = index > 0 ? entries[index - 1] : null;
        const previousImageDataUrl =
          previousEntry && typeof previousEntry.imageDataUrl === "string"
            ? previousEntry.imageDataUrl
            : "";
        const organization =
          imageKind === "project" && typeof entry.organization === "string"
            ? entry.organization.trim()
            : "";
        const previousOrganization =
          imageKind === "project" &&
          previousEntry &&
          typeof previousEntry.organization === "string"
            ? previousEntry.organization.trim()
            : "";
        const sameOrganizationAsPrevious =
          Boolean(organization) &&
          organization.toLocaleLowerCase() ===
            previousOrganization.toLocaleLowerCase();
        const reusePreviousOrganization =
          imageKind === "project" &&
          sameOrganizationAsPrevious &&
          entry.forceProjectImage !== true &&
          (!imageDataUrl ||
            (Boolean(previousImageDataUrl) &&
              imageDataUrl === previousImageDataUrl));
        const imageLabel =
          (imageKind === "experience"
            ? String(entry.company || "")
            : imageKind === "education"
              ? String(entry.school || "")
              : String(entry.organization || entry.name || "")) ||
          (imageKind === "experience"
            ? "회사"
            : imageKind === "education"
              ? "학교"
              : "프로젝트");
        const evidenceLinks: Item[] =
          imageKind === "project"
            ? Array.isArray(entry.evidenceLinks)
              ? (entry.evidenceLinks as Item[])
              : typeof entry.evidenceUrl === "string" && entry.evidenceUrl.trim()
                ? [
                    {
                      id: `legacy-${itemId}`,
                      label: "코드·PR·이슈",
                      url: entry.evidenceUrl,
                    },
                  ]
                : []
            : [];
        const updateEvidenceLinks = (nextLinks: Item[]) => {
          onChange(
            entries.map((currentEntry, entryIndex) =>
              entryIndex === index
                ? { ...currentEntry, evidenceLinks: nextLinks, evidenceUrl: "" }
                : currentEntry,
            ),
          );
        };
        return (
          <div
            className={`item-editor ${imageKind ? "item-editor-with-image" : ""}`}
            key={itemId}
          >
            {imageKind && (
              <div className="item-image-control">
                {reusePreviousOrganization ? (
                  <div className="item-image-reused">
                    <FolderKanban size={20} />
                    <strong>같은 기업</strong>
                    <span>중복 사진 생략</span>
                    <button
                      type="button"
                      onClick={() => update(index, "forceProjectImage", true)}
                    >
                      별도 사진 사용
                    </button>
                  </div>
                ) : (
                  <label className={`item-image-picker ${imageDataUrl ? "has-image" : ""}`}>
                    {imageDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageDataUrl} alt={`${imageLabel} 로고 또는 사진`} />
                    ) : (
                      <span className="item-image-placeholder">
                        {imageKind === "experience" ? (
                          <BriefcaseBusiness size={24} />
                        ) : imageKind === "project" ? (
                          <FolderKanban size={24} />
                        ) : (
                          <GraduationCap size={25} />
                        )}
                      </span>
                    )}
                    <span className="item-image-action">
                      <ImagePlus size={13} />
                      {imageDataUrl ? "교체" : "사진 추가"}
                    </span>
                    <input
                      className="visually-hidden-file"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      aria-label={`${imageLabel} 로고 또는 사진 ${imageDataUrl ? "교체" : "추가"}`}
                      onChange={async (event) => {
                        const input = event.currentTarget;
                        const file = input.files?.[0];
                        if (!file) return;
                        onImageError?.(itemId, "");
                        try {
                          update(index, "imageDataUrl", await optimizeImage(file));
                        } catch (error) {
                          onImageError?.(
                            itemId,
                            error instanceof Error ? error.message : "이미지를 처리하지 못했습니다.",
                          );
                        } finally {
                          input.value = "";
                        }
                      }}
                    />
                  </label>
                )}
                {imageDataUrl && !reusePreviousOrganization && (
                  <button
                    type="button"
                    className="item-image-remove"
                    onClick={() => {
                      update(index, "imageDataUrl", "");
                      onImageError?.(itemId, "");
                    }}
                  >
                    <X size={12} /> 사진 삭제
                  </button>
                )}
                {imageKind === "project" &&
                  sameOrganizationAsPrevious &&
                  entry.forceProjectImage === true && (
                    <button
                      type="button"
                      className="item-image-reuse"
                      onClick={() => update(index, "forceProjectImage", false)}
                    >
                      중복 사진 생략
                    </button>
                  )}
              </div>
            )}
            <div className="item-editor-content">
              {imageKind === "project" && (
                <div className="project-item-toolbar">
                  <strong>프로젝트 {index + 1}</strong>
                  <div className="project-item-actions">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label={`프로젝트 ${index + 1} 위로 이동`}
                      title="위로 이동"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === entries.length - 1}
                      aria-label={`프로젝트 ${index + 1} 아래로 이동`}
                      title="아래로 이동"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      className="project-item-delete"
                      onClick={() =>
                        onChange(entries.filter((_, entryIndex) => entryIndex !== index))
                      }
                      aria-label={`프로젝트 ${index + 1} 삭제`}
                      title="프로젝트 삭제"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
              <div className="item-editor-grid">
                {fields.map((field) => (
                  <Field
                    key={field.key}
                    label={field.label}
                    value={typeof entry[field.key] === "string" ? (entry[field.key] as string) : ""}
                    placeholder={field.placeholder}
                    multiline={field.multiline}
                    bulleted={field.bulleted}
                    onChange={(next) => update(index, field.key, next)}
                  />
                ))}
              </div>
              {imageKind === "project" && (
                <div className="project-evidence-editor">
                  <div className="project-evidence-editor-head">
                    <div>
                      <strong>코드·PR·이슈 증거 링크</strong>
                      <span>GitHub 저장소, PR, 이슈 등을 여러 개 추가할 수 있습니다.</span>
                    </div>
                    <button
                      type="button"
                      className="project-evidence-add"
                      onClick={() =>
                        updateEvidenceLinks([
                          ...evidenceLinks,
                          { id: crypto.randomUUID(), label: "", url: "" },
                        ])
                      }
                    >
                      <Plus size={13} /> 링크 추가
                    </button>
                  </div>
                  {evidenceLinks.length === 0 && (
                    <p className="project-evidence-empty">
                      증거 링크가 필요하면 링크 추가를 눌러 주세요.
                    </p>
                  )}
                  {evidenceLinks.map((link, evidenceIndex) => (
                    <div
                      className="project-evidence-editor-row"
                      key={String(link.id || evidenceIndex)}
                    >
                      <label className="field">
                        <span>표시 이름</span>
                        <input
                          aria-label={`증거 링크 ${evidenceIndex + 1} 표시 이름`}
                          value={typeof link.label === "string" ? link.label : ""}
                          placeholder="예: PR #42"
                          onChange={(event) =>
                            updateEvidenceLinks(
                              evidenceLinks.map((currentLink, currentIndex) =>
                                currentIndex === evidenceIndex
                                  ? { ...currentLink, label: event.target.value }
                                  : currentLink,
                              ),
                            )
                          }
                        />
                      </label>
                      <label className="field">
                        <span>URL</span>
                        <input
                          aria-label={`증거 링크 ${evidenceIndex + 1} URL`}
                          value={typeof link.url === "string" ? link.url : ""}
                          placeholder="https://github.com/..."
                          onChange={(event) =>
                            updateEvidenceLinks(
                              evidenceLinks.map((currentLink, currentIndex) =>
                                currentIndex === evidenceIndex
                                  ? { ...currentLink, url: event.target.value }
                                  : currentLink,
                              ),
                            )
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="project-evidence-remove"
                        aria-label={`증거 링크 ${evidenceIndex + 1} 삭제`}
                        onClick={() =>
                          updateEvidenceLinks(
                            evidenceLinks.filter(
                              (_, currentIndex) => currentIndex !== evidenceIndex,
                            ),
                          )
                        }
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {imageErrors?.[itemId] && (
                <p className="item-image-error" role="alert">
                  {imageErrors[itemId]}
                </p>
              )}
            </div>
            {imageKind !== "project" && (
              <button
                type="button"
                className="item-remove"
                onClick={() => onChange(entries.filter((_, entryIndex) => entryIndex !== index))}
                aria-label="항목 삭제"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      })}
      <button type="button" className="add-item-button" onClick={() => onChange([...entries, createItem()])}>
        <Plus size={14} /> 항목 추가
      </button>
    </div>
  );
}

export function BlockEditor({
  block,
  onChange,
}: {
  block: ResumeBlock;
  onChange: (block: ResumeBlock) => void;
}) {
  const data = block.data;
  const onData = (next: Data) => onChange({ ...block, data: next });
  const uuid = () => crypto.randomUUID();
  const [imageErrors, setImageErrors] = useState<Record<string, string>>({});
  const [profileImageAdjustmentOpen, setProfileImageAdjustmentOpen] = useState(false);
  const [profileImageSelected, setProfileImageSelected] = useState(false);
  const setImageError = (itemId: string, message: string) =>
    setImageErrors((current) => ({ ...current, [itemId]: message }));

  useEffect(() => {
    if (!profileImageAdjustmentOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileImageAdjustmentOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [profileImageAdjustmentOpen]);

  if (block.type === "divider") {
    const thickness = block.format?.dividerThickness ?? 1;
    return (
      <div
        className="editor-divider"
        aria-label={`구분선 ${thickness}px`}
        style={{ height: `${thickness}px` }}
      />
    );
  }

  if (block.type === "profile") {
    const contactVisibility =
      data.contactVisibility && typeof data.contactVisibility === "object"
        ? (data.contactVisibility as Record<string, unknown>)
        : {};
    const isContactVisible = (key: ContactKey) =>
      typeof contactVisibility[key] === "boolean" ? Boolean(contactVisibility[key]) : true;
    const setContactVisible = (key: ContactKey, visible: boolean) =>
      onData({
        ...data,
        contactVisibility: { ...contactVisibility, [key]: visible },
      });
    const visibleContacts = contactFields.filter((contact) => isContactVisible(contact.key));
    const hiddenContacts = contactFields.filter((contact) => !isContactVisible(contact.key));
    const contactLinks = Array.isArray(data.contactLinks)
      ? (data.contactLinks as Item[])
      : [];
    const updateContactLinks = (nextLinks: Item[]) =>
      onData({ ...data, contactLinks: nextLinks });
    const profileImage = value(data, "imageDataUrl");
    const profileImageFit = data.imageFit === "contain" ? "contain" : "cover";
    const profileImagePositionX = numericValue(data, "imagePositionX", 50);
    const profileImagePositionY = numericValue(data, "imagePositionY", 50);
    const profileImageZoom = numericValue(data, "imageZoom", 100);
    const profileImagePlacement =
      data.imagePlacement === "right" ||
      (data.imagePlacement !== "left" && data.layout === "right-photo")
        ? "right"
        : "left";
    const profileImageStyle = {
      objectFit: profileImageFit,
      objectPosition: `${profileImagePositionX}% ${profileImagePositionY}%`,
      transform: `scale(${profileImageZoom / 100})`,
      transformOrigin: `${profileImagePositionX}% ${profileImagePositionY}%`,
    } as const;
    const handleProfileImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const file = input.files?.[0];
      if (!file) return;
      setImageError("profile", "");
      try {
        const nextImage = await optimizeImage(file);
        onData({
          ...data,
          imageDataUrl: nextImage,
          imageFit: "cover",
          imagePositionX: 50,
          imagePositionY: 50,
          imageZoom: 100,
          imagePlacement: profileImagePlacement,
        });
        setProfileImageSelected(true);
        setProfileImageAdjustmentOpen(true);
      } catch (error) {
        setImageError(
          "profile",
          error instanceof Error ? error.message : "이미지를 처리하지 못했습니다.",
        );
      } finally {
        input.value = "";
      }
    };

    return (
      <div className="profile-editor">
        <div className={`profile-editor-head photo-${profileImagePlacement}`}>
          <div className="profile-image-control">
            {profileImage ? (
              <button
                type="button"
                className={`profile-image-picker has-image ${
                  profileImageSelected ? "selected" : ""
                }`}
                onClick={() => setProfileImageSelected((selected) => !selected)}
                aria-label="프로필 사진 선택"
                aria-pressed={profileImageSelected}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profileImage} alt="프로필 사진" style={profileImageStyle} />
              </button>
            ) : (
              <label className="profile-image-picker">
                <span>
                  <ImagePlus size={19} />
                  사진
                </span>
                <input
                  className="visually-hidden-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-label="프로필 사진 추가"
                  onChange={handleProfileImageChange}
                />
              </label>
            )}
          </div>
          <div className="profile-editor-identity">
            <input
              className="profile-name-input"
              value={value(data, "name")}
              onChange={(event) => onData({ ...data, name: event.target.value })}
              placeholder="이름"
              aria-label="이름"
            />
            {imageErrors.profile && (
              <p className="item-image-error" role="alert">
                {imageErrors.profile}
              </p>
            )}
          </div>
        </div>
        {profileImage && profileImageSelected && (
          <div className="profile-image-actions" aria-label="프로필 사진 옵션">
            <span className="profile-image-actions-label">사진 위치</span>
            <div className="profile-image-placement" role="group" aria-label="프로필 사진 위치">
              <button
                type="button"
                className={profileImagePlacement === "left" ? "active" : ""}
                onClick={() => onData({ ...data, imagePlacement: "left" })}
                aria-pressed={profileImagePlacement === "left"}
              >
                왼쪽
              </button>
              <button
                type="button"
                className={profileImagePlacement === "right" ? "active" : ""}
                onClick={() => onData({ ...data, imagePlacement: "right" })}
                aria-pressed={profileImagePlacement === "right"}
              >
                오른쪽
              </button>
            </div>
            <label className="profile-image-replace">
              <ImagePlus size={13} /> 사진 교체
              <input
                className="visually-hidden-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="프로필 사진 교체"
                onChange={handleProfileImageChange}
              />
            </label>
            <button
              type="button"
              className="profile-image-adjust-open"
              onClick={() => setProfileImageAdjustmentOpen(true)}
            >
              사진 조정
            </button>
            <button
              type="button"
              className="profile-image-remove"
              onClick={() => {
                onData({ ...data, imageDataUrl: "" });
                setProfileImageSelected(false);
                setProfileImageAdjustmentOpen(false);
                setImageError("profile", "");
              }}
            >
              <X size={12} /> 사진 삭제
            </button>
            <button
              type="button"
              className="profile-image-actions-close"
              onClick={() => setProfileImageSelected(false)}
              aria-label="프로필 사진 옵션 닫기"
            >
              <X size={14} />
            </button>
          </div>
        )}
        {profileImage && profileImageAdjustmentOpen && (
          <div
            className="profile-image-adjustment-backdrop"
            onMouseDown={() => setProfileImageAdjustmentOpen(false)}
          >
            <div
              className="profile-image-adjustment-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-image-adjustment-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="profile-image-adjustment-header">
                <strong id="profile-image-adjustment-title">사진 조정</strong>
                <button
                  type="button"
                  onClick={() => setProfileImageAdjustmentOpen(false)}
                  aria-label="사진 조정 닫기"
                  autoFocus
                >
                  <X size={17} />
                </button>
              </div>
              <div className="profile-image-adjustment-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profileImage} alt="조정 중인 프로필 사진" style={profileImageStyle} />
              </div>
              <div className="profile-image-adjustments">
                <div className="profile-image-fit" role="group" aria-label="사진 맞춤 방식">
                  <button
                    type="button"
                    className={profileImageFit === "cover" ? "active" : ""}
                    onClick={() => onData({ ...data, imageFit: "cover" })}
                  >
                    영역 채우기
                  </button>
                  <button
                    type="button"
                    className={profileImageFit === "contain" ? "active" : ""}
                    onClick={() => onData({ ...data, imageFit: "contain" })}
                  >
                    전체 사진
                  </button>
                </div>
                <div className="profile-image-sliders">
                  <label>
                    <span>가로 위치</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={profileImagePositionX}
                      onChange={(event) =>
                        onData({ ...data, imagePositionX: Number(event.target.value) })
                      }
                    />
                    <output>{profileImagePositionX}%</output>
                  </label>
                  <label>
                    <span>세로 위치</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={profileImagePositionY}
                      onChange={(event) =>
                        onData({ ...data, imagePositionY: Number(event.target.value) })
                      }
                    />
                    <output>{profileImagePositionY}%</output>
                  </label>
                  <label>
                    <span>확대</span>
                    <input
                      type="range"
                      min="100"
                      max="200"
                      value={profileImageZoom}
                      onChange={(event) =>
                        onData({ ...data, imageZoom: Number(event.target.value) })
                      }
                    />
                    <output>{profileImageZoom}%</output>
                  </label>
                </div>
                <div className="profile-image-adjustment-footer">
                  <button
                    type="button"
                    className="profile-image-reset"
                    onClick={() =>
                      onData({
                        ...data,
                        imageFit: "cover",
                        imagePositionX: 50,
                        imagePositionY: 50,
                        imageZoom: 100,
                      })
                    }
                  >
                    초기화
                  </button>
                  <button
                    type="button"
                    className="profile-image-adjustment-done"
                    onClick={() => setProfileImageAdjustmentOpen(false)}
                  >
                    완료
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="profile-contact-editor">
          {visibleContacts.map((contact) => {
            const Icon = contact.icon;
            return (
              <div className="profile-contact-field" key={contact.key}>
                <span className="profile-contact-icon">
                  <Icon size={13} />
                </span>
                <Field
                  label={contact.label}
                  value={value(data, contact.key)}
                  placeholder={contact.placeholder}
                  onChange={(next) => onData({ ...data, [contact.key]: next })}
                />
                <button
                  type="button"
                  className="profile-contact-remove"
                  onClick={() => setContactVisible(contact.key, false)}
                  aria-label={`${contact.label} 항목 제거`}
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}
          {contactLinks.map((contactLink, index) => {
            const label = typeof contactLink.label === "string" ? contactLink.label : "";
            const url = typeof contactLink.url === "string" ? contactLink.url : "";
            const Icon = /github(?:\.com)?/i.test(`${label} ${url}`) ? FaGithub : LinkIcon;
            const updateLink = (key: "label" | "url", next: string) =>
              updateContactLinks(
                contactLinks.map((entry, entryIndex) =>
                  entryIndex === index ? { ...entry, [key]: next } : entry,
                ),
              );

            return (
              <div className="profile-contact-field profile-contact-link-field" key={String(contactLink.id || index)}>
                <span className="profile-contact-icon">
                  <Icon size={13} />
                </span>
                <div className="profile-contact-link-inputs">
                  <Field
                    label="링크 이름"
                    value={label}
                    placeholder="GitHub"
                    onChange={(next) => updateLink("label", next)}
                  />
                  <Field
                    label="URL"
                    value={url}
                    placeholder="https://"
                    onChange={(next) => updateLink("url", next)}
                  />
                </div>
                <button
                  type="button"
                  className="profile-contact-remove"
                  onClick={() =>
                    updateContactLinks(
                      contactLinks.filter((_, entryIndex) => entryIndex !== index),
                    )
                  }
                  aria-label={`${label || "링크"} 항목 제거`}
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}
          <div className="profile-contact-add">
            <span>연락처 항목 추가</span>
            <div>
              {hiddenContacts.map((contact) => {
                const Icon = contact.icon;
                return (
                  <button
                    type="button"
                    key={contact.key}
                    onClick={() => setContactVisible(contact.key, true)}
                  >
                    <Icon size={12} /> {contact.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  updateContactLinks([
                    ...contactLinks,
                    { id: uuid(), label: "", url: "" },
                  ])
                }
              >
                <LinkIcon size={12} /> 링크
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (block.type === "summary" || block.type === "aiExperience") {
    return (
      <div>
        <SectionHeading data={data} onData={onData} />
        <Field
          label="내용"
          value={value(data, "content")}
          onChange={(next) => onData({ ...data, content: next })}
          multiline
          placeholder="구체적인 내용을 입력해 주세요."
        />
      </div>
    );
  }

  if (block.type === "experience") {
    return (
      <div>
        <SectionHeading data={data} onData={onData} />
        <ListEditor
          entries={list(data)}
          onChange={(items) => onData({ ...data, items })}
          imageKind="experience"
          imageErrors={imageErrors}
          onImageError={setImageError}
          createItem={() => ({
            id: uuid(),
            company: "",
            role: "",
            position: "",
            employmentType: "",
            startDate: "",
            endDate: "",
            description: "",
            imageDataUrl: "",
          })}
          fields={[
            { key: "company", label: "회사명", placeholder: "회사명" },
            { key: "employmentType", label: "고용 형태", placeholder: "정규직" },
            { key: "startDate", label: "시작일", placeholder: "YYYY.MM" },
            { key: "endDate", label: "종료일", placeholder: "YYYY.MM 또는 현재" },
            { key: "role", label: "직무", placeholder: "직무" },
            { key: "position", label: "직책", placeholder: "팀원" },
            {
              key: "description",
              label: "업무 경험과 주요 성과",
              placeholder: "역할, 기여도, 사용 기술과 성과를 작성해 주세요.",
              multiline: true,
            },
          ]}
        />
      </div>
    );
  }

  if (block.type === "project") {
    return (
      <div>
        <SectionHeading data={data} onData={onData} />
        <ListEditor
          entries={list(data)}
          onChange={(items) => onData({ ...data, items })}
          imageKind="project"
          imageErrors={imageErrors}
          onImageError={setImageError}
          createItem={() => ({
            id: uuid(),
            name: "",
            organization: "",
            period: "",
            role: "",
            stack: "",
            description: "",
            achievements: "",
            url: "",
            evidenceLinks: [
              {
                id: uuid(),
                label: "GitHub 저장소",
                url: "",
              },
            ],
            imageDataUrl: "",
          })}
          fields={[
            { key: "name", label: "프로젝트명", placeholder: "프로젝트명" },
            {
              key: "organization",
              label: "진행한 곳",
              placeholder: "회사명, 학교명, 기관명 또는 개인 프로젝트",
            },
            { key: "period", label: "기간" },
            { key: "role", label: "담당 역할", placeholder: "백엔드 리드" },
            { key: "stack", label: "핵심 기술", placeholder: "Java, Spring Boot, PostgreSQL" },
            { key: "url", label: "GitHub 저장소 링크" },
            {
              key: "description",
              label: "문제와 프로젝트 요약",
              placeholder: "어떤 문제를 왜 해결했는지 요약해 주세요.",
              multiline: true,
            },
            {
              key: "achievements",
              label: "핵심 성과 — 줄바꿈으로 구분",
              placeholder: "내가 기여한 일과 정량 결과를 한 줄씩 작성해 주세요.",
              multiline: true,
              bulleted: true,
            },
          ]}
        />
      </div>
    );
  }

  if (block.type === "education") {
    return (
      <div>
        <SectionHeading data={data} onData={onData} />
        <ListEditor
          entries={list(data)}
          onChange={(items) => onData({ ...data, items })}
          imageKind="education"
          imageErrors={imageErrors}
          onImageError={setImageError}
          createItem={() => ({
            id: uuid(),
            school: "",
            major: "",
            degree: "",
            period: "",
            status: "",
            description: "",
            imageDataUrl: "",
          })}
          fields={[
            { key: "school", label: "학교명", placeholder: "학교명" },
            { key: "period", label: "재학 기간", placeholder: "YYYY.MM - YYYY.MM" },
            { key: "status", label: "졸업 상태", placeholder: "재학 중" },
            { key: "major", label: "전공", placeholder: "전공명" },
            { key: "degree", label: "학위", placeholder: "학사" },
            {
              key: "description",
              label: "이수 과목 또는 연구 내용",
              placeholder: "주요 이수 과목, 연구 및 활동 내용을 작성해 주세요.",
              multiline: true,
            },
          ]}
        />
      </div>
    );
  }

  if (block.type === "skills") {
    const skills = Array.isArray(data.items) ? (data.items as string[]) : [];
    return (
      <div>
        <SectionHeading data={data} onData={onData} />
        <SkillsField
          skills={skills}
          onChange={(nextSkills) => onData({ ...data, items: nextSkills })}
        />
      </div>
    );
  }

  if (block.type === "award") {
    return (
      <div>
        <SectionHeading data={data} onData={onData} />
        <ListEditor
          entries={list(data)}
          onChange={(items) => onData({ ...data, items })}
          createItem={() => ({ id: uuid(), name: "", date: "", description: "" })}
          fields={[
            { key: "name", label: "활동명" },
            { key: "date", label: "날짜" },
            { key: "description", label: "설명", multiline: true },
          ]}
        />
      </div>
    );
  }

  if (block.type === "language") {
    return (
      <div>
        <SectionHeading data={data} onData={onData} />
        <ListEditor
          entries={list(data)}
          onChange={(items) => onData({ ...data, items })}
          createItem={() => ({ id: uuid(), language: "", level: "" })}
          fields={[
            { key: "language", label: "언어" },
            { key: "level", label: "수준" },
          ]}
        />
      </div>
    );
  }

  if (block.type === "links") {
    return (
      <div>
        <SectionHeading data={data} onData={onData} />
        <ListEditor
          entries={list(data)}
          onChange={(items) => onData({ ...data, items })}
          createItem={() => ({ id: uuid(), label: "", url: "" })}
          fields={[
            { key: "label", label: "이름" },
            { key: "url", label: "URL" },
          ]}
        />
      </div>
    );
  }

  if (block.type === "richText") {
    return (
      <div>
        <SectionHeading data={data} onData={onData} />
        <RichTextEditor
          value={data.content as TiptapDocument}
          onChange={(content) => onData({ ...data, content })}
        />
      </div>
    );
  }

  if (block.type === "bulletList") {
    const entries = Array.isArray(data.items) ? (data.items as string[]) : [];
    return (
      <div>
        <SectionHeading data={data} onData={onData} />
        <Field
          label="목록 — 줄바꿈으로 구분"
          value={entries.join("\n")}
          onChange={(next) => onData({ ...data, items: next.split("\n") })}
          multiline
        />
      </div>
    );
  }

  return null;
}
