export default function Sidebar() {
    return (
      <div className="w-[28%] border-r border-border p-4 flex flex-col gap-4">
        
        {/* Upload */}
        <div className="border border-dashed border-border rounded-xl p-4 text-center hover:bg-panel transition">
          <p className="text-sm text-muted">Drag & drop PDF</p>
  
          <input type="file" className="mt-2 w-full text-sm" />
  
          <input
            placeholder="Paste arXiv URL"
            className="mt-2 w-full bg-panel p-2 rounded text-sm"
          />
        </div>
  
        {/* Document List */}
        <div className="flex-1 overflow-y-auto">
          <DocumentItem />
          <DocumentItem />
        </div>
      </div>
    );
  }
  
  function DocumentItem() {
    return (
      <div className="p-3 bg-panel rounded-xl mb-2 hover:scale-[1.02] transition">
        <div className="flex justify-between">
          <p className="text-sm">Attention is All You Need</p>
          <span className="text-xs text-green-400">Ready</span>
        </div>
        <p className="text-xs text-muted">12 pages</p>
      </div>
    );
  }