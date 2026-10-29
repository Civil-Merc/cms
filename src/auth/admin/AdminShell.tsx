import {
  Box,
  Button,
  Collapsible,
  Drawer,
  IconButton,
  Image,
  Portal,
  Text,
} from "@chakra-ui/react"
import { useCallback, useState } from "react"
import {
  LuBriefcase,
  LuChevronRight,
  LuFileText,
  LuFolderKanban,
  LuLayoutDashboard,
  LuLogOut,
  LuMail,
  LuMenu,
  LuUsers,
  LuX,
} from "react-icons/lu"
import { AboutEditScreen } from "@/auth/admin/AboutEditScreen"
import { ContactEditScreen } from "@/auth/admin/ContactEditScreen"
import { ProjectEditScreen } from "@/auth/admin/ProjectEditScreen"
import { ProjectsTable } from "@/auth/admin/ProjectsTable"
import { ServiceEditScreen } from "@/auth/admin/ServiceEditScreen"
import { ServicesTable } from "@/auth/admin/ServicesTable"
import { initialPages, type AboutPage, type CmsPage, type ContactPage, type ProjectItem, type ServiceItem } from "@/auth/admin/cms-pages"
import { getAboutPage, getContactPage } from "@/auth/admin/pages-api"
import { createService, listServices } from "@/auth/admin/services-api"
import { createProject, listProjects } from "@/auth/admin/projects-api"
import smallLogo from "@/assets/small_logo.webp"

const navItems = [{ label: "Dashboard", icon: LuLayoutDashboard }]

const pageIcons: Record<string, typeof LuBriefcase> = {
  services: LuBriefcase,
  about: LuUsers,
  projects: LuFolderKanban,
  contact: LuMail,
}

function SidebarNav({
  active,
  pages,
  editingId,
  pagesOpen,
  onPagesOpenChange,
  onSelect,
  onEditPage,
  onSignOut,
  onClose,
}: {
  active: string
  pages: CmsPage[]
  editingId: string | null
  pagesOpen: boolean
  onPagesOpenChange: (open: boolean) => void
  onSelect: (label: string) => void
  onEditPage: (id: string) => void
  onSignOut: () => void
  onClose?: () => void
}) {
  return (
    <Box display="flex" flexDirection="column" h="full" bg="#181818" color="white" px={4} py={6}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={3} px={2} mb={8}>
        <Box display="flex" alignItems="center" gap={3}>
          <Image src={smallLogo} alt="" h="36px" w="36px" objectFit="contain" />
          <Box>
            <Text fontSize="15px" fontWeight="700" lineHeight="1.2">
              CivilMerc
            </Text>
            <Text fontSize="12px" color="#a3a3a3">
              CMS
            </Text>
          </Box>
        </Box>
        {onClose && (
          <Box
            as="button"
            aria-label="Close menu"
            onClick={onClose}
            display="flex"
            alignItems="center"
            justifyContent="center"
            h="35px"
            w="35px"
            borderRadius="10px"
            color="white"
            cursor="pointer"
          >
            <LuX size={20} />
          </Box>
        )}
      </Box>

      <Box as="nav" display="flex" flexDirection="column" gap={1}>
        {navItems.map((item) => {
          const selected = item.label === active && !editingId
          const Icon = item.icon
          return (
            <Box
              as="button"
              key={item.label}
              onClick={() => onSelect(item.label)}
              display="flex"
              alignItems="center"
              gap={3}
              w="full"
              textAlign="left"
              h="35px"
              px={3}
              borderRadius="10px"
              bg={selected ? "#2e2e2e" : "transparent"}
              color={selected ? "#f1f1f1" : "#e8e8e8"}
              fontSize="15px"
              fontWeight={selected ? "700" : "500"}
              cursor="pointer"
              _hover={{ opacity: selected ? 1 : 0.75 }}
              _active={{ opacity: 0.6 }}
            >
              <Icon size={18} />
              {item.label}
            </Box>
          )
        })}
        <Collapsible.Root
          open={pagesOpen}
          onOpenChange={(details) => onPagesOpenChange(details.open)}
        >
          <Collapsible.Trigger asChild>
            <Box
              as="button"
              display="flex"
              alignItems="center"
              gap={3}
              w="full"
              h="35px"
              px={3}
              borderRadius="10px"
              textAlign="left"
              bg={active === "Pages" ? "#2e2e2e" : "transparent"}
              color={active === "Pages" ? "#f1f1f1" : "#e8e8e8"}
              fontSize="15px"
              fontWeight={active === "Pages" ? "700" : "500"}
              cursor="pointer"
              _hover={{ opacity: active === "Pages" ? 1 : 0.75 }}
              _active={{ opacity: 0.6 }}
            >
              <LuFileText size={18} />
              Pages
              <Collapsible.Indicator
                ml="auto"
                transition="transform 0.2s"
                _open={{ transform: "rotate(90deg)" }}
              >
                <LuChevronRight size={16} />
              </Collapsible.Indicator>
            </Box>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <Box display="flex" flexDirection="column" gap={1} pl={7} pt={1}>
              {pages.map((page) => {
                const pageSelected = editingId === page.id
                return (
                  <Box
                    as="button"
                    key={page.id}
                    onClick={() => onEditPage(page.id)}
                    h="35px"
                    px={3}
                    borderRadius="10px"
                    textAlign="left"
                    fontSize="14px"
                    fontWeight={pageSelected ? "700" : "500"}
                    color={pageSelected ? "#f1f1f1" : "#e8e8e8"}
                    bg={pageSelected ? "#2e2e2e" : "transparent"}
                    cursor="pointer"
                    _hover={{ opacity: pageSelected ? 1 : 0.75 }}
                    _active={{ opacity: 0.6 }}
                  >
                    {page.title}
                  </Box>
                )
              })}
            </Box>
          </Collapsible.Content>
        </Collapsible.Root>
      </Box>

      <Box
        as="button"
        onClick={onSignOut}
        mt="auto"
        display="flex"
        alignItems="center"
        gap={3}
        w="full"
        h="35px"
        textAlign="left"
        px={3}
        borderRadius="10px"
        color="#e8e8e8"
        fontSize="15px"
        fontWeight="500"
        cursor="pointer"
        _hover={{ opacity: 0.75 }}
        _active={{ opacity: 0.6 }}
      >
        <LuLogOut size={18} />
        Log out
      </Box>
    </Box>
  )
}

export function AdminShell({ onSignOut }: { onSignOut: () => void }) {
  const [active, setActive] = useState("Dashboard")
  const [menuOpen, setMenuOpen] = useState(false)
  const [pages, setPages] = useState(initialPages)
  const [services, setServices] = useState<ServiceItem[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [servicesError, setServicesError] = useState("")
  const [aboutPage, setAboutPage] = useState<AboutPage | null>(null)
  const [aboutLoading, setAboutLoading] = useState(false)
  const [aboutError, setAboutError] = useState("")
  const [contactPage, setContactPage] = useState<ContactPage | null>(null)
  const [contactLoading, setContactLoading] = useState(false)
  const [contactError, setContactError] = useState("")
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectsError, setProjectsError] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [serviceId, setServiceId] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [pagesOpen, setPagesOpen] = useState(false)
  const editing = pages.find((page) => page.id === editingId) ?? null
  const editingService = services.find((service) => service.id === serviceId) ?? null
  const editingProject = projects.find((project) => project.id === projectId) ?? null

  const loadServices = useCallback(async () => {
    setServicesLoading(true)
    setServicesError("")
    try {
      const result = await listServices()
      setServices(result.services)
    } catch (error) {
      setServices([])
      setServicesError(error instanceof Error ? error.message : "Could not load services.")
    } finally {
      setServicesLoading(false)
    }
  }, [])

  const syncAboutDashboard = (page: AboutPage) => {
    setPages((current) =>
      current.map((entry) =>
        entry.id === "about"
          ? { ...entry, title: page.title, description: page.description, status: page.status }
          : entry,
      ),
    )
  }

  const syncContactDashboard = (page: ContactPage) => {
    setPages((current) =>
      current.map((entry) =>
        entry.id === "contact" ? { ...entry, title: page.title, status: page.status } : entry,
      ),
    )
  }

  const loadAbout = useCallback(async () => {
    setAboutLoading(true)
    setAboutError("")
    try {
      const page = await getAboutPage()
      setAboutPage(page)
      syncAboutDashboard(page)
    } catch (error) {
      setAboutPage(null)
      setAboutError(error instanceof Error ? error.message : "Could not load About Us.")
    } finally {
      setAboutLoading(false)
    }
  }, [])

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true)
    setProjectsError("")
    try {
      const result = await listProjects()
      setProjects(result.projects)
    } catch (error) {
      setProjects([])
      setProjectsError(error instanceof Error ? error.message : "Could not load projects.")
    } finally {
      setProjectsLoading(false)
    }
  }, [])

  const loadContact = useCallback(async () => {
    setContactLoading(true)
    setContactError("")
    try {
      const page = await getContactPage()
      setContactPage(page)
      syncContactDashboard(page)
    } catch (error) {
      setContactPage(null)
      setContactError(error instanceof Error ? error.message : "Could not load Contact Us.")
    } finally {
      setContactLoading(false)
    }
  }, [])

  const selectItem = (label: string) => {
    setActive(label)
    setMenuOpen(false)
    setEditingId(null)
    setServiceId(null)
    setProjectId(null)
  }

  const openPage = (id: string) => {
    setActive("Pages")
    setEditingId(id)
    setServiceId(null)
    setProjectId(null)
    setPagesOpen(true)
    setMenuOpen(false)
    if (id === "services") void loadServices()
    if (id === "about") void loadAbout()
    if (id === "contact") void loadContact()
    if (id === "projects") void loadProjects()
  }

  return (
    <Box display="flex" h="100dvh" overflow="hidden" bg="#f3f3f3" color="#181818">
      <Box as="aside" display={{ base: "none", lg: "block" }} w="240px" flexShrink={0}>
        <SidebarNav
          active={active}
          pages={pages}
          editingId={editingId}
          pagesOpen={pagesOpen}
          onPagesOpenChange={setPagesOpen}
          onSelect={selectItem}
          onEditPage={openPage}
          onSignOut={onSignOut}
        />
      </Box>

      <Drawer.Root
        placement="start"
        open={menuOpen}
        onOpenChange={(event) => setMenuOpen(event.open)}
      >
        <Portal>
          <Drawer.Backdrop display={{ lg: "none" }} />
          <Drawer.Positioner display={{ lg: "none" }}>
            <Drawer.Content bg="#181818" w="min(82vw, 260px)" maxW="260px" p={0}>
              <SidebarNav
                active={active}
                pages={pages}
                editingId={editingId}
                pagesOpen={pagesOpen}
                onPagesOpenChange={setPagesOpen}
                onSelect={selectItem}
                onEditPage={openPage}
                onSignOut={onSignOut}
                onClose={() => setMenuOpen(false)}
              />
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      <Box display="flex" flexDirection="column" flex="1" minW={0}>
        <Box
          as="header"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gap={3}
          h={{ base: "64px", sm: "68px" }}
          flexShrink={0}
          px={{ base: 4, sm: 6, lg: 8 }}
          bg="white"
          borderBottomWidth="1px"
          borderColor="#e6e6e6"
        >
          <Box display="flex" alignItems="center" gap={2} minW={0}>
            <IconButton
              aria-label="Open menu"
              display={{ base: "inline-flex", lg: "none" }}
              h="35px"
              minW="35px"
              borderRadius="10px"
              variant="ghost"
              color="#181818"
              _hover={{ opacity: 0.75 }}
              _active={{ opacity: 0.6 }}
              onClick={() => setMenuOpen(true)}
            >
              <LuMenu size={18} />
            </IconButton>
            <Text fontSize={{ base: "16px", sm: "18px" }} fontWeight="700" truncate>
              {editingService
                ? "Edit Screen"
                : editingProject
                  ? "Edit Screen"
                : editing?.id === "about"
                  ? "About Us"
                  : editing?.id === "contact"
                    ? "Contact Us"
                  : editing?.id === "projects"
                    ? "Projects"
                    : editing && editing.id !== "services"
                    ? "Edit Screen"
                    : editing
                      ? editing.id === "services"
                        ? "Services"
                        : editing.title
                      : active}
            </Text>
          </Box>
          <Box display="flex" alignItems="center" gap={{ base: 2, sm: 4 }} flexShrink={0}>
            <Text display={{ base: "none", sm: "block" }} fontSize="15px" fontWeight="600">
              Admin
            </Text>
            <Box
              as="button"
              onClick={onSignOut}
              display="flex"
              alignItems="center"
              gap={2}
              h="35px"
              px={3}
              borderRadius="10px"
              bg="#f1f1f1"
              color="#181818"
              fontSize="15px"
              fontWeight="600"
              cursor="pointer"
              _hover={{ opacity: 0.75 }}
              _active={{ opacity: 0.6 }}
            >
              <LuLogOut size={16} />
              <Text as="span" display={{ base: "none", sm: "inline" }}>
                Log out
              </Text>
            </Box>
          </Box>
        </Box>

        <Box
          as="main"
          flex="1"
          overflow="auto"
          p={{ base: 4, sm: 6, lg: 8 }}
          bg="transparent"
        >
          {editing?.id === "services" && editingService ? (
            <ServiceEditScreen
              service={editingService}
              onChange={(next) =>
                setServices((current) =>
                  current.map((service) => (service.id === next.id ? next : service)),
                )
              }
              onBack={() => {
                setServiceId(null)
                void loadServices()
              }}
            />
          ) : editing?.id === "services" ? (
            <ServicesTable
              services={services}
              loading={servicesLoading}
              error={servicesError}
              onRetry={() => void loadServices()}
              onCreate={async (input) => {
                const created = await createService(input)
                setServices((current) => [...current, created])
              }}
              onDeleted={(id) => {
                setServices((current) => current.filter((service) => service.id !== id))
                if (serviceId === id) setServiceId(null)
              }}
              onEdit={setServiceId}
              onBack={() => {
                setEditingId(null)
                setActive("Dashboard")
              }}
            />
          ) : editing?.id === "about" ? (
            aboutLoading ? (
              <Text fontSize="14px" color="#6b6b6b">
                Loading About Us…
              </Text>
            ) : aboutError ? (
              <Box maxW="640px">
                <Text fontSize="14px" color="#8f2d2d" mb={3}>
                  {aboutError}
                </Text>
                <Button
                  h="35px"
                  px={4}
                  borderRadius="10px"
                  bg="#181818"
                  color="white"
                  fontSize="14px"
                  fontWeight="600"
                  _hover={{ opacity: 0.75 }}
                  _active={{ opacity: 0.6 }}
                  onClick={() => void loadAbout()}
                >
                  Try again
                </Button>
              </Box>
            ) : aboutPage ? (
              <AboutEditScreen
                page={aboutPage}
                onChange={(next) => {
                  setAboutPage(next)
                  syncAboutDashboard(next)
                }}
                onBack={() => {
                  setEditingId(null)
                  setActive("Dashboard")
                  void loadAbout()
                }}
              />
            ) : null
          ) : editing?.id === "projects" && editingProject ? (
            <ProjectEditScreen
              project={editingProject}
              onChange={(next) =>
                setProjects((current) => current.map((project) => (project.id === next.id ? next : project)))
              }
              onBack={() => {
                setProjectId(null)
                void loadProjects()
              }}
            />
          ) : editing?.id === "projects" ? (
            <ProjectsTable
              projects={projects}
              loading={projectsLoading}
              error={projectsError}
              onRetry={() => void loadProjects()}
              onCreate={async (input) => {
                const created = await createProject(input)
                setProjects((current) => [...current, created])
              }}
              onDeleted={(id) => {
                setProjects((current) => current.filter((project) => project.id !== id))
                if (projectId === id) setProjectId(null)
              }}
              onEdit={setProjectId}
              onBack={() => {
                setEditingId(null)
                setActive("Dashboard")
                void loadProjects()
              }}
            />
          ) : editing?.id === "contact" ? (
            contactLoading ? (
              <Text fontSize="14px" color="#6b6b6b">
                Loading Contact Us…
              </Text>
            ) : contactError ? (
              <Box maxW="640px">
                <Text fontSize="14px" color="#8f2d2d" mb={3}>
                  {contactError}
                </Text>
                <Button
                  h="35px"
                  px={4}
                  borderRadius="10px"
                  bg="#181818"
                  color="white"
                  fontSize="14px"
                  fontWeight="600"
                  _hover={{ opacity: 0.75 }}
                  _active={{ opacity: 0.6 }}
                  onClick={() => void loadContact()}
                >
                  Try again
                </Button>
              </Box>
            ) : contactPage ? (
              <ContactEditScreen
                page={contactPage}
                onChange={(next) => {
                  setContactPage(next)
                  syncContactDashboard(next)
                }}
                onBack={() => {
                  setEditingId(null)
                  setActive("Dashboard")
                  void loadContact()
                }}
              />
            ) : null
          ) : editing ? (
            <Text fontSize="14px" color="#6b6b6b">
              This page is not available in the editor yet.
            </Text>
          ) : (
            <Box maxW="640px">
              <Text fontSize={{ base: "20px", sm: "22px" }} fontWeight="700" mb={2}>
                Welcome to the CivilMerc CMS
              </Text>
              <Text fontSize="15px" color="#6b6b6b" lineHeight="1.6" mb={{ base: 5, sm: 6 }}>
                Manage the public site from here. Edit Services, About Us, Projects, and Contact Us below.
              </Text>

              <Box
                bg="white"
                borderRadius="10px"
                borderWidth="1px"
                borderColor="#e6e6e6"
                overflow="hidden"
              >
                {pages.map((page, index) => {
                  const PageIcon = pageIcons[page.id] ?? LuFileText
                  return (
                  <Box
                    key={page.id}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={3}
                    px={{ base: 4, sm: 5 }}
                    py={4}
                    borderTopWidth={index === 0 ? 0 : "1px"}
                    borderColor="#eeeeee"
                  >
                    <Box display="flex" alignItems="center" gap={3} minW={0} flex="1">
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                        h="40px"
                        w="40px"
                        borderRadius="10px"
                        bg="#f1f1f1"
                        color="#181818"
                      >
                        <PageIcon size={20} />
                      </Box>
                      <Box minW={0}>
                        <Text fontSize="16px" fontWeight="600">
                          {page.title}
                        </Text>
                        <Text fontSize="14px" color="#6b6b6b" truncate>
                          {page.description}
                        </Text>
                      </Box>
                    </Box>
                    <Button
                      onClick={() => openPage(page.id)}
                      flexShrink={0}
                      h="35px"
                      px={4}
                      borderRadius="10px"
                      bg="#181818"
                      color="white"
                      fontSize="14px"
                      fontWeight="600"
                      _hover={{ opacity: 0.75 }}
                      _active={{ opacity: 0.6 }}
                    >
                      Edit
                    </Button>
                  </Box>
                  )
                })}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
