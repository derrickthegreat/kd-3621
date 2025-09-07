import { NavSectionProps } from "@/components/admin-panel/nav-section";
import { Users, Calendar, Swords, Users2 } from "lucide-react";

export const PUBLIC_PAGES: NavSectionProps = {
  sectionTitle: "Public Pages",
  items: [
    {
      title: "Governos",
      url: "/players",
      icon: Users2,
    },
    {
      title: "Alliances",
      url: "/alliances",
      icon: Users,
    },
    {
      title: "Calendar",
      url: "/calendar",
      icon: Calendar,
    },
    {
      title: "Equipments",
      url: "/equipments",
      icon: Swords,
    },
    {
      title: "Builds",
      url: "/builds",
      icon: Swords,
    },
  ],
};
