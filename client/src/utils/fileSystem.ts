import { FileNode } from "@/types/types";

export async function getFileTree(
  dirHandle: FileSystemDirectoryHandle,
  path: string = ""
): Promise<FileNode> {
  const children: FileNode[] = [];
  const id = Math.random().toString(36).substring(2, 9);

  for await (const [, handle] of (dirHandle as any).entries()) {
    const childId = Math.random().toString(36).substring(2, 9);
    if (handle.kind === "file") {
      children.push({ 
        id: childId,
        name: handle.name, 
        type: "file",
        handle: handle
      });
    } else if (handle.kind === "directory") {
      const subTree = await getFileTree(handle, `${path}/${handle.name}`);
      children.push({
        ...subTree,
        id: childId,
        type: "folder"
      });
    }
  }

  return {
    id,
    name: dirHandle.name,
    type: "folder",
    children,
    handle: dirHandle
  };
}

