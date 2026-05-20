export interface PortalRow {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  destination_url: string;
  status: "active" | "inactive" | "suspended";
  scan_mode: "image" | "hybrid";
  visibility: "public" | "private";
  total_scans: number;
  last_scanned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortalImageRow {
  id: string;
  portal_id: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  sha256: string;
  created_at: string;
}
