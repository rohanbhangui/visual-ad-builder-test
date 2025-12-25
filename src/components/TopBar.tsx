interface TopBarProps {
  mode: 'edit' | 'preview';
  onModeChange: (mode: 'edit' | 'preview') => void;
}

export const TopBar = ({ mode, onModeChange }: TopBarProps) => {
  return (
    <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white">
      <h1 className="text-lg font-semibold text-gray-900">Visual Builder</h1>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">Edit</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={mode === 'preview'}
            onChange={(e) => onModeChange(e.target.checked ? 'preview' : 'edit')}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
        <span className="text-sm text-gray-700">Preview</span>
      </div>
    </div>
  );
}
