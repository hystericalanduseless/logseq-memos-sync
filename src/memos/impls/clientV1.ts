import axios, { AxiosResponse, Method } from "axios";
import { Memo } from "../type";
import { MemosClient } from "../client";

export default class MemosClientV1 implements MemosClient {
  private openId: string | undefined;
  private host: string;
  private token: string;
  private idMap: Map<number, string> = new Map(); // Map numeric IDs to V1 names
  private nextPageToken: string | null = null; // Store next page token

  constructor(host: string, token: string, openId?: string) {
    this.host = host.replace(/\/+$/, ''); // Strip trailing slashes
    this.token = token;
    this.openId = openId;
  }

  // Generate a stable numeric ID from alphanumeric string
  private generateNumericId(name: string): number {
    const id = name.split('/').pop() || '';
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const numericId = Math.abs(hash);
    this.idMap.set(numericId, name);
    return numericId;
  }

  private async request<T>(
    url: URL,
    method: Method,
    payload: any = null
  ): Promise<T> {
    try {
      if (this.openId) {
        url.searchParams.append("openId", String(this.openId));
      }

      const config: any = {
        method: method,
        url: url.toString(),
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        decompress: true,
        responseType: 'json' as const
      };

      // Only include data for non-GET requests
      if (payload !== null && method !== "GET") {
        config.data = payload;
      }

      const resp: AxiosResponse<T> = await axios(config);

      if (resp.status >= 400) {
        // @ts-ignore
        const errorMsg = resp.message || "Error occurred";
        console.error("memos-sync: API error:", errorMsg);
        throw errorMsg;
      } else if (resp.status >= 300) {
        throw "Unexpected redirect from memos server";
      }

      return resp.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const msg = error.response?.data?.message || error.message;
        console.error(`memos-sync: API request failed (${status}):`, msg);
        if (status === 401 || status === 403) {
          throw "Authentication failed - please check your Memos token";
        }
      } else {
        console.error("memos-sync: API request failed:", error);
      }
      throw "Cannot connect to memos server";
    }
  }


  public async getMemos(
    limit: number,
    offset: number,
    includeArchive: boolean,
  ): Promise<Memo[]> {
    const url = new URL(`${this.host}/api/v1/memos`);
    url.searchParams.append("pageSize", limit.toString());

    if (offset > 0) {
      if (!this.nextPageToken) {
        return [];
      }
      url.searchParams.append("pageToken", this.nextPageToken);
    }

    try {
      const response = await this.request<any>(url, "GET", null);

      let memos = response.memos || [];
      if (!Array.isArray(memos)) {
        console.warn("memos-sync: unexpected response format, memos is not an array");
        memos = [];
      }

      // Store next page token for subsequent calls
      this.nextPageToken = response.nextPageToken || null;

      // Filter out archived memos if needed
      if (!includeArchive) {
        memos = memos.filter((memo: any) => memo.state === 'NORMAL');
      }

      // Transform V1 format to expected format
      const transformedMemos = memos.map((memo: any) => ({
        id: this.generateNumericId(memo.name),
        content: memo.content,
        createdTs: Math.floor(new Date(memo.createTime).getTime() / 1000),
        updatedTs: Math.floor(new Date(memo.updateTime).getTime() / 1000),
        displayTs: Math.floor(new Date(memo.displayTime).getTime() / 1000),
        rowStatus: memo.state,
        visibility: memo.visibility,
        pinned: memo.pinned || false,
        creatorId: parseInt(memo.creator.split('/').pop() || '0'),
        creatorName: memo.creator,
        creatorUsername: memo.creator,
        resourceList: memo.resources || [],
        relationList: memo.relations || [],
        _v1Name: memo.name
      }));

      console.log(`memos-sync: fetched ${transformedMemos.length} memos`);
      return transformedMemos;
    } catch (error) {
      console.error("memos-sync: getMemos error:", error);
      throw new Error(`Failed to get memos, ${error}`);
    }
  }

  public async updateMemo(
    memoId: number,
    payload: Record<string, any>
  ): Promise<Memo> {
    const v1Name = this.idMap.get(memoId);
    if (!v1Name) {
      throw new Error(`Memo ID ${memoId} not found in mapping`);
    }
    const v1Id = v1Name.split('/').pop();
    const url = new URL(`${this.host}/api/v1/memos/${v1Id}`);
    const updatePayload: any = {};

    if (payload.content) updatePayload.content = payload.content;
    if (payload.visibility) updatePayload.visibility = payload.visibility.toUpperCase();
    if (payload.rowStatus === "ARCHIVED") updatePayload.row_status = "ARCHIVED";

    try {
      const response = await this.request<any>(url, "PATCH", updatePayload);
      return {
        id: this.generateNumericId(response.name),
        content: response.content,
        createdTs: Math.floor(new Date(response.createTime).getTime() / 1000),
        updatedTs: Math.floor(new Date(response.updateTime).getTime() / 1000),
        displayTs: Math.floor(new Date(response.displayTime).getTime() / 1000),
        rowStatus: response.state,
        visibility: response.visibility,
        pinned: response.pinned || false,
        creatorId: parseInt(response.creator.split('/').pop() || '0'),
        creatorName: response.creator,
        creatorUsername: response.creator,
        resourceList: response.resources || [],
        relationList: response.relations || []
      };
    } catch (error) {
      throw new Error(`Failed to update memo, ${error}.`);
    }
  }

  public async createMemo(content: string, visibility: string): Promise<Memo> {
    const payload = {
      content: content,
      visibility: visibility.toUpperCase(),
    };
    const url = new URL(`${this.host}/api/v1/memos`);
    try {
      const response = await this.request<any>(url, "POST", payload);
      return {
        id: this.generateNumericId(response.name),
        content: response.content,
        createdTs: Math.floor(new Date(response.createTime).getTime() / 1000),
        updatedTs: Math.floor(new Date(response.updateTime).getTime() / 1000),
        displayTs: Math.floor(new Date(response.displayTime).getTime() / 1000),
        rowStatus: response.state,
        visibility: response.visibility,
        pinned: response.pinned || false,
        creatorId: parseInt(response.creator.split('/').pop() || '0'),
        creatorName: response.creator,
        creatorUsername: response.creator,
        resourceList: response.resources || [],
        relationList: response.relations || []
      };
    } catch (error) {
      throw new Error(`Failed to create memo, ${error}.`);
    }
  }
}
