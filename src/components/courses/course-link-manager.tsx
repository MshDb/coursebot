"use client";

import { useState } from "react";
import { api } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Plus, Trash, Link as LinkIcon, ExternalLink, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface CourseLinkManagerProps {
  workspaceId: string;
  courseId: string;
}

export function CourseLinkManager({ workspaceId, courseId }: CourseLinkManagerProps) {
  const ctx = api.useUtils();
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const { data: course, isLoading } = api.course.getById.useQuery({ workspaceId, id: courseId });

  const addLink = api.course.addLink.useMutation({
    onSuccess: () => {
      toast.success("Link added");
      setNewUrl("");
      setNewTitle("");
      ctx.course.getById.invalidate({ workspaceId, id: courseId });
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const removeLink = api.course.removeLink.useMutation({
    onSuccess: () => {
      toast.success("Link removed");
      ctx.course.getById.invalidate({ workspaceId, id: courseId });
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const reorderMut = api.course.reorderLinks.useMutation({
    onSuccess: () => {
      ctx.course.getById.invalidate({ workspaceId, id: courseId });
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const moveLink = (index: number, direction: 'up' | 'down') => {
    const newLinks = [...links];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLinks.length) return;

    const [removed] = newLinks.splice(index, 1);
    newLinks.splice(targetIndex, 0, removed);

    reorderMut.mutate({
      workspaceId,
      courseId,
      linkIds: newLinks.map(l => l.id)
    });
  };

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  const links = course?.externalLinks || [];

  return (
    <div className="space-y-4">
      {links.length > 0 ? (
        <ul className="space-y-2">
          {links.map((link, index) => (
            <li key={link.id} className="flex flex-wrap items-center justify-between p-3 rounded-md border bg-muted/50">
              <div className="flex items-center gap-3 overflow-hidden max-w-[70%]">
                <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col truncate">
                  <span className="text-sm font-medium">{link.title || link.url}</span>
                  {link.title && <span className="text-xs text-muted-foreground truncate">{link.url}</span>}
                </div>
              </div>
              <div className="flex gap-1 items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => moveLink(index, 'up')} 
                  disabled={index === 0 || reorderMut.isPending}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => moveLink(index, 'down')} 
                  disabled={index === links.length - 1 || reorderMut.isPending}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <a href={link.url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8" })}>
                  <ExternalLink className="h-4 w-4" />
                </a>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeLink.mutate({ workspaceId, courseId, linkId: link.id })} disabled={removeLink.isPending}>
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">No external links yet.</p>
      )}

      <div className="pt-4 flex flex-wrap gap-2 items-end">
        <div className="grid gap-2 flex-grow min-w-[200px]">
          <Label htmlFor="url">URL</Label>
          <Input id="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div className="grid gap-2 flex-grow min-w-[200px]">
          <Label htmlFor="title">Title (Optional)</Label>
          <Input id="title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Lesson 1" />
        </div>
        <Button 
          disabled={!newUrl || addLink.isPending} 
          onClick={() => addLink.mutate({ workspaceId, courseId, url: newUrl, title: newTitle })}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Link
        </Button>
      </div>
    </div>
  );
}
