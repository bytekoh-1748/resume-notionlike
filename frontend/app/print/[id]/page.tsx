"use client";

import { useParams } from "next/navigation";
import { PrintResumePage } from "../../../components/print-resume-page";

export default function ResumePrintRoute() {
  const params = useParams<{ id: string }>();
  return <PrintResumePage id={params.id} />;
}

