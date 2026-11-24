import { permanentRedirect } from "next/navigation";

// Les articles « Stories of materials » ont été retirés (v2) : les anciens liens mènent au Journal.
export default function ArticlePage() {
  permanentRedirect("/journal");
}
