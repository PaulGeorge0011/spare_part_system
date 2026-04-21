const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(
  navigator.userAgent || '',
)
const DEFAULT_DURATION = isMobile ? 1500 : 2000

type MsgInput = string | { message: string; duration?: number }

function extract(opts: MsgInput): { content: string; duration: number } {
  if (typeof opts === 'string') return { content: opts, duration: DEFAULT_DURATION }
  return { content: opts.message, duration: opts.duration ?? DEFAULT_DURATION }
}

export const msg = Object.assign(
  (opts: MsgInput) => { const { content, duration } = extract(opts); window.$message?.info(content, { duration }) },
  {
    success: (o: MsgInput) => { const { content, duration } = extract(o); window.$message?.success(content, { duration }) },
    warning: (o: MsgInput) => { const { content, duration } = extract(o); window.$message?.warning(content, { duration }) },
    info: (o: MsgInput) => { const { content, duration } = extract(o); window.$message?.info(content, { duration }) },
    error: (o: MsgInput) => { const { content, duration } = extract(o); window.$message?.error(content, { duration }) },
    closeAll: () => window.$message?.destroyAll(),
  },
)
