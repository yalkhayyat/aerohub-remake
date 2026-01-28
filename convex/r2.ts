import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";
import { authComponent } from "./auth";

// Instantiate the R2 component client
export const r2 = new R2(components.r2);

// Export the client API for use with useUploadFile hook
export const { generateUploadUrl, syncMetadata } = r2.clientApi({
  checkUpload: async (ctx) => {
    // Verify user is authenticated before allowing upload
    // Cast ctx as any since R2's context is compatible with auth at runtime
    const user = await authComponent.getAuthUser(ctx as any);
    if (!user) {
      throw new Error("You must be logged in to upload files");
    }
  },
  onUpload: async (_ctx, _bucket, key) => {
    // Optional: Log or process upload completion
    console.log(`File uploaded with key: ${key}`);
  },
});

import { action } from "./_generated/server";
import { v } from "convex/values";

export const getUrl = action({
  args: { storageId: v.string() },
  handler: async (_ctx, { storageId }) => {
    return await r2.getUrl(storageId);
  },
});
