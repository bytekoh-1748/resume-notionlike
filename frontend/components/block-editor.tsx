"use client";

import { useState } from "react";
import {
  BriefcaseBusiness,
  GraduationCap,
  ImagePlus,
  Mail,
  MapPin,
  Phone,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { ResumeBlock, TiptapDocument } from "../lib/types";
import { RichTextEditor } from "./rich-text";

type Data = Record<string, unknown>;
type Item = Record<string, unknown>;
type ContactKey = "email" | "phone" | "location";

const value = (data: Data, key: string) => (typeof data[key] === "string" ? (data[key] as string) : "");
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <label className={`field ${multiline ? "field-wide" : ""}`}>
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      )}
    </label>
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
  fields: Array<{ key: string; label: string; placeholder?: string; multiline?: boolean }>;
  createItem: () => Item;
  imageKind?: "experience" | "education";
  imageErrors?: Record<string, string>;
  onImageError?: (itemId: string, message: string) => void;
}) {
  const update = (index: number, key: string, next: unknown) => {
    onChange(entries.map((entry, entryIndex) => (entryIndex === index ? { ...entry, [key]: next } : entry)));
  };
  return (
    <div className="item-editor-list">
      {entries.map((entry, index) => {
        const itemId = String(entry.id || index);
        const imageDataUrl = typeof entry.imageDataUrl === "string" ? entry.imageDataUrl : "";
        const imageLabel =
          (imageKind === "experience" ? String(entry.company || "") : String(entry.school || "")) ||
          (imageKind === "experience" ? "회사" : "학교");
        return (
          <div
            className={`item-editor ${imageKind ? "item-editor-with-image" : ""}`}
            key={itemId}
          >
            {imageKind && (
              <div className="item-image-control">
                <label className={`item-image-picker ${imageDataUrl ? "has-image" : ""}`}>
                  {imageDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageDataUrl} alt={`${imageLabel} 로고 또는 사진`} />
                  ) : (
                    <span className="item-image-placeholder">
                      {imageKind === "experience" ? (
                        <BriefcaseBusiness size={24} />
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
                {imageDataUrl && (
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
              </div>
            )}
            <div className="item-editor-content">
              <div className="item-editor-grid">
                {fields.map((field) => (
                  <Field
                    key={field.key}
                    label={field.label}
                    value={typeof entry[field.key] === "string" ? (entry[field.key] as string) : ""}
                    placeholder={field.placeholder}
                    multiline={field.multiline}
                    onChange={(next) => update(index, field.key, next)}
                  />
                ))}
              </div>
              {imageErrors?.[itemId] && (
                <p className="item-image-error" role="alert">
                  {imageErrors[itemId]}
                </p>
              )}
            </div>
            <button
              type="button"
              className="item-remove"
              onClick={() => onChange(entries.filter((_, entryIndex) => entryIndex !== index))}
              aria-label="항목 삭제"
            >
              <Trash2 size={14} />
            </button>
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
  const setImageError = (itemId: string, message: string) =>
    setImageErrors((current) => ({ ...current, [itemId]: message }));

  if (block.type === "divider") return <div className="editor-divider" aria-label="구분선" />;

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
    const profileImage = value(data, "imageDataUrl");

    return (
      <div className="profile-editor">
        <div className="profile-editor-head">
          <div className="profile-image-control">
            <label className={`profile-image-picker ${profileImage ? "has-image" : ""}`}>
              {profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileImage} alt="프로필 사진" />
              ) : (
                <span>
                  <ImagePlus size={19} />
                  사진
                </span>
              )}
              <input
                className="visually-hidden-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="프로필 사진 추가 또는 교체"
                onChange={async (event) => {
                  const input = event.currentTarget;
                  const file = input.files?.[0];
                  if (!file) return;
                  setImageError("profile", "");
                  try {
                    onData({ ...data, imageDataUrl: await optimizeImage(file) });
                  } catch (error) {
                    setImageError(
                      "profile",
                      error instanceof Error ? error.message : "이미지를 처리하지 못했습니다.",
                    );
                  } finally {
                    input.value = "";
                  }
                }}
              />
            </label>
            {profileImage && (
              <button
                type="button"
                className="profile-image-remove"
                onClick={() => {
                  onData({ ...data, imageDataUrl: "" });
                  setImageError("profile", "");
                }}
              >
                <X size={12} /> 사진 삭제
              </button>
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
            <input
              className="profile-role-input"
              value={value(data, "role")}
              onChange={(event) => onData({ ...data, role: event.target.value })}
              placeholder="한 줄 직무 소개"
              aria-label="직무"
            />
            {imageErrors.profile && (
              <p className="item-image-error" role="alert">
                {imageErrors.profile}
              </p>
            )}
          </div>
        </div>
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
          {hiddenContacts.length > 0 && (
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
              </div>
            </div>
          )}
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
          createItem={() => ({
            id: uuid(),
            name: "",
            period: "",
            role: "",
            stack: "",
            description: "",
            achievements: "",
            url: "",
            evidenceUrl: "",
          })}
          fields={[
            { key: "name", label: "프로젝트" },
            { key: "period", label: "기간" },
            { key: "role", label: "담당 역할", placeholder: "백엔드 리드" },
            { key: "stack", label: "핵심 기술", placeholder: "Java, Spring Boot, PostgreSQL" },
            { key: "url", label: "프로젝트 상세 링크" },
            { key: "evidenceUrl", label: "코드·PR·이슈 증거 링크" },
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
        <Field
          label="스킬"
          value={skills.join(", ")}
          onChange={(next) =>
            onData({
              ...data,
              items: next.split(",").map((item) => item.trim()).filter(Boolean),
            })
          }
          placeholder="React, TypeScript, Python"
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
