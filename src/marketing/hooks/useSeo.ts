import { useEffect } from "react";
import { setSeo } from "../lib/seo";

export function useSeo(
  title: string,
  description: string,
  path = "",
  image?: string,
  type?: "website" | "article",
  jsonLd?: unknown,
) {
  useEffect(() => {
    setSeo({ title, description, path, image, type, jsonLd });
  }, [description, image, jsonLd, path, title, type]);
}
