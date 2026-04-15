'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authFetch } from '@/lib/auth-fetch';

interface Branch {
  id: string;
  name: string;
  code: string;
  isMain: boolean;
  isActive: boolean;
}

interface BranchContextType {
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;
  branches: Branch[];
  loading: boolean;
  isBranchMode: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBranchMode, setIsBranchMode] = useState(false);

  useEffect(() => {
    async function fetchBranches() {
      try {
        const res = await authFetch('/api/sms/branches');
        if (res.ok) {
          const data = await res.json();
          const branchList = data.branches || [];
          setBranches(branchList);
          
          // Check if multiple branches exist
          if (branchList.length > 1) {
            setIsBranchMode(true);
            
            // Try to restore previously selected branch from localStorage
            const savedBranchId = localStorage.getItem('selectedBranchId');
            if (savedBranchId) {
              const savedBranch = branchList.find((b: Branch) => b.id === savedBranchId);
              if (savedBranch) {
                setSelectedBranch(savedBranch);
              }
            } else {
              // Default to main branch if exists
              const mainBranch = branchList.find((b: Branch) => b.isMain);
              if (mainBranch) {
                setSelectedBranch(mainBranch);
                localStorage.setItem('selectedBranchId', mainBranch.id);
              }
            }
          } else if (branchList.length === 1) {
            // Single branch - auto-select it
            setSelectedBranch(branchList[0]);
            localStorage.setItem('selectedBranchId', branchList[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch branches:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBranches();
  }, []);

  const handleSetSelectedBranch = (branch: Branch | null) => {
    setSelectedBranch(branch);
    if (branch) {
      localStorage.setItem('selectedBranchId', branch.id);
    } else {
      localStorage.removeItem('selectedBranchId');
    }
  };

  return (
    <BranchContext.Provider value={{
      selectedBranch,
      setSelectedBranch: handleSetSelectedBranch,
      branches,
      loading,
      isBranchMode
    }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
