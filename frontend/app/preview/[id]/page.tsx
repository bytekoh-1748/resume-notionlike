"use client";

import { useParams } from "next/navigation";
import { DraftPreviewPage } from "../../../components/draft-preview-page";

export default function DraftPreviewRoute() {
  const params = useParams<{ id: string }>();
  return <DraftPreviewPage id={params.id} />;
}
