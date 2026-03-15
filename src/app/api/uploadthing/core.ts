import { createUploadthing, type FileRouter } from "uploadthing/server";

const f = createUploadthing();

// Define a placeholder router, which can be expanded in later specs
export const ourFileRouter = {
  // Define an endpoint for uploading course materials or avatars
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      // In a real app, verify session here
      // const session = await auth();
      // if (!session) throw new Error("Unauthorized");
      return { userId: "test-user" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
