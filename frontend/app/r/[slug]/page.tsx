"use client";

import { useParams } from "next/navigation";
import { PublicResumePage } from "../../../components/public-resume-page";

export default function PublishedResumePage() {
  const params = useParams<{ slug: string }>();
  return <PublicResumePage slug={params.slug} />;
}

