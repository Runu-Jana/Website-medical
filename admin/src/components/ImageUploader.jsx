import { useRef, useState } from 'react';
import { FiUploadCloud, FiX, FiStar, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import api, { API_URL } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';

const resolveUrl = (u) => {
  if (!u) return '';
  if (u.startsWith('http')) return u;
  return `${API_URL}${u.startsWith('/') ? '' : '/'}${u}`;
};

export default function ImageUploader({ images = [], onChange }) {
  const inputRef = useRef(null);
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).slice(0, 10);
    if (!files.length) return;

    const form = new FormData();
    files.forEach((f) => form.append('images', f));

    setUploading(true);
    setProgress(0);
    try {
      const { data } = await api.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      const urls = data.urls || (data.url ? [data.url] : []);
      if (urls.length) {
        onChange([...(images || []), ...urls]);
        toast.success(`${urls.length} image(s) uploaded`);
      } else {
        toast.error('Upload returned no URLs');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (idx) => onChange(images.filter((_, i) => i !== idx));

  const move = (idx, dir) => {
    const next = [...images];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const makeThumb = (idx) => {
    if (idx === 0) return;
    const next = [...images];
    const [item] = next.splice(idx, 1);
    next.unshift(item);
    onChange(next);
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
          dragOver ? 'border-primary bg-primary-50' : 'border-slate-300 bg-slate-50 hover:border-primary'
        }`}
      >
        <FiUploadCloud size={34} className="text-primary" />
        <p className="mt-2 font-semibold text-slate-700">Drag & drop images here, or click to browse</p>
        <p className="mt-1 text-xs text-slate-500">
          Supports very large, high-resolution images — up to <span className="font-semibold">1GB</span> per file,
          10 files at a time.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {uploading && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {images?.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {images.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
            >
              <img src={resolveUrl(url)} alt="" className="h-full w-full object-cover" />
              {idx === 0 && (
                <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Thumbnail
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-slate-900/50 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  title="Make thumbnail"
                  onClick={() => makeThumb(idx)}
                  className="rounded bg-white/90 p-1.5 text-slate-700 hover:bg-white"
                >
                  <FiStar size={14} />
                </button>
                <button
                  type="button"
                  title="Move left"
                  onClick={() => move(idx, -1)}
                  className="rounded bg-white/90 p-1.5 text-slate-700 hover:bg-white"
                >
                  <FiArrowLeft size={14} />
                </button>
                <button
                  type="button"
                  title="Move right"
                  onClick={() => move(idx, 1)}
                  className="rounded bg-white/90 p-1.5 text-slate-700 hover:bg-white"
                >
                  <FiArrowRight size={14} />
                </button>
                <button
                  type="button"
                  title="Remove"
                  onClick={() => remove(idx)}
                  className="rounded bg-danger p-1.5 text-white hover:bg-red-600"
                >
                  <FiX size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
