import { Box } from "@chakra-ui/react"
import { useEffect, useMemo, useRef } from "react"
import ReactQuill from "react-quill-new"
import "react-quill-new/dist/quill.snow.css"

type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  uploadImage?: (file: File) => Promise<string>
  onImageError?: (message: string) => void
}

const modules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "link", "image"],
    ["clean"],
  ],
}

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "list",
  "blockquote",
  "link",
  "image",
]

export function RichTextEditor({ value, onChange, uploadImage, onImageError }: RichTextEditorProps) {
  const editorModules = useMemo(() => modules, [])
  const quillRef = useRef<ReactQuill>(null)

  useEffect(() => {
    const quill = quillRef.current?.editor
    if (!quill || !uploadImage) return
    const toolbar = quill.getModule("toolbar") as { addHandler: (name: string, handler: () => void) => void }
    toolbar.addHandler("image", () => {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "image/jpeg,image/png,image/webp,image/gif"
      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) {
          onImageError?.("Each image must be 2 MB or smaller.")
          return
        }
        void uploadImage(file)
          .then((src) => {
            const index = quill.getSelection(true)?.index ?? quill.getLength()
            quill.insertEmbed(index, "image", src, "user")
            quill.setSelection(index + 1)
          })
          .catch((error: unknown) => {
            onImageError?.(error instanceof Error ? error.message : "Could not upload the image.")
          })
      }
      input.click()
    })
  }, [onImageError, uploadImage])

  return (
    <Box className="cms-editor" borderRadius="10px" overflow="hidden">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={editorModules}
        formats={formats}
      />
    </Box>
  )
}
