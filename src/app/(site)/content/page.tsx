import { permanentRedirect } from "next/navigation";

// « Contenus » est devenu « The Journal » (v2).
export default function ContentPage() {
  permanentRedirect("/journal");
}
