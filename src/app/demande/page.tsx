import { redirect } from "next/navigation";

// /demande sans engineId → renvoie vers le catalogue de véhicules
export default function DemandePage() {
  redirect("/marques");
}
