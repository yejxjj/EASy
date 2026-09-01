"use client";

import { Check, FolderPlus, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  apiCreateFolder,
  apiDeleteFolder,
  apiFetchFolders,
  apiFetchHistory,
  apiMoveHistoryToFolder,
  apiRenameFolder,
  isSessionExpired,
} from "@/lib/api/auth";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import type { AuthUser, Folder, HistoryItem } from "@/types/auth";

/**
 * 왼쪽 기둥 — 새 분석 · 폴더 · 기록.
 *
 * 목록은 `/api/history` 하나에서만 온다. 대시보드가 쓰던 것과 같은
 * 엔드포인트다 — 목록을 두 벌 만들면 한쪽이 반드시 뒤처진다.
 *
 * 폴더를 고르면 기록 목록이 그 폴더로 걸러진다. 서버를 다시 부르지 않고
 * 이미 받아 둔 목록을 클라이언트에서 거른다 — 폴더 전환마다 왕복하면
 * 목록이 50개로 잘려 있는 지금 구조에서 얻는 것 없이 느려지기만 한다.
 *
 * 생성 · 이름변경 · 삭제 · 이동 모두 서버 응답을 받은 뒤에 화면을 바꾼다.
 * watchlist 삭제(대시보드)에서 이미 쓰는 원칙과 같다 — 응답을 기다리지
 * 않으면 실패해도 성공한 것처럼 보인다.
 */

const RISK_COLOR = (level: string) => {
  const v = (level || "").trim();
  if (v.includes("매우 낮") || v === "낮음") return "var(--color-verified)";
  if (v.includes("보통")) return "var(--color-partial)";
  if (v.includes("높")) return "var(--color-missing)";
  return "var(--color-fg-faint)";
};

const LABEL =
  "font-mono text-xs tracking-[var(--tracking-label)] text-fg-faint";

export function AppSidebar({
  user,
  onNavigate,
}: {
  user: AuthUser;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [folders, setFolders] = useState<Folder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState<number | null>(null);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const [moveOpenFor, setMoveOpenFor] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    apiFetchHistory(user.token)
      .then((h) => alive && setItems(h))
      .catch((e) => {
        if (!alive) return;
        if (isSessionExpired(e)) {
          router.replace("/login");
          return;
        }
        setFailed(true);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [user.token, router]);

  useEffect(() => {
    let alive = true;
    apiFetchFolders(user.token)
      .then((f) => alive && setFolders(f))
      .catch((e) => {
        if (!alive) return;
        if (isSessionExpired(e)) router.replace("/login");
      })
      .finally(() => alive && setFoldersLoading(false));
    return () => {
      alive = false;
    };
  }, [user.token, router]);

  useEffect(() => {
    if (creating) newFolderInputRef.current?.focus();
  }, [creating]);

  useEffect(() => {
    if (editingId !== null) editInputRef.current?.focus();
  }, [editingId]);

  function startCreating() {
    setCreating(true);
    setNewName("");
  }

  function cancelCreating() {
    setCreating(false);
    setNewName("");
  }

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    try {
      const folder = await apiCreateFolder(user.token, name);
      setFolders((prev) => [...prev, folder]);
      cancelCreating();
    } catch (e) {
      if (isSessionExpired(e)) router.replace("/login");
      // 실패하면 입력은 그대로 둔다 — 다시 시도할 수 있게.
    }
  }

  function startEditing(f: Folder) {
    setEditingId(f.id);
    setEditName(f.name);
  }

  async function handleRenameSubmit(e: React.FormEvent, id: number) {
    e.preventDefault();
    const name = editName.trim();
    if (!name) return;
    try {
      await apiRenameFolder(user.token, id, name);
      setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
      setEditingId(null);
    } catch (e) {
      if (isSessionExpired(e)) router.replace("/login");
    }
  }

  async function handleDeleteFolder(id: number) {
    try {
      await apiDeleteFolder(user.token, id);
      setFolders((prev) => prev.filter((f) => f.id !== id));
      // 서버가 FK ON DELETE SET NULL 로 이미 미분류로 되돌렸다 — 화면도 맞춘다.
      setItems((prev) =>
        prev.map((it) => (it.folder_id === id ? { ...it, folder_id: null } : it)),
      );
      setActiveFolder((cur) => (cur === id ? null : cur));
    } catch (e) {
      if (isSessionExpired(e)) router.replace("/login");
    }
  }

  async function handleMove(historyId: number, folderId: number | null) {
    setMoveOpenFor(null);
    const target = items.find((it) => it.id === historyId);
    if (!target || target.folder_id === folderId) return;
    const prevFolderId = target.folder_id;
    try {
      await apiMoveHistoryToFolder(user.token, historyId, folderId);
      setItems((prev) =>
        prev.map((it) => (it.id === historyId ? { ...it, folder_id: folderId } : it)),
      );
      setFolders((prev) =>
        prev.map((f) => {
          if (f.id === prevFolderId) return { ...f, count: Math.max(0, f.count - 1) };
          if (f.id === folderId) return { ...f, count: f.count + 1 };
          return f;
        }),
      );
    } catch (e) {
      if (isSessionExpired(e)) router.replace("/login");
    }
  }

  const visibleItems =
    activeFolder === null ? items : items.filter((it) => it.folder_id === activeFolder);

  return (
    <div className="bg-surface border-border flex h-full flex-col border-r">
      {/* 머리 */}
      <div className="flex h-12 shrink-0 items-center px-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="fides-wordmark text-fg text-[15px] uppercase"
        >
          Fides
        </Link>
      </div>

      {/* 새 분석 */}
      <div className="px-3 pb-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="border-border text-fg hover:bg-bg flex items-center gap-2 rounded-[var(--radius-input)] border px-3 py-2 text-sm tracking-[var(--tracking-tight)] transition-colors"
        >
          <Plus size={15} aria-hidden />
          새 분석
        </Link>
      </div>

      {/* 폴더 */}
      <div className="px-4 pt-2 pb-1">
        <div className="flex items-center justify-between">
          <p className={LABEL}>폴더</p>
          <button
            type="button"
            onClick={creating ? cancelCreating : startCreating}
            aria-label={creating ? "새 폴더 취소" : "새 폴더"}
            className="text-fg-faint hover:text-fg transition-colors"
          >
            {creating ? <X size={13} aria-hidden /> : <FolderPlus size={13} aria-hidden />}
          </button>
        </div>

        {creating ? (
          <form onSubmit={handleCreateFolder} className="mt-2 flex items-center gap-1">
            <input
              ref={newFolderInputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") cancelCreating();
              }}
              placeholder="폴더 이름"
              maxLength={100}
              className="border-border bg-bg text-fg placeholder:text-fg-faint min-w-0 flex-1 rounded-[var(--radius-input)] border px-2 py-1 text-xs outline-none"
            />
            <button type="submit" aria-label="만들기" className="text-fg-dim hover:text-fg shrink-0">
              <Check size={13} aria-hidden />
            </button>
          </form>
        ) : null}

        {foldersLoading ? (
          <p className="text-fg-faint mt-2 text-xs">불러오는 중…</p>
        ) : folders.length === 0 ? (
          creating ? null : (
            <p className="text-fg-faint mt-2 text-xs">아직 폴더가 없습니다.</p>
          )
        ) : (
          <ul className="mt-1 space-y-0.5">
            {folders.map((f) => (
              <li key={f.id}>
                {editingId === f.id ? (
                  <form
                    onSubmit={(e) => handleRenameSubmit(e, f.id)}
                    className="flex items-center gap-1 py-0.5"
                  >
                    <input
                      ref={editInputRef}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      maxLength={100}
                      className="border-border bg-bg text-fg min-w-0 flex-1 rounded-[var(--radius-input)] border px-2 py-1 text-xs outline-none"
                    />
                    <button type="submit" aria-label="저장" className="text-fg-dim hover:text-fg shrink-0">
                      <Check size={13} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      aria-label="취소"
                      className="text-fg-dim hover:text-fg shrink-0"
                    >
                      <X size={13} aria-hidden />
                    </button>
                  </form>
                ) : (
                  <div
                    className={cn(
                      "group flex items-center gap-1 rounded-[var(--radius-input)] transition-colors",
                      activeFolder === f.id ? "bg-bg" : "hover:bg-bg/60",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setActiveFolder((cur) => (cur === f.id ? null : f.id))
                      }
                      aria-pressed={activeFolder === f.id}
                      className="text-fg flex min-w-0 flex-1 items-baseline gap-1.5 truncate px-2 py-1.5 text-left text-[13px] tracking-[var(--tracking-tight)]"
                    >
                      <span className="min-w-0 truncate">{f.name}</span>
                      <span className="text-fg-faint shrink-0 text-[11px]">{f.count}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditing(f)}
                      aria-label={`${f.name} 이름 변경`}
                      className="text-fg-faint hover:text-fg mr-0.5 hidden shrink-0 group-hover:block"
                    >
                      <Pencil size={12} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFolder(f.id)}
                      aria-label={`${f.name} 삭제`}
                      className="text-fg-faint mr-1.5 hidden shrink-0 transition-colors group-hover:block hover:text-[color:var(--color-missing)]"
                    >
                      <Trash2 size={12} aria-hidden />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 기록 */}
      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between px-4 pb-2">
          <p className={LABEL}>기록</p>
          {activeFolder !== null ? (
            <button
              type="button"
              onClick={() => setActiveFolder(null)}
              className="text-fg-faint hover:text-fg text-[11px] transition-colors"
            >
              전체 보기
            </button>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {loading ? (
            <ul className="space-y-1 px-2" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <li
                  key={i}
                  className="bg-border/60 h-8 animate-pulse rounded-[var(--radius-input)]"
                />
              ))}
            </ul>
          ) : failed ? (
            <p className="text-fg-dim px-2 text-xs leading-relaxed">
              기록을 불러오지 못했습니다.
            </p>
          ) : visibleItems.length === 0 ? (
            <p className="text-fg-dim px-2 text-xs leading-relaxed">
              {items.length === 0
                ? "아직 분석한 제품이 없습니다. 위에서 시작하세요."
                : "이 폴더에는 아직 기록이 없습니다."}
            </p>
          ) : (
            <ul>
              {visibleItems.map((it) => {
                const active = pathname === `/history/${it.id}`;
                const moveOpen = moveOpenFor === it.id;
                return (
                  <li key={it.id}>
                    <div
                      className={cn(
                        "group flex items-center rounded-[var(--radius-input)] transition-colors",
                        active ? "bg-bg" : "hover:bg-bg/60",
                      )}
                    >
                      <Link
                        href={`/history/${it.id}`}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2"
                      >
                        <span
                          className="size-[5px] shrink-0 rounded-full"
                          style={{ background: RISK_COLOR(it.risk_level) }}
                          aria-hidden
                        />
                        <span className="text-fg min-w-0 flex-1 truncate text-[13px] tracking-[var(--tracking-tight)]">
                          {it.product_name || "이름 없음"}
                        </span>
                      </Link>
                      {folders.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setMoveOpenFor(moveOpen ? null : it.id)}
                          aria-label="폴더로 이동"
                          aria-expanded={moveOpen}
                          className={cn(
                            "text-fg-faint hover:text-fg mr-1 shrink-0 rounded p-1 transition-colors",
                            moveOpen ? "block" : "hidden group-hover:block",
                          )}
                        >
                          <MoreHorizontal size={13} aria-hidden />
                        </button>
                      ) : null}
                    </div>

                    {moveOpen ? (
                      <div className="border-border bg-bg mx-2 mb-1 flex flex-col gap-0.5 rounded-[var(--radius-input)] border p-1">
                        <button
                          type="button"
                          onClick={() => handleMove(it.id, null)}
                          className={cn(
                            "hover:bg-surface rounded-[var(--radius-input)] px-2 py-1 text-left text-xs transition-colors",
                            it.folder_id === null ? "text-fg" : "text-fg-dim",
                          )}
                        >
                          미분류
                        </button>
                        {folders.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => handleMove(it.id, f.id)}
                            className={cn(
                              "hover:bg-surface truncate rounded-[var(--radius-input)] px-2 py-1 text-left text-xs transition-colors",
                              it.folder_id === f.id ? "text-fg" : "text-fg-dim",
                            )}
                          >
                            {f.name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* 발 */}
      <div className="border-border shrink-0 border-t px-4 py-3">
        <p className="text-fg truncate text-xs">{user.nickname}</p>
        <div className="mt-1.5 flex items-center gap-3">
          <Link
            href="/about"
            onClick={onNavigate}
            className="text-fg-dim hover:text-fg text-xs transition-colors"
          >
            서비스 소개
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="text-fg-dim hover:text-fg text-xs transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
