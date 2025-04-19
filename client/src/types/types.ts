export type FileNode = {
    id: string,
    name: string,
    type: "file" | "folder",
    content?: string,
    children?: FileNode[],
    parentId?: string;
    handle?: any
  };