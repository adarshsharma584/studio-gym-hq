import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Link, useParams } from "react-router";
import { ArrowLeft, ArrowRight, CalendarDays, Newspaper, Sparkles } from "lucide-react";
import logo from "@/assets/logo.svg";
import { formatDate } from "@/components/admin/ui";
import type { Doc } from "@/convex/_generated/dataModel";

type PostRow = Doc<"posts">;

function BlogNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="Pulse Athletics" width={32} height={32} className="rounded-lg" />
          <span className="text-[15px] font-semibold tracking-tight">
            Pulse <span className="text-emerald-400">Athletics</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-zinc-400 md:flex">
          <Link to="/#programs" className="transition-colors hover:text-zinc-100">Programs</Link>
          <Link to="/#reels" className="transition-colors hover:text-zinc-100">Reels</Link>
          <Link to="/#membership" className="transition-colors hover:text-zinc-100">Membership</Link>
          <Link to="/blogs" className="text-emerald-300 transition-colors hover:text-emerald-200">Blog</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/auth?returnTo=/dashboard"
            className="hidden rounded-lg border border-white/10 px-3.5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-white/25 hover:text-white sm:block"
          >
            Member sign in
          </Link>
          <Link
            to="/auth?returnTo=/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 px-3.5 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}

function BlogCard({ post }: { post: PostRow }) {
  return (
    <Link
      to={`/blogs/${post._id}`}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 transition-colors hover:border-emerald-400/30"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-950">
        {post.image ? (
          <img src={post.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl opacity-40">🏋️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent" />
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <CalendarDays className="size-3.5" />
          {post.publishedAt ? formatDate(post.publishedAt) : "Just published"}
          <span className="rounded-full border border-white/10 px-2 py-0.5 uppercase tracking-wide">Article</span>
        </div>
        <h3 className="mt-2.5 text-base font-semibold leading-6 text-zinc-100 transition-colors group-hover:text-emerald-300">
          {post.title}
        </h3>
        {post.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">{post.excerpt}</p>}
        <p className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-emerald-300">
          Read article <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </p>
      </div>
    </Link>
  );
}

function BlogDetail({ posts, post }: { posts: PostRow[]; post: PostRow }) {
  const more = posts.filter((p) => p._id !== post._id).slice(0, 3);
  const paragraphs = (post.body ?? "").split(/\n+/).filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Link to="/blogs" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-emerald-300">
        <ArrowLeft className="size-4" /> All articles
      </Link>

      <div className="mt-8">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <CalendarDays className="size-4" />
          {post.publishedAt ? formatDate(post.publishedAt) : "Just published"}
          <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
            Pulse Athletics Journal
          </span>
        </div>
        <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{post.title}</h1>
        {post.excerpt && <p className="mt-4 text-lg leading-8 text-zinc-400">{post.excerpt}</p>}
      </div>

      {post.image && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
          <img src={post.image} alt="" className="aspect-[16/9] w-full object-cover" />
        </div>
      )}

      <div className="mt-8 space-y-5">
        {paragraphs.length > 0 ? (
          paragraphs.map((p, i) => (
            <p key={i} className="text-[15px] leading-7 text-zinc-300">
              {p}
            </p>
          ))
        ) : (
          <p className="text-[15px] leading-7 text-zinc-400">
            This article is still being written — check back soon for the full story. Meanwhile, ask the front desk or any
            trainer and they'll walk you through it in person.
          </p>
        )}
      </div>

      {more.length > 0 && (
        <div className="mt-14 border-t border-white/5 pt-10">
          <h2 className="text-lg font-semibold tracking-tight">Keep reading</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {more.map((p) => (
              <Link
                key={p._id}
                to={`/blogs/${p._id}`}
                className="group overflow-hidden rounded-xl border border-white/10 bg-zinc-950 transition-colors hover:border-emerald-400/30"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-950">
                  {p.image ? (
                    <img src={p.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl opacity-40">💪</div>
                  )}
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 text-sm font-medium leading-5 text-zinc-200 transition-colors group-hover:text-emerald-300">{p.title}</p>
                  <p className="mt-1.5 text-[11px] text-zinc-500">{p.publishedAt ? formatDate(p.publishedAt) : ""}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Blogs() {
  const data = useQuery(api.content.getPublic);
  const { id } = useParams();
  const posts = (data?.posts ?? []).filter((p) => p.type === "blog");
  const post = id ? posts.find((p) => p._id === id) : undefined;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <BlogNav />

      {post ? (
        <BlogDetail posts={posts} post={post} />
      ) : (
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-medium text-emerald-300">
              <Newspaper className="size-3.5" /> The Pulse Athletics Journal
            </p>
            <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Training intel, <span className="bg-gradient-to-r from-emerald-300 to-lime-300 bg-clip-text text-transparent">coach advice</span> & gym news
            </h1>
            <p className="mt-4 text-base leading-7 text-zinc-400">
              Articles written by our coaches and the front desk — programming tips, nutrition notes, member stories and
              everything happening at the club.
            </p>
          </div>

          <div className="mt-12">
            {!data ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
                    <div className="aspect-[16/9] bg-zinc-900" />
                    <div className="space-y-3 p-5">
                      <div className="h-3 w-24 rounded bg-zinc-900" />
                      <div className="h-4 w-4/5 rounded bg-zinc-900" />
                      <div className="h-3 w-full rounded bg-zinc-900" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 py-20 text-center">
                <Sparkles className="mx-auto size-8 text-emerald-400/50" />
                <p className="mt-4 text-sm text-zinc-400">No articles published yet — the coaches are busy writing.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((p) => (
                  <BlogCard key={p._id} post={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="mt-10 border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Pulse Athletics" width={24} height={24} className="rounded-md" />
            <span className="text-sm text-zinc-400">
              Pulse <span className="text-zinc-200">Athletics</span> · 42 Stadium Road, Indiranagar, Bengaluru
            </span>
          </div>
          <Link to="/" className="text-xs text-zinc-500 transition-colors hover:text-zinc-300">
            Back to homepage
          </Link>
        </div>
      </footer>
    </div>
  );
}