import { IBatchBlock } from "@logseq/libs/dist/LSPlugin";
import { AttachmentMode, Mode, Visibility } from "../settings";
import { Memo, Resource } from "./type";
import { format } from "date-fns";
import { downloadAttachment } from "./download";

const BREAK_LINE = "!!!-!!!";

export const formatContentWhenPush = (content: string) => {
  return content
    .replaceAll(/^-?\S*?TODO /gm, "- [ ] ")
    .replaceAll(/^-?\S*?NOW /gm, "- [ ] ")
    .replaceAll(/^-?\S*?DOING /gm, "- [ ] ")
    .replaceAll(/^-?\S*?DONE /gm, "- [x] ")
    .replaceAll(/\nmemo-id::.*/gm, "")
    .replaceAll(/\nmemoid::.*/gm, "")
    .replaceAll(/\nmemo-visibility::.*/gm, "");
};

export const memoContentGenerate = async (
  memo: Memo,
  host: string,
  preferredTodo: string,
  withProperties: boolean = false,
  attachmentMode: AttachmentMode = AttachmentMode.Link,
  showUnavailable: boolean = false,
  graphPath: string = ""
): Promise<IBatchBlock[]> => {
  let content = memo.content;
  content = content.replaceAll(/^[-*] /gm, "* ");
  content = content.replaceAll(
    /^\* \[ \](.*)/gm,
    `${BREAK_LINE}${preferredTodo} $1 ${BREAK_LINE}`
  );
  content = content.replaceAll(
    /^\* \[x\](.*)/gm,
    `${BREAK_LINE}DONE $1 ${BREAK_LINE}`
  );
  const result = content.split(BREAK_LINE).filter((item) => !!item.trim());

  const children: IBatchBlock[] = [];

  if (attachmentMode !== AttachmentMode.Disabled && memo.resourceList.length > 0) {
    for (const resource of memo.resourceList) {
      const block = await generateAttachmentBlock(
        resource, memo, host, attachmentMode, showUnavailable, graphPath
      );
      if (block) {
        children.push(block);
      }
    }
  }

  return result
    .filter((item) => !!item.trim())
    .map((item) => {
      const data: IBatchBlock = { content: item, properties: {} };
      if (withProperties) {
        data.properties = {
          "memo-id": memo.id,
        };
      }
      data.children = children;
      return data;
    });
};

async function generateAttachmentBlock(
  resource: Resource,
  memo: Memo,
  host: string,
  attachmentMode: AttachmentMode,
  showUnavailable: boolean,
  graphPath: string
): Promise<IBatchBlock | null> {
  // Determine the available link
  let link: string | null = null;

  if (resource.externalLink) {
    link = resource.externalLink;
  } else if (memo.visibility.toLowerCase() === Visibility.Public.toLowerCase()) {
    link = `${host}/o/r/${resource.id}`;
  }

  // Download mode: try to download and use local path
  if (attachmentMode === AttachmentMode.Download && link) {
    const localPath = await downloadAttachment(link, resource.filename, graphPath);
    if (localPath) {
      return { content: `![${resource.filename}](${localPath})` };
    }
    // Download failed, fall through to link mode
  }

  // Link mode (or download fallback): use remote link
  if (link) {
    return { content: `![${resource.filename}](${link})` };
  }

  // No available link — show notice or skip
  if (showUnavailable) {
    return { content: `📎 ${resource.filename}（附件请在 Memos 中查看）` };
  }

  return null; // Silently skip
}

export const renderMemoParentBlockContent = (
  memo: Memo,
  preferredDateFormat: string,
  mode: Mode
) => {
  const createDate = new Date(memo.createdTs * 1000);
  if (mode === Mode.JournalGrouped) {
    return `${format(createDate, "HH:mm")}`;
  } else if (mode === Mode.Journal) {
    return `${format(createDate, "HH:mm")} #memos`;
  }
  return `[[${format(createDate, preferredDateFormat)}]] ${format(
    createDate,
    "HH:mm"
  )} #memos`;
};
