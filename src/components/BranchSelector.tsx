'use client';

import { useBranch } from '@/lib/hooks/use-branch';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function BranchSelector() {
  const { selectedBranch, branches, setSelectedBranch, isBranchMode, loading } = useBranch();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading || !isBranchMode || branches.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Building2 className="w-4 h-4" />
        <span>{selectedBranch ? selectedBranch.name : 'All Branches'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Select Campus/Branch
            </p>
          </div>
          <div className="p-1 max-h-64 overflow-y-auto">
            <button
              onClick={() => {
                setSelectedBranch(null);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md transition-colors ${
                !selectedBranch 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="flex-1">All Branches</span>
              {!selectedBranch && <Check className="w-4 h-4 text-blue-600" />}
            </button>
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => {
                  setSelectedBranch(branch);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md transition-colors ${
                  selectedBranch?.id === branch.id 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Building2 className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <div className="font-medium">{branch.name}</div>
                  <div className="text-xs text-gray-500">{branch.code}</div>
                </div>
                {branch.isMain && (
                  <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                    Main
                  </span>
                )}
                {selectedBranch?.id === branch.id && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
