import { FiInbox } from 'react-icons/fi';

export default function EmptyState({ icon: Icon = FiInbox, title = 'Nothing here yet', message }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Icon size={26} />
      </div>
      <p className="mt-3 font-semibold text-slate-600">{title}</p>
      {message && <p className="mt-1 text-sm text-slate-500 max-w-sm">{message}</p>}
    </div>
  );
}
