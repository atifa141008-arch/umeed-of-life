const TEXT: Record<string, { title: string; body: string[] }> = {
  returns: { title: 'Returns', body: ['Return and refund rules will be published here by Umeed management before launch.', 'Please check this page and the product page before ordering.'] },
  terms: { title: 'Terms of use', body: ['Terms of use will be published here by Umeed management before launch.'] },
  privacy: { title: 'Privacy', body: ['We collect only the information needed to run your account, deliver orders and meet legal requirements.', 'The full privacy notice will be published here before launch.'] },
}
export default function Policy({ kind }: { kind: 'returns' | 'terms' | 'privacy' }) {
  const t = TEXT[kind]
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-bold">{t.title}</h1>
      {t.body.map((b) => <p key={b} className="mt-4 text-gray-700">{b}</p>)}
      <p className="mt-6 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Draft placeholder: replace with your reviewed legal text.</p>
    </div>
  )
}
