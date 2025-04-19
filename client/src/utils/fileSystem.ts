import { FileNode } from "@/types/types";

export async function getFileTree(
  dirHandle: FileSystemDirectoryHandle,
  path: string = ""
): Promise<FileNode> {
  const children: FileNode[] = [];

  // Use entries() to get both name and handle
  for await (const [name, handle] of (dirHandle as any).entries()) {
    if (handle.kind === "file") {
      children.push({ name: handle.name, kind: "file" });
    } else if (handle.kind === "directory") {
      const subTree = await getFileTree(handle, `${path}/${handle.name}`);
      children.push(subTree);
    }
  }

  return {
    name: dirHandle.name,
    kind: "directory",
    children,
  };
}

