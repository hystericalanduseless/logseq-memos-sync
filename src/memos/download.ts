import axios from "axios";

/**
 * Download an attachment from an external link and save it to
 * the Logseq graph's assets/memos/ directory.
 * Returns the relative path for use in markdown, or null if download failed.
 */
export async function downloadAttachment(
    externalLink: string,
    filename: string,
    graphPath: string
): Promise<string | null> {
    try {
        const fs = (window as any).require?.("fs");
        const path = (window as any).require?.("path");

        if (!fs || !path) {
            console.warn("memos-sync: Node fs/path not available in this environment");
            return null;
        }

        const assetsDir = path.join(graphPath, "assets", "memos");
        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir, { recursive: true });
        }

        // Sanitize filename to remove problematic characters
        const safeFilename = filename.replace(/[<>:"/\\|?*]/g, "_");
        const filePath = path.join(assetsDir, safeFilename);

        // Skip if file already exists
        if (fs.existsSync(filePath)) {
            console.log(`memos-sync: attachment already exists: ${safeFilename}`);
            return `../assets/memos/${safeFilename}`;
        }

        console.log(`memos-sync: downloading attachment: ${safeFilename}`);
        const response = await axios.get(externalLink, {
            responseType: "arraybuffer",
            timeout: 30000,
        });

        fs.writeFileSync(filePath, Buffer.from(response.data));
        console.log(`memos-sync: saved attachment: ${safeFilename} (${response.data.byteLength} bytes)`);
        return `../assets/memos/${safeFilename}`;
    } catch (error) {
        console.error(`memos-sync: failed to download attachment ${filename}:`, error);
        return null;
    }
}
