"use client";

import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/base/Button";
import { PageContainer } from "@/components/layout/PageContainer";

export default function LedgerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer width="form">
      <div className="flex min-h-[60vh] items-center justify-center">
        <section className="w-full rounded-[var(--radius-2xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-5 text-center shadow-[var(--shadow-sm)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--danger-soft)] text-[var(--danger)]">
            <AlertCircle size={22} />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">记账页面暂时没加载出来</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
            可能是旧离线缓存、路由数据或本地数据查询短暂失败。先刷新这页，仍失败再回到首页。
          </p>
          {error.digest ? (
            <p className="mt-3 text-xs text-[var(--text-muted)]">错误编号：{error.digest}</p>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button icon={<RefreshCw size={15} />} onClick={reset}>
              重新加载
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/">回到今天</Link>
            </Button>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
