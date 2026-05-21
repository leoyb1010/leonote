"use client";

import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/base/Button";
import { PageContainer } from "@/components/layout/PageContainer";

export default function NoteDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer width="default">
      <div className="flex min-h-[60vh] items-center justify-center">
        <section className="w-full max-w-md rounded-[var(--radius-2xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-5 text-center shadow-[var(--shadow-sm)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--danger-soft)] text-[var(--danger)]">
            <AlertCircle size={22} />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">这篇笔记打不开</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
            可能已被删除或数据加载异常，试试刷新或返回笔记列表。
          </p>
          {error.digest ? <p className="mt-3 text-xs text-[var(--text-muted)]">错误编号：{error.digest}</p> : null}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button icon={<RefreshCw size={15} />} onClick={reset}>重新加载</Button>
            <Button variant="secondary" asChild><Link href="/notes">笔记列表</Link></Button>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
