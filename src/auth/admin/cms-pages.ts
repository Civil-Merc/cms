import type { GalleryImage } from "@/auth/admin/ImageGallery"

export type ServiceItem = {
  id: string
  title: string
  description: string
  content: string
  updatedAt: string
  imageSrc: string
  imageName: string
  gallery: GalleryImage[]
}

export type ProjectItem = {
  id: string
  title: string
  description: string
  content: string
  updatedAt: string
  imageSrc: string
  imageName: string
  gallery: GalleryImage[]
}

export type AboutPage = {
  id: "about"
  title: string
  description: string
  content: string
  status: "draft" | "published"
  updatedAt: string
  gallery: GalleryImage[]
}

export type ContactPage = {
  id: "contact"
  title: string
  status: "draft" | "published"
  updatedAt: string
  address: string
  email: string
  phones: string[]
}

export type CmsPage = {
  id: string
  title: string
  slug: string
  description: string
  content: string
  status: "draft" | "published"
  gallery: GalleryImage[]
  services: ServiceItem[]
}

export const initialPages: CmsPage[] = [
  {
    id: "services",
    title: "Services",
    slug: "services",
    description: "The services CivilMerc offers.",
    status: "draft",
    gallery: [],
    services: [],
    content:
      "<p>CivilMerc delivers practical services for projects that need clear coordination and reliable delivery.</p><ul><li>Project planning</li><li>Site coordination</li><li>Ongoing support</li></ul>",
  },
  // Temporarily hidden from CMS nav and dashboard — restore to re-enable About Us editing.
  // {
  //   id: "about",
  //   title: "About Us",
  //   slug: "about-us",
  //   description: "Who CivilMerc is and how the team works.",
  //   status: "published",
  //   gallery: [],
  //   services: [],
  //   content:
  //     "<h2>About CivilMerc</h2><p>CivilMerc is a team focused on careful work, clear communication, and projects that hold up over time.</p>",
  // },
  {
    id: "projects",
    title: "Projects",
    slug: "projects",
    description: "Work CivilMerc has planned, built, and delivered.",
    status: "draft",
    gallery: [],
    services: [],
    content: "",
  },
  {
    id: "contact",
    title: "Contact Us",
    slug: "contact-us",
    description: "How visitors can reach CivilMerc.",
    status: "draft",
    gallery: [],
    services: [],
    content:
      "<p>Reach the CivilMerc team to talk through a project, a service, or a question.</p><ul><li>Email the office</li><li>Call during business hours</li></ul>",
  },
]
