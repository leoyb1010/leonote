"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN" data-theme="dark">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#080a0f",
          color: "#e5e7eb",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif",
        }}
      >
        <main
          style={{
            width: "min(420px, calc(100% - 32px))",
            padding: "32px 28px",
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.04)",
            textAlign: "center",
            boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              margin: "0 auto",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(220, 38, 38, 0.18)",
              color: "#f87171",
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            !
          </div>
          <h1 style={{ margin: "20px 0 0", fontSize: 18, fontWeight: 600 }}>
            Leonote 遇到了意外
          </h1>
          <p
            style={{
              margin: "12px auto 0",
              maxWidth: 320,
              fontSize: 14,
              lineHeight: 1.7,
              color: "rgba(229,231,235,0.7)",
            }}
          >
            页面骨架渲染失败，本地数据未受影响。请刷新页面继续。
          </p>
          {error.digest ? (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: 12,
                color: "rgba(229,231,235,0.45)",
              }}
            >
              错误编号：{error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 24,
              padding: "10px 20px",
              fontSize: 14,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.16)",
              backgroundColor: "rgba(255,255,255,0.06)",
              color: "#e5e7eb",
              cursor: "pointer",
            }}
          >
            重新加载
          </button>
        </main>
      </body>
    </html>
  );
}
