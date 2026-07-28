import type { TiptapDocument } from "../lib/types";

type JsonNode = {
  type?: string;
  text?: string;
  marks?: Array<{ type?: string }>;
  attrs?: Record<string, unknown>;
  content?: JsonNode[];
};

function renderNode(node: JsonNode, key: string): React.ReactNode {
  if (node.type === "text") {
    let child: React.ReactNode = node.text || "";
    for (const mark of node.marks || []) {
      if (mark.type === "bold") child = <strong key={`${key}-bold`}>{child}</strong>;
      if (mark.type === "italic") child = <em key={`${key}-italic`}>{child}</em>;
      if (mark.type === "strike") child = <s key={`${key}-strike`}>{child}</s>;
    }
    return child;
  }

  const children = (node.content || []).map((child, index) =>
    renderNode(child, `${key}-${index}`),
  );
  switch (node.type) {
    case "paragraph":
      return <p key={key}>{children.length ? children : <br />}</p>;
    case "heading": {
      const level = Number(node.attrs?.level || 2);
      if (level === 1) return <h1 key={key}>{children}</h1>;
      if (level === 3) return <h3 key={key}>{children}</h3>;
      return <h2 key={key}>{children}</h2>;
    }
    case "bulletList":
      return <ul key={key}>{children}</ul>;
    case "orderedList":
      return <ol key={key}>{children}</ol>;
    case "listItem":
      return <li key={key}>{children}</li>;
    case "blockquote":
      return <blockquote key={key}>{children}</blockquote>;
    case "hardBreak":
      return <br key={key} />;
    default:
      return <span key={key}>{children}</span>;
  }
}

export function RichTextView({ value }: { value?: TiptapDocument }) {
  if (!value?.content?.length) return null;
  return (
    <div className="rich-text-view">
      {value.content.map((node, index) => renderNode(node as JsonNode, String(index)))}
    </div>
  );
}
